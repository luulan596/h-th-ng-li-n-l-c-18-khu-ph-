import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { ToastContainer } from './components/Toast';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

import { Personnel, FilterState, SyncStatus, Headquarters, RedSite, ToastMessage } from './types';
import { INITIAL_PERSONNEL_DATA, ADMINISTRATIVE_HEADQUARTERS, INITIAL_RED_SITES_DATA } from './data/initialData';
import { isKeyLeader, isDeputyLeader, isPartyOfficial, removeVietnameseTones } from './utils/helpers';
import {
  apiFetchPersonnelList,
  apiSavePersonnel,
  apiDeletePersonnel,
  apiPushAllPersonnel,
  processOfflineSyncQueue,
  getStoredWebAppUrl,
  setStoredWebAppUrl,
} from './services/api';
import { addToOfflineQueue, getPendingQueueCount } from './services/offlineQueue';
import { Plus } from 'lucide-react';

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
    const savedUrl = getStoredWebAppUrl();
    return {
      isConnected: !!savedUrl,
      webAppUrl: savedUrl,
      lastSynced: null,
      statusMessage: savedUrl ? 'Đã lưu đường dẫn Google Sheet' : 'Chưa kết nối',
      isLoading: false,
      pendingCount: getPendingQueueCount(),
    };
  });

  // Toast System State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

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

  // Fetch Data from Google Sheets API
  const fetchFromGoogleSheet = async (urlToUse?: string) => {
    const targetUrl = urlToUse || syncStatus.webAppUrl;
    if (!targetUrl) return;

    setSyncStatus((prev) => ({ ...prev, isLoading: true, statusMessage: 'Đang tải từ Google Sheet...' }));

    const response = await apiFetchPersonnelList(targetUrl);

    if (response.success && response.data && response.data.length > 0) {
      setPersonnelList(response.data);
      const timeString = new Date().toLocaleTimeString('vi-VN');
      setSyncStatus({
        isConnected: true,
        webAppUrl: targetUrl,
        lastSynced: timeString,
        statusMessage: `Đã đồng bộ thành công lúc ${timeString}`,
        isLoading: false,
        pendingCount: getPendingQueueCount(),
      });
      addToast('success', `Đã đồng bộ dữ liệu thành công từ Google Sheets (${response.data.length} cán bộ).`);
    } else {
      setSyncStatus((prev) => ({
        ...prev,
        isLoading: false,
        statusMessage: response.message || 'Google Sheet rỗng hoặc dữ liệu chưa đúng cấu trúc.',
        pendingCount: getPendingQueueCount(),
      }));
      addToast('warning', response.message || 'Chưa tải được dữ liệu từ Google Sheets.');
    }
  };

  // Sync on startup if URL exists
  useEffect(() => {
    if (syncStatus.webAppUrl && navigator.onLine) {
      fetchFromGoogleSheet();
    }
  }, []);

  // Online / Offline & Auto Sync Handling
  useEffect(() => {
    const handleOnline = async () => {
      addToast('info', 'Đã có kết nối mạng trở lại. Đang kiểm tra đồng bộ dữ liệu...');
      if (syncStatus.webAppUrl) {
        const { syncedCount } = await processOfflineSyncQueue(syncStatus.webAppUrl);
        if (syncedCount > 0) {
          addToast('success', `Đã đồng bộ và lưu dữ liệu thành công vào Google Sheets (${syncedCount} giao dịch).`);
          fetchFromGoogleSheet();
        }
      }
      setSyncStatus((prev) => ({ ...prev, pendingCount: getPendingQueueCount() }));
    };

    const handleOffline = () => {
      addToast('warning', 'Thiết bị đang mất mạng. Dữ liệu sẽ được lưu tạm và đồng bộ khi có kết nối.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncStatus.webAppUrl, addToast]);

  const handleSaveAppsScriptUrl = (url: string) => {
    setStoredWebAppUrl(url);
    setSyncStatus((prev) => ({ ...prev, webAppUrl: url, isConnected: true }));
    fetchFromGoogleSheet(url);
  };

  // Fast Client-Side Memoized Filtering Logic
  const filteredPersonnelList = useMemo(() => {
    return personnelList.filter((p) => {
      if (filters.searchQuery.trim()) {
        const rawQ = filters.searchQuery.trim();
        const normQ = removeVietnameseTones(rawQ).toLowerCase();
        const digitsOnly = rawQ.replace(/\D/g, '');

        const normName = removeVietnameseTones(p.hoTen).toLowerCase();
        const phoneClean = p.soDienThoai.replace(/\D/g, '');
        const normAddress = removeVietnameseTones(p.diaChi).toLowerCase();
        const normRole = removeVietnameseTones(p.chucDanhMatTran || '').toLowerCase();
        const normOther = removeVietnameseTones(p.chucDanhKhac || '').toLowerCase();
        const normKP = removeVietnameseTones(p.khuPho || '').toLowerCase();
        const kpDigits = p.khuPho.replace(/\D/g, '');

        const matchName = normName.includes(normQ) || p.hoTen.toLowerCase().includes(rawQ.toLowerCase());

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

        const matchPhone = digitsOnly.length >= 3 ? phoneClean.includes(digitsOnly) : false;
        const matchRole = normRole.includes(normQ);
        const matchOther = normOther.includes(normQ);
        const matchAddress = normAddress.includes(normQ);
        const matchSTT = normQ.startsWith('stt') && digitsOnly.length > 0 && String(p.stt) === digitsOnly;

        if (!matchName && !matchKP && !matchPhone && !matchRole && !matchOther && !matchAddress && !matchSTT) {
          return false;
        }
      }

      if (filters.selectedKhuPho !== 'ALL' && p.khuPho !== filters.selectedKhuPho) {
        return false;
      }

      if (filters.selectedChucDanh !== 'ALL') {
        if (filters.selectedChucDanh === 'Trưởng ban' && !isKeyLeader(p)) return false;
        if (filters.selectedChucDanh === 'Phó Trưởng ban' && !isDeputyLeader(p)) return false;
        if (filters.selectedChucDanh === 'Thành viên' && (isKeyLeader(p) || isDeputyLeader(p))) return false;
      }

      if (filters.onlyCapUy && !isPartyOfficial(p)) {
        return false;
      }

      if (filters.selectedDoanThe !== 'ALL') {
        const other = p.chucDanhKhac?.toLowerCase() || '';
        const target = filters.selectedDoanThe.toLowerCase();
        if (!other.includes(target)) return false;
      }

      return true;
    });
  }, [personnelList, filters]);

  // Handle Add/Edit Personnel
  const handleSavePersonnel = async (person: Personnel) => {
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

    if (!navigator.onLine || !syncStatus.webAppUrl) {
      addToOfflineQueue(isUpdate ? 'UPDATE' : 'ADD', person);
      setSyncStatus((prev) => ({ ...prev, pendingCount: getPendingQueueCount() }));
      addToast('info', 'Thiết bị đang mất mạng. Dữ liệu đã được lưu tạm và sẽ được đồng bộ khi có kết nối.');
      return;
    }

    setSyncStatus((prev) => ({ ...prev, isLoading: true, statusMessage: 'Đang lưu vào Google Sheet...' }));
    const res = await apiSavePersonnel(person, isUpdate, syncStatus.webAppUrl);

    setSyncStatus((prev) => ({ ...prev, isLoading: false }));

    if (res.success) {
      const successMsg = isUpdate ? 'Đã cập nhật dữ liệu thành công.' : 'Đã lưu dữ liệu thành công vào Google Sheets.';
      addToast('success', successMsg);
      setSyncStatus((prev) => ({ ...prev, lastSynced: new Date().toLocaleTimeString('vi-VN') }));
    } else {
      addToOfflineQueue(isUpdate ? 'UPDATE' : 'ADD', person);
      setSyncStatus((prev) => ({ ...prev, pendingCount: getPendingQueueCount() }));
      addToast('error', 'Không thể lưu dữ liệu. Vui lòng kiểm tra kết nối mạng và thử lại.');
    }
  };

  // Handle Delete Personnel
  const handleDeletePersonnel = async (person: Personnel) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa cán bộ "${person.hoTen}" khỏi danh sách?`)) {
      return;
    }

    setPersonnelList((prev) => prev.filter((p) => p.id !== person.id));

    if (!navigator.onLine || !syncStatus.webAppUrl) {
      addToOfflineQueue('DELETE', person);
      setSyncStatus((prev) => ({ ...prev, pendingCount: getPendingQueueCount() }));
      addToast('info', 'Thiết bị đang mất mạng. Yêu cầu xóa đã được lưu tạm và sẽ đồng bộ khi có kết nối.');
      return;
    }

    setSyncStatus((prev) => ({ ...prev, isLoading: true, statusMessage: 'Đang xóa trên Google Sheet...' }));
    const res = await apiDeletePersonnel(person.id, syncStatus.webAppUrl);

    setSyncStatus((prev) => ({ ...prev, isLoading: false }));

    if (res.success) {
      addToast('success', 'Đã xóa dữ liệu thành công.');
    } else {
      addToOfflineQueue('DELETE', person);
      setSyncStatus((prev) => ({ ...prev, pendingCount: getPendingQueueCount() }));
      addToast('error', 'Lỗi xóa dữ liệu trên Google Sheets. Yêu cầu đã được lưu tạm.');
    }
  };

  // Push all local personnel data to Google Sheet
  const handlePushAllToGoogleSheet = async () => {
    if (!syncStatus.webAppUrl) {
      addToast('warning', 'Vui lòng nhập Web App URL trước khi đẩy dữ liệu.');
      return;
    }

    setSyncStatus((prev) => ({ ...prev, isLoading: true, statusMessage: 'Đang đẩy toàn bộ dữ liệu lên Google Sheet...' }));
    const res = await apiPushAllPersonnel(personnelList, syncStatus.webAppUrl);
    setSyncStatus((prev) => ({ ...prev, isLoading: false }));

    if (res.success) {
      const timeString = new Date().toLocaleTimeString('vi-VN');
      setSyncStatus((prev) => ({
        ...prev,
        lastSynced: timeString,
        statusMessage: `Đã đồng bộ toàn bộ ${personnelList.length} nhân sự lên Google Sheet thành công!`,
      }));
      addToast('success', `Đã đẩy toàn bộ ${personnelList.length} cán bộ lên Google Sheets thành công!`);
    } else {
      addToast('error', res.message || 'Lỗi khi đẩy dữ liệu lên Google Sheets.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-20 font-sans">
      {/* Toast Notifications System */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* PWA Installation Prompt */}
      <PWAInstallPrompt />

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
          <div className="flex items-center justify-between mb-3.5">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {syncStatus.pendingCount ? (
                <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full border border-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>{syncStatus.pendingCount} thay đổi chờ đồng bộ offline</span>
                </span>
              ) : null}
            </div>

            {/* Add Personnel Button */}
            <button
              onClick={() => {
                setEditingPersonnel(null);
                setIsFormModalOpen(true);
              }}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
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

        {/* Tab 4: Stats Mobile Tab */}
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
