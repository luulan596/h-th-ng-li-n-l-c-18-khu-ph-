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
 * Bắt buộc lưu PushSubscription vào bảng push_subscribers trên Supabase:
 * Sau khi người dùng cấp quyền (Notification.permission === 'granted'):
 * Lấy đối tượng đăng ký: const sub = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe(...).
 * Chuyển đổi sang JSON chuẩn: const subJSON = sub.toJSON();.
 * Thực hiện lưu (Upsert) vào Supabase:
 * const { error } = await supabase
 *   .from('push_subscribers')
 *   .upsert({
 *     endpoint: sub.endpoint,
 *     subscription: subJSON
 *   }, { onConflict: 'endpoint' });
 * Thêm console.log('Lưu subscription kết quả:', { error }) để dễ dàng gỡ lỗi nếu có sự cố mạng.
 */
export async function registerPushSubscriber(): Promise<{
  success: boolean;
  message: string;
  data?: any;
  subscription?: any;
  error?: any;
}> {
  try {
    if (typeof window === 'undefined') {
      return { success: false, message: 'Môi trường không có window' };
    }

    // 1. Kiểm tra Service Worker và PushManager
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { success: false, message: 'Trình duyệt không hỗ trợ Web Push' };
    }

    // 2. Yêu cầu hoặc kiểm tra quyền thông báo
    if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        return { success: false, message: 'Chưa được cấp quyền Notification' };
      }
    }

    const registration = await navigator.serviceWorker.ready;

    // Lấy đối tượng đăng ký: const sub = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe(...).
    let sub: PushSubscription | null = await registration.pushManager.getSubscription();

    if (!sub) {
      try {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      } catch (subscribeErr) {
        console.warn('[PushService] registration.pushManager.subscribe thử mới có lỗi, lấy subscription hiện hữu:', subscribeErr);
        sub = await registration.pushManager.getSubscription();
      }
    }

    if (!sub) {
      console.warn('[PushService] Không lấy được đối tượng PushSubscription');
      return { success: false, message: 'Không lấy được PushSubscription từ trình duyệt' };
    }

    // Chuyển đổi sang JSON chuẩn: const subJSON = sub.toJSON();
    const subJSON = sub.toJSON();

    // Thực hiện lưu (Upsert) vào Supabase:
    const supabase = getSupabase();
    let supabaseError: any = null;

    if (supabase) {
      const { error } = await supabase
        .from('push_subscribers')
        .upsert({
          endpoint: sub.endpoint,
          subscription: subJSON
        }, { onConflict: 'endpoint' });

      supabaseError = error;
      // Thêm console.log('Lưu subscription kết quả:', { error }) để dễ dàng gỡ lỗi nếu có sự cố mạng.
      console.log('Lưu subscription kết quả:', { error });
    }

    // Lưu vào LocalStorage cache
    try {
      localStorage.setItem(LOCAL_PUSH_SUBSCRIBER_KEY, JSON.stringify({
        endpoint: sub.endpoint,
        subscription: subJSON,
        updated_at: new Date().toISOString()
      }));
    } catch (cacheErr) {
      // ignore
    }

    return {
      success: !supabaseError,
      message: supabaseError
        ? `Lỗi khi lưu Supabase: ${supabaseError.message}`
        : 'Đã lưu subscription vào Supabase thành công!',
      data: { endpoint: sub.endpoint, subscription: subJSON },
      subscription: sub,
      error: supabaseError
    };
  } catch (err: any) {
    console.error('[PushService] Lỗi quy trình registerPushSubscriber:', err);
    console.log('Lưu subscription kết quả:', { error: err });
    return {
      success: false,
      message: err?.message || 'Lỗi ngoại lệ khi lưu subscription',
      error: err
    };
  }
}

/**
 * Lên lịch gửi thông báo đẩy mới (Ghi vào bảng `scheduled_notifications` với trang_thai: 'pending')
 * Nếu có input.id (đang sửa), tự động chuyển sang ghi đè (UPDATE) để không tạo bản ghi thừa.
 */
