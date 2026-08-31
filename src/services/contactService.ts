/**
 * ==============================================================================
 * TẦNG DỮ LIỆU (DATA ACCESS LAYER) - CONTACT SERVICE
 * ==============================================================================
 * Quản lý danh bạ nhân sự Mặt trận 18 Khu phố và Ban Thường trực.
 * Bảng Supabase: `danh_ba` (hoặc fallback sang LocalStorage / Dữ liệu khởi tạo).
 */

import { Personnel, FilterState } from '../types';
import { getSupabase } from './supabaseClient';
import { INITIAL_PERSONNEL_DATA, BAN_THUONG_TRUC_DATA } from '../data/initialData';
import { removeVietnameseTones, isBanThuongTruc, isPartyOfficial } from '../utils/helpers';

const LOCAL_STORAGE_KEY = 'mt_personnel_data';

/**
 * Lấy toàn bộ danh sách nhân sự từ Supabase hoặc LocalStorage
 */
export async function fetchAllPersonnel(): Promise<Personnel[]> {
  const supabase = getSupabase();
  
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('stt', { ascending: true });

      if (!error && data && data.length > 0) {
        // Map trường từ snake_case của database sang camelCase của frontend nếu cần
        const mappedData: Personnel[] = data.map((item: any) => ({
          id: item.id || `p-${item.stt || Math.random()}`,
          stt: item.stt || 0,
          khuPho: item.khu_pho || item.khuPho || 'Khu phố 1',
          hoTen: item.ho_ten || item.hoTen || '',
          namSinhNam: item.nam_sinh_nam || item.namSinhNam || '',
          namSinhNu: item.nam_sinh_nu || item.namSinhNu || '',
          gender: item.gender || (item.nam_sinh_nam ? 'Nam' : item.nam_sinh_nu ? 'Nữ' : ''),
          birthYear: item.birth_year || (item.nam_sinh_nam || item.nam_sinh_nu || ''),
          chucDanhMatTran: item.chuc_danh_mat_tran || item.chucDanhMatTran || 'Thành viên',
          chucDanhKhac: item.chuc_danh_khac || item.chucDanhKhac || '',
          diaChi: item.dia_chi || item.diaChi || '',
          soDienThoai: item.so_dien_thoai || item.soDienThoai || '',
          isCapUy: item.is_cap_uy ?? item.isCapUy ?? false,
          ghiChu: item.ghi_chu || item.ghiChu || '',
          dataWarning: item.data_warning || item.dataWarning || '',
        }));

        // Lưu cache lại local
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mappedData));
        return mappedData;
      }
    } catch (err) {
      console.warn('[ContactService] Lỗi kết nối Supabase, chuyển sang cache local:', err);
    }
  }

  // Fallback: Đọc từ LocalStorage
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      const parsed: Personnel[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error('[ContactService] Lỗi parse LocalStorage:', e);
    }
  }

  // Fallback cuối cùng: Trả về dữ liệu mẫu có sẵn
  return INITIAL_PERSONNEL_DATA;
}

/**
 * Lấy danh sách nhân sự Ban Thường trực Phường
 */
export async function getBanThuongTruc(): Promise<Personnel[]> {
  const all = await fetchAllPersonnel();
  return all.filter((p) => isBanThuongTruc(p));
}

/**
 * Lọc nhân sự theo Khu phố (1 - 18) hoặc Ban Thường trực
 */
export async function getPersonnelByKhuPho(khuPho: string): Promise<Personnel[]> {
  const all = await fetchAllPersonnel();
  if (!khuPho || khuPho === 'ALL') return all;
  return all.filter((p) => p.khuPho === khuPho);
}

/**
 * Bộ lọc nâng cao theo tiêu chí tìm kiếm, chức danh, giới tính, cấp ủy
 */
