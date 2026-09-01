/**
 * ==============================================================================
 * TẦNG DỮ LIỆU (DATA ACCESS LAYER) - MAP SERVICE
 * ==============================================================================
 * Quản lý danh sách tọa độ 5 cơ quan Đảng ủy - UBND - Công an - Quân sự - Trạm Y tế
 * và 18 Trụ sở Ban Công tác Mặt trận Khu phố tại Phường Bình Tiên.
 * Bảng Supabase: `toa_do_tru_so`
 */

import { Headquarters, HeadquartersType } from '../types';
import { getSupabase } from './supabaseClient';
import { ADMINISTRATIVE_HEADQUARTERS } from '../data/initialData';

const LOCAL_STORAGE_KEY = 'mt_headquarters_data_v18';

/**
 * Lấy toàn bộ danh sách trụ sở (5 cơ quan phường + 18 trụ sở khu phố)
 */
export async function fetchAllHeadquarters(): Promise<Headquarters[]> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      console.log('[MapService] Đang tải dữ liệu từ bảng: toadotruso');
      const { data, error } = await supabase
        .from('toadotruso')
        .select('*');

      if (error) {
        console.error('[MapService] Lỗi khi truy vấn toadotruso:', error.message);
        throw error;
      }

      if (data && data.length > 0) {
        console.log(`[MapService] Đã tải thành công ${data.length} điểm từ toadotruso.`);
        const mapped: Headquarters[] = data.map((item: any) => ({
          id: item.ma_tru_so || item.id || `hq-${Math.random()}`,
          tenTruSo: item.ten_tru_so || '',
          loaiTruSo: item.loai_diem === 'CO_QUAN' ? 'CO_QUAN' : (item.loai_diem === 'KHU_PHO' ? 'khu_pho' : item.loai_diem),
          khuPhoThuocVong: item.khu_pho || item.khu_pho_thuoc_vong || '',
          diaChi: item.dia_chi || '',
          soDienThoai: item.so_dien_thoai || '',
          gioLamViec: item.gio_lam_viec || '07:30 - 17:00 (Thứ 2 - Thứ 6)',
          canBoPhuTrach: item.can_bo_phu_trach || '',
          chucVuCanBo: item.chuc_vu_can_bo || '',
          ma_tru_so: item.ma_tru_so || '',
          toaDo: {
            lat: Number(item.latitude || item.lat || 10.748),
            lng: Number(item.longitude || item.lng || 106.650),
          },
          moTaChucNang: item.mo_ta_chuc_nang || '',
        }));

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
        return mapped;
      } else {
        console.warn('[MapService] Bảng toadotruso rỗng.');
      }
    } catch (err: any) {
      console.error('[MapService] Exception fetchAllHeadquarters:', err.message || err);
    }
  }

  // Fallback sang LocalStorage
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      const parsed: Headquarters[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.filter((p) => p.loaiTruSo === 'khu_pho').length >= 18) {
        return parsed;
      }
    } catch (e) {
      console.error('[MapService] Lỗi parse LocalStorage:', e);
    }
  }

  return ADMINISTRATIVE_HEADQUARTERS;
}

/**
 * Lấy danh sách 5 cơ quan nòng cốt cấp Phường
 */
export async function getWardAgencies(): Promise<Headquarters[]> {
  const all = await fetchAllHeadquarters();
  return all.filter((hq) => hq.loaiTruSo !== 'khu_pho');
}

/**
 * Lấy danh sách 18 trụ sở khu phố
 */
export async function getKhuPhoHeadquarters(): Promise<Headquarters[]> {
  const all = await fetchAllHeadquarters();
  return all.filter((hq) => hq.loaiTruSo === 'khu_pho');
}

/**
 * Lấy thông tin trụ sở theo số Khu phố
 */
export async function getHeadquartersByKhuPho(khuPhoNumber: number | string): Promise<Headquarters | undefined> {
  const all = await fetchAllHeadquarters();
  const searchTag = typeof khuPhoNumber === 'number' ? `Khu phố ${khuPhoNumber}` : khuPhoNumber;
  return all.find((hq) => hq.khuPhoThuocVong === searchTag || hq.tenTruSo.includes(searchTag));
}

/**
 * Cập nhật thông tin hoặc tọa độ trụ sở
 */
export async function saveHeadquarters(headquarters: Headquarters): Promise<boolean> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const payload = {
        ma_tru_so: headquarters.id,
        ten_tru_so: headquarters.tenTruSo,
        loai_diem: headquarters.loaiTruSo === 'CO_QUAN' ? 'CO_QUAN' : (headquarters.loaiTruSo === 'khu_pho' ? 'KHU_PHO' : headquarters.loaiTruSo),
        khu_pho: headquarters.khuPhoThuocVong,
        dia_chi: headquarters.diaChi,
        so_dien_thoai: headquarters.soDienThoai,
        gio_lam_viec: headquarters.gioLamViec,
        can_bo_phu_trach: headquarters.canBoPhuTrach,
        chuc_vu_can_bo: headquarters.chucVuCanBo,
        latitude: headquarters.toaDo.lat,
        longitude: headquarters.toaDo.lng,
        mo_ta_chuc_nang: headquarters.moTaChucNang,
      };

      console.log('[MapService] Đang cập nhật tọa độ cho:', headquarters.tenTruSo);
      const { error } = await supabase.from('toadotruso').upsert(payload, { onConflict: 'ma_tru_so' });
      if (error) {
        console.error('[MapService] Lỗi khi upsert toadotruso:', error.message);
        throw error;
      }
      return true;
    } catch (e: any) {
      console.error('[MapService] Lỗi cập nhật tọa độ trên Supabase:', e.message || e);
      return false;
    }
  }

  return true;
}
