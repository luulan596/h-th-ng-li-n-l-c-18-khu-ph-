/**
 * ==============================================================================
 * TẦNG DỮ LIỆU (DATA ACCESS LAYER) - MONUMENT SERVICE (ĐỊA CHỈ ĐỎ)
 * ==============================================================================
 * Quản lý danh sách các Di tích Lịch sử, Địa chỉ đỏ, Địa điểm truyền thống
 * trên địa bàn Phường Bình Tiên và tự động xử lý link ảnh Google Drive / Supabase.
 * Bảng Supabase: `dia_chi_do`
 */

import { RedSite } from '../types';
import { getSupabase } from './supabaseClient';
import { INITIAL_RED_SITES_DATA } from '../data/initialData';

const LOCAL_STORAGE_KEY = 'mt_red_sites_data_v6';

/**
 * Hàm tiện ích: Chuyển đổi link ảnh Google Drive (nếu người dùng dán link chia sẻ thông thường)
 * sang direct image link hiển thị được trên thẻ <img> và modal.
 */
export function transformDriveImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // Kiểm tra link Google Drive
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    // 1. Dạng /file/d/FILE_ID/view
    const fileIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
    }

    // 2. Dạng ?id=FILE_ID
    const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParamMatch && idParamMatch[1]) {
      return `https://drive.google.com/uc?export=view&id=${idParamMatch[1]}`;
    }

    // 3. Dạng open?id=FILE_ID
    const openIdMatch = trimmed.match(/open\?id=([a-zA-Z0-9_-]+)/);
    if (openIdMatch && openIdMatch[1]) {
      return `https://drive.google.com/uc?export=view&id=${openIdMatch[1]}`;
    }
  }

  // Link Supabase Storage hoặc ảnh CDN thông thường
  return trimmed;
}

/**
 * Chuẩn hóa link thư mục tài liệu / video Google Drive
 */
export function formatDriveDocumentLink(url?: string): string {
  if (!url) return '';
  return url.trim();
}

/**
 * Lấy toàn bộ danh sách Địa chỉ đỏ từ Supabase hoặc LocalStorage
 */
export async function fetchAllRedSites(): Promise<RedSite[]> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      console.log('[MonumentService] Đang tải dữ liệu từ bảng: diachido');
      const { data, error } = await supabase
        .from('diachido')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('[MonumentService] Lỗi khi truy vấn diachido:', error.message);
        throw error;
      }

      if (data && data.length > 0) {
        console.log(`[MonumentService] Đã tải thành công ${data.length} địa chỉ đỏ.`);
        const mapped: RedSite[] = data.map((item: any) => ({
          id: item.id || `red-${Math.random()}`,
          name: item.name || item.ten_di_tich || '',
          category: item.category || item.loai_di_tich || 'Di tích Lịch sử',
          address: item.address || item.dia_chi || '',
          khuPho: item.khu_pho || item.khuPho || '',
          summary: item.summary || item.tom_tat || '',
          detailedHistory: item.detailed_history || item.lich_su_chi_tiet || '',
          imageUrl: transformDriveImageUrl(item.image_url || item.imageUrl || ''),
          galleryImages: Array.isArray(item.gallery_images || item.galleryImages)
            ? (item.gallery_images || item.galleryImages).map(transformDriveImageUrl)
            : [],
          videoUrl: item.video_url || item.videoUrl || '',
          driveUrl: item.drive_url || item.driveUrl || '',
          toaDo: {
            lat: Number(item.lat || item.toaDo?.lat || 10.748),
            lng: Number(item.lng || item.toaDo?.lng || 106.650),
          },
          openHours: item.open_hours || item.openHours || '07:30 - 17:00',
          ticketPrice: item.ticket_price || item.ticketPrice || 'Miễn phí',
          isFeatured: item.is_featured ?? item.isFeatured ?? false,
        }));

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
        return mapped;
      } else {
        console.warn('[MonumentService] Bảng diachido rỗng.');
      }
    } catch (err: any) {
      console.error('[MonumentService] Exception fetchAllRedSites:', err.message || err);
    }
  }

  // Fallback sang LocalStorage
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      const parsed: RedSite[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Tự động map và bổ sung các bản ghi mặc định nếu thiếu
        const existingIds = new Set(parsed.map((p) => p.id));
        const missingDefaults = INITIAL_RED_SITES_DATA.filter((item) => !existingIds.has(item.id));
        const fullList = [...parsed, ...missingDefaults].map((s) => ({
          ...s,
          imageUrl: transformDriveImageUrl(s.imageUrl),
          galleryImages: (s.galleryImages || []).map(transformDriveImageUrl),
        }));
        return fullList;
      }
    } catch (e) {
      console.error('[MonumentService] Lỗi parse LocalStorage:', e);
    }
  }

  // Fallback sang dữ liệu mẫu khởi tạo
  return INITIAL_RED_SITES_DATA.map((s) => ({
    ...s,
    imageUrl: transformDriveImageUrl(s.imageUrl),
    galleryImages: (s.galleryImages || []).map(transformDriveImageUrl),
  }));
}

/**
 * Lấy chi tiết một địa chỉ đỏ theo ID
 */
export async function getRedSiteById(id: string): Promise<RedSite | undefined> {
  const all = await fetchAllRedSites();
  return all.find((s) => s.id === id);
}

/**
 * Lưu hoặc cập nhật địa chỉ đỏ vào Supabase
 */
export async function saveRedSite(site: RedSite): Promise<boolean> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const payload = {
        name: site.name,
        category: site.category,
        address: site.address,
        khu_pho: site.khuPho,
        summary: site.summary,
        detailed_history: site.detailedHistory,
        image_url: site.imageUrl,
        gallery_images: site.galleryImages,
        video_url: site.videoUrl,
        drive_url: site.driveUrl,
        lat: site.toaDo.lat,
        lng: site.toaDo.lng,
        open_hours: site.openHours,
        ticket_price: site.ticketPrice,
        is_featured: site.isFeatured,
      };

      console.log('[MonumentService] Đang lưu địa chỉ đỏ:', site.name);
      const { error } = await supabase.from('diachido').upsert({ id: site.id, ...payload });
      if (error) {
        console.error('[MonumentService] Lỗi khi upsert diachido:', error.message);
        throw error;
      }
      return true;
    } catch (e: any) {
      console.error('[MonumentService] Lỗi lưu Supabase:', e.message || e);
      return false;
    }
  }

  return true;
}
