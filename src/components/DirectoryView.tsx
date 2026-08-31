/**
 * ==============================================================================
 * MÀN HÌNH TAB 1: DANH BẠ NHÂN SỰ MẶT TRẬN (DIRECTORY VIEW)
 * ==============================================================================
 * Quản lý danh bạ 18 khu phố và Ban Thường trực, tích hợp tìm kiếm thông minh,
 * lọc đa tiêu chí, chuyển đổi xem Dạng Thẻ / Dạng Bảng, gọi điện nhanh,
 * xuất CSV và nhập dữ liệu từ Excel / Google Sheet.
 */

import React, { useState } from 'react';
import { Personnel, FilterState, SyncStatus } from '../types';
import { FilterBar } from './FilterBar';
import { PersonnelCard } from './PersonnelCard';
import { PersonnelTable } from './PersonnelTable';
import { QuickCallModal } from './QuickCallModal';
import { PersonnelFormModal } from './PersonnelFormModal';
import { AppsScriptModal } from './AppsScriptModal';
import { ExcelImportModal } from './ExcelImportModal';
import { Grid, Table, Plus, Download, RefreshCw, FileSpreadsheet, RotateCcw } from 'lucide-react';

interface DirectoryViewProps {
  personnelList: Personnel[];
  filteredPersonnelList: Personnel[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  availableKhuPhoList: string[];
  syncStatus: SyncStatus;
  viewMode: 'GRID' | 'TABLE';
  setViewMode: (mode: 'GRID' | 'TABLE') => void;
  onSavePersonnel: (person: Personnel) => void;
  onDeletePersonnel: (person: Personnel) => void;
  onImportExcel: (data: Personnel[], mode: 'replace' | 'append') => void;
  onResetToDefault: () => void;
  onSyncGoogleSheet: (url?: string) => void;
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  personnelList,
  filteredPersonnelList,
  filters,
  setFilters,
  availableKhuPhoList,
  syncStatus,
  viewMode,
  setViewMode,
  onSavePersonnel,
  onDeletePersonnel,
  onImportExcel,
  onResetToDefault,
  onSyncGoogleSheet,
}) => {
  const [selectedPersonForCall, setSelectedPersonForCall] = useState<Personnel | null>(null);
  const [isAppsScriptModalOpen, setIsAppsScriptModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);

  // Xuất file CSV định dạng chuẩn tiếng Việt UTF-8 BOM
  const handleExportCSV = () => {
    const headers = ['STT', 'Họ và tên', 'Năm sinh Nam', 'Năm sinh Nữ', 'Chức danh Mặt trận', 'Chức danh kiêm nhiệm', 'Địa chỉ', 'Số điện thoại', 'Khu phố'];
    const rows = filteredPersonnelList.map((p) => [
      p.stt,
      `"${p.hoTen}"`,
      p.namSinhNam || '',
      p.namSinhNu || '',
      `"${p.chucDanhMatTran}"`,
      `"${p.chucDanhKhac || ''}"`,
      `"${p.diaChi}"`,
      `"'${p.soDienThoai}"`,
      `"${p.khuPho}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Danh_sach_Mat_tran_18_Khu_pho.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Thanh công cụ thao tác nhanh (Quick Action Toolbar) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Kết quả: <span className="text-red-700 font-extrabold">{filteredPersonnelList.length}</span> / {personnelList.length} cán bộ
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Nút Chuyển chế độ xem Thẻ / Bảng */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('GRID')}
              className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'GRID' ? 'bg-red-800 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem dạng thẻ danh thiếp"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thẻ</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'TABLE' ? 'bg-red-800 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem dạng bảng chi tiết"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bảng</span>
            </button>
          </div>

          {/* Nút Nhập Excel */}
          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
            title="Nhập danh sách từ tệp Excel .xlsx"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Nhập Excel</span>
          </button>

          {/* Nút Xuất CSV */}
          <button
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
            title="Tải về file CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Xuất CSV</span>
          </button>

          {/* Nút Thêm cán bộ */}
          <button
            onClick={() => {
              setEditingPersonnel(null);
              setIsFormModalOpen(true);
            }}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Cán Bộ</span>
          </button>
        </div>
      </div>

      {/* Thanh tìm kiếm và bộ lọc nâng cao */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        totalCount={filteredPersonnelList.length}
        availableKhuPhoList={availableKhuPhoList}
      />

      {/* Khu vực hiển thị danh sách (Thẻ hoặc Bảng) */}
      {filteredPersonnelList.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-14 h-14 bg-red-50 text-red-700 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            🔍
          </div>
          <h3 className="text-base font-bold text-slate-800">Không tìm thấy cán bộ nào phù hợp</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc bấm nút thiết lập lại để xem toàn bộ danh bạ 18 khu phố.
          </p>
          <button
            onClick={() =>
              setFilters({
                searchQuery: '',
                selectedKhuPho: 'ALL',
                selectedChucDanh: 'ALL',
                selectedGender: 'ALL',
                onlyCapUy: false,
                selectedDoanThe: 'ALL',
                sortBy: 'stt',
              })
            }
            className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white text-xs font-bold rounded-lg transition-all"
          >
            Xóa bộ lọc tìm kiếm
          </button>
        </div>
      ) : viewMode === 'GRID' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredPersonnelList.map((person) => (
            <PersonnelCard
              key={person.id}
              personnel={person}
              onQuickCall={(p) => setSelectedPersonForCall(p)}
              onEdit={(p) => {
                setEditingPersonnel(p);
                setIsFormModalOpen(true);
              }}
              onDelete={onDeletePersonnel}
            />
          ))}
        </div>
      ) : (
        <PersonnelTable
          personnelList={filteredPersonnelList}
          onQuickCall={(p) => setSelectedPersonForCall(p)}
          onEdit={(p) => {
            setEditingPersonnel(p);
            setIsFormModalOpen(true);
          }}
          onDelete={onDeletePersonnel}
        />
      )}

      {/* Chân trang Danh bạ với nút khôi phục mặc định */}
      <div className="flex items-center justify-center pt-3">
        <button
          onClick={() => {
            if (window.confirm('Bạn có chắc chắn muốn khôi phục danh bạ về dữ liệu mặc định ban đầu không?')) {
              onResetToDefault();
            }
          }}
          className="text-xs text-slate-400 hover:text-red-700 flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Khôi phục dữ liệu danh bạ gốc</span>
        </button>
      </div>

      {/* --- CÁC MODAL ĐIỀU HÀNH --- */}
      {selectedPersonForCall && (
        <QuickCallModal
          personnel={selectedPersonForCall}
          onClose={() => setSelectedPersonForCall(null)}
        />
      )}

      {isFormModalOpen && (
        <PersonnelFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingPersonnel(null);
          }}
          onSave={(p) => {
            onSavePersonnel(p);
            setIsFormModalOpen(false);
            setEditingPersonnel(null);
          }}
          initialData={editingPersonnel}
          availableKhuPhoList={availableKhuPhoList}
        />
      )}

      {isAppsScriptModalOpen && (
        <AppsScriptModal
          isOpen={isAppsScriptModalOpen}
          onClose={() => setIsAppsScriptModalOpen(false)}
          currentUrl={syncStatus.webAppUrl}
          onSaveUrl={(url) => onSyncGoogleSheet(url)}
        />
      )}

      {isExcelModalOpen && (
        <ExcelImportModal
          isOpen={isExcelModalOpen}
          onClose={() => setIsExcelModalOpen(false)}
          onImport={onImportExcel}
        />
      )}
    </div>
  );
};
