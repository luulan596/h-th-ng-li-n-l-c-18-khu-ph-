import { Personnel, Headquarters } from '../types';

const DB_NAME = 'MatTran18KhuPhoDB';
const DB_VERSION = 1;

const STORES = {
  PERSONNEL: 'personnel',
  HEADQUARTERS: 'headquarters',
  META: 'meta',
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB không được hỗ trợ trên trình duyệt này.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORES.PERSONNEL)) {
        db.createObjectStore(STORES.PERSONNEL, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.HEADQUARTERS)) {
        db.createObjectStore(STORES.HEADQUARTERS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.META)) {
        db.createObjectStore(STORES.META, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save Personnel List to IndexedDB
export async function savePersonnelCache(list: Personnel[], version?: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORES.PERSONNEL, STORES.META], 'readwrite');
    const store = tx.objectStore(STORES.PERSONNEL);
    const metaStore = tx.objectStore(STORES.META);

    store.clear();
    list.forEach((item) => store.put(item));

    if (version) {
      metaStore.put({ key: 'personnel_version', value: version, updatedAt: new Date().toISOString() });
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('IndexedDB savePersonnelCache error:', err);
  }
}

// Get Personnel List from IndexedDB
export async function getPersonnelCache(): Promise<Personnel[] | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.PERSONNEL, 'readonly');
    const store = tx.objectStore(STORES.PERSONNEL);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const result = request.result as Personnel[];
        resolve(result && result.length > 0 ? result : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('IndexedDB getPersonnelCache error:', err);
    return null;
  }
}

// Save Metadata (e.g. DATA_VERSION)
export async function saveMetaValue(key: string, value: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.META, 'readwrite');
    const store = tx.objectStore(STORES.META);
    store.put({ key, value, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('IndexedDB saveMetaValue error:', err);
  }
}

// Get Metadata Value
export async function getMetaValue(key: string): Promise<string | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.META, 'readonly');
    const store = tx.objectStore(STORES.META);

    return new Promise((resolve) => {
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

// Save Headquarters Cache
export async function saveHeadquartersCache(list: Headquarters[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.HEADQUARTERS, 'readwrite');
    const store = tx.objectStore(STORES.HEADQUARTERS);
    store.clear();
    list.forEach((item) => store.put(item));
  } catch (err) {
    console.error('IndexedDB saveHeadquartersCache error:', err);
  }
}

// Get Headquarters Cache
export async function getHeadquartersCache(): Promise<Headquarters[] | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.HEADQUARTERS, 'readonly');
    const store = tx.objectStore(STORES.HEADQUARTERS);

    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const result = request.result as Headquarters[];
        resolve(result && result.length > 0 ? result : null);
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}
