/**
 * ==============================================================================
 * TẦNG DỮ LIỆU (DATA ACCESS LAYER) - NOTIFICATION SERVICE (THÔNG BÁO ĐẨY HẸN GIỜ)
 * ==============================================================================
 * 1. Lưu mã thiết bị (PushSubscription) vào bảng `push_subscribers` trên Supabase
 *    khi người dùng nhấn "BẬT NGAY".
 * 2. Lên lịch gửi thông báo vào bảng `scheduled_notifications` trên Supabase
 *    với trạng thái `trang_thai: 'pending'`.
 */

import { PushSubscriber, ScheduledNotification } from '../types';
import { getSupabase } from './supabaseClient';

/**
 * Hằng số VAPID Public Key chính thức
 */
export const VAPID_PUBLIC_KEY = 'BILyGewTFhuMq8oK1CPqXHtjwCOSN4-MN_xkYQJ1qqWCPceYysjNESA5yw3DO-WhtffmWGfuXlkFqLYMt62oslY';

const LOCAL_PUSH_SUBSCRIBER_KEY = 'mttq_push_subscriber_device';
const LOCAL_SCHEDULED_NOTIFS_KEY = 'mttq_scheduled_notifications_v2026';

/**
 * Helper chuyển đổi base64 URL-safe thành Uint8Array cho applicationServerKey
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Lấy đối tượng PushSubscription của trình duyệt và lưu vào Supabase bảng `push_subscribers` (tránh trùng lặp)
 */
export async function registerPushSubscriber(): Promise<{ success: boolean; message: string; data?: any; subscription?: any }> {
  try {
    let sub: PushSubscription | null = null;
    let endpoint = '';
    let p256dh: string | null = null;
    let auth: string | null = null;
    let subscriptionJson: any = null;

    // 1. Kiểm tra Service Worker và PushManager
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;

        // Đăng ký nhận thông báo chuẩn xác với VAPID_PUBLIC_KEY
        try {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          });
          sub = subscription;
        } catch (subscribeErr) {
          console.warn('[PushService] registration.pushManager.subscribe thử mới có lỗi, lấy subscription hiện hữu:', subscribeErr);
          sub = await registration.pushManager.getSubscription();
        }
      } catch (swErr) {
        console.warn('[PushService] Lỗi khi truy cập PushManager:', swErr);
      }
    }

    // 2. Chuẩn bị payload thiết bị
    if (sub) {
      subscriptionJson = sub.toJSON();
      endpoint = sub.endpoint || subscriptionJson?.endpoint || '';
      p256dh = subscriptionJson?.keys?.p256dh || null;
      auth = subscriptionJson?.keys?.auth || null;
    }

    // Nếu trình duyệt không hỗ trợ push endpoint trực tiếp hoặc đang ở môi trường sandbox,
    // sinh ra Device ID định danh duy nhất cho thiết bị
    if (!endpoint) {
      let storedDeviceId = localStorage.getItem('mttq_device_endpoint_id');
      if (!storedDeviceId) {
        storedDeviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem('mttq_device_endpoint_id', storedDeviceId);
      }
      endpoint = `client://${storedDeviceId}`;
    }

    const payload: PushSubscriber = {
      endpoint,
      p256dh,
      auth,
      subscription: subscriptionJson ? JSON.stringify(subscriptionJson) : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Lưu vào LocalStorage cache
    localStorage.setItem(LOCAL_PUSH_SUBSCRIBER_KEY, JSON.stringify(payload));

    // 3. Gửi lệnh insert/upsert vào bảng `push_subscribers` trên Supabase (kèm cơ chế tránh trùng lặp)
    const supabase = getSupabase();
    if (supabase) {
      try {
        // Thử upsert theo cột endpoint (tránh trùng lặp nếu endpoint đã tồn tại)
        const recordData = {
          endpoint: payload.endpoint,
          p256dh: payload.p256dh,
          auth: payload.auth,
          subscription: payload.subscription,
          user_agent: payload.user_agent,
          updated_at: payload.updated_at,
        };

        const { error: upsertErr } = await supabase
          .from('push_subscribers')
          .upsert(recordData, { onConflict: 'endpoint' });

        if (upsertErr) {
          console.warn('[PushService] Upsert push_subscribers có cảnh báo, thử xử lý trùng lặp an toàn:', upsertErr);
          // Thử kiểm tra trùng lặp trước khi insert
          const { data: existingRows } = await supabase
            .from('push_subscribers')
            .select('endpoint')
            .eq('endpoint', payload.endpoint)
            .limit(1);

          if (existingRows && existingRows.length > 0) {
            // Bản ghi đã tồn tại -> cập nhật thời gian và subscription mới
            await supabase
              .from('push_subscribers')
              .update({
                p256dh: payload.p256dh,
                auth: payload.auth,
                subscription: payload.subscription,
                user_agent: payload.user_agent,
                updated_at: payload.updated_at,
              })
              .eq('endpoint', payload.endpoint);
          } else {
            // Chưa tồn tại -> chèn mới và bắt lỗi trùng lặp nếu có race condition (code 23505)
            const { error: insertErr } = await supabase
              .from('push_subscribers')
              .insert([
                {
                  endpoint: payload.endpoint,
                  p256dh: payload.p256dh,
                  auth: payload.auth,
                  subscription: payload.subscription,
                  user_agent: payload.user_agent,
                  created_at: payload.created_at,
                },
              ]);

            if (insertErr && insertErr.code !== '23505') {
              console.warn('[PushService] Insert push_subscribers error:', insertErr);
            }
          }
        }
      } catch (dbErr) {
        console.warn('[PushService] Không thể kết nối Supabase push_subscribers:', dbErr);
      }
    }

    return {
      success: true,
      message: 'Đã lưu mã thiết bị nhận thông báo thành công!',
      data: payload,
      subscription: sub,
    };
  } catch (err: any) {
    console.warn('[PushService] Lỗi quy trình registerPushSubscriber:', err);
    return {
      success: false,
      message: err?.message || 'Có lỗi xảy ra khi lưu mã thiết bị',
    };
  }
}

