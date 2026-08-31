import React from 'react';
import { Users, MapPin, Landmark, BarChart3, Mail, QrCode } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  isConnected: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl">
      <div className="grid grid-cols-5 h-14 max-w-lg mx-auto">
        
        {/* Danh bạ Personnel List Tab */}
        <button
          onClick={() => onChangeTab('LIST')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'LIST' ? 'text-red-700' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Users className={`w-5 h-5 ${activeTab === 'LIST' ? 'text-red-700 stroke-[2.5]' : ''}`} />
          <span>Danh bạ</span>
        </button>

        {/* Hộp thư dân chủ cơ sở Feedback Tab */}
        <button
          onClick={() => onChangeTab('FEEDBACK')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors relative ${
            activeTab === 'FEEDBACK' ? 'text-red-700 font-extrabold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Mail className={`w-5 h-5 ${activeTab === 'FEEDBACK' ? 'text-red-700 stroke-[2.5]' : ''}`} />
          <span>Hộp thư</span>
          <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
        </button>

        {/* Địa chỉ đỏ Red Sites Tab */}
        <button
          onClick={() => onChangeTab('RED_SITES')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors relative ${
            activeTab === 'RED_SITES' || activeTab === 'NEWS' ? 'text-red-800 font-extrabold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Landmark className={`w-5 h-5 ${activeTab === 'RED_SITES' || activeTab === 'NEWS' ? 'text-red-800 stroke-[2.5]' : ''}`} />
          <span>Địa chỉ đỏ</span>
        </button>

        {/* Bản đồ HQ Map Tab */}
        <button
          onClick={() => onChangeTab('MAP')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'MAP' ? 'text-red-700' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <MapPin className={`w-5 h-5 ${activeTab === 'MAP' ? 'text-red-700 stroke-[2.5]' : ''}`} />
          <span>Bản đồ</span>
        </button>

        {/* Thống kê Stats Tab */}
        <button
          onClick={() => onChangeTab('STATS')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors ${
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


