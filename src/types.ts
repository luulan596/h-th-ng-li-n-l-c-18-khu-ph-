export interface Personnel {
  id: string;
  stt: number;
  khuPho: string; // e.g. "Khu phố 1", "Khu phố 2"...
  hoTen: string;
  namSinhNam?: number | string;
  namSinhNu?: number | string;
  chucDanhMatTran: 'Trưởng ban' | 'Phó Trưởng ban' | 'Thành viên' | string;
  chucDanhKhac: string;
  diaChi: string;
  soDienThoai: string;
  isCapUy?: boolean;
  ghiChu?: string;
}

export type HeadquartersType = 'ubnd' | 'mat_tran' | 'cong_an' | 'quan_su' | 'y_te' | 'khu_pho';

export interface Headquarters {
  id: string;
  tenTruSo: string;
  loaiTruSo: HeadquartersType;
  khuPhoThuocVong?: string;
  diaChi: string;
  soDienThoai: string;
  gioLamViec: string;
  canBoPhuTrach: string;
  chucVuCanBo: string;
  toaDo: {
    lat: number;
    lng: number;
  };
  moTaChucNang: string;
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

export interface FilterState {
  searchQuery: string;
  selectedKhuPho: string;
  selectedChucDanh: string;
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
  pendingCount?: number;
}

export interface ApiResponse<T = any> {
  status?: 'success' | 'error';
  success: boolean;
  message: string;
  data: T;
  total?: number;
  errorCode?: string;
  timestamp?: string;
}

export interface OfflineQueueItem {
  txId: string;
  action: 'ADD' | 'UPDATE' | 'DELETE' | 'SYNC_ALL';
  data: any;
  createdAt: string;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
  errorMessage?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}
