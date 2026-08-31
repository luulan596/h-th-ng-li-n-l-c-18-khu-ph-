import React from 'react';
import { Personnel } from '../types';
import { isBanThuongTruc, isKeyLeader, isDeputyLeader, isPartyOfficial } from '../utils/helpers';
import { Users, Award, Shield, UserCheck, Star } from 'lucide-react';

interface StatsOverviewProps {
  personnelList: Personnel[];
  onSelectQuickFilter: (type: 'BTT' | 'TRUONG_BAN' | 'PHO_BAN' | 'CAP_UY' | 'ALL') => void;
  currentFilterType: string;
  redSitesCount?: number;
  onSelectRedSites?: () => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  personnelList,
  onSelectQuickFilter,
  currentFilterType,
}) => {
  const total = personnelList.length;
  const bttCount = personnelList.filter(isBanThuongTruc).length;
  const truongBanCount = personnelList.filter(isKeyLeader).length;
  const phoBanCount = personnelList.filter(isDeputyLeader).length;
  const capUyCount = personnelList.filter(isPartyOfficial).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
      
      {/* Tất cả cán bộ */}
      <div
        onClick={() => onSelectQuickFilter('ALL')}
        className={`flex items-center justify-between px-2.5 py-1.5 rounded-md border text-xs transition-all cursor-pointer select-none ${
          currentFilterType === 'ALL'
            ? 'bg-red-800 text-white border-red-900 shadow-sm ring-1 ring-red-600'
            : 'bg-white hover:bg-red-50/50 text-slate-800 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Users className={`w-3.5 h-3.5 shrink-0 ${currentFilterType === 'ALL' ? 'text-amber-300' : 'text-red-700'}`} />
          <span className="font-bold tracking-tight truncate text-[11px] uppercase">Tổng số</span>
        </div>
        <span className={`text-xs font-black px-1.5 py-0.5 rounded ml-1 shrink-0 ${
          currentFilterType === 'ALL' ? 'bg-amber-400 text-red-950' : 'bg-red-100 text-red-800'
        }`}>
          {total}
        </span>
      </div>

      {/* Ban Thường trực */}
      <div
        onClick={() => onSelectQuickFilter('BTT')}
        className={`flex items-center justify-between px-2.5 py-1.5 rounded-md border transition-all cursor-pointer select-none ${
          currentFilterType === 'BTT'
            ? 'bg-amber-700 text-white border-amber-800 shadow-sm ring-1 ring-amber-500'
            : 'bg-amber-50/80 hover:bg-amber-100/80 text-amber-950 border-amber-200 border-l-3 border-l-amber-600'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Star className={`w-3.5 h-3.5 shrink-0 ${currentFilterType === 'BTT' ? 'text-amber-200 fill-amber-200' : 'text-amber-600 fill-amber-500'}`} />
          <span className="font-extrabold tracking-tight truncate text-[11px] uppercase text-amber-900">Thường trực</span>
        </div>
        <span className={`text-xs font-black px-1.5 py-0.5 rounded ml-1 shrink-0 ${
          currentFilterType === 'BTT' ? 'bg-white text-amber-900' : 'bg-amber-500 text-white'
        }`}>
          {bttCount}
        </span>
      </div>

      {/* Trưởng ban 18 KP */}
      <div
        onClick={() => onSelectQuickFilter('TRUONG_BAN')}
        className={`flex items-center justify-between px-2.5 py-1.5 rounded-md border transition-all cursor-pointer select-none ${
          currentFilterType === 'TRUONG_BAN'
            ? 'bg-red-800 text-white border-red-900 shadow-sm ring-1 ring-red-600'
            : 'bg-white hover:bg-amber-50/60 text-slate-800 border-slate-200 border-l-3 border-l-amber-500'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Award className={`w-3.5 h-3.5 shrink-0 ${currentFilterType === 'TRUONG_BAN' ? 'text-amber-300' : 'text-amber-600'}`} />
          <span className="font-bold tracking-tight truncate text-[11px] uppercase">Trưởng ban KP</span>
        </div>
        <span className={`text-xs font-black px-1.5 py-0.5 rounded ml-1 shrink-0 ${
          currentFilterType === 'TRUONG_BAN' ? 'bg-amber-400 text-red-950' : 'bg-amber-100 text-amber-900'
        }`}>
          {truongBanCount}
        </span>
      </div>

      {/* Phó Trưởng ban 18 KP */}
      <div
        onClick={() => onSelectQuickFilter('PHO_BAN')}
        className={`flex items-center justify-between px-2.5 py-1.5 rounded-md border transition-all cursor-pointer select-none ${
          currentFilterType === 'PHO_BAN'
            ? 'bg-red-800 text-white border-red-900 shadow-sm ring-1 ring-red-600'
            : 'bg-white hover:bg-red-50/50 text-slate-800 border-slate-200 border-l-3 border-l-red-700'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <UserCheck className={`w-3.5 h-3.5 shrink-0 ${currentFilterType === 'PHO_BAN' ? 'text-amber-300' : 'text-red-700'}`} />
          <span className="font-bold tracking-tight truncate text-[11px] uppercase">Phó ban KP</span>
        </div>
        <span className={`text-xs font-black px-1.5 py-0.5 rounded ml-1 shrink-0 ${
          currentFilterType === 'PHO_BAN' ? 'bg-amber-400 text-red-950' : 'bg-red-100 text-red-900'
        }`}>
          {phoBanCount}
        </span>
      </div>

      {/* Cấp ủy Chi bộ */}
      <div
        onClick={() => onSelectQuickFilter('CAP_UY')}
        className={`flex items-center justify-between px-2.5 py-1.5 rounded-md border transition-all cursor-pointer select-none col-span-2 sm:col-span-1 ${
          currentFilterType === 'CAP_UY'
            ? 'bg-red-800 text-white border-red-900 shadow-sm ring-1 ring-red-600'
            : 'bg-white hover:bg-red-50/60 text-slate-800 border-slate-200 border-l-3 border-l-red-600'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Shield className={`w-3.5 h-3.5 shrink-0 ${currentFilterType === 'CAP_UY' ? 'text-amber-300' : 'text-red-600'}`} />
          <span className="font-bold tracking-tight truncate text-[11px] uppercase">Cấp ủy</span>
        </div>
        <span className={`text-xs font-black px-1.5 py-0.5 rounded ml-1 shrink-0 ${
          currentFilterType === 'CAP_UY' ? 'bg-amber-400 text-red-950' : 'bg-red-100 text-red-800'
        }`}>
          {capUyCount}
        </span>
      </div>

    </div>
  );
};

