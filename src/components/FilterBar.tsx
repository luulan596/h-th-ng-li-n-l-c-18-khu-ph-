import React from 'react';
import { Search, RefreshCcw, Filter, UserCheck, Users, Shield } from 'lucide-react';
import { FilterState, Personnel } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  totalFiltered: number;
  totalCount: number;
  availableKhuPhoList: string[];
  personnelList?: Personnel[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalFiltered,
  totalCount,
  availableKhuPhoList,
}) => {
  const khuPhoOptions = React.useMemo(() => {
    // Generate Khu phố 1 to 18 ordered
    const list = Array.from({ length: 18 }, (_, i) => `Khu phố ${i + 1}`);
    return list;
  }, []);

  const hasActiveFilters = Boolean(
    filters.searchQuery ||
    filters.selectedKhuPho !== 'ALL' ||
    filters.selectedChucDanh !== 'ALL' ||
    (filters.selectedGender && filters.selectedGender !== 'ALL') ||
    filters.selectedDoanThe !== 'ALL' ||
    filters.onlyCapUy
  );

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-3 mb-4 space-y-2.5">
      {/* Top Row: Search Box & Reset & Count */}
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        
        {/* Search Box */}
        <div className="relative flex-1 min-w-[220px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4 text-indigo-600" />
          </div>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Tìm theo họ tên, SĐT, chức danh, địa chỉ, khu phố..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50/80 py-1.5 pl-9 pr-7 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium placeholder-slate-400"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-slate-400 hover:text-slate-600 font-bold"
              title="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>

        {/* Results Counter & Reset */}
        <div className="flex items-center gap-2 shrink-0 justify-between md:justify-end">
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="p-1.5 rounded-md text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 transition-colors flex items-center gap-1 border border-slate-200"
              title="Đặt lại toàn bộ bộ lọc"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>
          )}

          <div className="text-xs text-slate-700 font-medium px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200">
            Hiển thị: <span className="font-bold text-red-700">{totalFiltered}</span>/{totalCount} cán bộ
          </div>
        </div>
      </div>

      {/* Bottom Filter Controls Row */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
        
        {/* Khu phố Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Khu phố:</span>
          <select
            value={filters.selectedKhuPho}
            onChange={(e) => onFilterChange({ selectedKhuPho: e.target.value })}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-md px-2 py-1 focus:ring-1 focus:ring-indigo-500 font-semibold"
          >
            <option value="ALL">Tất cả 18 Khu phố</option>
            {khuPhoOptions.map((kp) => (
              <option key={kp} value={kp}>{kp}</option>
            ))}
          </select>
        </div>

        {/* Chức danh Mặt trận Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Chức danh:</span>
          <select
            value={filters.selectedChucDanh}
            onChange={(e) => onFilterChange({ selectedChucDanh: e.target.value })}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-md px-2 py-1 focus:ring-1 focus:ring-indigo-500 font-semibold"
          >
            <option value="ALL">Tất cả chức danh</option>
            <option value="Trưởng ban">Trưởng ban</option>
            <option value="Phó Trưởng ban">Phó Trưởng ban</option>
            <option value="Thành viên">Thành viên</option>
          </select>
        </div>

        {/* Giới tính Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Giới tính:</span>
          <select
            value={filters.selectedGender || 'ALL'}
            onChange={(e) => onFilterChange({ selectedGender: e.target.value })}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-md px-2 py-1 focus:ring-1 focus:ring-indigo-500 font-semibold"
          >
            <option value="ALL">Tất cả</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </div>

        {/* Cấp ủy Chi bộ Toggle */}
        <button
          onClick={() => onFilterChange({ onlyCapUy: !filters.onlyCapUy })}
          className={`px-2 py-1 rounded-md text-xs font-bold transition-colors flex items-center gap-1 border ${
            filters.onlyCapUy
              ? 'bg-red-700 text-white border-red-800 shadow-2xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          <Shield className="w-3 h-3 text-amber-300" />
          <span>Cấp ủy Chi bộ</span>
        </button>

      </div>
    </div>
  );
};
