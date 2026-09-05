/**
 * ==============================================================================
 * SERVICE WORKER (PWA) - MẶT TRẬN TỔ QUỐC PHƯỜNG BÌNH TIÊN
 * ==============================================================================
 * Cung cấp khả năng lưu bộ nhớ đệm (Cache) để ứng dụng hoạt động ngoại tuyến (Offline),
 * tải nhanh các tài nguyên tĩnh và bảo vệ dữ liệu danh bạ, địa chỉ đỏ khi mất kết nối mạng.
 */

const CACHE_NAME = 'mat-tran-v2026-final';

// Danh sách các tài nguyên tĩnh cần nạp vào bộ nhớ đệm ban đầu
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/mat-tran-logo.svg',
  'https://fonts.googleapis.com/css2?family=Anton&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&family=Merriweather:wght@400;700;900&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
];

// 1. Cài đặt Service Worker (Install Event)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Đang lưu trước các tài nguyên tĩnh vào Cache');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Một số tài nguyên tĩnh không thể lưu trước:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Kích hoạt và dọn dẹp Cache cũ (Activate Event)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[ServiceWorker] Đang quét và xóa toàn bộ bộ nhớ đệm phiên bản cũ:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Xử lý yêu cầu mạng (Fetch Event) - Network-first với Cache Fallback cho dữ liệu
self.addEventListener('fetch', (event) => {
  // Chỉ xử lý các yêu cầu HTTP/HTTPS dạng GET
  if (event.request.method !== 'GET') return;

  // Bỏ qua các yêu cầu nội bộ của extension hoặc chrome-extension
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Nếu có sẵn trong cache và là tài nguyên tĩnh, vẫn thử fetch mới để cập nhật ở chế độ nền
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Lưu bản sao mới vào cache nếu hợp lệ
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Khi mất mạng hoàn toàn, trả về cachedResponse nếu có
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. Xử lý nhận Push Notification từ máy chủ / Supabase
self.addEventListener('push', (event) => {
  let data = {
    title: 'Mặt trận Tổ quốc Phường Bình Tiên',
    body: 'Bạn có thông báo mới từ Ban Thường trực.'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const title = data.title || data.tieu_de || 'Thông báo Mặt trận';
  let bodyText = data.body || data.noi_dung || '';
  if (data.dia_diem) {
    bodyText += `\n📍 Địa điểm: ${data.dia_diem}`;
  }
  if (data.thoi_gian_gui) {
    bodyText += `\n⏰ Thời gian: ${data.thoi_gian_gui}`;
  }

  const options = {
    body: bodyText,
    icon: '/mat-tran-logo.svg',
    badge: '/mat-tran-logo.svg',
    vibrate: [200, 100, 200, 100, 300],
    tag: data.id ? String(data.id) : `notif-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/',
      id: data.id,
      notification: data
    }
  };

  // Phát thông điệp đến tất cả tab ứng dụng đang mở để cập nhật chấm đỏ In-App Red Badge
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) {
      client.postMessage({
        type: 'PUSH_RECEIVED',
        notification: {
          id: data.id || `push-${Date.now()}`,
          title: title,
          body: bodyText,
          tieu_de: title,
          noi_dung: data.noi_dung || data.body || '',
          dia_diem: data.dia_diem,
          thoi_gian_gui: data.thoi_gian_gui,
          created_at: new Date().toISOString()
        }
      });
    }
  });

  event.waitUntil(self.registration.showNotification(title, options));
});

// 5. Lắng nghe thông điệp từ giao diện Web (gửi thông báo trực tiếp qua Service Worker)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    const finalOptions = {
      body: options?.body || '',
      icon: '/mat-tran-logo.svg',
      badge: '/mat-tran-logo.svg',
      vibrate: [200, 100, 200, 100, 300],
      tag: options?.tag || `msg-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
      data: options?.data || { url: '/' }
    };

    event.waitUntil(
      self.registration.showNotification(title || 'Thông báo Mặt trận', finalOptions)
    );

    // Phát lại cho toàn bộ tab để đồng bộ chấm đỏ
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        client.postMessage({
          type: 'PUSH_RECEIVED',
          notification: options?.data?.notification || {
            id: finalOptions.tag,
            title: title,
            body: finalOptions.body,
            created_at: new Date().toISOString()
          }
        });
      }
    });
  }
});

// 6. Xử lý sự kiện nhấp vào thông báo
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
