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
import { UtilitiesView } from './components/UtilitiesView';
import {
  fetchAllPersonnel,
  fetchAllHeadquarters,
  fetchAllRedSites,
  registerPushSubscriber,
  startNotificationBackgroundScheduler,
  VAPID_PUBLIC_KEY,
  urlBase64ToUint8Array
} from './services';

import { Personnel, FilterState, SyncStatus, Headquarters, RedSite, TabType } from './types';
import { INITIAL_PERSONNEL_DATA, BAN_THUONG_TRUC_DATA, ADMINISTRATIVE_HEADQUARTERS, INITIAL_RED_SITES_DATA } from './data/initialData';
import { isBanThuongTruc, isChuyenVien, isKeyLeader, isDeputyLeader, isThanhVien, isPartyOfficial, removeVietnameseTones } from './utils/helpers';
import { Grid, Table, Plus, Download, RefreshCw, Database, MapPin, Users, Landmark, FileSpreadsheet, RotateCcw, Mail, BarChart3, Bell } from 'lucide-react';

export default function App() {
  // --- Persistent Local & Google Sheet Data State ---
  const [personnelList, setPersonnelList] = useState<Personnel[]>(() => {
    const saved = localStorage.getItem('mt_personnel_data');
    if (saved) {
      try {
        const parsed: Personnel[] = JSON.parse(saved);
        const withoutBTT = parsed.filter(p => String(p.khuPho || '') !== 'Ban Thường trực' && !String(p.id || '').startsWith('btt-'));
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
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    try {
      const saved = sessionStorage.getItem('mttq_active_tab');
      if (saved && ['LIST', 'MAP', 'SITES', 'FEEDBACK', 'STATS'].includes(saved)) {
        return saved as TabType;
      }
    } catch { /* ignore */ }
    return 'LIST';
  });

  useEffect(() => {
    sessionStorage.setItem('mttq_active_tab', activeTab);
  }, [activeTab]);

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
    try {
      const version = localStorage.getItem('mt_red_asset_version');
      if (version === 'v2026_final') {
        const saved = localStorage.getItem('mt_red_sites_data_v8');
        if (saved) {
          const parsed: RedSite[] = JSON.parse(saved);
          const defaultMap = new Map(INITIAL_RED_SITES_DATA.map((s) => [s.id, s]));
          const updated = parsed.map((item) => {
            const def = defaultMap.get(item.id);
            if (def) {
              return {
                ...item,
                image: def.image || def.imageUrl,
                images: def.images || def.galleryImages,
                imageUrl: def.imageUrl,
                galleryImages: def.galleryImages
              };
            }
            return item;
          });
          const existingIds = new Set(updated.map((p) => p.id));
          const missingDefaults = INITIAL_RED_SITES_DATA.filter((item) => !existingIds.has(item.id));
          return [...updated, ...missingDefaults];
        }
      } else {
        localStorage.setItem('mt_red_asset_version', 'v2026_final');
        localStorage.setItem('mt_red_sites_data_v8', JSON.stringify(INITIAL_RED_SITES_DATA));
        return INITIAL_RED_SITES_DATA;
      }
    } catch (e) { /* fallback */ }
    return INITIAL_RED_SITES_DATA;
  });

  useEffect(() => {
    localStorage.setItem('mt_red_sites_data_v8', JSON.stringify(redSitesList));
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

  // --- Notification System States & Mechanism ---
  const [isNotificationGranted, setIsNotificationGranted] = useState<boolean>(() => {
    return typeof Notification !== 'undefined' && Notification.permission === 'granted';
  });
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);
  const [isSadChibi, setIsSadChibi] = useState(false);

  // Trigger floating notification banner after 1.5 seconds if not dismissed
  useEffect(() => {
    const isDismissed = sessionStorage.getItem('mttq_notif_banner_dismissed');
    const isGranted = typeof Notification !== 'undefined' && Notification.permission === 'granted';
    if (!isDismissed && !isGranted) {
      const timer = setTimeout(() => {
        setShowNotificationBanner(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Play crisp "ting" chime using Web Audio API
  const playTingSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5 note
      osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08); // E6 note
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.warn('Audio ting sound error:', e);
    }
  };

  // Auto-sync Push Subscription if permission is already granted & Start Background Scheduler
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      registerPushSubscriber().catch(err => {
        console.warn('[Push] Auto-sync subscription error:', err);
      });
    }

    // Kích hoạt Bộ đếm tự động phát tức thì (Background Scheduler quét mỗi 15 - 30 giây)
    const stopScheduler = startNotificationBackgroundScheduler((notif) => {
      console.log('[App] Bộ đếm tự động phát tức thì đã kích hoạt thông báo:', notif.tieu_de);
    });

    return () => {
      if (stopScheduler) stopScheduler();
    };
  }, []);

  const handleEnableNotification = async () => {
    playTingSound();
    try {
      if (typeof Notification !== 'undefined') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setIsNotificationGranted(true);
          // Lưu đối tượng subscription vào bảng push_subscribers trên Supabase (chuẩn hóa endpoint và json)
          try {
            const res = await registerPushSubscriber();
            console.log('[Push] registerPushSubscriber hoàn tất:', res);
          } catch (regErr) {
            console.warn('[Push] Lỗi khi lưu mã thiết bị push_subscribers:', regErr);
          }
        }
      }
    } catch (e) {
      console.warn('Notification permission error:', e);
    }
    setShowNotificationBanner(false);
    sessionStorage.setItem('mttq_notif_banner_dismissed', 'true');
  };

  const handleDismissNotification = () => {
    setIsSadChibi(true);
    setTimeout(() => {
      setIsSadChibi(false);
      setShowNotificationBanner(false);
      sessionStorage.setItem('mttq_notif_banner_dismissed', 'true');
    }, 1800);
  };

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
      // 0. BỘ LỌC CHUYÊN VIÊN: Khi bấm nút CHUYÊN VIÊN (selectedChucDanh === 'Chuyên viên' hoặc selectedDoanThe === 'CHUYEN_VIEN')
      const isFilterChuyenVien = filters.selectedChucDanh === 'Chuyên viên' || filters.selectedDoanThe === 'CHUYEN_VIEN';
      if (isFilterChuyenVien) {
        const cdRaw = String((p as any).chuc_danh_mat_tran || p.chucDanhMatTran || '');
        const cdkRaw = String((p as any).chuc_danh_khac || p.chucDanhKhac || '');
        const isCV = cdRaw.toLowerCase().includes('chuyên viên') ||
                     cdRaw.toLowerCase().includes('chuyen vien') ||
                     cdkRaw.toLowerCase().includes('chuyên viên') ||
                     cdkRaw.toLowerCase().includes('chuyen vien') ||
                     isChuyenVien(p) ||
                     String(p.id || '').startsWith('cv-');

        if (!isCV) return false;

        // Bỏ qua điều kiện lọc Khu phố/Ngành đoàn thể (không ép khu_pho !== null)
        // Nếu có tìm kiếm thì lọc tiếp theo ô tìm kiếm
        if (filters.searchQuery.trim()) {
          const rawQ = filters.searchQuery.trim();
          const query = removeVietnameseTones(rawQ).toLowerCase();
          const nameClean = removeVietnameseTones(p.hoTen).toLowerCase();
          const phoneClean = String(p.soDienThoai || '').replace(/\D/g, '');
          const queryDigits = query.replace(/\D/g, '');
          const matchName = nameClean.includes(query);
          const matchPhone = queryDigits.length >= 3 && phoneClean.includes(queryDigits);
          if (!matchName && !matchPhone) return false;
        }

        return true;
      }

      // 0b. BỘ LỌC THƯỜNG TRỰC: Khi bấm nút ⭐ THƯỜNG TRỰC (selectedDoanThe === 'BAN_THUONG_TRUC' hoặc selectedChucDanh === 'Thường trực')
      const isFilterBTT = filters.selectedDoanThe === 'BAN_THUONG_TRUC' || filters.selectedChucDanh === 'Thường trực';
      if (isFilterBTT) {
        if (!isBanThuongTruc(p)) return false;

        // Bỏ qua điều kiện lọc Khu phố (không ép khu_pho !== null để hiện đủ 5 đồng chí Thường trực)
        if (filters.searchQuery.trim()) {
          const rawQ = filters.searchQuery.trim();
          const query = removeVietnameseTones(rawQ).toLowerCase();
          const nameClean = removeVietnameseTones(p.hoTen).toLowerCase();
          const phoneClean = String(p.soDienThoai || '').replace(/\D/g, '');
          const queryDigits = query.replace(/\D/g, '');
          const matchName = nameClean.includes(query);
          const matchPhone = queryDigits.length >= 3 && phoneClean.includes(queryDigits);
          if (!matchName && !matchPhone) return false;
        }

        return true;
      }

      // 1. Nếu ô tìm kiếm có chữ -> CHỈ tìm theo Họ Tên, Số Điện Thoại hoặc Viết tắt Khu Phố
      if (filters.searchQuery.trim()) {
        const rawQ = filters.searchQuery.trim();
        const query = removeVietnameseTones(rawQ).toLowerCase();
        
        // a. TÌM THEO HỌ TÊN (So sánh chính xác từng từ độc lập)
        const nameClean = removeVietnameseTones(p.hoTen).toLowerCase();
        const nameWords = nameClean.split(/\s+/).filter(Boolean);
        const matchName = nameWords.some(word => {
          if (word === query) return true;
          if (word.startsWith(query)) {
            if (query === 'huy' && word === 'huynh') return false;
            return true;
          }
          return false;
        });

        // b. TÌM THEO SỐ ĐIỆN THOẠI
        const phoneClean = String(p.soDienThoai || '').replace(/\D/g, '');
        const queryDigits = query.replace(/\D/g, '');
        const matchPhone = queryDigits.length >= 3 && phoneClean.includes(queryDigits);

        // c. TÌM THEO VIẾT TẮT KHU PHỐ
        const kpMatch = query.match(/^kp\s*0?(\d+)$/);
        let matchKhuPho = false;
        if (kpMatch) {
          const kpNum = kpMatch[1];
          const pKP = String(p.khuPho || '').replace(/\D/g, '');
          matchKhuPho = pKP === kpNum;
        }

        if (!matchName && !matchPhone && !matchKhuPho) {
          return false;
        }
      }

      // 2. Khu Phố / Đơn vị
      if (filters.selectedKhuPho !== 'ALL') {
        if (String(p.khuPho || '') !== filters.selectedKhuPho || isBanThuongTruc(p)) return false;
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
        const g = String(p.gender || (p.namSinhNam ? 'Nam' : p.namSinhNu ? 'Nữ' : ''));
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
          const other = removeVietnameseTones(p.chucDanhKhac || '').toLowerCase();
          
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
            const target = removeVietnameseTones(String(filters.selectedDoanThe || '').toLowerCase());
            if (!other.includes(target)) return false;
          }
        }
      }

      return true;
    }).sort((a, b) => {
      const getRolePriority = (person: Personnel) => {
        if (isBanThuongTruc(person)) return 0;
        if (isChuyenVien(person)) return 1;
        if (isKeyLeader(person)) return 2;
        if (isDeputyLeader(person)) return 3;
        return 4;
      };
      const roleDiff = getRolePriority(a) - getRolePriority(b);
      if (roleDiff !== 0) return roleDiff;

      const sttA = Number(a.stt) || 0;
      const sttB = Number(b.stt) || 0;
      return sttA - sttB;
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
          onOpenNotification={() => {
            if (isNotificationGranted) {
              alert('Hệ thống thông báo Mặt trận đã được kích hoạt. Bạn sẽ nhận được các thông báo khẩn và nhắc lịch công tác.');
            } else {
              setShowNotificationBanner(true);
              setIsSadChibi(false);
            }
          }}
          isNotificationGranted={isNotificationGranted}
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
              filters.selectedChucDanh === 'Chuyên viên' || filters.selectedDoanThe === 'CHUYEN_VIEN'
                ? 'CHUYEN_VIEN'
                : filters.selectedDoanThe === 'BAN_THUONG_TRUC'
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
              } else if (type === 'CHUYEN_VIEN') {
                setFilters(prev => ({
                  ...prev,
                  searchQuery: '',
                  selectedKhuPho: 'ALL',
                  selectedDoanThe: 'ALL',
                  selectedChucDanh: prev.selectedChucDanh === 'Chuyên viên' ? 'ALL' : 'Chuyên viên',
                  onlyCapUy: false,
                }));
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
              onFilterChange={(newF) => {
                setFilters((prev) => {
                  const updated = { ...prev, ...newF };
                  
                  // LOGIC TÁCH BIỆT: Nếu gõ tìm kiếm (có nội dung) -> reset tất cả các bộ lọc dropdown
                  if (newF.searchQuery !== undefined && newF.searchQuery.trim() !== '') {
                    updated.selectedKhuPho = 'ALL';
                    updated.selectedDoanThe = 'ALL';
                    updated.selectedChucDanh = 'ALL';
                    updated.onlyCapUy = false;
                    updated.selectedGender = 'ALL';
                  }
                  
                  // LOGIC TÁCH BIỆT: Nếu chọn bất kỳ dropdown nào -> xóa trắng ô tìm kiếm
                  if (newF.selectedKhuPho !== undefined || 
                      newF.selectedDoanThe !== undefined || 
                      newF.selectedChucDanh !== undefined || 
                      newF.selectedGender !== undefined ||
                      newF.onlyCapUy !== undefined) {
                    updated.searchQuery = '';
                  }
                  
                  return updated;
                });
              }}
              onResetFilters={() => {
                setFilters({
                  searchQuery: '',
                  selectedKhuPho: 'ALL',
                  selectedDoanThe: 'ALL',
                  selectedChucDanh: 'ALL',
                  selectedGender: 'ALL',
                  onlyCapUy: false,
                  sortBy: 'stt',
                });
              }}
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

        {/* Tab 5: Tiện ích (Thống kê, Lịch công tác, Văn bản, Đóng góp ý kiến) */}
        {activeTab === 'STATS' && (
          <UtilitiesView
            personnelList={personnelList}
            headquartersList={headquartersList}
            redSitesList={redSitesList}
            onSelectKhuPho={(kp) => {
              setFilters((prev) => ({ ...prev, selectedKhuPho: kp }));
              setActiveTab('LIST');
            }}
            onNavigateToFeedback={() => setActiveTab('FEEDBACK')}
          />
        )}

      </main>

      {/* Floating Notification Permission Banner (Xin quyền thông báo sau 1.5s) */}
      {showNotificationBanner && (
        <div className="fixed top-4 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-gradient-to-r from-red-950 via-red-900 to-amber-950 text-white p-4 rounded-2xl shadow-2xl border-2 border-amber-400/50 backdrop-blur-md">
            {isSadChibi ? (
              <div className="flex flex-col items-center justify-center py-3 px-2 text-center animate-in fade-in duration-300">
                <span className="text-5xl mb-2 animate-bounce select-none">🥺</span>
                <p className="text-xs sm:text-sm font-medium text-amber-100 leading-relaxed max-w-xs">
                  Dạ, vậy lát nữa Mặt trận xin phép nhắc lại cô/chú sau nhé!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-red-950 flex items-center justify-center shrink-0 shadow-md">
                    <Bell className="w-5 h-5 fill-red-950 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                      BẬT THÔNG BÁO MẶT TRẬN
                    </h4>
                    <p className="text-xs text-red-100/90 mt-0.5 leading-snug">
                      Nhận thông báo tức thời về lịch họp khẩn, công tác Mặt trận và tin tức mới nhất từ Ban Thường trực Phường Bình Tiên.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-red-800/60">
                  <button
                    onClick={handleDismissNotification}
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition-colors"
                  >
                    LÁT NỮA
                  </button>
                  <button
                    onClick={handleEnableNotification}
                    className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-red-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                  >
                    <span>BẬT NGAY</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
