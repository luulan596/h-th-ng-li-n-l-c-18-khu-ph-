const CACHE_NAME = 'mattran18kp-v1.0.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './mat_tran_logo.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

// Cài đặt Service Worker và lưu Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching Static Assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Kích hoạt Service Worker và dọn dẹp Cache cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Xử lý các yêu cầu Fetch dữ liệu & Tài nguyên
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Không cache các phương thức ngoại trừ GET (Ví dụ: POST ghi dữ liệu Apps Script)
  if (req.method !== 'GET') {
    return;
  }

  // Đối với API Apps Script (script.google.com): dùng Network-First
  if (url.hostname.includes('script.google.com') || url.hostname.includes('googleusercontent.com')) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          // Lưu cache kết quả GET nếu hợp lệ
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return response;
        })
        .catch(() => {
          // Khi mất mạng, trả về cache gần nhất nếu có
          return caches.match(req);
        })
    );
    return;
  }

  // Đối với tài nguyên trang web (Static Assets): Cache-First kết hợp Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Tải cập nhật ngầm nếu có mạng
        fetch(req).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
          }
        }).catch(() => {/* Offline */});
        return cachedResponse;
      }

      return fetch(req)
        .then((networkResponse) => {
          if (req.method === 'GET' && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          // Nếu truy cập trang HTML lúc mất mạng hoàn toàn và không có cache, phục vụ offline.html
          if (req.headers.get('accept')?.includes('text/html')) {
            return caches.match('./offline.html');
          }
        });
    })
  );
});
