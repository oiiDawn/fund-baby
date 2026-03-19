import type { FundData, Holding, PendingTrade, ViewMode } from '@/app/types';
import {
  collectFundSnapshot,
  mergeFundSnapshots,
} from '@/app/features/fund-dashboard/services/fund-import-export';
import {
  createBrowserFundStorage,
  FUND_STORAGE_KEYS,
} from '@/app/features/fund-dashboard/storage/fund-storage';
import type { FundSnapshot } from '@/app/features/fund-dashboard/types';

export interface DashboardBootstrapState {
  funds: FundData[];
  refreshMs: number;
  collapsedCodes: Set<string>;
  pendingTrades: PendingTrade[];
  holdings: Record<string, Holding>;
  viewMode: ViewMode;
  theme: string;
}

function toUniqueSet(values: string[]): Set<string> {
  return new Set(Array.isArray(values) ? values.filter(Boolean) : []);
}

export function createFundDashboardRepository() {
  const storage = createBrowserFundStorage();

  return {
    ...storage,
    loadBootstrapState(): DashboardBootstrapState {
      storage.removeItem('favorites');
      storage.removeItem('groups');
      const rawFunds = storage.getItem(FUND_STORAGE_KEYS.funds);
      const parsedFunds = rawFunds ? JSON.parse(rawFunds) : [];
      const refreshMs = Number.parseInt(
        storage.getItem(FUND_STORAGE_KEYS.refreshMs) || '30000',
        10,
      );
      const viewMode = storage.getItem(FUND_STORAGE_KEYS.viewMode);
      const theme = storage.getItem(FUND_STORAGE_KEYS.theme) || 'dark';

      return {
        funds: Array.isArray(parsedFunds) ? parsedFunds : [],
        refreshMs:
          Number.isFinite(refreshMs) && refreshMs >= 5000 ? refreshMs : 30000,
        collapsedCodes: toUniqueSet(
          storage.getJSON<string[]>(FUND_STORAGE_KEYS.collapsedCodes, []),
        ),
        pendingTrades: storage.getJSON<PendingTrade[]>(
          FUND_STORAGE_KEYS.pendingTrades,
          [],
        ),
        holdings: storage.getJSON<Record<string, Holding>>(
          FUND_STORAGE_KEYS.holdings,
          {},
        ),
        viewMode: viewMode === 'list' ? 'list' : 'card',
        theme,
      };
    },
    saveTheme(theme: string) {
      storage.setItem(FUND_STORAGE_KEYS.theme, theme);
    },
    saveFunds(funds: FundData[]) {
      storage.setJSON(FUND_STORAGE_KEYS.funds, funds);
    },
    saveRefreshMs(refreshMs: number) {
      storage.setItem(FUND_STORAGE_KEYS.refreshMs, String(refreshMs));
    },
    saveCollapsedCodes(codes: Iterable<string>) {
      storage.setJSON(FUND_STORAGE_KEYS.collapsedCodes, Array.from(codes));
    },
    savePendingTrades(pendingTrades: PendingTrade[]) {
      storage.setJSON(FUND_STORAGE_KEYS.pendingTrades, pendingTrades);
    },
    saveHoldings(holdings: Record<string, Holding>) {
      storage.setJSON(FUND_STORAGE_KEYS.holdings, holdings);
    },
    saveViewMode(viewMode: ViewMode) {
      storage.setItem(FUND_STORAGE_KEYS.viewMode, viewMode);
    },
    collectSnapshot(exportedAt: string): FundSnapshot {
      return collectFundSnapshot(window.localStorage, exportedAt);
    },
    mergeImportedSnapshot(
      incomingSnapshot: Partial<FundSnapshot>,
      exportedAt: string,
    ) {
      const currentSnapshot = collectFundSnapshot(
        window.localStorage,
        exportedAt,
      );
      return mergeFundSnapshots(currentSnapshot, incomingSnapshot);
    },
  };
}
