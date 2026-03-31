export const FUND_STORAGE_KEYS = {
  funds: 'funds',
  refreshMs: 'refreshMs',
  holdings: 'holdings',
  pendingTrades: 'pendingTrades',
  dcaPlans: 'dcaPlans',
  viewMode: 'viewMode',
  theme: 'theme',
} as const;

export type FundStorageKey =
  (typeof FUND_STORAGE_KEYS)[keyof typeof FUND_STORAGE_KEYS];

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

const noopStorage: StorageLike = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

export const createFundStorage = (storage: StorageLike = noopStorage) => ({
  getItem(key: FundStorageKey | string) {
    return storage.getItem(key);
  },
  setItem(key: FundStorageKey | string, value: string) {
    storage.setItem(key, value);
  },
  removeItem(key: FundStorageKey | string) {
    storage.removeItem(key);
  },
  clear() {
    storage.clear();
  },
  getJSON<T>(key: FundStorageKey | string, fallback: T): T {
    const raw = storage.getItem(key);
    if (raw == null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  setJSON(key: FundStorageKey | string, value: unknown) {
    storage.setItem(key, JSON.stringify(value));
  },
});

export const createBrowserFundStorage = () =>
  createFundStorage(
    typeof window === 'undefined' ? noopStorage : window.localStorage,
  );
