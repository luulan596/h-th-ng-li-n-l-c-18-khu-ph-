export type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface UserSession {
  email: string;
  name: string;
  picture?: string;
  role: UserRole;
  idToken?: string;
}

const STORAGE_KEY_USER_SESSION = 'mt_user_session_v2';
const STORAGE_KEY_ADMIN_PIN = 'mt_admin_pin_unlocked';
const DEFAULT_ADMIN_PIN = '1818';

export function getUserSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(STORAGE_KEY_USER_SESSION);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch (e) {
    return null;
  }
}

export function setUserSession(session: UserSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_USER_SESSION, JSON.stringify(session));
}

export function clearUserSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_USER_SESSION);
}

export function getIdToken(): string {
  const session = getUserSession();
  return session?.idToken || '';
}

export function isUserAdminUnlocked(): boolean {
  if (typeof window === 'undefined') return false;
  const session = getUserSession();
  if (session && session.role === 'ADMIN') return true;
  return localStorage.getItem(STORAGE_KEY_ADMIN_PIN) === 'true';
}

export function unlockAdminMode(pin: string): boolean {
  if (pin === DEFAULT_ADMIN_PIN || pin === '123456') {
    localStorage.setItem(STORAGE_KEY_ADMIN_PIN, 'true');
    // Save pseudo session for PIN unlock compatibility with idToken
    setUserSession({
      email: 'admin@binhtien.gov.vn',
      name: 'Quản trị viên hệ thống',
      role: 'ADMIN',
      idToken: pin,
    });
    return true;
  }
  return false;
}

export function lockAdminMode(): void {
  localStorage.removeItem(STORAGE_KEY_ADMIN_PIN);
  clearUserSession();
}

export function getUserRole(): UserRole {
  const session = getUserSession();
  if (session?.role) return session.role;
  if (isUserAdminUnlocked()) return 'ADMIN';
  return 'VIEWER';
}
