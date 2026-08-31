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
      const { data, error } = await supabase
        .from('headquarters')
        .select('*')
        .order('id', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped: Headquarters[] = data.map((item: any) => ({
          id: item.id || `hq-${Math.random()}`,
          tenTruSo: item.ten_tru_so || item.tenTruSo || '',
          loaiTruSo: item.loai_tru_so || item.loaiTruSo || 'khu_pho',
          khuPhoThuocVong: item.khu_pho_thuoc_vong || item.khuPhoThuocVong || '',
          diaChi: item.dia_chi || item.diaChi || '',
          soDienThoai: item.so_dien_thoai || item.soDienThoai || '',
          gioLamViec: item.gio_lam_viec || item.gioLamViec || '07:30 - 17:00 (Thứ 2 - Thứ 6)',
          canBoPhuTrach: item.can_bo_phu_trach || item.canBoPhuTrach || '',
          chucVuCanBo: item.chuc_vu_can_bo || item.chucVuCanBo || '',
          toaDo: {
            lat: Number(item.lat || item.toaDo?.lat || 10.748),
            lng: Number(item.lng || item.toaDo?.lng || 106.650),
          },
          moTaChucNang: item.mo_ta_chuc_nang || item.moTaChucNang || '',
        }));

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn('[MapService] Lỗi kết nối Supabase, chuyển sang cache local:', err);
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
        ten_tru_so: headquarters.tenTruSo,
        loai_tru_so: headquarters.loaiTruSo,
        khu_pho_thuoc_vong: headquarters.khuPhoThuocVong,
        dia_chi: headquarters.diaChi,
        so_dien_thoai: headquarters.soDienThoai,
        gio_lam_viec: headquarters.gioLamViec,
        can_bo_phu_trach: headquarters.canBoPhuTrach,
        chuc_vu_can_bo: headquarters.chucVuCanBo,
        lat: headquarters.toaDo.lat,
        lng: headquarters.toaDo.lng,
        mo_ta_chuc_nang: headquarters.moTaChucNang,
      };

      await supabase.from('headquarters').upsert({ id: headquarters.id, ...payload });
      return true;
    } catch (e) {
      console.warn('[MapService] Lỗi cập nhật tọa độ trên Supabase:', e);
    }
  }

  return true;
}
