import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Kiểm tra iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    // Kiểm tra xem ứng dụng đã được cài đặt (standalone mode) chưa
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Lắng nghe sự kiện beforeinstallprompt (Android / Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSPrompt(true);
    }
  };

  if (isInstalled) return null;

  return (
    <>
      {/* Nút cài đặt PWA hiển thị trên giao diện nếu trình duyệt hỗ trợ hoặc trên iOS */}
      {(deferredPrompt || isIOS) && (
        <div className="fixed top-16 right-4 z-40 animate-bounce-slow">
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-bold rounded-full text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg border border-amber-300/40 transition-all active:scale-95"
            title="Cài đặt ứng dụng lên Màn hình chính"
          >
            <Download className="w-4 h-4 animate-pulse" />
            <span>CÀI ỨNG DỤNG</span>
          </button>
        </div>
      )}

      {/* Modal hướng dẫn dành riêng cho iPhone / iPad Safari */}
      {showIOSPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-red-700" />
                <h4 className="font-bold text-slate-900 text-sm">CÀI ĐẶT TRÊN IPHONE / IPAD</h4>
              </div>
              <button
                onClick={() => setShowIOSPrompt(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Trình duyệt Safari trên iPhone không hỗ trợ nút cài trực tiếp. Bạn vui lòng thực hiện 2 bước sau:
            </p>

            <ol className="space-y-3 text-xs text-slate-800 font-semibold bg-amber-50 p-3.5 rounded-xl border border-amber-200">
              <li className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-red-900 text-amber-300 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span>Nhấn nút <strong>Chia sẻ</strong> <Share className="w-4 h-4 inline text-blue-600" /> ở thanh dưới Safari.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-red-900 text-amber-300 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span>Cuộn xuống chọn <strong>“Thêm vào Màn hình chính”</strong> <PlusSquare className="w-4 h-4 inline text-slate-700" />.</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSPrompt(false)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
};
