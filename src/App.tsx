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
import { AuthModal } from './components/AuthModal';
import { BottomNav } from './components/BottomNav';
import { RedSitesView } from './components/RedSitesView';
import { ExcelImportModal } from './components/ExcelImportModal';
import { GrassrootsDemocracyView } from './components/GrassrootsDemocracyView';

import { Personnel, FilterState, SyncStatus, Headquarters, RedSite } from './types';
import { ADMINISTRATIVE_HEADQUARTERS, INITIAL_RED_SITES_DATA } from './data/initialData';
import { isKeyLeader, isDeputyLeader, isPartyOfficial, removeVietnameseTones } from './utils/helpers';
import { Grid, Table, Plus, Download, RefreshCw, Database, MapPin, Users, Landmark, FileSpreadsheet, RotateCcw, WifiOff, Lock } from 'lucide-react';
import { getPersonnelApi, getPublicPersonnelApi, getPublicHeadquartersApi, getDataVersionApi, createPersonnelApi, updatePersonnelApi, deletePersonnelApi, syncAllPersonnelApi, getApiUrl, setApiUrl } from './services/api';
import { getPersonnelCache, savePersonnelCache, getMetaValue, saveMetaValue, getHeadquartersCache, saveHeadquartersCache } from './services/db';
import { getUserSession, UserSession } from './services/auth';
import { SkeletonGrid, SkeletonTable } from './components/SkeletonLoader';

