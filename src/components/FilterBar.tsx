import React from 'react';
import { Search, Filter, RefreshCcw } from 'lucide-react';
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
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2.5 sm:p-3 mb-4">
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
            placeholder="Tìm theo tên, khu phố, chức danh..."
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

        {/* Quick Filters Group & Results Counter */}
        <div className="flex flex-wrap items-center gap-1.5 justify-between md:justify-end">
          {/* Reset button & Results Counter */}
          <div className="flex items-center gap-2">
            {/* Reset button if active */}
            {(filters.searchQuery ||
              filters.selectedKhuPho !== 'ALL' ||
              filters.selectedChucDanh !== 'ALL' ||
              filters.selectedDoanThe !== 'ALL' ||
              filters.onlyCapUy) && (
              <button
                onClick={onResetFilters}
                className="p-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1"
                title="Đặt lại bộ lọc"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Đặt lại</span>
              </button>
            )}

            {/* Count Badge */}
            <div className="text-xs text-slate-600 font-medium px-2 py-1 bg-slate-100 rounded-md border border-slate-200">
              Hiển thị: <span className="font-bold text-red-700">{totalFiltered}</span>/{totalCount} cán bộ
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};


