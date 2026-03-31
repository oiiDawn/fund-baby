import type {
  DcaPlan,
  FundData,
  Holding,
  PendingTrade,
  ViewMode,
} from '@/app/types';
import {
  collectFundSnapshot,
  mergeFundSnapshots,
} from '@/app/services/fund-import-export';
import {
  createBrowserFundStorage,
  FUND_STORAGE_KEYS,
} from '@/app/storage/fund-storage';
import type { FundSnapshot } from '@/app/types';

export interface DashboardBootstrapState {
  funds: FundData[];
  refreshMs: number;
  pendingTrades: PendingTrade[];
  dcaPlans: DcaPlan[];
  holdings: Record<string, Holding>;
  viewMode: ViewMode;
  theme: string;
}

export function createFundDashboardRepository() {
  const storage = createBrowserFundStorage();

  return {
    ...storage,
    loadBootstrapState(): DashboardBootstrapState {
      storage.removeItem('favorites');
      storage.removeItem('groups');
      storage.removeItem('collapsedCodes');
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
        pendingTrades: storage.getJSON<PendingTrade[]>(
          FUND_STORAGE_KEYS.pendingTrades,
          [],
        ),
        dcaPlans: storage.getJSON<DcaPlan[]>(FUND_STORAGE_KEYS.dcaPlans, []),
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
    savePendingTrades(pendingTrades: PendingTrade[]) {
      storage.setJSON(FUND_STORAGE_KEYS.pendingTrades, pendingTrades);
    },
    saveDcaPlans(dcaPlans: DcaPlan[]) {
      storage.setJSON(FUND_STORAGE_KEYS.dcaPlans, dcaPlans);
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
