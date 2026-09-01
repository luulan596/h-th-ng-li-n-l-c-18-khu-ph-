/**
 * ==============================================================================
 * SERVICE WORKER (PWA) - MẶT TRẬN TỔ QUỐC PHƯỜNG BÌNH TIÊN
 * ==============================================================================
 * Cung cấp khả năng lưu bộ nhớ đệm (Cache) để ứng dụng hoạt động ngoại tuyến (Offline),
 * tải nhanh các tài nguyên tĩnh và bảo vệ dữ liệu danh bạ, địa chỉ đỏ khi mất kết nối mạng.
 */

const CACHE_NAME = 'mttq-binh-tien-v2026-icon';

// Danh sách các tài nguyên tĩnh cần nạp vào bộ nhớ đệm ban đầu
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/mat_tran_logo.svg',
  '/pwa-512x512.png?v=2026',
  '/pwa-192x192.png?v=2026',
  '/maskable-icon-512x512.png?v=2026',
  '/apple-touch-icon.png?v=2026',
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
            console.log('[ServiceWorker] Đang xóa bộ nhớ đệm phiên bản cũ:', name);
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
