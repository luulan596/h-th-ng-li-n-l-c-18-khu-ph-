import React from 'react';
import { RefreshCw } from 'lucide-react';
import { SyncStatus } from '../types';

interface HeaderProps {
  syncStatus: SyncStatus;
  onOpenAppsScriptModal: () => void;
  onRefreshData: () => void;
  onOpenFeedback?: () => void;
  totalPersonnel: number;
  totalKhuPho: number;
}

export const Header: React.FC<HeaderProps> = ({
  syncStatus,
  onRefreshData,
}) => {
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
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Lắng nghe & đồng hành cùng Nhân dân
              </p>
            </div>
          </div>

          {/* Quick Info & Actions */}
          <div className="flex items-center flex-wrap justify-center md:justify-end gap-2.5">
            {/* Manual Refresh Button */}
            <button
              onClick={onRefreshData}
              disabled={syncStatus.isLoading}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition-colors"
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


