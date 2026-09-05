import React from 'react';
import { RefreshCw, Bell } from 'lucide-react';
import { SyncStatus } from '../types';

interface HeaderProps {
  syncStatus: SyncStatus;
  onOpenAppsScriptModal: () => void;
  onRefreshData: () => void;
  onOpenFeedback?: () => void;
  onOpenNotification?: () => void;
  isNotificationGranted?: boolean;
  totalPersonnel: number;
  totalKhuPho: number;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  syncStatus,
  onRefreshData,
  onOpenNotification,
  isNotificationGranted = false,
  unreadCount = 0,
}) => {
  return (
    <header className="relative bg-white text-slate-900 shadow-sm border-b border-slate-200">
      {/* Decorative Golden & Red Accent Line */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-red-600 to-indigo-600"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* National/Front Banner */}
          <div className="flex items-center space-x-3 sm:space-x-3.5 text-center md:text-left min-w-0 max-w-full">
            <img
              src="/mat-tran-logo.svg"
              alt="Logo Mặt Trận Tổ Quốc Việt Nam"
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-13 md:h-13 object-contain shrink-0 drop-shadow-xs"
              loading="eager"
            />
            <div className="min-w-0">
              <h1 className="font-anton text-base sm:text-xl md:text-2xl tracking-wide text-red-950 leading-tight uppercase whitespace-nowrap">
                MẶT TRẬN SỐ BÌNH TIÊN - MỘT CHẠM KẾT NỐI
              </h1>
              <p className="text-xs text-slate-600 mt-0.5 sm:mt-1 font-medium">
                Lắng nghe & đồng hành cùng Nhân dân
              </p>
            </div>
          </div>

          {/* Quick Info & Actions */}
          <div className="flex items-center flex-wrap justify-center md:justify-end gap-2.5">
            {/* Notification Bell with pulsating glowing Red Badge (Lớp 2: In-App Red Badge Notification) */}
            <button
              id="btn-header-notification-bell"
              onClick={onOpenNotification}
              className={`relative p-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                unreadCount > 0
                  ? 'bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700'
              }`}
              title={
                unreadCount > 0
                  ? `Có ${unreadCount} thông báo mới chưa đọc! Bấm để xem`
                  : isNotificationGranted
                  ? 'Thông báo hệ thống (Đã bật thông báo màn hình khóa)'
                  : 'Thông báo hệ thống (Bấm để xem thông báo mới)'
              }
              aria-label="Thông báo hệ thống"
            >
              <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-red-600' : 'text-slate-700'}`} />

              {/* Chấm đỏ phát sáng (Red Badge Notification) nổi bật kèm hiệu ứng nhịp thở nhẹ */}
              {unreadCount > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4.5 w-4.5 bg-gradient-to-tr from-red-600 to-rose-500 border-2 border-white text-[9px] font-black text-white items-center justify-center shadow-xs animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </span>
              ) : !isNotificationGranted ? (
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 border border-white" />
                </span>
              ) : null}
            </button>

            {/* Manual Refresh Button */}
            <button
              onClick={onRefreshData}
              disabled={syncStatus.isLoading}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition-colors cursor-pointer active:scale-95"
              title="Cập nhật dữ liệu mới nhất"
            >
              <RefreshCw className={`w-4 h-4 ${syncStatus.isLoading ? 'animate-spin text-amber-600' : ''}`} />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};



