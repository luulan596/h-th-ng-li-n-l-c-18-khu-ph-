import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();

precacheAndRoute(self.__WB_MANIFEST);

// SPA Navigation Fallback to index.html
const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler, {
  denylist: [/^\/api\//],
});
registerRoute(navigationRoute);

// Google Fonts Stylesheets
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Google Fonts Webfonts
registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Leaflet CDN Assets
registerRoute(
  /^https:\/\/unpkg\.leaflet.*/i,
  new CacheFirst({
    cacheName: 'leaflet-cdn-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// NetworkOnly for Google Apps Script endpoints
registerRoute(/^https:\/\/script\.google\.com\/.*/i, new NetworkOnly());
registerRoute(/^https:\/\/script\.googleusercontent\.com\/.*/i, new NetworkOnly());

// 1. Web Push Event Listener
self.addEventListener('push', (event) => {
  let data = {
    title: 'Thông báo mới',
    body: 'Bạn có thông báo mới',
    url: '/',
  };

  if (event.data) {
    try {
      const json = event.data.json();
      data = {
        ...data,
        ...json,
      };
    } catch {
      data.body = event.data.text();
    }
  }

  const title = data.title || data.tieu_de || 'Thông báo mới';
  let body = data.body || data.noi_dung || 'Bạn có thông báo mới';
  if (data.dia_diem) {
    body += `\n📍 Địa điểm: ${data.dia_diem}`;
  }
  if (data.thoi_gian_gui) {
    body += `\n⏰ Thời gian: ${data.thoi_gian_gui}`;
  }

  const options = {
    body: body || '',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    data: {
      url: data.url || '/',
      id: data.id,
      notification: data,
    },
  };

  // Broadcast push to open clients for in-app badge updates
  if (self.clients) {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        client.postMessage({
          type: 'PUSH_RECEIVED',
          notification: {
            id: data.id || `push-${Date.now()}`,
            title,
            body,
            tieu_de: title,
            noi_dung: data.noi_dung || data.body || '',
            dia_diem: data.dia_diem,
            thoi_gian_gui: data.thoi_gian_gui,
            created_at: new Date().toISOString(),
          },
        });
      }
    });
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 2. Notification Click Event Listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// 3. In-App Message Listener (skip waiting or show local notification)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    const finalOptions = {
      body: options?.body || '',
      icon: options?.icon || '/pwa-192x192.png',
      badge: options?.badge || '/pwa-192x192.png',
      data: options?.data || { url: '/' },
    };
    event.waitUntil(
      self.registration.showNotification(title || 'Thông báo mới', finalOptions)
    );
  }
});
