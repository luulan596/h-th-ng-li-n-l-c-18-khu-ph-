import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { ExcelImportModal } from './components/ExcelImportModal';
import { DemocraticMailboxView } from './components/DemocraticMailboxView';
import { OverviewView } from './components/OverviewView';
import { fetchAllPersonnel, fetchAllHeadquarters, fetchAllRedSites } from './services';

import { Personnel, FilterState, SyncStatus, Headquarters, RedSite, TabType } from './types';
import { INITIAL_PERSONNEL_DATA, BAN_THUONG_TRUC_DATA, ADMINISTRATIVE_HEADQUARTERS, INITIAL_RED_SITES_DATA } from './data/initialData';
import { isBanThuongTruc, isKeyLeader, isDeputyLeader, isThanhVien, isPartyOfficial, removeVietnameseTones } from './utils/helpers';
import { Grid, Table, Plus, Download, RefreshCw, Database, MapPin, Users, Landmark, FileSpreadsheet, RotateCcw, Mail, BarChart3 } from 'lucide-react';

export default function App() {
  // --- Persistent Local & Google Sheet Data State ---
  const [personnelList, setPersonnelList] = useState<Personnel[]>(() => {
    const saved = localStorage.getItem('mt_personnel_data');
    if (saved) {
      try {
        const parsed: Personnel[] = JSON.parse(saved);
        const withoutBTT = parsed.filter(p => p.khuPho !== 'Ban Thường trực' && !p.id.startsWith('btt-'));
        return [...BAN_THUONG_TRUC_DATA, ...withoutBTT];
      } catch (e) { /* fallback */ }
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
  const [activeTab, setActiveTab] = useState<TabType>('LIST');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // --- Headquarters State (18 Trụ sở Khu phố + 5 Cơ quan Phường) ---
  const [headquartersList, setHeadquartersList] = useState<Headquarters[]>(() => {
    const saved = localStorage.getItem('mt_headquarters_data_v18');
    if (saved) {
      try {
        const parsed: Headquarters[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.filter(p => p.loaiTruSo === 'khu_pho').length >= 18) {
          return parsed;
        }
      } catch (e) { /* fallback */ }
    }
    return ADMINISTRATIVE_HEADQUARTERS;
  });

  useEffect(() => {
    localStorage.setItem('mt_headquarters_data_v18', JSON.stringify(headquartersList));
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

  const [searchParams] = useSearchParams();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // --- Initial Data Fetch from Supabase ---
  useEffect(() => {
    const loadAllData = async () => {
      setIsInitialLoading(true);
      try {
        // Fetch in parallel for better performance
        const [personnel, headquarters, redSites] = await Promise.all([
          fetchAllPersonnel(),
          fetchAllHeadquarters(),
          fetchAllRedSites()
        ]);

        if (personnel && personnel.length > 0) {
          setPersonnelList(personnel);
        }
        if (headquarters && headquarters.length > 0) {
          setHeadquartersList(headquarters);
        }
        if (redSites && redSites.length > 0) {
          setRedSitesList(redSites);
        }
      } catch (error) {
        console.error('[App] Lỗi khi đồng bộ dữ liệu từ Supabase:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadAllData();
  }, []);

  // --- Deep Link Handling (?kp=...&nganh=...&tab=...) ---
  useEffect(() => {
    const kpParam = searchParams.get('kp');
    const nganhParam = searchParams.get('nganh');
    const tabParam = searchParams.get('tab');

    if (kpParam) {
      // kp=1 -> Khu phố 1
      const kpVal = /^\d+$/.test(kpParam) ? `Khu phố ${kpParam}` : kpParam;
      setFilters((prev) => ({ ...prev, selectedKhuPho: kpVal }));
      setActiveTab('LIST');
    }
    
    if (nganhParam) {
      setFilters((prev) => ({ ...prev, selectedDoanThe: nganhParam }));
      setActiveTab('LIST');
    }

    if (tabParam) {
      const upperTab = tabParam.toUpperCase();
      if (['LIST', 'FEEDBACK', 'RED_SITES', 'MAP', 'STATS'].includes(upperTab)) {
        setActiveTab(upperTab as TabType);
      }
    }
  }, [searchParams]);

  const handleImportExcel = (newPersonnel: Personnel[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setPersonnelList(newPersonnel);
    } else {
      setPersonnelList((prev) => [...prev, ...newPersonnel]);
    }
  };

  const handleResetToDefault = () => {
    setPersonnelList(INITIAL_PERSONNEL_DATA);
    localStorage.setItem('mt_personnel_data', JSON.stringify(INITIAL_PERSONNEL_DATA));
  };

  // Available Khu phố List - Chỉ hiển thị 18 khu phố, loại bỏ Ban Thường trực
  const availableKhuPhoList = useMemo(() => {
    const kpList: string[] = [];
    for (let i = 1; i <= 18; i++) {
      kpList.push(`Khu phố ${i}`);
    }
    return kpList;
  }, []);

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

      // 2. Khu Phố / Đơn vị - Loại bỏ logic lọc Ban Thường trực tại đây (đã có ở bộ lọc Ngành)
      if (filters.selectedKhuPho !== 'ALL') {
        if (p.khuPho !== filters.selectedKhuPho || isBanThuongTruc(p)) return false;
      }

      // 3. Chức danh Mặt trận
      if (filters.selectedChucDanh !== 'ALL') {
        if (filters.selectedChucDanh === 'Chủ tịch' && !isBanThuongTruc(p)) return false;
        if (filters.selectedChucDanh === 'Thường trực' && !isBanThuongTruc(p)) return false;
        if (filters.selectedChucDanh === 'Trưởng ban' && !isKeyLeader(p)) return false;
        if (filters.selectedChucDanh === 'Phó Trưởng ban' && !isDeputyLeader(p)) return false;
        if (filters.selectedChucDanh === 'Thành viên' && !isThanhVien(p)) return false;
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

      // 6. Ngành / Đoàn thể
      if (filters.selectedDoanThe !== 'ALL') {
        if (filters.selectedDoanThe === 'BAN_THUONG_TRUC') {
          if (!isBanThuongTruc(p)) return false;
        } else {
          // Xử lý lọc theo các Ngành/Đoàn thể khác (dựa trên từ khóa trong chucDanhKhac)
          const other = removeVietnameseTones(p.chucDanhKhac || '').toLowerCase();
          
          // Map các value từ ORGANIZATION_KEYWORDS sang từ khóa tìm kiếm
          const orgKeywords: Record<string, string[]> = {
            'PHU_NU': ['phu nu'],
            'CUU_CHIEN_BINH': ['cuu chien binh'],
            'DOAN_THANH_NIEN': ['doan thanh nien', 'chi doan'],
            'NGUOI_CAO_TUOI': ['nguoi cao tuoi'],
            'CHU_THAP_DO': ['chu thap do'],
            'KHUYEN_HOC': ['khuyen hoc']
          };

          const keywords = orgKeywords[filters.selectedDoanThe];
          if (keywords) {
            if (!keywords.some(kw => other.includes(kw))) return false;
          } else {
            // Fallback cho các trường hợp khác nếu có
            const target = removeVietnameseTones(filters.selectedDoanThe.toLowerCase());
            if (!other.includes(target)) return false;
          }
        }
      }

      return true;
    }).sort((a, b) => {
      // 1. Sort by Front role priority: Ban Thường trực (0) -> Trưởng ban (1) -> Phó Trưởng ban (2) -> Thành viên (3)
      const getRolePriority = (person: Personnel) => {
        if (isBanThuongTruc(person)) return 0;
        if (isKeyLeader(person)) return 1;
        if (isDeputyLeader(person)) return 2;
        return 3;
      };
      const roleDiff = getRolePriority(a) - getRolePriority(b);
      if (roleDiff !== 0) return roleDiff;

      // 2. Secondary sort: STT / original order
      return (a.stt || 0) - (b.stt || 0);
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
      
      {/* Official Government Header (Only shown in Directory/List view) */}
      {activeTab === 'LIST' && (
        <Header
          syncStatus={syncStatus}
          onOpenAppsScriptModal={() => setIsAppsScriptModalOpen(true)}
          onRefreshData={() => fetchFromGoogleSheet()}
          onOpenFeedback={() => setActiveTab('FEEDBACK')}
          totalPersonnel={personnelList.length}
          totalKhuPho={18}
        />
      )}

      {isInitialLoading && (
        <div className="bg-indigo-50 border-b border-indigo-100 py-2 px-4 flex items-center justify-center gap-3">
          <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
          <span className="text-xs font-medium text-indigo-700">Đang đồng bộ dữ liệu từ hệ thống trung tâm...</span>
        </div>
      )}

      {/* Main Responsive Body Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-5">
        
        {/* Quick Action Toolbar */}
        {activeTab === 'LIST' && (
          <div className="flex flex-wrap items-center justify-end gap-2 mb-3.5">
            {/* Add Personnel Button */}
            <button
              onClick={() => {
                setEditingPersonnel(null);
                setIsFormModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
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
              filters.selectedDoanThe === 'BAN_THUONG_TRUC'
                ? 'BTT'
                : filters.selectedChucDanh === 'Trưởng ban'
                ? 'TRUONG_BAN'
                : filters.selectedChucDanh === 'Phó Trưởng ban'
                ? 'PHO_BAN'
                : filters.onlyCapUy
                ? 'CAP_UY'
                : 'ALL'
            }
            onSelectQuickFilter={(type) => {
              if (type === 'ALL') {
                setFilters(prev => ({ ...prev, searchQuery: '', selectedKhuPho: 'ALL', selectedChucDanh: 'ALL', selectedDoanThe: 'ALL', onlyCapUy: false }));
              } else if (type === 'BTT') {
                setFilters(prev => ({
                  ...prev,
                  searchQuery: '',
                  selectedKhuPho: 'ALL',
                  selectedDoanThe: prev.selectedDoanThe === 'BAN_THUONG_TRUC' ? 'ALL' : 'BAN_THUONG_TRUC',
                  selectedChucDanh: 'ALL',
                  onlyCapUy: false,
                }));
              } else if (type === 'TRUONG_BAN') {
                setFilters(prev => ({
                  ...prev,
                  searchQuery: '',
                  selectedKhuPho: 'ALL',
                  selectedDoanThe: 'ALL',
                  selectedChucDanh: prev.selectedChucDanh === 'Trưởng ban' ? 'ALL' : 'Trưởng ban',
                  onlyCapUy: false,
                }));
              } else if (type === 'PHO_BAN') {
                setFilters(prev => ({
                  ...prev,
                  searchQuery: '',
                  selectedKhuPho: 'ALL',
                  selectedDoanThe: 'ALL',
                  selectedChucDanh: prev.selectedChucDanh === 'Phó Trưởng ban' ? 'ALL' : 'Phó Trưởng ban',
                  onlyCapUy: false,
                }));
              } else if (type === 'CAP_UY') {
                setFilters(prev => ({
                  ...prev,
                  searchQuery: '',
                  selectedKhuPho: 'ALL',
                  selectedDoanThe: 'ALL',
                  selectedChucDanh: 'ALL',
                  onlyCapUy: !prev.onlyCapUy,
                }));
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
                  selectedDoanThe: 'ALL',
                  selectedGender: 'ALL',
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

        {/* Tab 2: Democratic Mailbox View (Hộp thư dân chủ cơ sở) */}
        {activeTab === 'FEEDBACK' && (
          <DemocraticMailboxView onBackToList={() => setActiveTab('LIST')} />
        )}

        {/* Tab 3: Red Sites View (Địa chỉ đỏ) */}
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

        {/* Tab 5: Overview & Stats View (Tổng quan & Thống kê cơ cấu nhân sự) */}
        {activeTab === 'STATS' && (
          <OverviewView
            personnelList={personnelList}
            headquartersList={headquartersList}
            redSitesList={redSitesList}
            onSelectKhuPho={(kp) => {
              setFilters((prev) => ({ ...prev, selectedKhuPho: kp }));
              setActiveTab('LIST');
            }}
          />
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
