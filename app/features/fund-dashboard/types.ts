import type {
  FeeMode,
  FundData,
  Holding,
  PendingTrade,
  SortBy,
  SortOrder,
  ViewMode,
} from '@/app/types';

export interface PersistedHolding {
  share: number | null;
  cost: number | null;
}

export interface FundSnapshot {
  version: 1;
  funds: FundData[];
  collapsedCodes: string[];
  refreshMs: number;
  holdings: Record<string, PersistedHolding>;
  pendingTrades: PendingTrade[];
  viewMode: ViewMode;
  exportedAt: string;
}

export interface NormalizedFund extends FundData {
  dwjzValue: number | null;
  gszValue: number | null;
  gszzlValue: number | null;
  zzlValue: number | null;
}

export interface FundDashboardState {
  funds: FundData[];
  holdings: Record<string, Holding>;
  pendingTrades: PendingTrade[];
  collapsedCodes: Set<string>;
  viewMode: ViewMode;
  sortBy: SortBy;
  sortOrder: SortOrder;
}

export interface TradeDraft {
  fundCode: string;
  type: 'buy' | 'sell';
  share: number | null;
  amount: number | null;
  feeRate?: number;
  feeMode?: FeeMode;
  feeValue?: string | number;
  date: string;
  isAfter3pm: boolean;
}

export interface TradeSettlementResult {
  holdings: Record<string, Holding>;
  pendingTrades: PendingTrade[];
  processedIds: string[];
  processedCount: number;
}
