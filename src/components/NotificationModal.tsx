import React from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Calendar, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { InAppNotificationItem } from '../services/notificationService';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: InAppNotificationItem[];
  unreadCount: number;
  onMarkAllAsRead: () => void;
  onMarkItemAsRead: (id: string) => void;
  isNotificationGranted: boolean;
  onRequestPushPermission?: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAllAsRead,
  onMarkItemAsRead,
  isNotificationGranted,
  onRequestPushPermission
}) => {
  if (!isOpen) return null;

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-4 sm:p-5 relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                <Bell className="w-5 h-5 text-white animate-bounce" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>THÔNG BÁO & TIN CHỈ ĐẠO</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-white text-red-700 shadow-xs">
                      {unreadCount} tin mới
                    </span>
                  )}
                </h3>
                <p className="text-xs text-red-100 font-medium mt-0.5">
                  Ban Thường trực UB.MTTQ VN Phường Bình Tiên
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Push Permission Status Bar */}
          <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-red-100">
              <span className={`w-2 h-2 rounded-full ${isNotificationGranted ? 'bg-emerald-400' : 'bg-amber-300 animate-pulse'}`} />
              <span>
                {isNotificationGranted 
                  ? 'Đã bật thông báo ngoài màn hình khóa' 
                  : 'Chưa cấp quyền thông báo màn hình khóa'}
              </span>
            </div>

            {!isNotificationGranted && onRequestPushPermission && (
              <button
                type="button"
                onClick={onRequestPushPermission}
                className="px-2.5 py-1 bg-white text-red-700 hover:bg-red-50 rounded-lg text-[11px] font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                Bật thông báo ngay
              </button>
            )}
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Danh sách thông báo nội bộ & công tác</span>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="inline-flex items-center gap-1 font-bold text-red-700 hover:text-red-800 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Đã xem tất cả</span>
            </button>
          )}
        </div>

        {/* Notification Cards List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {notifications.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Bell className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-700">Chưa có thông báo nào</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Khi Ban Thường trực phát thông báo khẩn hoặc lịch họp mới, thông tin sẽ hiển thị ngay tại đây kèm chuông đỏ báo tin.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const isUnread = !item.read;

              return (
                <div
                  key={item.id}
                  onClick={() => onMarkItemAsRead(item.id)}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isUnread
                      ? 'bg-red-50/70 border-red-200 hover:border-red-300 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                  }`}
                >
                  {/* Top line: Tag & Read Indicator */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        item.type === 'URGENT'
                          ? 'bg-red-600 text-white'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.type === 'URGENT' ? 'Khẩn' : 'Lịch công tác'}
                      </span>

                      {isUnread && (
                        <span className="flex items-center gap-1 text-[10px] font-black text-red-700 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-red-600" />
                          <span>MỚI</span>
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] font-medium text-slate-400">
                      {formatDate(item.created_at)}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {item.tieu_de}
                  </h4>

                  {/* Metadata: Time and Location if available */}
                  {(item.thoi_gian_gui || item.dia_diem) && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-700 bg-white/80 p-2 rounded-lg border border-slate-200/70">
                      {item.thoi_gian_gui && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-red-700 shrink-0" />
                          <span>
                            {formatTime(item.thoi_gian_gui)} - {formatDate(item.thoi_gian_gui)}
                          </span>
                        </div>
                      )}
                      {item.dia_diem && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                          <span className="truncate">{item.dia_diem}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Body Content */}
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {item.noi_dung}
                  </p>

                  {/* Bottom Footer hint */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Mặt trận Tổ quốc Việt Nam Phường Bình Tiên</span>
                    <span>{isUnread ? 'Chạm để đánh dấu đã đọc' : 'Đã xem'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Hệ thống thông báo 2 lớp: Web Push + In-App Badge
          </span>
          <button
            type="button"
            onClick={() => {
              onMarkAllAsRead();
              onClose();
            }}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            Đóng hộp thư
          </button>
        </div>
      </div>
    </div>
  );
};
