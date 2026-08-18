import React, { useState, useEffect } from 'react';
import { KeyRound, Shield, LogOut, CheckCircle2, AlertCircle, X, UserCheck, Lock } from 'lucide-react';
import { getUserSession, setUserSession, clearUserSession, unlockAdminMode, UserSession } from '../services/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [session, setSession] = useState<UserSession | null>(() => getUserSession());

  useEffect(() => {
    setSession(getUserSession());
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setErrorMsg('Vui lòng nhập Mã PIN Quản trị');
      return;
    }

    if (unlockAdminMode(pinInput.trim())) {
      const newSession: UserSession = {
        email: 'admin@binhtien.gov.vn',
        name: 'Cán bộ Quản trị Hệ thống',
        role: 'ADMIN',
      };
      setSession(newSession);
      setErrorMsg('');
      setPinInput('');
      onLoginSuccess(newSession);
      onClose();
    } else {
      setErrorMsg('Mã PIN không đúng (Mặc định: 1818). Vui lòng thử lại.');
    }
  };

  const handleLogout = () => {
    clearUserSession();
    setSession(null);
    onLoginSuccess({ email: '', name: '', role: 'VIEWER' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-indigo-950 p-4 text-white flex items-center justify-between border-b border-indigo-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-white rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider">XÁC THỰC QUYỀN CÁN BỘ / ADMIN</h3>
              <p className="text-xs text-indigo-200">
                Đăng nhập để xem SĐT cá nhân và thực hiện thao tác quản trị
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-slate-800">
          {session && session.role !== 'VIEWER' ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-sm text-emerald-950">{session.name}</div>
                  <div className="text-xs text-emerald-800">{session.email}</div>
                  <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-600 text-white">
                    <UserCheck className="w-3 h-3" /> Quyền: {session.role}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất khỏi Chế độ Quản trị</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Chế độ **PUBLIC READ** cho phép xem danh sách & bản đồ không cần đăng nhập. Nhập mã PIN Cán bộ để xem SĐT cá nhân và chỉnh sửa dữ liệu.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mã PIN Quản trị Cán bộ (Mặc định: 1818)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Nhập mã PIN (1818)..."
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:border-indigo-600 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-lg text-xs text-rose-800 flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs uppercase tracking-wider"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs uppercase tracking-wider shadow"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
