import { Personnel, Headquarters, SyncStatus } from '../types';
import { getIdToken } from './auth';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
  version?: string;
  timestamp?: string;
}

// Global API Endpoint URL from Environment Variables or Local Storage
export function getApiUrl(): string {
  const envUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
  if (envUrl && envUrl !== 'https://script.google.com/macros/s/YOUR_APPS_SCRIPT_ID/exec') {
    return envUrl;
  }
  return localStorage.getItem('mt_apps_script_url') || '';
}

export function setApiUrl(url: string): void {
  localStorage.setItem('mt_apps_script_url', url.trim());
}

/**
 * Universal API Call Helper to communicate with Google Apps Script Web App HTTPS API.
 * Uses POST JSON payload format with action routing to comply with CORS restrictions.
 * Automatically injects Google idToken for authenticated sessions.
 */
export async function callApi<T = any>(
  action: string,
  payload: Record<string, any> = {},
  customUrl?: string
): Promise<ApiResponse<T>> {
  const targetUrl = customUrl || getApiUrl();
  if (!targetUrl) {
    return {
      success: false,
      message: 'Chưa cấu hình đường dẫn kết nối máy chủ.',
    };
  }

  if (typeof window !== 'undefined' && !window.navigator.onLine) {
    return {
      success: false,
      message: 'Không có kết nối Internet. Vui lòng kiểm tra lại mạng.',
    };
  }

  try {
    const token = payload.idToken || getIdToken();

    const bodyPayload = JSON.stringify({
      action,
      idToken: token,
      ...payload,
      timestamp: new Date().toISOString(),
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(targetUrl, {
      method: 'POST',
      body: bodyPayload,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        message: 'Không thể kết nối với máy chủ.',
      };
    }

    const json = await response.json();
    
    // Normalize response structure
    if (json.success !== undefined) {
      return json as ApiResponse<T>;
    }
    
    // Compatibility with legacy status format { status: "success", data: [...] }
    if (json.status === 'success' || Array.isArray(json.data)) {
      return {
        success: true,
        message: json.message || 'Thao tác thành công',
        data: json.data !== undefined ? json.data : json,
        version: json.version,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: false,
      message: json.message || 'Phản hồi từ máy chủ chưa sẵn sàng.',
      data: json.data,
      version: json.version,
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.warn(`API Timeout [${action}]`);
      return {
        success: false,
        message: 'Thời gian phản hồi vượt quá giới hạn.',
      };
    }
    console.error(`API Error [${action}]:`, err);
    return {
      success: false,
      message: 'Không thể kết nối máy chủ.',
    };
  }
}

/**
 * Fetch Data Version from Server (Lightweight request)
 */
export async function getDataVersionApi(customUrl?: string): Promise<ApiResponse<{ version: string }>> {
  return callApi<{ version: string }>('GET_DATA_VERSION', {}, customUrl);
}

/**
 * Fetch Public Contacts (Public Read Mode - No Google Token required)
 */
export async function getPublicContactsApi(customUrl?: string): Promise<ApiResponse<Personnel[]>> {
  return callApi<Personnel[]>('GET_PUBLIC_CONTACTS', {}, customUrl);
}

export async function getPublicPersonnelApi(customUrl?: string): Promise<ApiResponse<Personnel[]>> {
  return getPublicContactsApi(customUrl);
}

/**
 * Fetch Public Headquarters (23 locations: 5 ward agencies + 18 KP headquarters)
 */
export async function getPublicHeadquartersApi(customUrl?: string): Promise<ApiResponse<Headquarters[]>> {
  return callApi<Headquarters[]>('GET_PUBLIC_HEADQUARTERS', {}, customUrl);
}


/**
 * Fetch all Personnel records with full details (Protected Mode - Requires Google Token for Admin/Editor)
 */
export async function getPersonnelApi(customUrl?: string): Promise<ApiResponse<Personnel[]>> {
  const token = getIdToken();
  if (token) {
    return callApi<Personnel[]>('GET_PERSONNEL', { idToken: token }, customUrl);
  }
  // Fallback to Public Read if no token present
  return getPublicPersonnelApi(customUrl);
}

/**
 * Create a new Personnel record (Protected WRITE - Requires Google Token)
 */
export async function createPersonnelApi(person: Personnel): Promise<ApiResponse> {
  return callApi('CREATE_PERSONNEL', { action: 'ADD', data: person });
}

/**
 * Update an existing Personnel record (Protected WRITE - Requires Google Token)
 */
export async function updatePersonnelApi(person: Personnel): Promise<ApiResponse> {
  return callApi('UPDATE_PERSONNEL', { action: 'UPDATE', data: person });
}

/**
 * Delete a Personnel record (Protected WRITE - Requires Admin Google Token)
 */
export async function deletePersonnelApi(person: Personnel): Promise<ApiResponse> {
  return callApi('DELETE_PERSONNEL', { action: 'DELETE', data: person });
}

/**
 * Sync / Replace all Personnel records (Protected WRITE - Requires Admin Google Token)
 */
export async function syncAllPersonnelApi(list: Personnel[]): Promise<ApiResponse> {
  return callApi('SYNC_ALL_PERSONNEL', { action: 'SYNC_ALL', list });
}

/**
 * Update Headquarters coordinates (Protected WRITE - Requires Google Token)
 */
export async function updateHeadquartersToaDoApi(
  id: string,
  tenTruSo: string,
  lat: number,
  lng: number
): Promise<ApiResponse> {
  return callApi('UPDATE_HEADQUARTERS_TOADO', {
    action: 'updateHeadquartersToaDo',
    id,
    tenTruSo,
    lat,
    lng,
  });
}

/**
 * Test server connection PING
 */
export async function pingApi(customUrl?: string): Promise<ApiResponse> {
  return callApi('PING', {}, customUrl);
}
