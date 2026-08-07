import { Personnel, ApiResponse } from '../types';
import { getOfflineQueue, removeFromOfflineQueue, saveOfflineQueue } from './offlineQueue';

const DEFAULT_TIMEOUT_MS = 15000;

export const getStoredWebAppUrl = (): string => {
  return localStorage.getItem('mt_apps_script_url') || '';
};

export const setStoredWebAppUrl = (url: string): void => {
  localStorage.setItem('mt_apps_script_url', url.trim());
};

/**
 * Fetch với timeout
 */
async function fetchWithTimeout(resource: string, options: RequestInit = {}, timeout = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Lấy danh sách nhân sự từ Google Apps Script
 */
export async function apiFetchPersonnelList(webAppUrl?: string): Promise<ApiResponse<Personnel[]>> {
  const targetUrl = webAppUrl || getStoredWebAppUrl();
  if (!targetUrl) {
    return {
      success: false,
      message: 'Chưa kết nối Google Apps Script URL',
      data: [],
      errorCode: 'NO_URL',
    };
  }

  try {
    const response = await fetchWithTimeout(`${targetUrl}?action=GET_ALL&t=${Date.now()}`);
    const json: ApiResponse<Personnel[]> = await response.json();

    if (json && (json.success || Array.isArray(json.data) || json.status === 'success')) {
      return {
        success: true,
        message: json.message || 'Lấy dữ liệu thành công từ Google Sheets',
        data: Array.isArray(json.data) ? json.data : [],
        total: json.total || (Array.isArray(json.data) ? json.data.length : 0),
      };
    } else {
      return {
        success: false,
        message: json.message || 'Dữ liệu phản hồi từ Google Sheets không đúng định dạng',
        data: [],
        errorCode: json.errorCode || 'INVALID_FORMAT',
      };
    }
  } catch (err: any) {
    console.error('apiFetchPersonnelList error:', err);
    return {
      success: false,
      message: err.name === 'AbortError' ? 'Quá thời gian chờ kết nối (Timeout)' : 'Lỗi kết nối mạng tới Google Apps Script',
      data: [],
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * Lưu (Thêm mới hoặc Cập nhật) một cán bộ nhân sự vào Google Sheets
 */
export async function apiSavePersonnel(person: Personnel, isUpdate: boolean, webAppUrl?: string): Promise<ApiResponse<Personnel>> {
  const targetUrl = webAppUrl || getStoredWebAppUrl();
  if (!targetUrl) {
    return {
      success: false,
      message: 'Chưa cấu hình URL Google Apps Script',
      data: person,
      errorCode: 'NO_URL',
    };
  }

  const payload = {
    action: isUpdate ? 'UPDATE' : 'ADD',
    data: person,
  };

  try {
    const response = await fetchWithTimeout(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json();
    if (json && (json.success || json.status === 'success')) {
      return {
        success: true,
        message: json.message || (isUpdate ? 'Đã cập nhật dữ liệu thành công.' : 'Đã lưu dữ liệu thành công vào Google Sheets.'),
        data: json.data || person,
      };
    } else {
      return {
        success: false,
        message: json.message || 'Không thể lưu dữ liệu vào Google Sheets.',
        data: person,
        errorCode: json.errorCode || 'SERVER_REJECTED',
      };
    }
  } catch (err: any) {
    console.error('apiSavePersonnel error:', err);
    return {
      success: false,
      message: 'Không thể kết nối máy chủ Google Sheets. Vui lòng kiểm tra lại mạng.',
      data: person,
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * Xóa cán bộ nhân sự khỏi Google Sheets
 */
export async function apiDeletePersonnel(id: string, webAppUrl?: string): Promise<ApiResponse<{ id: string }>> {
  const targetUrl = webAppUrl || getStoredWebAppUrl();
  if (!targetUrl) {
    return {
      success: false,
      message: 'Chưa cấu hình URL Google Apps Script',
      data: { id },
      errorCode: 'NO_URL',
    };
  }

  const payload = {
    action: 'DELETE',
    data: { id },
  };

  try {
    const response = await fetchWithTimeout(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json();
    if (json && (json.success || json.status === 'success')) {
      return {
        success: true,
        message: json.message || 'Đã xóa dữ liệu thành công khỏi Google Sheets.',
        data: { id },
      };
    } else {
      return {
        success: false,
        message: json.message || 'Không thể xóa dữ liệu trên Google Sheets.',
        data: { id },
        errorCode: json.errorCode || 'SERVER_REJECTED',
      };
    }
  } catch (err: any) {
    console.error('apiDeletePersonnel error:', err);
    return {
      success: false,
      message: 'Lỗi mạng khi thực hiện xóa.',
      data: { id },
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * Đẩy toàn bộ danh sách nhân sự lên Google Sheets (SYNC_ALL)
 */
export async function apiPushAllPersonnel(list: Personnel[], webAppUrl?: string): Promise<ApiResponse<{ count: number }>> {
  const targetUrl = webAppUrl || getStoredWebAppUrl();
  if (!targetUrl) {
    return {
      success: false,
      message: 'Chưa cấu hình URL Google Apps Script',
      data: { count: 0 },
      errorCode: 'NO_URL',
    };
  }

  const payload = {
    action: 'SYNC_ALL',
    data: { list },
  };

  try {
    const response = await fetchWithTimeout(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    }, 30000); // 30s timeout cho push toàn bộ

    const json = await response.json();
    if (json && (json.success || json.status === 'success')) {
      return {
        success: true,
        message: json.message || `Đã đồng bộ thành công ${list.length} nhân sự lên Google Sheets.`,
        data: json.data || { count: list.length },
      };
    } else {
      return {
        success: false,
        message: json.message || 'Đồng bộ thất bại.',
        data: { count: 0 },
        errorCode: json.errorCode || 'SERVER_REJECTED',
      };
    }
  } catch (err: any) {
    console.error('apiPushAllPersonnel error:', err);
    return {
      success: false,
      message: 'Lỗi mạng khi đẩy dữ liệu lên Google Sheets.',
      data: { count: 0 },
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * Xử lý đồng bộ các mục trong Hàng đợi Offline lên Google Sheets khi có kết nối lại
 */
export async function processOfflineSyncQueue(webAppUrl?: string): Promise<{ syncedCount: number; failedCount: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { syncedCount: 0, failedCount: 0 };

  const targetUrl = webAppUrl || getStoredWebAppUrl();
  if (!targetUrl) return { syncedCount: 0, failedCount: queue.length };

  let syncedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    item.status = 'SYNCING';
    saveOfflineQueue(queue);

    try {
      let res: ApiResponse;
      if (item.action === 'ADD') {
        res = await apiSavePersonnel(item.data, false, targetUrl);
      } else if (item.action === 'UPDATE') {
        res = await apiSavePersonnel(item.data, true, targetUrl);
      } else if (item.action === 'DELETE') {
        res = await apiDeletePersonnel(item.data.id || item.data, targetUrl);
      } else if (item.action === 'SYNC_ALL') {
        res = await apiPushAllPersonnel(item.data, targetUrl);
      } else {
        res = { success: false, message: 'Thao tác không hỗ trợ', data: null };
      }

      if (res.success) {
        syncedCount++;
        removeFromOfflineQueue(item.txId);
      } else {
        failedCount++;
        item.status = 'FAILED';
        item.errorMessage = res.message;
        saveOfflineQueue(queue);
      }
    } catch (e: any) {
      failedCount++;
      item.status = 'FAILED';
      item.errorMessage = e.message || 'Lỗi kết nối';
      saveOfflineQueue(queue);
    }
  }

  return { syncedCount, failedCount };
}
