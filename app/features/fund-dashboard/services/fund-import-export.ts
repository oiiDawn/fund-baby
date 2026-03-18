import type { FundData, FundGroup, PendingTrade, ViewMode } from '@/app/types';
import type {
  FundSnapshot,
  PersistedHolding,
} from '@/app/features/fund-dashboard/types';
import {
  dedupeFundsByCode,
  mergeGroups,
} from '@/app/features/fund-dashboard/services/fund-collection';
import {
  FUND_STORAGE_KEYS,
  type StorageLike,
  createFundStorage,
} from '@/app/features/fund-dashboard/storage/fund-storage';

const SNAPSHOT_VERSION = 1 as const;

const normalizeNullableNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const sanitizeHoldings = (
  fundCodes: Set<string>,
  holdings: unknown,
): Record<string, PersistedHolding> => {
  if (!holdings || typeof holdings !== 'object' || Array.isArray(holdings))
    return {};

  return Object.entries(holdings).reduce<Record<string, PersistedHolding>>(
    (acc, [code, value]) => {
      if (!fundCodes.has(code) || !value || typeof value !== 'object')
        return acc;
      const record = value as Record<string, unknown>;
      const share = normalizeNullableNumber(record.share);
      const cost = normalizeNullableNumber(record.cost);
      if (share === null && cost === null) return acc;
      acc[code] = { share, cost };
      return acc;
    },
    {},
  );
};

export const collectFundSnapshot = (
  storage: StorageLike,
  exportedAt: string,
): FundSnapshot => {
  const repository = createFundStorage(storage);
  const funds = dedupeFundsByCode(
    repository.getJSON<FundData[]>(FUND_STORAGE_KEYS.funds, []),
  );
  const fundCodes = new Set(funds.map((fund) => fund.code));
  const favorites = repository
    .getJSON<string[]>(FUND_STORAGE_KEYS.favorites, [])
    .filter((code) => fundCodes.has(code));
  const collapsedCodes = repository
    .getJSON<string[]>(FUND_STORAGE_KEYS.collapsedCodes, [])
    .filter((code) => fundCodes.has(code));
  const groups = repository
    .getJSON<FundGroup[]>(FUND_STORAGE_KEYS.groups, [])
    .map((group) => ({
      ...group,
      codes: Array.isArray(group.codes)
        ? group.codes.filter((code) => fundCodes.has(code))
        : [],
    }));
  const pendingTrades = repository
    .getJSON<PendingTrade[]>(FUND_STORAGE_KEYS.pendingTrades, [])
    .filter((trade) => trade && fundCodes.has(trade.fundCode));
  const refreshMs = Number.parseInt(
    repository.getItem(FUND_STORAGE_KEYS.refreshMs) || '30000',
    10,
  );
  const rawViewMode = repository.getItem(FUND_STORAGE_KEYS.viewMode);
  const viewMode: ViewMode = rawViewMode === 'list' ? 'list' : 'card';

  return {
    version: SNAPSHOT_VERSION,
    funds,
    favorites,
    groups,
    collapsedCodes,
    refreshMs: Number.isFinite(refreshMs) ? refreshMs : 30000,
    holdings: sanitizeHoldings(
      fundCodes,
      repository.getJSON<Record<string, PersistedHolding>>(
        FUND_STORAGE_KEYS.holdings,
        {},
      ),
    ),
    pendingTrades,
    viewMode,
    exportedAt,
  };
};

export const mergeFundSnapshots = (
  current: FundSnapshot,
  incomingRaw: Partial<FundSnapshot>,
) => {
  const incomingFunds = Array.isArray(incomingRaw.funds)
    ? dedupeFundsByCode(incomingRaw.funds)
    : [];
  const currentFunds = dedupeFundsByCode(current.funds);
  const existingCodes = new Set(currentFunds.map((fund) => fund.code));
  const appendedCodes = incomingFunds
    .filter((fund) => fund?.code && !existingCodes.has(fund.code))
    .map((fund) => fund.code);
  const funds = dedupeFundsByCode([...currentFunds, ...incomingFunds]);
  const fundCodes = new Set(funds.map((fund) => fund.code));

  const favorites = Array.from(
    new Set([
      ...current.favorites.filter((code) => fundCodes.has(code)),
      ...(incomingRaw.favorites || []).filter((code) => fundCodes.has(code)),
    ]),
  );

  const collapsedCodes = Array.from(
    new Set([
      ...current.collapsedCodes.filter((code) => fundCodes.has(code)),
      ...(incomingRaw.collapsedCodes || []).filter((code) =>
        fundCodes.has(code),
      ),
    ]),
  );

  const groups = mergeGroups(
    current.groups,
    Array.isArray(incomingRaw.groups) ? incomingRaw.groups : [],
  ).map((group) => ({
    ...group,
    codes: group.codes.filter((code) => fundCodes.has(code)),
  }));

  const holdings = {
    ...current.holdings,
    ...sanitizeHoldings(fundCodes, incomingRaw.holdings),
  };

  const keyOfTrade = (trade: PendingTrade) =>
    trade.id
      ? `id:${trade.id}`
      : `k:${trade.fundCode}:${trade.type}:${trade.date}:${trade.share ?? ''}:${trade.amount ?? ''}:${trade.isAfter3pm ? 1 : 0}`;

  const pendingTradeMap = new Map<string, PendingTrade>();
  current.pendingTrades.forEach((trade) => {
    if (fundCodes.has(trade.fundCode))
      pendingTradeMap.set(keyOfTrade(trade), trade);
  });
  (Array.isArray(incomingRaw.pendingTrades)
    ? incomingRaw.pendingTrades
    : []
  ).forEach((trade) => {
    if (trade && fundCodes.has(trade.fundCode))
      pendingTradeMap.set(keyOfTrade(trade), trade);
  });

  return {
    snapshot: {
      version: SNAPSHOT_VERSION,
      funds,
      favorites,
      groups,
      collapsedCodes,
      refreshMs:
        typeof incomingRaw.refreshMs === 'number' &&
        incomingRaw.refreshMs >= 5000
          ? incomingRaw.refreshMs
          : current.refreshMs,
      holdings,
      pendingTrades: Array.from(pendingTradeMap.values()),
      viewMode:
        incomingRaw.viewMode === 'list' || incomingRaw.viewMode === 'card'
          ? incomingRaw.viewMode
          : current.viewMode,
      exportedAt: incomingRaw.exportedAt || current.exportedAt,
    } satisfies FundSnapshot,
    appendedCodes,
  };
};
