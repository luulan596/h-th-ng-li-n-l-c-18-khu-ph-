export interface Personnel {
  id: string;
  stt: number;
  khuPho: string; // e.g. "Khu phố 1", "Khu phố 2"...
  hoTen: string;
  namSinhNam?: number | string;
  namSinhNu?: number | string;
  gender?: 'Nam' | 'Nữ' | '';
  birthYear?: string;
  chucDanhMatTran: 'Trưởng ban' | 'Phó Trưởng ban' | 'Thành viên' | string;
  chucDanhKhac: string;
  diaChi: string;
  soDienThoai: string;
  phones?: string[];
  isCapUy?: boolean;
  dataWarning?: string;
  ghiChu?: string;
}

export type HeadquartersType = 'ubnd' | 'mat_tran' | 'cong_an' | 'quan_su' | 'y_te' | 'khu_pho';

export interface Headquarters {
  id: string;
  tenTruSo: string;
  toaDo: {
    lat: number;
    lng: number;
  };
  updatedAt?: string;
  loaiDiem?: 'KHU_PHO' | 'CO_QUAN' | string;
  khuPho?: string;
  diaChi?: string;
  soDienThoai?: string;
  loaiTruSo?: HeadquartersType;
  khuPhoThuocVong?: string;
  gioLamViec?: string;
  canBoPhuTrach?: string;
  chucVuCanBo?: string;
  moTaChucNang?: string;
}

export interface RedSite {
  id: string;
  name: string;
  category: string; // 'Di tích Quốc gia' | 'Di tích Cấp Thành phố' | 'Nhà Truyền thống' | 'Khu Lưu niệm'
  address: string;
  khuPho?: string;
  summary: string;
  detailedHistory: string;
  imageUrl: string;
  galleryImages: string[];
  videoUrl?: string;
  driveUrl?: string; // Google Drive link (video, photo folder, document storage)
  toaDo: {
    lat: number;
    lng: number;
  };
  openHours?: string;
  ticketPrice?: string;
  isFeatured?: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  fbUrl: string;
  publishedAt: string;
  category: string;
  isFeatured?: boolean;
}

export interface CitizenFeedback {
  id: string;
  senderName: string;
  isAnonymous: boolean;
  phone?: string;
  email?: string;
  khuPho: string;
  category: string;
  title: string;
  content: string;
  createdAt: string;
  status: 'da_tiep_nhan' | 'dang_xu_ly' | 'da_giai_quyet';
}

export type TabType = 'LIST' | 'FEEDBACK' | 'RED_SITES' | 'MAP' | 'STATS' | 'SETTINGS' | 'NEWS';

export interface FilterState {
  searchQuery: string;
  selectedKhuPho: string;
  selectedChucDanh: string;
  selectedGender: string;
  onlyCapUy: boolean;
  selectedDoanThe: string;
  sortBy: 'stt' | 'name' | 'khuPho';
}

export interface SyncStatus {
  isConnected: boolean;
  webAppUrl: string;
  lastSynced: string | null;
  statusMessage: string;
  isLoading: boolean;
}
