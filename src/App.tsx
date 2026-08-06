import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { StatsOverview } from './components/StatsOverview';
import { PersonnelCard } from './components/PersonnelCard';
import { PersonnelTable } from './components/PersonnelTable';
import { AdminMap } from './components/AdminMap';
import { QuickCallModal } from './components/QuickCallModal';
import { AppsScriptModal } from './components/AppsScriptModal';
import { PersonnelFormModal } from './components/PersonnelFormModal';
import { BottomNav } from './components/BottomNav';
import { RedSitesView } from './components/RedSitesView';

import { Personnel, FilterState, SyncStatus, Headquarters, RedSite } from './types';
import { INITIAL_PERSONNEL_DATA, ADMINISTRATIVE_HEADQUARTERS, INITIAL_RED_SITES_DATA } from './data/initialData';
import { isKeyLeader, isDeputyLeader, isPartyOfficial, removeVietnameseTones } from './utils/helpers';
import { Grid, Table, Plus, Download, RefreshCw, Database, MapPin, Users, Landmark } from 'lucide-react';

export default function App() {
  // --- Persistent Local & Google Sheet Data State ---
  const [personnelList, setPersonnelList] = useState<Personnel[]>(() => {
    const saved = localStorage.getItem('mt_personnel_data');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_PERSONNEL_DATA;
  });

  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => {
    const savedUrl = localStorage.getItem('mt_apps_script_url') || '';
    return {
      isConnected: !!savedUrl,
      webAppUrl: savedUrl,
      lastSynced: null,
      statusMessage: savedUrl ? 'Đã lưu đường dẫn Google Sheet' : 'Chưa kết nối',
      isLoading: false,
    };
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('mt_personnel_data', JSON.stringify(personnelList));
  }, [personnelList]);

  // --- UI View States ---
  const [activeTab, setActiveTab] = useState<'LIST' | 'MAP' | 'RED_SITES' | 'NEWS' | 'STATS' | 'SETTINGS'>('LIST');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // --- Headquarters State ---
  const [headquartersList, setHeadquartersList] = useState<Headquarters[]>(() => {
    const saved = localStorage.getItem('mt_headquarters_data');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return ADMINISTRATIVE_HEADQUARTERS;
  });

  useEffect(() => {
    localStorage.setItem('mt_headquarters_data', JSON.stringify(headquartersList));
  }, [headquartersList]);

  // --- Red Sites State ---
  const [redSitesList, setRedSitesList] = useState<RedSite[]>(() => {
    const saved = localStorage.getItem('mt_red_sites_data_v6');
    if (saved) {
      try {
        const parsed: RedSite[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((p) => p.id));
        const missingDefaults = INITIAL_RED_SITES_DATA.filter((item) => !existingIds.has(item.id));
        if (missingDefaults.length > 0) {
          return [...parsed, ...missingDefaults];
        }
        return parsed;
      } catch (e) { /* fallback */ }
    }
    return INITIAL_RED_SITES_DATA;
  });

  useEffect(() => {
    localStorage.setItem('mt_red_sites_data_v6', JSON.stringify(redSitesList));
  }, [redSitesList]);

  // --- Filter State ---
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedKhuPho: 'ALL',
    selectedChucDanh: 'ALL',
    onlyCapUy: false,
    selectedDoanThe: 'ALL',
    sortBy: 'stt',
  });

  // --- Modal States ---
  const [selectedPersonForCall, setSelectedPersonForCall] = useState<Personnel | null>(null);
  const [isAppsScriptModalOpen, setIsAppsScriptModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);

  // Available Khu phố List
  const availableKhuPhoList = useMemo(() => {
    const set = new Set<string>();
    for (let i = 1; i <= 18; i++) {
      set.add(`Khu phố ${i}`);
    }
    personnelList.forEach((p) => p.khuPho && set.add(p.khuPho));
    return Array.from(set);
  }, [personnelList]);

  // Sync with Google Sheet Function
  const fetchFromGoogleSheet = async (urlToUse?: string) => {
    const targetUrl = urlToUse || syncStatus.webAppUrl;
    if (!targetUrl) return;

    setSyncStatus((prev) => ({ ...prev, isLoading: true, statusMessage: 'Đang tải từ Google Sheet...' }));

    try {
      const response = await fetch(targetUrl);
      const result = await response.json();

      if (result && Array.isArray(result.data) && result.data.length > 0) {
        setPersonnelList(result.data);
        const timeString = new Date().toLocaleTimeString('vi-VN');
        setSyncStatus({
          isConnected: true,
          webAppUrl: targetUrl,
          lastSynced: timeString,
          statusMessage: `Đã đồng bộ thành công lúc ${timeString}`,
          isLoading: false,
        });
      } else {
        setSyncStatus((prev) => ({
          ...prev,
          isLoading: false,
          statusMessage: 'Google Sheet rỗng hoặc dữ liệu chưa đúng cấu trúc.',
        }));
      }
    } catch (err) {
      console.error('Fetch Google Sheet error:', err);
      setSyncStatus((prev) => ({
        ...prev,
        isLoading: false,
        statusMessage: 'Lỗi kết nối. Vui lòng kiểm tra lại URL Apps Script.',
      }));
    }
  };

  // Sync on startup if URL exists
  useEffect(() => {
    if (syncStatus.webAppUrl) {
      fetchFromGoogleSheet();
    }
  }, []);

  const handleSaveAppsScriptUrl = (url: string) => {
    localStorage.setItem('mt_apps_script_url', url);
    setSyncStatus((prev) => ({ ...prev, webAppUrl: url, isConnected: true }));
    fetchFromGoogleSheet(url);
  };

  // Fast Client-Side Memoized Filtering Logic
  const filteredPersonnelList = useMemo(() => {
    return personnelList.filter((p) => {
      // 1. Smart Search Query (Accent-insensitive, diacritic tolerant & numerical shortcuts)
      if (filters.searchQuery.trim()) {
        const rawQ = filters.searchQuery.trim();
        const normQ = removeVietnameseTones(rawQ).toLowerCase();
        const digitsOnly = rawQ.replace(/\D/g, '');

        // Normalized personnel fields
        const normName = removeVietnameseTones(p.hoTen).toLowerCase();
        const phoneClean = p.soDienThoai.replace(/\D/g, '');
        const normAddress = removeVietnameseTones(p.diaChi).toLowerCase();
        const normRole = removeVietnameseTones(p.chucDanhMatTran || '').toLowerCase();
        const normOther = removeVietnameseTones(p.chucDanhKhac || '').toLowerCase();
        const normKP = removeVietnameseTones(p.khuPho || '').toLowerCase();
        const kpDigits = p.khuPho.replace(/\D/g, '');

        // 1. Direct Name Match
        const matchName = normName.includes(normQ) || p.hoTen.toLowerCase().includes(rawQ.toLowerCase());

        // 2. Khu Phố Match (e.g. searching "1", "KP1", "Khu phố 1")
        let matchKP = normKP.includes(normQ);
        if (!matchKP && /^\d{1,2}$/.test(rawQ)) {
          const parsedNum = parseInt(rawQ, 10);
          if (parsedNum >= 1 && parsedNum <= 18) {
            matchKP = kpDigits === String(parsedNum);
          }
        } else if (!matchKP && /^(kp|khu\s*pho)\s*\d{1,2}$/i.test(normQ)) {
          const numMatch = normQ.match(/\d{1,2}/);
          if (numMatch) {
            matchKP = kpDigits === String(parseInt(numMatch[0], 10));
          }
        }

        // 3. Phone Match (only when >= 3 digits)
        const matchPhone = digitsOnly.length >= 3 ? phoneClean.includes(digitsOnly) : false;

        // 4. Role, Other Roles, Address
        const matchRole = normRole.includes(normQ);
        const matchOther = normOther.includes(normQ);
        const matchAddress = normAddress.includes(normQ);

        // Explicit STT search only if "stt" is typed
        const matchSTT = normQ.startsWith('stt') && digitsOnly.length > 0 && String(p.stt) === digitsOnly;

        if (!matchName && !matchKP && !matchPhone && !matchRole && !matchOther && !matchAddress && !matchSTT) {
          return false;
        }
      }

      // 2. Khu Phố
      if (filters.selectedKhuPho !== 'ALL' && p.khuPho !== filters.selectedKhuPho) {
        return false;
      }

      // 3. Chức danh Mặt trận
      if (filters.selectedChucDanh !== 'ALL') {
        const cd = p.chucDanhMatTran?.toLowerCase() || '';
        if (filters.selectedChucDanh === 'Trưởng ban' && !isKeyLeader(p)) return false;
        if (filters.selectedChucDanh === 'Phó Trưởng ban' && !isDeputyLeader(p)) return false;
        if (filters.selectedChucDanh === 'Thành viên' && (isKeyLeader(p) || isDeputyLeader(p))) return false;
      }

      // 4. Cấp ủy Chi bộ
      if (filters.onlyCapUy && !isPartyOfficial(p)) {
        return false;
      }

      // 5. Đoàn thể
      if (filters.selectedDoanThe !== 'ALL') {
        const other = p.chucDanhKhac?.toLowerCase() || '';
        const target = filters.selectedDoanThe.toLowerCase();
        if (!other.includes(target)) return false;
      }

      return true;
    });
  }, [personnelList, filters]);

  // Handle Add/Edit Personnel
  const handleSavePersonnel = (person: Personnel) => {
    let isUpdate = false;
    setPersonnelList((prev) => {
      const existsIndex = prev.findIndex((p) => p.id === person.id);
      if (existsIndex >= 0) {
        isUpdate = true;
        const updated = [...prev];
        updated[existsIndex] = person;
        return updated;
      } else {
        return [person, ...prev];
      }
    });

    // If connected to Apps Script, send POST
    if (syncStatus.webAppUrl) {
      fetch(syncStatus.webAppUrl, {
        method: 'POST',
        body: JSON.stringify({ action: isUpdate ? 'UPDATE' : 'ADD', data: person }),
      }).catch((e) => console.log('POST AppsScript error:', e));
    }
  };

  // Handle Delete Personnel
  const handleDeletePersonnel = (person: Personnel) => {
    setPersonnelList((prev) => prev.filter((p) => p.id !== person.id));

    if (syncStatus.webAppUrl) {
      fetch(syncStatus.webAppUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'DELETE', data: person }),
      }).catch((e) => console.log('Delete AppsScript error:', e));
    }
  };

  // Push all local personnel data to Google Sheet
  const handlePushAllToGoogleSheet = async () => {
    if (!syncStatus.webAppUrl) return;
    setSyncStatus((prev) => ({ ...prev, isLoading: true, statusMessage: 'Đang đẩy toàn bộ dữ liệu lên Google Sheet...' }));
    try {
      await fetch(syncStatus.webAppUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'SYNC_ALL', list: personnelList }),
      });
      const timeString = new Date().toLocaleTimeString('vi-VN');
      setSyncStatus((prev) => ({
        ...prev,
        isLoading: false,
        lastSynced: timeString,
        statusMessage: `Đã đồng bộ toàn bộ ${personnelList.length} nhân sự lên Google Sheet thành công!`,
      }));
    } catch (e) {
      setSyncStatus((prev) => ({ ...prev, isLoading: false, statusMessage: 'Lỗi kết nối tới Google Apps Script' }));
    }
  };

  // Export CSV Helper
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
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-20 font-sans">
      
      {/* Official Government Header (Only in List view) */}
      {activeTab === 'LIST' && (
        <Header
          syncStatus={syncStatus}
          onOpenAppsScriptModal={() => setIsAppsScriptModalOpen(true)}
          onRefreshData={() => fetchFromGoogleSheet()}
          totalPersonnel={personnelList.length}
          totalKhuPho={18}
        />
      )}

      {/* Main Responsive Body Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-5">
        
        {/* Quick Action Toolbar */}
        {activeTab === 'LIST' && (
          <div className="flex items-center justify-end gap-1.5 mb-3.5">
            {/* Add Personnel Button */}
            <button
              onClick={() => {
                setEditingPersonnel(null);
                setIsFormModalOpen(true);
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>THÊM CÁN BỘ</span>
            </button>
          </div>
        )}

        {/* Top Summary Statistics Cards (Only in List view) */}
        {activeTab === 'LIST' && (
          <StatsOverview
            personnelList={personnelList}
            currentFilterType={
              filters.selectedChucDanh === 'Trưởng ban'
                ? 'TRUONG_BAN'
                : filters.selectedChucDanh === 'Phó Trưởng ban'
                ? 'PHO_BAN'
                : filters.onlyCapUy
                ? 'CAP_UY'
                : 'ALL'
            }
            onSelectQuickFilter={(type) => {
              if (type === 'ALL') {
                setFilters({ ...filters, selectedChucDanh: 'ALL', onlyCapUy: false });
              } else if (type === 'TRUONG_BAN') {
                setFilters({ ...filters, selectedChucDanh: 'Trưởng ban', onlyCapUy: false });
              } else if (type === 'PHO_BAN') {
                setFilters({ ...filters, selectedChucDanh: 'Phó Trưởng ban', onlyCapUy: false });
              } else if (type === 'CAP_UY') {
                setFilters({ ...filters, selectedChucDanh: 'ALL', onlyCapUy: true });
              }
            }}
          />
        )}

        {/* Tab 1: Personnel Directory View */}
        {activeTab === 'LIST' && (
          <div className="space-y-4">
            
            {/* Filter Bar */}
            <FilterBar
              filters={filters}
              onFilterChange={(newF) => setFilters((prev) => ({ ...prev, ...newF }))}
              onResetFilters={() =>
                setFilters({
                  searchQuery: '',
                  selectedKhuPho: 'ALL',
                  selectedChucDanh: 'ALL',
                  onlyCapUy: false,
                  selectedDoanThe: 'ALL',
                  sortBy: 'stt',
                })
              }
              totalFiltered={filteredPersonnelList.length}
              totalCount={personnelList.length}
              availableKhuPhoList={availableKhuPhoList}
              personnelList={personnelList}
            />

            {/* Content: Cards Grid or Table */}
            {viewMode === 'GRID' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {filteredPersonnelList.length === 0 ? (
                  <div className="col-span-full bg-white p-12 rounded-xl text-center border border-slate-200">
                    <p className="text-slate-500 font-medium">Không tìm thấy nhân sự phù hợp với từ khóa hoặc bộ lọc.</p>
                  </div>
                ) : (
                  filteredPersonnelList.map((person) => (
                    <PersonnelCard
                      key={person.id}
                      personnel={person}
                      onSelectPerson={(p) => setSelectedPersonForCall(p)}
                    />
                  ))
                )}
              </div>
            ) : (
              <PersonnelTable
                personnelList={filteredPersonnelList}
                onSelectPerson={(p) => setSelectedPersonForCall(p)}
              />
            )}

          </div>
        )}

        {/* Tab 2: Red Sites View (Địa chỉ đỏ) */}
        {(activeTab === 'RED_SITES' || activeTab === 'NEWS') && (
          <RedSitesView
            redSitesList={redSitesList}
            onAddRedSite={(newItem) => setRedSitesList((prev) => [newItem, ...prev])}
            onResetRedSites={() => setRedSitesList(INITIAL_RED_SITES_DATA)}
          />
        )}

        {/* Tab 3: Map & Headquarters View */}
        {activeTab === 'MAP' && (
          <AdminMap
            headquartersList={headquartersList}
            redSitesList={redSitesList}
            selectedKhuPhoFilter={filters.selectedKhuPho}
            onUpdateHeadquarters={(updated) => setHeadquartersList(updated)}
            webAppUrl={syncStatus.webAppUrl}
          />
        )}

        {/* Tab 3: Stats Mobile Tab */}
        {activeTab === 'STATS' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold font-anton text-red-950 border-b border-slate-200 pb-2">
              THỐNG KÊ CHI TIẾT BAN CÔNG TÁC MẶT TRẬN 18 KHU PHỐ
            </h3>
            
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="font-semibold text-slate-700">Tổng số Khu phố:</span>
                <span className="font-mono font-bold text-red-900">18 Khu phố</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                <span className="font-semibold text-amber-950">Tổng số Trưởng ban:</span>
                <span className="font-mono font-bold text-amber-900">{personnelList.filter(isKeyLeader).length} đồng chí</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-amber-50/50 rounded-lg border border-amber-200/60">
                <span className="font-semibold text-amber-900">Tổng số Phó Trưởng ban:</span>
                <span className="font-mono font-bold text-amber-800">{personnelList.filter(isDeputyLeader).length} đồng chí</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                <span className="font-semibold text-red-950">Đại diện Cấp ủy Chi bộ kiêm nhiệm:</span>
                <span className="font-mono font-bold text-red-900">{personnelList.filter(isPartyOfficial).length} đồng chí</span>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Quick Call & Contact Modal */}
      <QuickCallModal
        personnel={selectedPersonForCall}
        onClose={() => setSelectedPersonForCall(null)}
        onNavigateToMap={(kp) => {
          setFilters((prev) => ({ ...prev, selectedKhuPho: kp }));
          setActiveTab('MAP');
        }}
      />

      {/* Google Sheet & Apps Script Modal */}
      <AppsScriptModal
        isOpen={isAppsScriptModalOpen}
        onClose={() => setIsAppsScriptModalOpen(false)}
        syncStatus={syncStatus}
        onSaveUrl={handleSaveAppsScriptUrl}
        onSyncNow={() => fetchFromGoogleSheet()}
        onPushAll={handlePushAllToGoogleSheet}
      />

      {/* Add/Edit Personnel Modal */}
      <PersonnelFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingPersonnel(null);
        }}
        onSave={handleSavePersonnel}
        editingPersonnel={editingPersonnel}
        availableKhuPhoList={availableKhuPhoList}
      />

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        isConnected={syncStatus.isConnected}
      />

    </div>
  );
}
