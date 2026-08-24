import React from 'react';
import { Users, MapPin, Landmark, BarChart3, MessageSquare } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'LIST' | 'MAP' | 'RED_SITES' | 'NEWS' | 'FEEDBACK' | 'STATS' | 'SETTINGS';
  onChangeTab: (tab: 'LIST' | 'MAP' | 'RED_SITES' | 'FEEDBACK' | 'STATS' | 'SETTINGS') => void;
  isConnected: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl pb-[env(safe-area-inset-bottom,0px)]">
      <div className="grid grid-cols-5 h-14">

        {/* 1. Danh bạ Personnel List Tab */}
        <button
          onClick={() => onChangeTab('LIST')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors px-0.5 ${
            activeTab === 'LIST' ? 'text-red-700' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Users className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'LIST' ? 'text-red-700 stroke-[2.5]' : ''}`} />
          <span className="truncate max-w-full">Danh bạ</span>
        </button>

        {/* 2. Địa chỉ đỏ Red Sites Tab */}
        <button
          onClick={() => onChangeTab('RED_SITES')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors relative px-0.5 ${
            activeTab === 'RED_SITES' || activeTab === 'NEWS' ? 'text-red-800 font-extrabold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Landmark className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'RED_SITES' || activeTab === 'NEWS' ? 'text-red-800 stroke-[2.5]' : ''}`} />
          <span className="truncate max-w-full">Địa chỉ đỏ</span>
          <span className="absolute top-1.5 right-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
        </button>

        {/* 3. Bản đồ HQ Map Tab */}
        <button
          onClick={() => onChangeTab('MAP')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors px-0.5 ${
            activeTab === 'MAP' ? 'text-red-700' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <MapPin className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'MAP' ? 'text-red-700 stroke-[2.5]' : ''}`} />
          <span className="truncate max-w-full">Bản đồ</span>
        </button>

        {/* 4. Góp ý Feedback Tab */}
        <button
          onClick={() => onChangeTab('FEEDBACK')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors px-0.5 ${
            activeTab === 'FEEDBACK' ? 'text-red-700' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <MessageSquare className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'FEEDBACK' ? 'text-red-700 stroke-[2.5]' : ''}`} />
          <span className="truncate max-w-full">Góp ý</span>
        </button>

        {/* 5. Thống kê Stats Tab */}
        <button
          onClick={() => onChangeTab('STATS')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors px-0.5 ${
            activeTab === 'STATS' ? 'text-red-700' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <BarChart3 className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'STATS' ? 'text-red-700 stroke-[2.5]' : ''}`} />
          <span className="truncate max-w-full">Thống kê</span>
        </button>

      </div>
    </nav>
  );
};

