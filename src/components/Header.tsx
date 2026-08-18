import React from 'react';
import { RefreshCw, Layers, Database, Wifi, WifiOff, Shield, ShieldCheck, Lock } from 'lucide-react';
import { SyncStatus } from '../types';
import { UserSession } from '../services/auth';

interface HeaderProps {
  syncStatus: SyncStatus;
  isOnline: boolean;
  userSession?: UserSession | null;
  onOpenAppsScriptModal: () => void;
  onOpenAuthModal?: () => void;
  onRefreshData: () => void;
  totalPersonnel: number;
  totalKhuPho: number;
}

export const Header: React.FC<HeaderProps> = ({
  syncStatus,
  isOnline,
  userSession,
  onOpenAppsScriptModal,
  onOpenAuthModal,
  onRefreshData,
}) => {
  const isAdminOrEditor = userSession && userSession.role !== 'VIEWER';

  return (
    <header className="relative bg-white text-slate-900 shadow-sm border-b border-slate-200">
      {/* Decorative Golden & Red Accent Line */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-red-600 to-indigo-600"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* National/Front Banner */}
          <div className="flex items-center space-x-3.5 text-center md:text-left">
            <div>
              <h1 className="font-anton text-xl sm:text-2xl tracking-wide text-red-950 leading-tight">
                HỆ THỐNG LIÊN LẠC BAN CÔNG TÁC MẶT TRẬN 18 KHU PHỐ <span className="whitespace-nowrap">PHƯỜNG BÌNH TIÊN</span>
              </h1>
              <p className="text-xs text-slate-600 mt-1 font-medium flex items-center justify-center md:justify-start gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-100 font-semibold uppercase text-[10px] tracking-wider">
                  <Layers className="w-3 h-3" /> 18 Khu Phố
                </span>
                
                {/* Network status pill */}
                {isOnline ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold text-[10px] uppercase tracking-wider">
                    <Wifi className="w-3 h-3 text-emerald-600" /> Trực tuyến (Online)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 font-semibold text-[10px] uppercase tracking-wider animate-pulse">
                    <WifiOff className="w-3 h-3 text-amber-700" /> Ngoại tuyến (Offline PWA)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Quick Info & Actions */}
          <div className="flex items-center flex-wrap justify-center md:justify-end gap-2">
            {/* Auth / Admin Mode Trigger */}
            <button
              onClick={onOpenAuthModal}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                isAdminOrEditor
                  ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-sm'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
              title={isAdminOrEditor ? `Đã xác thực quyền: ${userSession?.role}` : "Đăng nhập Cán bộ / Quản trị"}
            >
              {isAdminOrEditor ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  <span>{userSession?.role === 'ADMIN' ? '👑 Admin' : '✏️ Editor'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Đăng nhập Cán bộ</span>
                </>
              )}
            </button>

            {/* Apps Script Connection Modal Trigger */}
            <button
              onClick={onOpenAppsScriptModal}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                syncStatus.isConnected
                  ? 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
              title="Cấu hình Google Sheet / Apps Script"
            >
              <Database className="w-3.5 h-3.5 text-indigo-700" />
              <span>{syncStatus.isConnected ? 'Đã lưu URL Sheet' : 'Kết nối Sheet'}</span>
            </button>

            {/* Manual Refresh Button */}
            <button
              onClick={onRefreshData}
              disabled={syncStatus.isLoading || !isOnline}
              className={`p-2 rounded-lg border transition-colors ${
                !isOnline
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              }`}
              title={isOnline ? "Cập nhật dữ liệu từ Google Sheet" : "Cần Internet để làm mới dữ liệu từ Google Sheet"}
            >
              <RefreshCw className={`w-4 h-4 ${syncStatus.isLoading ? 'animate-spin text-amber-600' : ''}`} />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};



