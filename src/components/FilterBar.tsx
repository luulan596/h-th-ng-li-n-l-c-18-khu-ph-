import React, { useMemo } from 'react';
import { Search, RefreshCcw } from 'lucide-react';
import { FilterState, Personnel } from '../types';
import { removeVietnameseTones } from '../utils/helpers';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  totalFiltered: number;
  totalCount: number;
  availableKhuPhoList?: string[];
  personnelList: Personnel[];
}

/**
 * Danh sách các từ khóa để nhận diện Ngành/Đoàn thể từ dữ liệu thô
 */
const ORGANIZATION_KEYWORDS = [
  { value: 'PHU_NU', label: 'Phụ nữ', keywords: ['phụ nữ'] },
  { value: 'CUU_CHIEN_BINH', label: 'Cựu chiến binh', keywords: ['cựu chiến binh'] },
  { value: 'DOAN_THANH_NIEN', label: 'Đoàn thanh niên', keywords: ['đoàn thanh niên', 'bí thư chi đoàn'] },
  { value: 'NGUOI_CAO_TUOI', label: 'Người cao tuổi', keywords: ['người cao tuổi'] },
  { value: 'CHU_THAP_DO', label: 'Chữ thập đỏ', keywords: ['chữ thập đỏ'] },
  { value: 'KHUYEN_HOC', label: 'Khuyến học', keywords: ['khuyến học'] },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalFiltered,
  totalCount,
  availableKhuPhoList = [],
  personnelList = [],
}) => {
  // Tạo danh sách Ngành/Đoàn thể động dựa trên dữ liệu hiện có (loại bỏ BTT, Công an, Quân sự)
  const dynamicNganhOptions = useMemo(() => {
    // Chỉ lấy các ngành có ít nhất 1 người trong dữ liệu hiện tại
    const activeOptions = ORGANIZATION_KEYWORDS.filter(org => {
      return personnelList.some(p => {
        const cdk = removeVietnameseTones(p.chucDanhKhac || '').toLowerCase();
        return org.keywords.some(kw => removeVietnameseTones(kw).toLowerCase().includes(cdk) || cdk.includes(removeVietnameseTones(kw).toLowerCase()));
      });
    });

    return [
      { value: 'ALL', label: 'Tất cả Ngành' },
      ...activeOptions
    ];
  }, [personnelList]);

  const hasActiveFilters = Boolean(
    filters.searchQuery ||
    filters.selectedKhuPho !== 'ALL' ||
    (filters.selectedGender && filters.selectedGender !== 'ALL') ||
    filters.selectedDoanThe !== 'ALL'
  );

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-3 mb-4 space-y-3">
      {/* Search Box & Results Counter */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Search Box */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4 text-red-600" />
          </div>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Tìm tên, SĐT, chức danh, khu phố..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition-all text-slate-900 font-medium"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Results Counter */}
        <div className="flex items-center gap-2 shrink-0 justify-between">
          <div className="text-xs text-slate-700 font-medium px-2.5 py-2 bg-slate-100 rounded-lg border border-slate-200">
            Hiển thị: <span className="font-bold text-red-700">{totalFiltered}</span>/{totalCount} cán bộ
          </div>
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="p-2 rounded-lg text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 transition-colors flex items-center gap-1 border border-slate-200"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Khu phố Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase px-1 tracking-wider">Khu phố</label>
          <select
            value={filters.selectedKhuPho}
            onChange={(e) => onFilterChange({ selectedKhuPho: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="ALL">Tất cả Khu phố</option>
            {availableKhuPhoList.map(kp => (
              <option key={kp} value={kp}>{kp}</option>
            ))}
          </select>
        </div>

        {/* Ngành Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase px-1 tracking-wider">Ngành / Đoàn thể</label>
          <select
            value={filters.selectedDoanThe}
            onChange={(e) => onFilterChange({ selectedDoanThe: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            {dynamicNganhOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