export async function saveScheduledNotification(input: {
  id?: string | number;
  tieu_de: string;
  noi_dung: string;
  thoi_gian_gui: string; // ISO string hoặc YYYY-MM-DDTHH:mm
  dia_diem?: string;
  nguoi_tao?: string;
  loai_thong_bao?: string;
}): Promise<{ success: boolean; data?: ScheduledNotification; message: string }> {
  // Nếu có id -> Gọi updateScheduledNotification để ghi đè, tuyệt đối không tạo thêm bản ghi trùng lặp
  if (input.id) {
    return updateScheduledNotification(input.id, {
      tieu_de: input.tieu_de,
      noi_dung: input.noi_dung,
      thoi_gian_gui: input.thoi_gian_gui,
      dia_diem: input.dia_diem,
      loai_thong_bao: input.loai_thong_bao,
    });
  }

  const newNotification: ScheduledNotification = {
    id: `sched-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    tieu_de: input.tieu_de.trim(),
    noi_dung: input.noi_dung.trim(),
    thoi_gian_gui: input.thoi_gian_gui,
    dia_diem: input.dia_diem?.trim() || undefined,
    trang_thai: 'pending',
    loai_thong_bao: input.loai_thong_bao || 'LỊCH HỌP',
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
      if (newNotification.loai_thong_bao) {
        payloadVi.loai_thong_bao = newNotification.loai_thong_bao;
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
          loai_thong_bao: data.loai_thong_bao || newNotification.loai_thong_bao,
          created_at: data.created_at || newNotification.created_at,
          nguoi_tao: newNotification.nguoi_tao,
        };
        saveScheduledToLocalCache(savedItem);
        notifyScheduledNotificationsUpdated();
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
            loai_thong_bao: newNotification.loai_thong_bao,
            created_at: fbData.created_at || newNotification.created_at,
            nguoi_tao: newNotification.nguoi_tao,
          };
          saveScheduledToLocalCache(savedItem);
          notifyScheduledNotificationsUpdated();
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
  notifyScheduledNotificationsUpdated();
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
 * Ghi đè trực tiếp theo id, không sinh thêm bản ghi trùng lặp
 */
export async function updateScheduledNotification(
  id: string | number,
  input: {
    tieu_de: string;
    noi_dung: string;
    thoi_gian_gui: string;
    dia_diem?: string;
    loai_thong_bao?: string;
  }
): Promise<{ success: boolean; data?: ScheduledNotification; message: string }> {
  const safeId = String(id);
  const updatedFields: Partial<ScheduledNotification> = {
    tieu_de: input.tieu_de.trim(),
    noi_dung: input.noi_dung.trim(),
    thoi_gian_gui: input.thoi_gian_gui,
    dia_diem: input.dia_diem?.trim() || undefined,
    loai_thong_bao: input.loai_thong_bao || 'LỊCH HỌP',
    trang_thai: 'pending', // Đặt về pending để sẵn sàng phát khi đến giờ hẹn mới
  };

  // 1. Cập nhật LocalStorage cache tại chỗ (thay thế hoàn toàn, không tạo bản ghi mới)
  try {
    const saved = localStorage.getItem(LOCAL_SCHEDULED_NOTIFS_KEY);
    const list: ScheduledNotification[] = saved ? JSON.parse(saved) : [];
    const index = list.findIndex((x) => String(x.id) === safeId);
    if (index >= 0) {
      list[index] = {
        ...list[index],
        ...updatedFields,
      };
      localStorage.setItem(LOCAL_SCHEDULED_NOTIFS_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.error('[PushService] Lỗi cập nhật localStorage:', e);
  }

  // 2. Cập nhật trên Supabase theo id
  const supabase = getSupabase();
  if (supabase) {
    try {
      const payloadVi: any = {
        tieu_de: input.tieu_de.trim(),
        noi_dung: input.noi_dung.trim(),
        thoi_gian_gui: input.thoi_gian_gui,
        trang_thai: 'pending',
      };
      if (input.dia_diem !== undefined) {
        payloadVi.dia_diem = input.dia_diem.trim();
      }
      if (input.loai_thong_bao) {
        payloadVi.loai_thong_bao = input.loai_thong_bao;
      }

      let { data, error } = await supabase
        .from('scheduled_notifications')
        .update(payloadVi)
        .eq('id', id)
        .select()
        .single();

      // Nếu thất bại do kiểu id number/string, thử chuyển đổi
      if (error && !isNaN(Number(id))) {
        const retry = await supabase
          .from('scheduled_notifications')
          .update(payloadVi)
          .eq('id', Number(id))
          .select()
          .single();
        if (retry.data) {
          data = retry.data;
          error = null;
        }
      }

      if (!error && data) {
        const resultItem: ScheduledNotification = {
          id: String(data.id || id),
          tieu_de: data.tieu_de || input.tieu_de,
          noi_dung: data.noi_dung || input.noi_dung,
          thoi_gian_gui: data.thoi_gian_gui || input.thoi_gian_gui,
          dia_diem: data.dia_diem || input.dia_diem,
          trang_thai: data.trang_thai || 'pending',
          loai_thong_bao: data.loai_thong_bao || input.loai_thong_bao || 'LỊCH HỌP',
          created_at: data.created_at || new Date().toISOString(),
          nguoi_tao: data.nguoi_tao || 'Ban Quản trị',
        };
        saveScheduledToLocalCache(resultItem);
        notifyScheduledNotificationsUpdated();
        return {
          success: true,
          data: resultItem,
          message: 'Đã cập nhật thay thế thông báo thành công trên Supabase!',
        };
      }

      if (error) {
        console.warn('[PushService] Thử cập nhật payload tối giản:', error);
        const fallbackPayload: any = {
          tieu_de: input.tieu_de.trim(),
          noi_dung: input.dia_diem
            ? `${input.noi_dung.trim()}\n(Địa điểm: ${input.dia_diem.trim()})`
            : input.noi_dung.trim(),
          thoi_gian_gui: input.thoi_gian_gui,
          trang_thai: 'pending',
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

  notifyScheduledNotificationsUpdated();
  return {
    success: true,
    message: 'Đã cập nhật thay thế thông báo thành công!',
  };
}

/**
 * Xóa 1 thông báo hẹn giờ khỏi hệ thống (Supabase & LocalStorage)
 */
export async function deleteScheduledNotification(id: string | number): Promise<boolean> {
  const safeId = String(id);
  // 1. Cập nhật LocalStorage ngay lập tức
  try {
    const saved = localStorage.getItem(LOCAL_SCHEDULED_NOTIFS_KEY);
    const list = saved ? JSON.parse(saved) : [];
    const updated = (Array.isArray(list) ? list : []).filter((item: any) => String(item.id) !== safeId);
    localStorage.setItem(LOCAL_SCHEDULED_NOTIFS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('[PushService] Lỗi cập nhật localStorage:', e);
  }

  // 2. Xóa triệt để trên Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('scheduled_notifications').delete().eq('id', id);
      if (error && !isNaN(Number(id))) {
        await supabase.from('scheduled_notifications').delete().eq('id', Number(id));
      }
    } catch (e) {
      console.warn('[PushService] Lỗi xóa trên Supabase:', e);
    }
  }

  notifyScheduledNotificationsUpdated();
  return true;
}

/**
 * Xóa toàn bộ lịch thông báo trong bảng scheduled_notifications trên Supabase và làm sạch bộ nhớ
 */
export async function clearAllScheduledNotifications(): Promise<{ success: boolean; message: string }> {
  // 1. Dọn sạch LocalStorage
  try {
    localStorage.setItem(LOCAL_SCHEDULED_NOTIFS_KEY, JSON.stringify([]));
  } catch (e) {
    console.error('[PushService] Lỗi xóa cache local:', e);
  }

  // 2. Gửi lệnh xóa toàn bộ bản ghi trên Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      // Dùng .not('id', 'is', null) xóa toàn bộ các dòng có id khác null
      let { error } = await supabase
        .from('scheduled_notifications')
        .delete()
        .not('id', 'is', null);

      if (error) {
        console.warn('[PushService] Lỗi delete not id null, thử lọc theo created_at:', error);
        await supabase
          .from('scheduled_notifications')
          .delete()
          .gte('created_at', '1970-01-01');
      }
    } catch (e) {
      console.warn('[PushService] Lỗi xóa toàn bộ trên Supabase:', e);
    }
  }

  notifyScheduledNotificationsUpdated();
  return {
    success: true,
    message: 'Đã xóa toàn bộ lịch thông báo trong hệ thống!',
  };
}

/**
 * Phát tín hiệu thông báo danh sách lịch đã được cập nhật (Thêm/Sửa/Xóa/Xóa tất cả)
 * Đồng bộ tức thì trong cùng tab và xuyên suốt các tab qua BroadcastChannel & Window Event.
 */
export function notifyScheduledNotificationsUpdated() {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('mttq_scheduled_notifications_updated'));
    } catch {}
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('mttq_scheduled_channel');
        bc.postMessage({ type: 'SCHEDULE_UPDATED', timestamp: Date.now() });
        bc.close();
      } catch {}
    }
  }
}

/**
 * Đăng ký lắng nghe Realtime thay đổi từ bảng `scheduled_notifications` (Supabase Realtime)
 * và các sự kiện đồng bộ từ Local/Cross-Tab.
 */
export function subscribeToScheduledNotificationsRealtime(onUpdate: () => void): () => void {
  const handleUpdate = () => {
    onUpdate();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('mttq_scheduled_notifications_updated', handleUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === LOCAL_SCHEDULED_NOTIFS_KEY) {
        onUpdate();
      }
    });
  }

  let broadcastChannel: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      broadcastChannel = new BroadcastChannel('mttq_scheduled_channel');
      broadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'SCHEDULE_UPDATED') {
          onUpdate();
        }
      };
    } catch {}
  }

  // Kết nối Supabase Realtime Channel
  const supabase = getSupabase();
  let channel: any = null;
  if (supabase) {
    try {
      channel = supabase
        .channel('realtime_scheduled_notifications_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'scheduled_notifications' },
          (payload) => {
            console.log('[Supabase Realtime] Thay đổi trên scheduled_notifications:', payload);
            onUpdate();
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('[Supabase Realtime] Lỗi đăng ký kênh:', e);
    }
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('mttq_scheduled_notifications_updated', handleUpdate);
    }
    if (broadcastChannel) {
      try { broadcastChannel.close(); } catch {}
    }
    if (channel && supabase) {
      try { supabase.removeChannel(channel); } catch {}
    }
  };
}

/**
 * Lưu 1 bản ghi vào local cache (thay thế nếu đã có cùng id, tránh sinh trùng lặp)
 */
function saveScheduledToLocalCache(item: ScheduledNotification) {
  try {
    const saved = localStorage.getItem(LOCAL_SCHEDULED_NOTIFS_KEY);
    const list: ScheduledNotification[] = saved ? JSON.parse(saved) : [];
    // So sánh chuẩn chuỗi để tránh lệch kiểu number vs string
    const index = list.findIndex((x) => String(x.id) === String(item.id));
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

// Tập hợp ID đã được kích hoạt phát tự động để chống gửi trùng lặp
const triggeredNotificationIds = new Set<string>();

/**
 * Quét các thông báo hẹn giờ đến hạn (now >= thoi_gian_gui) và chưa phát (trang_thai !== 'sent').
 * Khi đến đúng giờ hẹn:
 * 1. Lập tức kích hoạt phát Web Push Notification rung/chuông đến toàn bộ thiết bị trong push_subscribers.
 * 2. Tự động chuyển trạng thái bản ghi từ pending sang sent (✓ Đã phát).
 * 3. Kích hoạt Chấm đỏ thông báo (Red Badge) trên thanh menu cho người dùng.
 */
export async function checkAndTriggerDueNotifications(
  onNotificationTriggered?: (notif: ScheduledNotification) => void
): Promise<number> {
  try {
    const list = await fetchScheduledNotifications();
    const now = Date.now();
    let triggeredCount = 0;

    for (const notif of list) {
      const safeId = String(notif.id);
      // Bỏ qua nếu đã gửi hoặc vừa mới được kích hoạt trong phiên này
      if (notif.trang_thai === 'sent' || triggeredNotificationIds.has(safeId)) {
        continue;
      }

      if (!notif.thoi_gian_gui) continue;

      const scheduledTime = new Date(notif.thoi_gian_gui).getTime();
      if (isNaN(scheduledTime)) continue;

      // Đến đúng giờ hẹn (cho phép sai số 24 giờ gần nhất, không phát lại tin cũ hơn 1 ngày)
      const diffMs = now - scheduledTime;
      if (diffMs >= 0 && diffMs < 24 * 60 * 60 * 1000) {
        triggeredNotificationIds.add(safeId);
        console.log(`[Scheduler] 🔔 Đến đúng giờ hẹn phát thông báo: "${notif.tieu_de}" (${notif.thoi_gian_gui})`);

        // Kích hoạt phát tức thì tới toàn bộ thiết bị và cập nhật sang sent
        await broadcastToAllDevices({
          id: notif.id,
          tieu_de: notif.tieu_de,
          noi_dung: notif.noi_dung || '',
          dia_diem: notif.dia_diem || '',
          thoi_gian_gui: notif.thoi_gian_gui,
          loai_thong_bao: notif.loai_thong_bao || 'LỊCH HỌP'
        });

        triggeredCount++;
        if (onNotificationTriggered) {
          onNotificationTriggered(notif);
        }
      }
    }

    return triggeredCount;
  } catch (err) {
    console.warn('[Scheduler] Lỗi khi quét lịch hẹn thông báo:', err);
    return 0;
  }
}

let schedulerTimerId: any = null;

/**
 * Khởi động bộ quét định kỳ (Background Scheduler) mỗi 15 - 30 giây (mặc định 20 giây)
 */
export function startNotificationBackgroundScheduler(
  onNotificationTriggered?: (notif: ScheduledNotification) => void
): () => void {
  if (schedulerTimerId) {
    return () => {
      if (schedulerTimerId) {
        clearInterval(schedulerTimerId);
        schedulerTimerId = null;
      }
    };
  }

  // Quét nhanh sau 2 giây khi ứng dụng mở
  setTimeout(() => {
    checkAndTriggerDueNotifications(onNotificationTriggered);
  }, 2000);

  // Quét định kỳ mỗi 20 giây (trong khoảng 15 - 30 giây)
  schedulerTimerId = setInterval(() => {
    checkAndTriggerDueNotifications(onNotificationTriggered);
  }, 20000);

  console.log('[Scheduler] Đã kích hoạt Bộ đếm tự động phát thông báo hẹn giờ định kỳ (mỗi 20s)');

  return () => {
    if (schedulerTimerId) {
      clearInterval(schedulerTimerId);
      schedulerTimerId = null;
    }
  };
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
 * Nút 'GỬI ĐẾN TOÀN BỘ THIẾT BỊ' trong Quản trị (ScheduleManagement.tsx):
 * Khi Quản trị viên nhấn 🚀 PHÁT THÔNG BÁO NGAY LẬP TỨC:
 * 1. Đọc danh sách tất cả các thiết bị trong bảng push_subscribers.
 * 2. Kích hoạt phát thông báo tới tất cả thiết bị đã lưu.
 * 3. Đồng thời cập nhật trạng thái trong bảng scheduled_notifications từ pending sang sent.
 * 4. Bật chấm đỏ thông báo (Red Badge) trên thanh menu ứng dụng cho toàn bộ người dùng.
 */
export async function broadcastToAllDevices(payload: {
  id?: string | number;
  tieu_de: string;
  noi_dung: string;
  thoi_gian_gui?: string;
  dia_diem?: string;
  loai_thong_bao?: string;
}): Promise<{
  success: boolean;
  message: string;
  subscribersCount: number;
  sentCount: number;
  error?: any;
}> {
  try {
    const notifId = payload.id ? String(payload.id) : `sched-${Date.now()}`;
    const formattedTitle = payload.tieu_de.trim();
    const formattedBody = payload.noi_dung.trim();
    const formattedLocation = payload.dia_diem?.trim() || 'Hội trường UBND Phường';
    const formattedTime = payload.thoi_gian_gui || new Date().toISOString();

    const supabase = getSupabase();
    let subscribers: any[] = [];

    // BƯỚC 1: Đọc danh sách tất cả các thiết bị trong bảng push_subscribers
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('push_subscribers')
          .select('*');

        if (error) {
          console.warn('[Broadcast] Lỗi khi đọc bảng push_subscribers:', error);
        } else if (data) {
          subscribers = data;
        }
      } catch (subErr) {
        console.warn('[Broadcast] Ngoại lệ khi đọc push_subscribers:', subErr);
      }
    }
    console.log(`[Broadcast] Đã đọc ${subscribers.length} thiết bị từ bảng push_subscribers:`, subscribers);

    // BƯỚC 2: Kích hoạt phát thông báo tới tất cả thiết bị đã lưu
    const detailedBodyText = `${formattedBody}${formattedLocation ? `\n📍 Địa điểm: ${formattedLocation}` : ''}`;
    const bodyData = {
      id: notifId,
      tieu_de: formattedTitle,
      noi_dung: formattedBody,
      dia_diem: formattedLocation,
      thoi_gian_gui: formattedTime,
      subscribers: subscribers,
      isImmediate: true,
    };

    let sentCount = 0;
    const pushEndpoints = ['/api/cron-push', '/api/send-push'];

    for (const endpoint of pushEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          sentCount = json.sentCount || subscribers.length || 1;
          break;
        }
      } catch (e) {
        // thử endpoint tiếp theo
      }
    }

    // Kích hoạt ngoài màn hình khóa qua Service Worker trên thiết bị quản trị viên / thiết bị hiện tại
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && 'showNotification' in registration) {
          await registration.showNotification(formattedTitle, {
            body: detailedBodyText,
            icon: '/mat-tran-logo.svg',
            badge: '/mat-tran-logo.svg',
            vibrate: [200, 100, 200, 100, 300],
            tag: notifId,
            renotify: true,
            requireInteraction: true,
            data: {
              url: '/#tien-ich',
              id: notifId
            }
          } as NotificationOptions & { vibrate?: number[] });
        }
      } catch (swErr) {
        console.warn('[Broadcast] ServiceWorker showNotification:', swErr);
      }

      try {
        navigator.serviceWorker.controller?.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: formattedTitle,
          options: {
            body: detailedBodyText,
            tag: notifId,
            data: { url: '/#tien-ich' }
          }
        });
      } catch (msgErr) {
        // bỏ qua
      }
    }

    // BƯỚC 3: Đồng thời cập nhật trạng thái trong bảng scheduled_notifications từ pending sang sent
    if (supabase && notifId && !notifId.startsWith('temp-')) {
      try {
        const { error: updateErr } = await supabase
          .from('scheduled_notifications')
          .update({ trang_thai: 'sent' })
          .eq('id', notifId);

        console.log('Cập nhật trạng thái scheduled_notifications sang sent kết quả:', { error: updateErr });
      } catch (dbErr) {
        console.warn('[Broadcast] Lỗi cập nhật trang_thai = sent trong Supabase:', dbErr);
      }
    }

    // Cập nhật trạng thái sent trong LocalStorage cache
    try {
      const saved = localStorage.getItem(LOCAL_SCHEDULED_NOTIFS_KEY);
      if (saved) {
        const list: ScheduledNotification[] = JSON.parse(saved);
        const updated = list.map(item => String(item.id) === notifId ? { ...item, trang_thai: 'sent' as const } : item);
        localStorage.setItem(LOCAL_SCHEDULED_NOTIFS_KEY, JSON.stringify(updated));
      }
    } catch (cacheErr) {
      // ignore
    }

    // BƯỚC 4: Bật chấm đỏ thông báo (Red Badge) trên thanh menu ứng dụng cho toàn bộ người dùng
    saveInAppNotification({
      id: notifId,
      tieu_de: formattedTitle,
      noi_dung: formattedBody,
      dia_diem: formattedLocation,
      thoi_gian_gui: formattedTime,
      type: 'URGENT',
      created_at: new Date().toISOString()
    });

    // Phát âm thanh chuông báo Red Badge
    playNotificationSound();

    return {
      success: true,
      message: subscribers.length > 0
        ? `Đã phát thông báo thành công tới ${subscribers.length} thiết bị, cập nhật trạng thái đã gửi (sent) và bật chuông đỏ hệ thống!`
        : `Đã phát thông báo khẩn cấp, cập nhật trạng thái đã gửi (sent) và bật chuông đỏ ứng dụng!`,
      subscribersCount: subscribers.length,
      sentCount: sentCount || (subscribers.length > 0 ? subscribers.length : 1),
    };
  } catch (err: any) {
    console.error('[Broadcast] Ngoại lệ khi broadcastToAllDevices:', err);
    return {
      success: false,
      message: err?.message || 'Có lỗi xảy ra khi phát thông báo tới toàn bộ thiết bị',
      subscribersCount: 0,
      sentCount: 0,
      error: err
    };
  }
}

/**
 * Hàm kích hoạt phát thông báo ngay lập tức (sử dụng broadcastToAllDevices)
 */
export async function triggerImmediatePushNotification(payload: {
  id?: string | number;
  tieu_de: string;
  noi_dung: string;
  thoi_gian_gui?: string;
  dia_diem?: string;
}): Promise<{ success: boolean; message: string; subscribersCount?: number; sentCount?: number }> {
  return broadcastToAllDevices(payload);
}