export default function App() {
  // --- Auth & User Session State ---
  const [userSession, setUserSessionState] = useState<UserSession | null>(() => getUserSession());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // --- Network Online / Offline State ---
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof window !== 'undefined' ? window.navigator.onLine : true);

  // --- Persistent Local & Cloud Data State ---
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [dataFetchError, setDataFetchError] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState<string | null>(null);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => {
    const savedUrl = getApiUrl();
    return {
      isConnected: !!savedUrl,
      webAppUrl: savedUrl,
      lastSynced: null,
      statusMessage: savedUrl ? 'Đã lưu cấu hình kết nối' : 'Chưa kết nối',
      isLoading: false,
    };
  });

  // 1-Time Migration: Loại bỏ cache mẫu cũ 'mt_personnel_data' nếu tồn tại
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('mt_personnel_data')) {
      localStorage.removeItem('mt_personnel_data');
    }
  }, []);

  // --- UI View States ---
  const [activeTab, setActiveTab] = useState<'LIST' | 'MAP' | 'RED_SITES' | 'NEWS' | 'FEEDBACK' | 'STATS' | 'SETTINGS'>('LIST');
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
    saveHeadquartersCache(headquartersList);
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
    selectedGender: 'ALL',
    onlyCapUy: false,
    selectedDoanThe: 'ALL',
    sortBy: 'stt',
  });

  // --- Modal States ---
  const [selectedPersonForCall, setSelectedPersonForCall] = useState<Personnel | null>(null);
  const [isAppsScriptModalOpen, setIsAppsScriptModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);

  // --- Headquarters Fetch Helper (GET_PUBLIC_HEADQUARTERS) ---
  const fetchAndSyncHeadquartersData = async (targetUrl?: string) => {
    const url = targetUrl || getApiUrl();
    if (!url || (typeof window !== 'undefined' && !window.navigator.onLine)) return;
    try {
      const hqRes = await getPublicHeadquartersApi(url);
      if (hqRes.success && Array.isArray(hqRes.data) && hqRes.data.length > 0) {
        setHeadquartersList(hqRes.data);
        saveHeadquartersCache(hqRes.data);
        localStorage.setItem('mt_headquarters_data', JSON.stringify(hqRes.data));
      }
    } catch (err) {
      console.error('fetchAndSyncHeadquartersData error:', err);
    }
  };

  // --- Centralized Data Fetch & DATA_VERSION Sync Helper ---
  const fetchAndSyncData = async (isManual = false, hasExistingCache = false) => {
    const targetUrl = getApiUrl();
    if (!targetUrl) {
      setIsLoadingData(false);
      return;
    }

    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      setSyncStatus((prev) => ({
        ...prev,
        isLoading: false,
        statusMessage: '⚠️ Đang ngoại tuyến. Dùng dữ liệu từ bộ nhớ IndexedDB.',
      }));
      setIsLoadingData(false);
      if (!hasExistingCache && personnelList.length === 0) {
        setDataFetchError('Không thể tải dữ liệu (Ngoại tuyến). Vui lòng kết nối mạng và thử lại.');
      }
      return;
    }

    try {
      setSyncStatus((prev) => ({ ...prev, isLoading: true, statusMessage: 'Đang kiểm tra phiên bản dữ liệu...' }));
      setDataFetchError(null);

      // Đồng bộ dữ liệu trụ sở công khai ngầm ở background
      fetchAndSyncHeadquartersData(targetUrl);

      // 1. Kiểm tra DATA_VERSION nhẹ từ máy chủ
      const versionRes = await getDataVersionApi(targetUrl);
      const serverVersion = versionRes.data?.version || versionRes.version;
      const localVersion = await getMetaValue('personnel_version');

      // Nếu version trùng khớp và không phải bấm làm mới thủ công -> Không cần tải lại dataset
      if (!isManual && serverVersion && localVersion && serverVersion === localVersion && personnelList.length > 0) {
        setSyncStatus((prev) => ({
          ...prev,
          isLoading: false,
          statusMessage: `Dữ liệu đồng bộ mới nhất (${serverVersion.substring(11, 19)})`,
        }));
        setIsLoadingData(false);
        return;
      }

      // 2. Phiên bản khác hoặc làm mới thủ công -> Gọi Public/Protected API tương ứng
      setSyncStatus((prev) => ({ ...prev, isLoading: true, statusMessage: 'Đang tải danh bạ từ máy chủ...' }));
      
      const currentSession = getUserSession();
      const res = currentSession && currentSession.role !== 'VIEWER'
        ? await getPersonnelApi(targetUrl)
        : await getPublicPersonnelApi(targetUrl);

      if (res.success && Array.isArray(res.data)) {
        setPersonnelList(res.data);
        const newVer = serverVersion || res.version || new Date().toISOString();
        await savePersonnelCache(res.data, newVer);
        setDataVersion(newVer);
        setDataFetchError(null);

        const timeString = new Date().toLocaleTimeString('vi-VN');
        setSyncStatus({
          isConnected: true,
          webAppUrl: targetUrl,
          lastSynced: timeString,
          statusMessage: `Cập nhật danh bạ thành công (${res.data.length} cán bộ) lúc ${timeString}`,
          isLoading: false,
        });
      } else {
        setSyncStatus((prev) => ({
          ...prev,
          isLoading: false,
          statusMessage: res.message || 'Không thể tải dữ liệu từ máy chủ.',
        }));
        if (personnelList.length === 0 && !hasExistingCache) {
          setDataFetchError('Không thể tải dữ liệu. Vui lòng thử lại.');
        }
      }
    } catch (err) {
      console.error('fetchAndSyncData error:', err);
      setSyncStatus((prev) => ({ ...prev, isLoading: false, statusMessage: 'Lỗi kết nối máy chủ.' }));
      if (personnelList.length === 0 && !hasExistingCache) {
        setDataFetchError('Không thể tải dữ liệu. Vui lòng thử lại.');
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  // --- Initial Data Load from IndexedDB + Background Version Check ---
  useEffect(() => {
    async function initIndexedDBData() {
      setIsLoadingData(true);
      setDataFetchError(null);
      try {
        // Load cached headquarters list
        const cachedHq = await getHeadquartersCache();
        if (cachedHq && cachedHq.length > 0) {
          setHeadquartersList(cachedHq);
        }

        const cachedPersonnel = await getPersonnelCache();
        const localVer = await getMetaValue('personnel_version');
        const hasCache = cachedPersonnel && cachedPersonnel.length > 0;
        
        if (hasCache) {
          setPersonnelList(cachedPersonnel);
          if (localVer) setDataVersion(localVer);
          setIsLoadingData(false);
        }

        // Tự động kiểm tra version ngầm sau khi đã load cache IndexedDB
        if (getApiUrl() && isOnline) {
          await fetchAndSyncData(false, hasCache);
        } else {
          setIsLoadingData(false);
          if (!hasCache && !isOnline) {
            setDataFetchError('Không thể tải dữ liệu (Ngoại tuyến). Vui lòng kết nối mạng và thử lại.');
          }
        }
      } catch (e) {
        console.error('initIndexedDBData error:', e);
        setIsLoadingData(false);
      }
    }

    initIndexedDBData();
  }, []);

  // --- Network Event Listeners ---
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus((prev) => ({
        ...prev,
        statusMessage: '🟢 Đã kết nối Internet trở lại. Đang kiểm tra dữ liệu...',
      }));
      fetchAndSyncData(false, personnelList.length > 0);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus((prev) => ({
        ...prev,
        statusMessage: '⚠️ Đang ngoại tuyến (Offline PWA). Dữ liệu được dùng từ bộ nhớ IndexedDB.',
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [personnelList.length]);

  const handleSaveAppsScriptUrl = (url: string) => {
    setApiUrl(url);
    setSyncStatus((prev) => ({ ...prev, webAppUrl: url, isConnected: true }));
    fetchAndSyncData(true, personnelList.length > 0);
  };

  const handleImportExcel = (newPersonnel: Personnel[], mode: 'replace' | 'append') => {
    const updated = mode === 'replace' ? newPersonnel : [...personnelList, ...newPersonnel];
    setPersonnelList(updated);
    savePersonnelCache(updated);
  };

  const handleResetToDefault = () => {
    fetchAndSyncData(true, personnelList.length > 0);
  };


  // Available Khu phố List
  const availableKhuPhoList = useMemo(() => {
    const set = new Set<string>();
    for (let i = 1; i <= 18; i++) {
      set.add(`Khu phố ${i}`);
    }
    personnelList.forEach((p) => p.khuPho && set.add(p.khuPho));
    return Array.from(set);
  }, [personnelList]);

  // Fast Client-Side Memoized Filtering Logic
  const filteredPersonnelList = useMemo(() => {
    return personnelList.filter((p) => {
      // 1. Smart Search Query
      if (filters.searchQuery.trim()) {
        const rawQ = filters.searchQuery.trim();
        const normQ = removeVietnameseTones(rawQ).toLowerCase();
        const digitsOnly = rawQ.replace(/\D/g, '');

        const normName = removeVietnameseTones(p.hoTen).toLowerCase();
        const phoneClean = (p.soDienThoai || '').replace(/\D/g, '');
        const normAddress = removeVietnameseTones(p.diaChi || '').toLowerCase();
        const normRole = removeVietnameseTones(p.chucDanhMatTran || '').toLowerCase();
        const normOther = removeVietnameseTones(p.chucDanhKhac || '').toLowerCase();
        const normKP = removeVietnameseTones(p.khuPho || '').toLowerCase();
        const kpDigits = (p.khuPho || '').replace(/\D/g, '');

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

      // 2. Khu Phố
      if (filters.selectedKhuPho !== 'ALL' && p.khuPho !== filters.selectedKhuPho) {
        return false;
      }

      // 3. Chức danh Mặt trận
      if (filters.selectedChucDanh !== 'ALL') {
        if (filters.selectedChucDanh === 'Trưởng ban' && !isKeyLeader(p)) return false;
        if (filters.selectedChucDanh === 'Phó Trưởng ban' && !isDeputyLeader(p)) return false;
        if (filters.selectedChucDanh === 'Thành viên' && (isKeyLeader(p) || isDeputyLeader(p))) return false;
      }

      // 4. Giới tính
      if (filters.selectedGender && filters.selectedGender !== 'ALL') {
        const g = p.gender || (p.namSinhNam ? 'Nam' : p.namSinhNu ? 'Nữ' : '');
        if (g !== filters.selectedGender) return false;
      }

      // 5. Cấp ủy Chi bộ
      if (filters.onlyCapUy && !isPartyOfficial(p)) {
        return false;
      }

      // 6. Đoàn thể
      if (filters.selectedDoanThe !== 'ALL') {
        const other = p.chucDanhKhac?.toLowerCase() || '';
        const target = filters.selectedDoanThe.toLowerCase();
        if (!other.includes(target)) return false;
      }

      return true;
    }).sort((a, b) => {
      const getRolePriority = (person: Personnel) => {
        if (isKeyLeader(person)) return 1;
        if (isDeputyLeader(person)) return 2;
        return 3;
      };
      const roleDiff = getRolePriority(a) - getRolePriority(b);
      if (roleDiff !== 0) return roleDiff;
      return (a.stt || 0) - (b.stt || 0);
    });
  }, [personnelList, filters]);

  // Handle Add/Edit Personnel (Protected Action)
  const handleSavePersonnel = (person: Personnel) => {
    if (!isOnline) {
      alert('Không có kết nối Internet. Vui lòng kết nối mạng để thực hiện thao tác này.');
      return;
    }

    if (!userSession || userSession.role === 'VIEWER') {
      setIsAuthModalOpen(true);
      return;
    }

    let isUpdate = false;
    const updatedList = (() => {
      const existsIndex = personnelList.findIndex((p) => p.id === person.id);
      if (existsIndex >= 0) {
        isUpdate = true;
        const copy = [...personnelList];
        copy[existsIndex] = person;
        return copy;
      } else {
        return [person, ...personnelList];
      }
    })();

    setPersonnelList(updatedList);
    savePersonnelCache(updatedList);

    if (getApiUrl()) {
      if (isUpdate) {
        updatePersonnelApi(person).then((res) => {
          if (res.version) saveMetaValue('personnel_version', res.version);
        }).catch((e) => console.error('Save API error:', e));
      } else {
        createPersonnelApi(person).then((res) => {
          if (res.version) saveMetaValue('personnel_version', res.version);
        }).catch((e) => console.error('Create API error:', e));
      }
    }
  };

  // Handle Delete Personnel (Protected Action)
  const handleDeletePersonnel = (person: Personnel) => {
    if (!isOnline) {
      alert('Không có kết nối Internet. Vui lòng kết nối mạng để thực hiện thao tác này.');
      return;
    }

    if (!userSession || userSession.role !== 'ADMIN') {
      alert('Thao tác xóa cán bộ yêu cầu quyền ADMIN.');
      setIsAuthModalOpen(true);
      return;
    }

    const updatedList = personnelList.filter((p) => p.id !== person.id);
    setPersonnelList(updatedList);
    savePersonnelCache(updatedList);

    if (getApiUrl()) {
      deletePersonnelApi(person).then((res) => {
        if (res.version) saveMetaValue('personnel_version', res.version);
      }).catch((e) => console.error('Delete API error:', e));
    }
  };

  // Push all local personnel data to cloud server (Protected Action)
  const handlePushAllToGoogleSheet = async () => {
    if (!getApiUrl()) return;

    if (!isOnline) {
      alert('Không có kết nối Internet. Vui lòng kết nối mạng để thực hiện thao tác này.');
      return;
    }

    if (!userSession || userSession.role !== 'ADMIN') {
      alert('Thao tác ghi đè toàn bộ danh sách yêu cầu quyền ADMIN.');
      setIsAuthModalOpen(true);
      return;
    }

    setSyncStatus((prev) => ({ ...prev, isLoading: true, statusMessage: 'Đang lưu dữ liệu...' }));
    
    const res = await syncAllPersonnelApi(personnelList);
    const timeString = new Date().toLocaleTimeString('vi-VN');

    if (res.success) {
      if (res.version) saveMetaValue('personnel_version', res.version);
      setSyncStatus((prev) => ({
        ...prev,
        isLoading: false,
        lastSynced: timeString,
        statusMessage: `Đã lưu thành công ${personnelList.length} nhân sự lúc ${timeString}!`,
      }));
    } else {
      setSyncStatus((prev) => ({
        ...prev,
        isLoading: false,
        statusMessage: res.message || 'Không thể lưu dữ liệu. Vui lòng thử lại.',
      }));
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
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-24 font-sans safe-mb-nav">
      
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-sm border-b border-amber-600">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Bạn đang ngoại tuyến (Offline PWA). Dữ liệu đang xem được phục vụ từ bộ nhớ IndexedDB.</span>
        </div>
      )}

      {/* Header Banner */}
      {activeTab === 'LIST' && (
        <Header
          syncStatus={syncStatus}
          isOnline={isOnline}
          userSession={userSession}
          onOpenAppsScriptModal={() => setIsAppsScriptModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onRefreshData={() => fetchAndSyncData(true)}
          totalPersonnel={personnelList.length}
          totalKhuPho={18}
        />
      )}

      {/* Main Responsive Body Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-5">

        {/* Quick Action Toolbar */}
        {activeTab === 'LIST' && (
          <div className="flex flex-wrap items-center justify-end gap-2 mb-3.5">
            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs transition-colors"
              title="Xuất file danh bạ CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">XUẤT CSV</span>
            </button>

            {/* Add Personnel Button */}
            <button
              onClick={() => {
                if (!userSession || userSession.role === 'VIEWER') {
                  setIsAuthModalOpen(true);
                  return;
                }
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

            {/* Content: Cards Grid or Table or Skeleton Loader or Error State */}
            {(isLoadingData || (syncStatus.isLoading && personnelList.length === 0)) ? (
              viewMode === 'GRID' ? <SkeletonGrid count={8} /> : <SkeletonTable />
            ) : dataFetchError && personnelList.length === 0 ? (
              <div className="bg-white p-12 rounded-xl text-center border border-amber-200 shadow-2xs space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-xl font-bold">
                  ⚠️
                </div>
                <p className="text-slate-800 font-bold text-sm">{dataFetchError}</p>
                <button
                  onClick={() => fetchAndSyncData(true, false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Thử lại</span>
                </button>
              </div>
            ) : viewMode === 'GRID' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {filteredPersonnelList.length === 0 ? (
                  <div className="col-span-full bg-white p-12 rounded-xl text-center border border-slate-200">
                    <p className="text-slate-500 font-medium">Không tìm thấy cán bộ phù hợp với bộ lọc hiện tại.</p>
                  </div>
                ) : (
                  filteredPersonnelList.map((person) => (
                    <PersonnelCard
                      key={person.id}
                      personnel={person}
                      onSelectPerson={(p) => setSelectedPersonForCall(p)}
                      onOpenAuthModal={() => setIsAuthModalOpen(true)}
                    />
                  ))
                )}
              </div>
            ) : (
              <PersonnelTable
                personnelList={filteredPersonnelList}
                onSelectPerson={(p) => setSelectedPersonForCall(p)}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
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

        {/* Tab 3: Map & Headquarters View (PUBLIC READ OK) */}
        {activeTab === 'MAP' && (
          <AdminMap
            headquartersList={headquartersList}
            redSitesList={redSitesList}
            selectedKhuPhoFilter={filters.selectedKhuPho}
            onUpdateHeadquarters={(updated) => setHeadquartersList(updated)}
            webAppUrl={syncStatus.webAppUrl}
          />
        )}

        {/* Tab 4: Grassroots Democracy View (Hộp thư Dân chủ cơ sở) */}
        {activeTab === 'FEEDBACK' && (
          <GrassrootsDemocracyView />
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

      {/* Auth Modal for Admin / Editor Sign In */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(newSession) => {
          setUserSessionState(newSession);
          fetchAndSyncData(true);
        }}
      />

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
        onSyncNow={() => fetchAndSyncData(true)}
        onPushAll={handlePushAllToGoogleSheet}
      />

      {/* Excel / CSV Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onImport={handleImportExcel}
        onResetToDefault={handleResetToDefault}
        currentCount={personnelList.length}
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
