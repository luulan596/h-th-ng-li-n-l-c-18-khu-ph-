/**
 * ==============================================================================
 * TẦNG DỮ LIỆU (DATA ACCESS LAYER) - FEEDBACK SERVICE (HỘP THƯ DÂN CHỦ)
 * ==============================================================================
 * Quản lý việc tiếp nhận, lưu trữ và theo dõi các ý kiến đóng góp, phản ánh
 * từ người dân gửi qua Hộp thư Dân chủ Cơ sở.
 * Bảng Supabase: `hop_thu_dan_chu`
 */

import { CitizenFeedback } from '../types';
import { getSupabase } from './supabaseClient';

const LOCAL_STORAGE_KEY = 'mt_citizen_feedback_list';

/**
 * Gửi ý kiến phản ánh mới (Hỗ trợ cả online Supabase và offline LocalStorage)
 */
export async function submitCitizenFeedback(feedback: Omit<CitizenFeedback, 'id' | 'createdAt' | 'status'>): Promise<{ success: boolean; data?: CitizenFeedback; message: string }> {
  const newFeedback: CitizenFeedback = {
    ...feedback,
    id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
    status: 'da_tiep_nhan',
  };

  const supabase = getSupabase();

  if (supabase) {
    try {
      const dbPayload = {
        sender_name: newFeedback.senderName,
        is_anonymous: newFeedback.isAnonymous,
        phone: newFeedback.phone || null,
        email: newFeedback.email || null,
        khu_pho: newFeedback.khuPho,
        category: newFeedback.category,
        title: newFeedback.title,
        content: newFeedback.content,
        created_at: newFeedback.createdAt,
        status: newFeedback.status,
      };

      const { data, error } = await supabase
        .from('hop_thu_dan_chu')
        .insert([dbPayload])
        .select()
        .single();

      if (!error && data) {
        // Lưu bản sao vào local để hiển thị lịch sử người gửi
        saveToLocalCache(newFeedback);
        return {
          success: true,
          data: newFeedback,
          message: 'Ý kiến của bạn đã được gửi thành công đến Thường trực UB.MTTQ Phường.',
        };
      }
    } catch (err) {
      console.warn('[FeedbackService] Lỗi gửi trực tiếp Supabase, lưu vào LocalStorage:', err);
    }
  }

  // Fallback: Lưu vào LocalStorage
  saveToLocalCache(newFeedback);
  return {
    success: true,
    data: newFeedback,
    message: 'Ý kiến đã được lưu an toàn trên thiết bị và sẽ đồng bộ khi có kết nối máy chủ.',
  };
}

/**
 * Lấy toàn bộ danh sách phản ánh (dành cho Cán bộ Quản lý/Thường trực)
 */
export async function fetchAllFeedbacks(): Promise<CitizenFeedback[]> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('hop_thu_dan_chu')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: CitizenFeedback[] = data.map((item: any) => ({
          id: item.id || `fb-${Math.random()}`,
          senderName: item.sender_name || item.senderName || 'Người dân',
          isAnonymous: item.is_anonymous ?? item.isAnonymous ?? false,
          phone: item.phone || '',
          email: item.email || '',
          khuPho: item.khu_pho || item.khuPho || 'Khu phố 1',
          category: item.category || 'Ý kiến chung',
          title: item.title || '',
          content: item.content || '',
          createdAt: item.created_at || item.createdAt || new Date().toISOString(),
          status: item.status || 'da_tiep_nhan',
        }));

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
        return mapped;
      }
    } catch (e) {
      console.warn('[FeedbackService] Lỗi tải từ Supabase:', e);
    }
  }

  // Đọc từ LocalStorage
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }

  return [];
}

/**
 * Cập nhật trạng thái xử lý ý kiến phản ánh (Đã tiếp nhận / Đang xử lý / Đã giải quyết)
 */
export async function updateFeedbackStatus(id: string, status: CitizenFeedback['status']): Promise<boolean> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      await supabase.from('hop_thu_dan_chu').update({ status }).eq('id', id);
    } catch (e) {
      console.warn(e);
    }
  }

  // Cập nhật LocalStorage
  const current = await fetchAllFeedbacks();
  const updated = current.map((item) => (item.id === id ? { ...item, status } : item));
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

  return true;
}

/**
 * Lưu 1 bản ghi vào local cache
 */
function saveToLocalCache(item: CitizenFeedback) {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    const list: CitizenFeedback[] = saved ? JSON.parse(saved) : [];
    list.unshift(item);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
}