export function filterPersonnelList(list: Personnel[], filters: FilterState): Personnel[] {
  return list.filter((p) => {
    // 1. Tìm kiếm theo Tên, SĐT, Địa chỉ, Chức vụ
    if (filters.searchQuery.trim()) {
      const query = removeVietnameseTones(filters.searchQuery.toLowerCase().trim());
      const name = removeVietnameseTones(p.hoTen.toLowerCase());
      const phone = (p.soDienThoai || '').replace(/\D/g, '');
      const addr = removeVietnameseTones(p.diaChi.toLowerCase());
      const role = removeVietnameseTones((p.chucDanhKhac || '').toLowerCase());
      const mtRole = removeVietnameseTones((p.chucDanhMatTran || '').toLowerCase());
      const kp = removeVietnameseTones(p.khuPho.toLowerCase());

      const queryClean = query.replace(/\D/g, '');
      const matchesPhone = queryClean.length >= 3 && phone.includes(queryClean);
      const matchesText = name.includes(query) || addr.includes(query) || role.includes(query) || mtRole.includes(query) || kp.includes(query);

      if (!matchesText && !matchesPhone) return false;
    }

    // 2. Lọc theo Khu phố
    if (filters.selectedKhuPho !== 'ALL') {
      if (p.khuPho !== filters.selectedKhuPho) {
        return false;
      }
    }

    // 3. Lọc theo Chức danh Mặt trận
    if (filters.selectedChucDanh !== 'ALL') {
      if (filters.selectedChucDanh === 'BTT') {
        if (!isBanThuongTruc(p)) return false;
      } else if (filters.selectedChucDanh === 'TRUONG_BAN') {
        if (p.chucDanhMatTran?.toUpperCase() !== 'TRƯỞNG BAN') return false;
      } else if (filters.selectedChucDanh === 'PHO_BAN') {
        if (p.chucDanhMatTran?.toUpperCase() !== 'PHÓ TRƯỞNG BAN') return false;
      } else if (filters.selectedChucDanh === 'THANH_VIEN') {
        if (p.chucDanhMatTran?.toUpperCase() !== 'THÀNH VIÊN' && p.chucDanhMatTran) return false;
      }
    }

    // 4. Lọc theo Giới tính
    if (filters.selectedGender !== 'ALL') {
      const isNu = Boolean(p.namSinhNu || p.gender === 'Nữ');
      const isNam = Boolean(p.namSinhNam || p.gender === 'Nam');
      if (filters.selectedGender === 'NAM' && !isNam) return false;
      if (filters.selectedGender === 'NU' && !isNu) return false;
    }

    // 5. Lọc Cấp ủy Chi bộ
    if (filters.onlyCapUy) {
      if (!isPartyOfficial(p)) return false;
    }

    // 6. Lọc theo 9 Ngành / Tổ chức Đoàn thể
    if (filters.selectedDoanThe !== 'ALL') {
      const roleLower = (p.chucDanhKhac || '').toLowerCase();
      const mtRoleLower = (p.chucDanhMatTran || '').toLowerCase();
      
      if (filters.selectedDoanThe === 'BAN_THUONG_TRUC') {
        if (!isBanThuongTruc(p)) return false;
      } else if (filters.selectedDoanThe === 'CONG_AN') {
        if (!roleLower.includes('công an')) return false;
      } else if (filters.selectedDoanThe === 'QUAN_SU') {
        if (!roleLower.includes('quân sự')) return false;
      } else if (filters.selectedDoanThe === 'PHU_NU') {
        if (!roleLower.includes('phụ nữ')) return false;
      } else if (filters.selectedDoanThe === 'CUU_CHIEN_BINH') {
        if (!roleLower.includes('cựu chiến binh')) return false;
      } else if (filters.selectedDoanThe === 'DOAN_THANH_NIEN') {
        if (!roleLower.includes('đoàn') && !roleLower.includes('thanh niên')) return false;
      } else if (filters.selectedDoanThe === 'NGUOI_CAO_TUOI') {
        if (!roleLower.includes('người cao tuổi')) return false;
      } else if (filters.selectedDoanThe === 'CHU_THAP_DO') {
        if (!roleLower.includes('chữ thập đỏ')) return false;
      } else if (filters.selectedDoanThe === 'KHUYEN_HOC') {
        if (!roleLower.includes('khuyến học')) return false;
      }
    }

    return true;
  });
}

/**
 * Lưu hoặc cập nhật một bản ghi nhân sự
 */
export async function savePersonnel(person: Personnel): Promise<{ success: boolean; data?: Personnel; error?: any }> {
  const supabase = getSupabase();
  
  if (supabase) {
    try {
      const dbPayload = {
        stt: person.stt,
        khu_pho: person.khuPho,
        ho_ten: person.hoTen,
        nam_sinh_nam: person.namSinhNam || null,
        nam_sinh_nu: person.namSinhNu || null,
        chuc_danh_mat_tran: person.chucDanhMatTran,
        chuc_danh_khac: person.chucDanhKhac,
        dia_chi: person.diaChi,
        so_dien_thoai: person.soDienThoai,
        is_cap_uy: person.isCapUy,
        ghi_chu: person.ghiChu,
      };

      if (person.id && !person.id.startsWith('temp-') && !person.id.startsWith('btt-') && !person.id.startsWith('kp')) {
        const { data, error } = await supabase
          .from('contacts')
          .update(dbPayload)
          .eq('id', person.id)
          .select()
          .single();
        if (error) throw error;
        return { success: true, data };
      } else {
        const { data, error } = await supabase
          .from('contacts')
          .insert([dbPayload])
          .select()
          .single();
        if (error) throw error;
        return { success: true, data };
      }
    } catch (err) {
      console.warn('[ContactService] Lỗi lưu Supabase:', err);
    }
  }

  // Local state update
  return { success: true, data: person };
}

/**
 * Xóa một bản ghi nhân sự
 */
export async function deletePersonnel(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (!error) return true;
    } catch (e) {
      console.warn('[ContactService] Lỗi xóa bản ghi trên Supabase:', e);
    }
  }
  return true;
}