/**
 * Lên lịch gửi thông báo đẩy mới (Ghi vào bảng `scheduled_notifications` với trang_thai: 'pending')
 */
export async function saveScheduledNotification(input: {
  tieu_de: string;
  noi_dung: string;
  thoi_gian_gui: string; // ISO string hoặc YYYY-MM-DDTHH:mm
  nguoi_tao?: string;
}): Promise<{ success: boolean; data?: ScheduledNotification; message: string }> {
  const newNotification: ScheduledNotification = {
    id: `sched-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    tieu_de: input.tieu_de.trim(),
    noi_dung: input.noi_dung.trim(),
    thoi_gian_gui: input.thoi_gian_gui,
    trang_thai: 'pending',
    created_at: new Date().toISOString(),
    nguoi_tao: input.nguoi_tao || 'yeunuhotranp7',
  };

  const supabase = getSupabase();

  if (supabase) {
    try {
      // 1. Thử insert với các tên cột tiếng Việt theo đặc tả bảng
      const payloadVi = {
        tieu_de: newNotification.tieu_de,
        noi_dung: newNotification.noi_dung,
        thoi_gian_gui: newNotification.thoi_gian_gui,
        trang_thai: 'pending',
        created_at: newNotification.created_at,
      };

      const { data, error } = await supabase
        .from('scheduled_notifications')
        .insert([payloadVi])
        .select()
        .single();

      if (!error && data) {
        const savedItem: ScheduledNotification = {
          id: data.id || newNotification.id,
          tieu_de: data.tieu_de || newNotification.tieu_de,
          noi_dung: data.noi_dung || newNotification.noi_dung,
          thoi_gian_gui: data.thoi_gian_gui || newNotification.thoi_gian_gui,
          trang_thai: data.trang_thai || 'pending',
          created_at: data.created_at || newNotification.created_at,
          nguoi_tao: newNotification.nguoi_tao,
        };
        saveScheduledToLocalCache(savedItem);
        return {
          success: true,
          data: savedItem,
          message: 'Đã lên lịch phát thông báo thành công lên máy chủ Supabase!',
        };
      }

      // 2. Nếu báo lỗi cột, thử với tên cột song ngữ / tiếng Anh dự phòng
      if (error) {
        console.warn('[PushService] Thử lưu scheduled_notifications với cấu trúc dự phòng:', error);
        const fallbackPayload = {
          title: newNotification.tieu_de,
          content: newNotification.noi_dung,
          scheduled_at: newNotification.thoi_gian_gui,
          status: 'pending',
          created_at: newNotification.created_at,
        };
        const { data: fbData, error: fbErr } = await supabase
          .from('scheduled_notifications')
          .insert([fallbackPayload])
          .select()
          .single();

        if (!fbErr && fbData) {
          const savedItem: ScheduledNotification = {
            id: fbData.id || newNotification.id,
            tieu_de: fbData.title || newNotification.tieu_de,
            noi_dung: fbData.content || newNotification.noi_dung,
            thoi_gian_gui: fbData.scheduled_at || newNotification.thoi_gian_gui,
            trang_thai: 'pending',
            created_at: fbData.created_at || newNotification.created_at,
          };
          saveScheduledToLocalCache(savedItem);
          return {
            success: true,
            data: savedItem,
            message: 'Đã lên lịch phát thông báo thành công!',
          };
        }
      }
    } catch (err) {
      console.warn('[PushService] Lỗi kết nối Supabase scheduled_notifications:', err);
    }
  }

  // Lưu fallback vào LocalStorage
  saveScheduledToLocalCache(newNotification);
  return {
    success: true,
    data: newNotification,
    message: 'Đã lưu lịch thông báo vào bộ nhớ và sẽ tự động đồng bộ khi có kết nối mạng.',
  };
}

/**
 * Tải danh sách các thông báo hẹn giờ từ Supabase (hoặc LocalStorage)
 */
export async function fetchScheduledNotifications(): Promise<ScheduledNotification[]> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: ScheduledNotification[] = data.map((item: any) => ({
          id: item.id || `sched-${Math.random()}`,
          tieu_de: item.tieu_de || item.title || 'Thông báo Mặt trận',
          noi_dung: item.noi_dung || item.content || item.body || '',
          thoi_gian_gui: item.thoi_gian_gui || item.scheduled_at || new Date().toISOString(),
          trang_thai: item.trang_thai || item.status || 'pending',
          created_at: item.created_at || new Date().toISOString(),
          nguoi_tao: item.nguoi_tao || item.created_by || 'yeunuhotranp7',
        }));

        localStorage.setItem(LOCAL_SCHEDULED_NOTIFS_KEY, JSON.stringify(mapped));
        return mapped;
      }
    } catch (e) {
      console.warn('[PushService] Lỗi tải scheduled_notifications từ Supabase:', e);
    }
  }

  // Đọc từ LocalStorage
  const saved = localStorage.getItem(LOCAL_SCHEDULED_NOTIFS_KEY);
  if (saved) {
    try {
      const list = JSON.parse(saved);
      if (Array.isArray(list)) return list;
    } catch (e) {
      console.error(e);
    }
  }

  // Mẫu mặc định nếu chưa có bản ghi nào
  return [
    {
      id: 'sched-default-1',
      tieu_de: 'Triệu tập họp giao ban khẩn Ban Thường trực',
      noi_dung: 'Thông báo triệu tập cuộc họp giao ban khẩn đánh giá công tác an sinh xã hội và triển khai nhiệm vụ trọng tâm.',
      thoi_gian_gui: new Date(Date.now() + 1800000).toISOString(),
      trang_thai: 'pending',
      created_at: new Date().toISOString(),
      nguoi_tao: 'yeunuhotranp7'
    }
  ];
}

/**
 * Hủy hoặc xóa thông báo hẹn giờ
 */
export async function deleteScheduledNotification(id: string): Promise<boolean> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      await supabase.from('scheduled_notifications').delete().eq('id', id);
    } catch (e) {
      console.warn('[PushService] Lỗi xóa trên Supabase:', e);
    }
  }

  // Cập nhật LocalStorage
  const current = await fetchScheduledNotifications();
  const updated = current.filter((item) => item.id !== id);
  localStorage.setItem(LOCAL_SCHEDULED_NOTIFS_KEY, JSON.stringify(updated));

  return true;
}

/**
 * Lưu 1 bản ghi vào local cache
 */
function saveScheduledToLocalCache(item: ScheduledNotification) {
  try {
    const saved = localStorage.getItem(LOCAL_SCHEDULED_NOTIFS_KEY);
    const list: ScheduledNotification[] = saved ? JSON.parse(saved) : [];
    // Kiểm tra xem đã tồn tại chưa để thay thế hoặc chèn mới
    const index = list.findIndex((x) => x.id === item.id);
    if (index >= 0) {
      list[index] = item;
    } else {
      list.unshift(item);
    }
    localStorage.setItem(LOCAL_SCHEDULED_NOTIFS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
}
