import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

import { registerSW } from 'virtual:pwa-register';

// Tự động cập nhật Service Worker khi có bản mới
registerSW({
  onNeedRefresh() {
    console.log('[PWA] Phát hiện phiên bản mới, đang tự động làm mới...');
    window.location.reload();
  },
  onOfflineReady() {
    console.log('[PWA] Ứng dụng đã sẵn sàng sử dụng ngoại tuyến.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

