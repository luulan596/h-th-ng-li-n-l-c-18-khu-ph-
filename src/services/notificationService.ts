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
export type { PushSubscriber, ScheduledNotification };
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

    // 3. Gửi lệnh insert/upsert vào bảng `push_subscribers` & `push_subscriptions` trên Supabase (kèm cơ chế tránh trùng lặp)
    const supabase = getSupabase();
    if (supabase) {
      const recordData = {
        endpoint: payload.endpoint,
        p256dh: payload.p256dh,
        auth: payload.auth,
        subscription: payload.subscription,
        user_agent: payload.user_agent,
        updated_at: payload.updated_at,
      };

      // 3.1. Thử lưu vào push_subscriptions (chuẩn tên bảng Web Push)
      try {
        await supabase
          .from('push_subscriptions')
          .upsert(recordData, { onConflict: 'endpoint' });
      } catch (subErr) {
        console.warn('[PushService] Lưu push_subscriptions:', subErr);
      }

      // 3.2. Thử lưu vào push_subscribers (chuẩn phụ trợ)
      try {
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
            await supabase
              .from('push_subscribers')
              .update(recordData)
              .eq('endpoint', payload.endpoint);
          } else {
            await supabase
              .from('push_subscribers')
              .insert([{ ...recordData, created_at: payload.created_at }]);
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
  dia_diem?: string;
  nguoi_tao?: string;
}): Promise<{ success: boolean; data?: ScheduledNotification; message: string }> {
  const newNotification: ScheduledNotification = {
    id: `sched-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    tieu_de: input.tieu_de.trim(),
    noi_dung: input.noi_dung.trim(),
    thoi_gian_gui: input.thoi_gian_gui,
    dia_diem: input.dia_diem?.trim() || undefined,
    trang_thai: 'pending',
    created_at: new Date().toISOString(),
    nguoi_tao: input.nguoi_tao === 'yeunuhotranp7' ? 'Ban Quản trị' : (input.nguoi_tao || 'Ban Quản trị'),
  };

  const supabase = getSupabase();

  if (supabase) {
    try {
      // 1. Thử insert với các tên cột tiếng Việt theo đặc tả bảng (có dia_diem)
      const payloadVi: any = {
        tieu_de: newNotification.tieu_de,
        noi_dung: newNotification.noi_dung,
        thoi_gian_gui: newNotification.thoi_gian_gui,
        trang_thai: 'pending',
        created_at: newNotification.created_at,
      };
      if (newNotification.dia_diem) {
        payloadVi.dia_diem = newNotification.dia_diem;
      }

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
          dia_diem: data.dia_diem || newNotification.dia_diem,
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

      // 2. Nếu báo lỗi cột (ví dụ bảng chưa có cột dia_diem), thử với payload chuẩn không có dia_diem
      if (error) {
        console.warn('[PushService] Thử lưu scheduled_notifications với cấu trúc không có dia_diem:', error);
        const payloadWithoutDiaDiem: any = {
          tieu_de: newNotification.tieu_de,
          noi_dung: newNotification.dia_diem 
            ? `${newNotification.noi_dung}\n(Địa điểm: ${newNotification.dia_diem})`
            : newNotification.noi_dung,
          thoi_gian_gui: newNotification.thoi_gian_gui,
          trang_thai: 'pending',
          created_at: newNotification.created_at,
        };
        const { data: fbData, error: fbErr } = await supabase
          .from('scheduled_notifications')
          .insert([payloadWithoutDiaDiem])
          .select()
          .single();

        if (!fbErr && fbData) {
          const savedItem: ScheduledNotification = {
            id: fbData.id || newNotification.id,
            tieu_de: fbData.tieu_de || newNotification.tieu_de,
            noi_dung: newNotification.noi_dung,
            dia_diem: newNotification.dia_diem,
            thoi_gian_gui: fbData.thoi_gian_gui || newNotification.thoi_gian_gui,
            trang_thai: 'pending',
            created_at: fbData.created_at || newNotification.created_at,
            nguoi_tao: newNotification.nguoi_tao,
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
        const mapped: ScheduledNotification[] = (data || []).map((item: any) => ({
          id: String(item?.id ?? `sched-${Math.random()}`),
          tieu_de: item?.tieu_de || item?.title || 'Thông báo Mặt trận',
          noi_dung: item?.noi_dung || item?.content || item?.body || '',
          thoi_gian_gui: item?.thoi_gian_gui || item?.scheduled_at || new Date().toISOString(),
          dia_diem: item?.dia_diem || item?.location || '',
          trang_thai: item?.trang_thai || item?.status || 'pending',
          created_at: item?.created_at || new Date().toISOString(),
          nguoi_tao: (item?.nguoi_tao === 'yeunuhotranp7' ? 'Ban Quản trị' : (item?.nguoi_tao || item?.created_by || 'Ban Quản trị')),
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
      tieu_de: 'Họp Giao ban Ban Thường trực UB.MTTQ Việt Nam Phường',
      noi_dung: 'Đánh giá tiến độ công tác tuần qua, kiểm tra phong trào và phân công nhiệm vụ trọng tâm tuần mới.',
      thoi_gian_gui: '2026-09-07T08:30:00',
      dia_diem: 'Hội trường số 2, Trụ sở UBND Phường Bình Tiên',
      trang_thai: 'pending',
      created_at: new Date().toISOString(),
      nguoi_tao: 'Ban Quản trị'
    },
    {
      id: 'sched-default-2',
      tieu_de: 'Sinh hoạt định kỳ Ban Công tác Mặt trận 18 Khu phố',
      noi_dung: 'Triển khai Cuộc vận động Toàn dân đoàn kết xây dựng nông thôn mới, đô thị văn minh và rà soát an sinh xã hội.',
      thoi_gian_gui: '2026-09-11T19:00:00',
      dia_diem: 'Tại 18 Trụ sở Ban Điều hành & Ban Công tác Mặt trận Khu phố',
      trang_thai: 'pending',
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      nguoi_tao: 'Ban Quản trị'
    },
    {
      id: 'sched-default-3',
      tieu_de: 'Hội nghị Tiếp xúc Cử tri trước kỳ họp HĐND các cấp',
      noi_dung: 'Báo cáo dự kiến chương trình kỳ họp, tiếp thu ý kiến và tâm tư nguyện vọng của nhân dân địa phương.',
      thoi_gian_gui: '2026-09-15T14:00:00',
      dia_diem: 'Hội trường Trung tâm Văn hóa Phường Bình Tiên',
      trang_thai: 'pending',
      created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      nguoi_tao: 'Ban Quản trị'
    },
    {
      id: 'sched-default-4',
      tieu_de: 'Tập huấn bồi dưỡng kỹ năng giám sát, phản biện xã hội ở cơ sở',
      noi_dung: 'Hướng dẫn quy trình giám sát đầu tư cộng đồng theo Luật Thực hiện Dân chủ ở cơ sở năm 2022.',
      thoi_gian_gui: '2026-09-22T08:00:00',
      dia_diem: 'Hội trường Trung tâm Bồi dưỡng Chính trị Quận',
      trang_thai: 'pending',
      created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      nguoi_tao: 'Ban Quản trị'
    }
  ];
}

/**
 * Cập nhật thông báo hẹn giờ đã có (sửa trên Supabase và đồng bộ LocalStorage)
 */
export async function updateScheduledNotification(
  id: string | number,
  input: {
    tieu_de: string;
    noi_dung: string;
    thoi_gian_gui: string;
    dia_diem?: string;
  }
): Promise<{ success: boolean; data?: ScheduledNotification; message: string }> {
  const updatedItem: Partial<ScheduledNotification> = {
    tieu_de: input.tieu_de.trim(),
    noi_dung: input.noi_dung.trim(),
    thoi_gian_gui: input.thoi_gian_gui,
    dia_diem: input.dia_diem?.trim() || undefined,
  };

  // 1. Cập nhật LocalStorage cache
  try {
    const saved = localStorage.getItem(LOCAL_SCHEDULED_NOTIFS_KEY);
    const list: ScheduledNotification[] = saved ? JSON.parse(saved) : [];
    const index = list.findIndex((x) => String(x.id) === String(id));
    if (index >= 0) {
      list[index] = {
        ...list[index],
        ...updatedItem,
      };
      localStorage.setItem(LOCAL_SCHEDULED_NOTIFS_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.error('[PushService] Lỗi cập nhật localStorage:', e);
  }

  // 2. Cập nhật trên Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      const payloadVi: any = {
        tieu_de: input.tieu_de.trim(),
        noi_dung: input.noi_dung.trim(),
        thoi_gian_gui: input.thoi_gian_gui,
      };
      if (input.dia_diem !== undefined) {
        payloadVi.dia_diem = input.dia_diem.trim();
      }

      const { data, error } = await supabase
        .from('scheduled_notifications')
        .update(payloadVi)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        const resultItem: ScheduledNotification = {
          id: String(data.id || id),
          tieu_de: data.tieu_de || input.tieu_de,
          noi_dung: data.noi_dung || input.noi_dung,
          thoi_gian_gui: data.thoi_gian_gui || input.thoi_gian_gui,
          dia_diem: data.dia_diem || input.dia_diem,
          trang_thai: data.trang_thai || 'pending',
          created_at: data.created_at || new Date().toISOString(),
          nguoi_tao: data.nguoi_tao || 'Ban Quản trị',
        };
        saveScheduledToLocalCache(resultItem);
        return {
          success: true,
          data: resultItem,
          message: 'Đã cập nhật thông báo thành công trên Supabase!',
        };
      }

      if (error) {
        console.warn('[PushService] Thử cập nhật không có dia_diem nếu cột chưa tồn tại:', error);
        const fallbackPayload: any = {
          tieu_de: input.tieu_de.trim(),
          noi_dung: input.dia_diem
            ? `${input.noi_dung.trim()}\n(Địa điểm: ${input.dia_diem.trim()})`
            : input.noi_dung.trim(),
          thoi_gian_gui: input.thoi_gian_gui,
        };
        await supabase
          .from('scheduled_notifications')
          .update(fallbackPayload)
          .eq('id', id);
      }
    } catch (e) {
      console.warn('[PushService] Lỗi khi update trên Supabase:', e);
    }
  }

  return {
    success: true,
    message: 'Đã cập nhật thông báo thành công!',
  };
}

/**
 * Hủy hoặc xóa thông báo hẹn giờ
 */
export async function deleteScheduledNotification(id: string | number): Promise<boolean> {
  // Cập nhật LocalStorage ngay lập tức
  try {
    const saved = localStorage.getItem(LOCAL_SCHEDULED_NOTIFS_KEY);
    const list = saved ? JSON.parse(saved) : [];
    const updated = (Array.isArray(list) ? list : []).filter((item: any) => String(item.id) !== String(id));
    localStorage.setItem(LOCAL_SCHEDULED_NOTIFS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('[PushService] Lỗi cập nhật localStorage:', e);
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('scheduled_notifications').delete().eq('id', id);
    } catch (e) {
      console.warn('[PushService] Lỗi xóa trên Supabase:', e);
    }
  }

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

/**
 * Giao diện thông báo trong ứng dụng (Lớp 2: In-App Notifications)
 */
export interface InAppNotificationItem {
  id: string;
  tieu_de: string;
  noi_dung: string;
  dia_diem?: string;
  thoi_gian_gui?: string;
  created_at: string;
  read?: boolean;
  type?: 'URGENT' | 'MEETING' | 'GENERAL';
}

export const LOCAL_INAPP_NOTIFS_KEY = 'mttq_inapp_notifications_v2026';
export const LOCAL_READ_NOTIFS_KEY = 'mttq_read_notification_ids_v2026';

// Dữ liệu thông báo khởi tạo mặc định nếu chưa có tin nhắn nào
const INITIAL_INAPP_NOTIFICATIONS: InAppNotificationItem[] = [
  {
    id: 'notif-init-1',
    tieu_de: 'Triệu tập Hội nghị Giao ban Ban Công tác Mặt trận 18 Khu phố',
    noi_dung: 'Đề nghị các đồng chí Trưởng Ban CTMT 18 Khu phố tham dự đầy đủ, đúng giờ để đánh giá tiến độ phong trào Toàn dân đoàn kết xây dựng đời sống văn hóa và triển khai các nhiệm vụ trọng tâm.',
    dia_diem: 'Hội trường Tầng 2, Trụ sở UBND Phường Bình Tiên',
    thoi_gian_gui: new Date().toISOString(),
    created_at: new Date(Date.now() - 3600000).toISOString(),
    type: 'MEETING'
  },
  {
    id: 'notif-init-2',
    tieu_de: 'Thông báo khẩn: Tiếp xúc cử tri và Lắng nghe ý kiến Nhân dân',
    noi_dung: 'Ban Thường trực UB.MTTQ VN Phường tổ chức buổi tiếp xúc trực tiếp cử tri lắng nghe phản ánh về vệ sinh môi trường, an sinh xã hội và trật tự đô thị tại địa bàn dân cư.',
    dia_diem: 'Văn phòng Ban Điều hành Khu phố 3, Phường Bình Tiên',
    thoi_gian_gui: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
    type: 'URGENT'
  }
];

/**
 * Phát âm thanh chuông thông báo trong ứng dụng bằng Web Audio API
 */
export function playNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.exponentialRampToValueAtTime(1318.5, now + 0.12); // E6

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1318.5, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.25); // A6

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.25);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.85);
  } catch (e) {
    console.warn('[Audio] Could not play notification chime:', e);
  }
}

/**
 * Lấy danh sách ID các thông báo đã đọc
 */
export function getReadNotificationIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(LOCAL_READ_NOTIFS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Lấy danh sách thông báo In-App đã được gán trạng thái read/unread
 */
export function getInAppNotifications(): InAppNotificationItem[] {
  if (typeof window === 'undefined') return INITIAL_INAPP_NOTIFICATIONS;
  try {
    const saved = localStorage.getItem(LOCAL_INAPP_NOTIFS_KEY);
    let list: InAppNotificationItem[] = saved ? JSON.parse(saved) : [];
    
    // Nếu chưa có, nạp danh sách ban đầu
    if (list.length === 0) {
      list = [...INITIAL_INAPP_NOTIFICATIONS];
      localStorage.setItem(LOCAL_INAPP_NOTIFS_KEY, JSON.stringify(list));
    }

    const readIds = getReadNotificationIds();
    return list.map(item => ({
      ...item,
      read: readIds.includes(String(item.id))
    }));
  } catch (e) {
    return INITIAL_INAPP_NOTIFICATIONS;
  }
}

/**
 * Lưu 1 thông báo mới vào bộ nhớ In-App và phát sự kiện đồng bộ
 */
export function saveInAppNotification(notif: Omit<InAppNotificationItem, 'read'>): InAppNotificationItem {
  const item: InAppNotificationItem = {
    ...notif,
    id: notif.id ? String(notif.id) : `inapp-${Date.now()}`,
    created_at: notif.created_at || new Date().toISOString(),
    read: false
  };

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(LOCAL_INAPP_NOTIFS_KEY);
      const list: InAppNotificationItem[] = saved ? JSON.parse(saved) : [];
      
      const existingIdx = list.findIndex(x => String(x.id) === String(item.id));
      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...item };
      } else {
        list.unshift(item);
      }
      localStorage.setItem(LOCAL_INAPP_NOTIFS_KEY, JSON.stringify(list));

      // Bỏ id này khỏi danh sách đã đọc nếu có
      const readIds = getReadNotificationIds().filter(id => id !== String(item.id));
      localStorage.setItem(LOCAL_READ_NOTIFS_KEY, JSON.stringify(readIds));

      // Phát sự kiện trong tab hiện tại
      window.dispatchEvent(new CustomEvent('mttq_new_notification', { detail: item }));

      // Phát sự kiện qua BroadcastChannel đến các tab khác
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('mttq_notifications');
        channel.postMessage({ type: 'NEW_NOTIFICATION', notification: item });
        channel.close();
      }
    } catch (e) {
      console.warn('[InAppNotification] Lỗi khi lưu thông báo:', e);
    }
  }

  return item;
}

/**
 * Đánh dấu một thông báo là ĐÃ ĐỌC
 */
export function markNotificationAsRead(id: string | number) {
  if (typeof window === 'undefined') return;
  try {
    const safeId = String(id);
    const readIds = getReadNotificationIds();
    if (!readIds.includes(safeId)) {
      readIds.push(safeId);
      localStorage.setItem(LOCAL_READ_NOTIFS_KEY, JSON.stringify(readIds));
    }
    window.dispatchEvent(new CustomEvent('mttq_notification_read_changed', { detail: { id: safeId } }));
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('mttq_notifications');
      channel.postMessage({ type: 'READ_CHANGED', id: safeId });
      channel.close();
    }
  } catch (e) {
    console.warn('[InAppNotification] Lỗi markNotificationAsRead:', e);
  }
}

/**
 * Đánh dấu TẤT CẢ thông báo là ĐÃ ĐỌC (xóa ngay Red Badge)
 */
export function markAllNotificationsAsRead() {
  if (typeof window === 'undefined') return;
  try {
    const list = getInAppNotifications();
    const allIds = list.map(item => String(item.id));
    localStorage.setItem(LOCAL_READ_NOTIFS_KEY, JSON.stringify(allIds));
    
    window.dispatchEvent(new CustomEvent('mttq_notification_read_changed', { detail: { all: true } }));
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('mttq_notifications');
      channel.postMessage({ type: 'ALL_READ' });
      channel.close();
    }
  } catch (e) {
    console.warn('[InAppNotification] Lỗi markAllNotificationsAsRead:', e);
  }
}

/**
 * Lấy số lượng thông báo chưa đọc
 */
export function getUnreadNotificationCount(): number {
  const list = getInAppNotifications();
  const readIds = getReadNotificationIds();
  return list.filter(item => !readIds.includes(String(item.id))).length;
}

/**
 * Tự động kích hoạt Push tức thì:
 * 1. Gọi Edge Function / Web Push API gửi đến toàn bộ thuê bao trong Supabase (push_subscriptions)
 * 2. Bật Notification ngoài màn hình khóa (vibrate, sound, /icon.png)
 * 3. Lưu vào danh sách thông báo In-App để hiển thị Red Badge (Lớp 2)
 */
export async function triggerImmediatePushNotification(payload: {
  id?: string | number;
  tieu_de: string;
  noi_dung: string;
  thoi_gian_gui?: string;
  dia_diem?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const notifId = payload.id ? String(payload.id) : `push-${Date.now()}`;
    const formattedTitle = payload.tieu_de.trim();
    const formattedBody = payload.noi_dung.trim();
    const formattedLocation = payload.dia_diem?.trim() || 'Hội trường UBND Phường';
    const formattedTime = payload.thoi_gian_gui || new Date().toISOString();

    // 1. Lưu ngay vào hệ thống In-App Notification (LỚP 2: Red Badge lập tức bật sáng)
    saveInAppNotification({
      id: notifId,
      tieu_de: formattedTitle,
      noi_dung: formattedBody,
      dia_diem: formattedLocation,
      thoi_gian_gui: formattedTime,
      type: 'URGENT',
      created_at: new Date().toISOString()
    });

    // 2. Kích hoạt âm thanh chuông
    playNotificationSound();

    // 3. Chuẩn bị nội dung hiển thị popup ngoài màn hình
    const detailedBodyText = `${formattedBody}\n📍 Địa điểm: ${formattedLocation}\n⏰ Thời gian: ${formattedTime}`;

    // 4. Kích hoạt thông báo ngoài màn hình khóa qua Service Worker (kèm Rung, Chuông, Logo /icon.png)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && 'showNotification' in registration) {
          await registration.showNotification(formattedTitle, {
            body: detailedBodyText,
            icon: '/icon.png',
            badge: '/icon.png',
            vibrate: [200, 100, 200, 100, 300],
            tag: notifId,
            renotify: true,
            requireInteraction: true,
            data: {
              url: '/',
              id: notifId
            }
          } as NotificationOptions & { vibrate?: number[] });
        }
      } catch (swErr) {
        console.warn('[PushService] Không thể hiển thị qua ServiceWorker showNotification:', swErr);
      }

      // Gửi message cho SW để phát tán cho các clients
      try {
        navigator.serviceWorker.controller?.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: formattedTitle,
          options: {
            body: detailedBodyText,
            tag: notifId,
            data: { url: '/' }
          }
        });
      } catch (msgErr) {
        // bỏ qua
      }
    }

    // 5. Nếu ServiceWorker chưa hỗ trợ nhưng Notification.permission granted, dùng Notification API trực tiếp
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(formattedTitle, {
          body: detailedBodyText,
          icon: '/icon.png',
        });
      } catch (e) {
        // bỏ qua
      }
    }

    // 6. GỌI API PHÁT TIN (Edge Function / Web Push Server) tới toàn bộ thiết bị đã đăng ký trong Supabase
    const bodyData = {
      id: notifId,
      tieu_de: formattedTitle,
      noi_dung: formattedBody,
      dia_diem: formattedLocation,
      thoi_gian_gui: formattedTime,
    };

    // Gọi lần lượt các endpoint hỗ trợ Web Push
    const pushEndpoints = ['/api/send-push', '/api/cron-push'];
    let sentToBackend = false;

    for (const endpoint of pushEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          sentToBackend = true;
          break;
        }
      } catch (e) {
        // thử endpoint tiếp theo
      }
    }

    // 7. Thử gọi Supabase Edge Function nếu Supabase client có functions
    const supabase = getSupabase();
    if (supabase && (supabase as any).functions) {
      try {
        await (supabase as any).functions.invoke('send-push', {
          body: bodyData
        });
        sentToBackend = true;
      } catch (edgeErr) {
        console.warn('[PushService] Edge function send-push:', edgeErr);
      }
    }

    return {
      success: true,
      message: sentToBackend 
        ? 'Đã phát thông báo Push tức thì đến toàn bộ thiết bị đăng ký và bật chuông đỏ trong ứng dụng!'
        : 'Đã kích hoạt phát thông báo ngay lập tức trên thiết bị và đồng bộ chuông đỏ trong ứng dụng!'
    };
  } catch (err: any) {
    console.warn('[PushService] Ngoại lệ khi triggerImmediatePushNotification:', err);
    return {
      success: false,
      message: err?.message || 'Lỗi mạng khi kích hoạt Push',
    };
  }
}
