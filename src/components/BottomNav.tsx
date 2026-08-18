import React from 'react';
import { Users, MapPin, Landmark, BarChart3 } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'LIST' | 'MAP' | 'RED_SITES' | 'NEWS' | 'STATS' | 'SETTINGS';
  onChangeTab: (tab: 'LIST' | 'MAP' | 'RED_SITES' | 'STATS' | 'SETTINGS') => void;
  isConnected: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl pb-[env(safe-area-inset-bottom,0px)]">
      <div className="grid grid-cols-4 h-14">

        
        {/* Danh bạ Personnel List Tab */}
        <button
          onClick={() => onChangeTab('LIST')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'LIST' ? 'text-red-700' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Users className={`w-5 h-5 ${activeTab === 'LIST' ? 'text-red-700 stroke-[2.5]' : ''}`} />
          <span>Danh bạ</span>
        </button>

        {/* Địa chỉ đỏ Red Sites Tab */}
        <button
          onClick={() => onChangeTab('RED_SITES')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors relative ${
            activeTab === 'RED_SITES' || activeTab === 'NEWS' ? 'text-red-800 font-extrabold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Landmark className={`w-5 h-5 ${activeTab === 'RED_SITES' || activeTab === 'NEWS' ? 'text-red-800 stroke-[2.5]' : ''}`} />
          <span>Địa chỉ đỏ</span>
          <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
        </button>

        {/* Bản đồ HQ Map Tab */}
        <button
          onClick={() => onChangeTab('MAP')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'MAP' ? 'text-red-700' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <MapPin className={`w-5 h-5 ${activeTab === 'MAP' ? 'text-red-700 stroke-[2.5]' : ''}`} />
          <span>Bản đồ</span>
        </button>

        {/* Thống kê Stats Tab */}
        <button
          onClick={() => onChangeTab('STATS')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'STATS' ? 'text-red-700' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <BarChart3 className={`w-5 h-5 ${activeTab === 'STATS' ? 'text-red-700 stroke-[2.5]' : ''}`} />
          <span>Thống kê</span>
        </button>

      </div>
    </nav>
  );
};

