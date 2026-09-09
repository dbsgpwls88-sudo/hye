import { SavedFourCut } from '../types';

const DB_NAME = 'kindergarten_four_cut_db';
const DB_VERSION = 1;
const STORE_NAME = 'saved_strips';
const CLASS_INFO_KEY = 'kindergarten_class_info';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// Save a completed four-cut photo to IndexedDB
export async function saveFourCutToStorage(strip: SavedFourCut): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(strip);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to save to IndexedDB, using localStorage fallback', err);
    // Fallback: localStorage metadata
    try {
      const existing = getSavedFourCutsFromLocalStorage();
      const updated = [strip, ...existing.filter((s) => s.id !== strip.id)];
      // If dataUrl is very large, keep the most recent ones
      localStorage.setItem(STORE_NAME, JSON.stringify(updated.slice(0, 10)));
    } catch (e) {
      console.error('localStorage quota exceeded', e);
    }
  }
}

// Retrieve all saved four-cuts from IndexedDB
export async function getSavedFourCuts(): Promise<SavedFourCut[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result as SavedFourCut[]) || [];
        // Sort descending by creation date
        results.sort((a, b) => b.createdAt - a.createdAt);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB unavailable, reading localStorage fallback', err);
    return getSavedFourCutsFromLocalStorage();
  }
}

// Delete a saved four-cut
export async function deleteSavedFourCut(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to delete from IndexedDB', err);
    const existing = getSavedFourCutsFromLocalStorage();
    localStorage.setItem(STORE_NAME, JSON.stringify(existing.filter((s) => s.id !== id)));
  }
}

function getSavedFourCutsFromLocalStorage(): SavedFourCut[] {
  try {
    const raw = localStorage.getItem(STORE_NAME);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export interface ClassInfo {
  className: string;
  subTitle: string;
  soundEnabled: boolean;
  selectedThemeId: string;
}

const DEFAULT_CLASS_INFO: ClassInfo = {
  className: '햇살가득 샛별반',
  subTitle: '우리들의 반짝이는 오늘 ✨',
  soundEnabled: true,
  selectedThemeId: 'chick-yellow',
};

export function getClassInfo(): ClassInfo {
  try {
    const raw = localStorage.getItem(CLASS_INFO_KEY);
    if (!raw) return DEFAULT_CLASS_INFO;
    return { ...DEFAULT_CLASS_INFO, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CLASS_INFO;
  }
}

export function saveClassInfo(info: Partial<ClassInfo>): void {
  try {
    const current = getClassInfo();
    const updated = { ...current, ...info };
    localStorage.setItem(CLASS_INFO_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save class info to localStorage', err);
  }
}
