/**
 * ==============================================================================
 * TẦNG DỮ LIỆU (DATA ACCESS LAYER) - SUPABASE CLIENT
 * ==============================================================================
 * Khởi tạo Supabase client từ biến môi trường (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
 * Hỗ trợ chế độ an toàn (Safe Fallback) khi chưa có API key để ứng dụng không bị crash.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Đọc thông tin kết nối từ biến môi trường của Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Kiểm tra xem cấu hình Supabase đã được điền hợp lệ hay chưa
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project')
  );
};

let clientInstance: SupabaseClient | null = null;

/**
 * Lấy đối tượng Supabase Client (Lazy Initialization)
 * Nếu chưa cấu hình, trả về null hoặc client dummy để tránh lỗi runtime.
 */
export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return clientInstance;
};

// Export client instance trực tiếp cho các module cần dùng
export const supabase = isSupabaseConfigured() ? getSupabase() : null;
