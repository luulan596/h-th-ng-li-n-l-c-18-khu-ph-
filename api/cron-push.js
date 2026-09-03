import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUP_ANON_KEY
);

webpush.setVapidDetails(
  'mailto:mttqbinhtien@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  try {
    const now = new Date().toISOString();

    // 1. Quét các thông báo đến hạn chưa gửi
    const { data: notifications, error: notifError } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('trang_thai', 'pending')
      .lte('thoi_gian_gui', now);

    if (notifError) throw notifError;

    if (!notifications || notifications.length === 0) {
      return res.status(200).json({ message: 'Không có thông báo nào cần gửi.' });
    }

    // 2. Lấy danh sách thiết bị đã đăng ký
    const { data: subscribers, error: subError } = await supabase
      .from('push_subscribers')
      .select('subscription');

    if (subError) throw subError;

    // 3. Gửi thông báo đến từng thiết bị
    for (const notif of notifications) {
      const payload = JSON.stringify({
        title: notif.tieu_de,
        body: notif.noi_dung,
        icon: '/pwa-icon.png'
      });

      const sendPromises = (subscribers || []).map(async (sub) => {
        try {
          await webpush.sendNotification(sub.subscription, payload);
        } catch (err) {
          // Bỏ qua nếu thiết bị đã hủy đăng ký hoặc lỗi token
          console.error('Lỗi gửi tới subscription:', err.message);
        }
      });

      await Promise.all(sendPromises);

      // 4. Đánh dấu thông báo đã gửi
      await supabase
        .from('scheduled_notifications')
        .update({ trang_thai: 'sent' })
        .eq('id', notif.id);
    }

    return res.status(200).json({ success: true, count: notifications.length });
  } catch (error) {
    console.error('Lỗi cron-push:', error);
    return res.status(500).json({ error: error.message });
  }
}
