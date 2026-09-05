import React, { useState, useEffect, useRef } from 'react';
import { Lock, X, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

export const ADMIN_PASSWORD = 'yeunuhotranp7';

export const checkIsAdmin = (): boolean => {
  if (typeof sessionStorage === 'undefined') return false;
  return (
    sessionStorage.getItem('mt_auth_account') === ADMIN_PASSWORD ||
    sessionStorage.getItem('mt_is_admin') === 'true'
  );
};

export const setAdminSession = (): void => {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('mt_auth_account', ADMIN_PASSWORD);
    sessionStorage.setItem('mt_is_admin', 'true');
  }
};

export const clearAdminSession = (): void => {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('mt_auth_account');
    sessionStorage.removeItem('mt_is_admin');
  }
};

export interface AdminAuthGuardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionType?: 'ADD_PERSONNEL' | 'ADD_RED_SITE' | 'RESET_RED_SITES' | 'GENERAL';
  title?: string;
}

export const AdminAuthGuardModal: React.FC<AdminAuthGuardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionType = 'GENERAL',
  title = 'Xác thực Quản trị viên'
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setErrorMessage('');
      setShowPassword(false);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === ADMIN_PASSWORD) {
      setAdminSession();
      setPassword('');
      setErrorMessage('');
      onSuccess();
      onClose();
    } else {
      if (actionType === 'ADD_PERSONNEL') {
        setErrorMessage('Mật khẩu không chính xác. Bạn không có quyền thêm cán bộ!');
      } else if (actionType === 'ADD_RED_SITE') {
        setErrorMessage('Mật khẩu không chính xác. Bạn không có quyền thêm địa chỉ đỏ!');
      } else if (actionType === 'RESET_RED_SITES') {
        setErrorMessage('Mật khẩu không chính xác. Bạn không có quyền khôi phục di tích!');
      } else {
        setErrorMessage('Mật khẩu không chính xác. Bạn không có quyền quản trị!');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-700 border border-amber-200">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">{title}</h3>
              <p className="text-[11px] text-slate-500 font-medium">Bảo mật hệ thống Mặt trận Phường Bình Tiên</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng hộp thoại"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prompt Instruction */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-950 space-y-1">
          <p className="font-semibold text-slate-900 leading-relaxed">
            Khu vực dành riêng cho Quản trị viên. Vui lòng nhập mật khẩu quản trị:
          </p>
          <p className="text-[11px] text-amber-800">
            Phiên đăng nhập quản trị sẽ được lưu tự động để không cần phải nhập lại nhiều lần.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Mật khẩu quản trị (Admin Password)</label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Nhập mật khẩu quản trị..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm pr-10 outline-none transition-all ${
                  errorMessage
                    ? 'border-red-400 focus:ring-2 focus:ring-red-200 bg-red-50/20'
                    : 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
                }`}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error notification if incorrect */}
          {errorMessage && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Xác thực & Mở</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
