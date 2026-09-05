import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUP_ANON_KEY || '';

const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BILyGewTFhuMq8oK1CPqXHtjwCOSN4-MN_xkYQJ1qqWCPceYysjNESA5yw3DO-WhtffmWGfuXlkFqLYMt62oslY';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

if (vapidPrivateKey) {
  try {
    webpush.setVapidDetails(
      'mailto:mttqbinhtien@gmail.com',
      vapidPublicKey,
      vapidPrivateKey
    );
  } catch (err) {
    console.warn('[cron-push] Không thể khởi tạo VAPID details:', err?.message);
  }
}

export default async function handler(req, res) {
  // Bật CORS để hỗ trợ gọi ngầm từ client-side
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. Kiểm tra payload truyền vào (gửi tức thì qua POST từ Admin)
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        // body không phải JSON
      }
    }

    let notificationsToSend = [];

    if (body && (body.tieu_de || body.title)) {
      // Trường hợp kích hoạt gửi ngay lập tức từ Admin
      notificationsToSend = [
        {
          id: body.id || `immediate-${Date.now()}`,
          tieu_de: body.tieu_de || body.title,
          noi_dung: body.noi_dung || body.body || body.content || '',
          dia_diem: body.dia_diem || body.location || '',
          isImmediate: true,
        },
      ];
    } else if (supabase) {
      // Trường hợp cron định kỳ: Quét các thông báo đến hạn chưa gửi
      const now = new Date().toISOString();
      const { data: notifications, error: notifError } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .eq('trang_thai', 'pending')
        .lte('thoi_gian_gui', now);

      if (notifError) throw notifError;
      notificationsToSend = notifications || [];
    }

    if (!notificationsToSend || notificationsToSend.length === 0) {
      return res.status(200).json({ success: true, message: 'Không có thông báo nào cần gửi.', count: 0 });
    }

    // 2. Lấy danh sách thiết bị đã đăng ký từ bảng push_subscribers
    let subscribers = [];
    if (body && Array.isArray(body.subscribers) && body.subscribers.length > 0) {
      subscribers = body.subscribers;
    } else if (supabase) {
      const { data, error: subError } = await supabase
        .from('push_subscribers')
        .select('*');

      if (!subError && data) {
        subscribers = data;
      }
    }

    // 3. Gửi thông báo Push đến từng thiết bị nếu có cấu hình VAPID
    let sentCount = 0;
    if (vapidPrivateKey && subscribers.length > 0) {
      for (const notif of notificationsToSend) {
        const locationText = notif.dia_diem ? ` (Địa điểm: ${notif.dia_diem})` : '';
        const payload = JSON.stringify({
          title: notif.tieu_de,
          body: `${notif.noi_dung}${locationText}`,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          data: {
            url: '/#tien-ich',
            id: notif.id,
            timestamp: Date.now(),
          },
        });

        const sendPromises = subscribers.map(async (sub) => {
          try {
            if (!sub) return;
            let subData = sub.subscription || sub;
            if (typeof subData === 'string') {
              try {
                subData = JSON.parse(subData);
              } catch {
                // fallback
              }
            }

            if (subData && subData.endpoint) {
              await webpush.sendNotification(subData, payload);
              sentCount++;
            }
          } catch (err) {
            // Bỏ qua lỗi token hết hạn hoặc thiết bị hủy đăng ký
            console.error('Lỗi gửi tới subscription:', err?.message);
          }
        });

        await Promise.allSettled(sendPromises);

        // 4. Cập nhật trạng thái trong bảng scheduled_notifications từ pending sang sent
        if (supabase && notif.id) {
          try {
            await supabase
              .from('scheduled_notifications')
              .update({ trang_thai: 'sent' })
              .eq('id', notif.id);
          } catch (updateDbErr) {
            console.warn('Lỗi cập nhật trang_thai sent:', updateDbErr?.message);
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Đã gửi Push Notification thành công!',
      notificationsCount: notificationsToSend.length,
      subscribersCount: subscribers.length,
      sentCount,
    });
  } catch (error) {
    console.error('Lỗi cron-push:', error);
    return res.status(200).json({
      success: false,
      message: error?.message || 'Có lỗi khi xử lý gửi push notification',
    });
  }
}
