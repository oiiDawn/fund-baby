import type { DcaPlan, FundData, PendingTrade, ViewMode } from '@/app/types';
import type { FundSnapshot, PersistedHolding } from '@/app/types';
import { dedupeFundsByCode } from '@/app/services/fund-collection';
import { sanitizeDcaPlans } from '@/app/services/fund-dca';
import {
  FUND_STORAGE_KEYS,
  type StorageLike,
  createFundStorage,
} from '@/app/storage/fund-storage';

const SNAPSHOT_VERSION = 2 as const;

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

const mergeDcaPlans = (
  currentPlans: DcaPlan[],
  incomingPlans: DcaPlan[],
): DcaPlan[] => {
  const planMap = new Map<string, DcaPlan>();

  currentPlans.forEach((plan) => {
    planMap.set(plan.id, plan);
  });

  incomingPlans.forEach((plan) => {
    const existing = planMap.get(plan.id);
    if (!existing) {
      planMap.set(plan.id, plan);
      return;
    }

    const existingUpdated = Date.parse(existing.updatedAt || '') || 0;
    const incomingUpdated = Date.parse(plan.updatedAt || '') || 0;
    planMap.set(plan.id, incomingUpdated >= existingUpdated ? plan : existing);
  });

  return Array.from(planMap.values());
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
  const pendingTrades = repository
    .getJSON<PendingTrade[]>(FUND_STORAGE_KEYS.pendingTrades, [])
    .filter((trade) => trade && fundCodes.has(trade.fundCode));
  const dcaPlans = sanitizeDcaPlans(
    fundCodes,
    repository.getJSON<DcaPlan[]>(FUND_STORAGE_KEYS.dcaPlans, []),
  );
  const refreshMs = Number.parseInt(
    repository.getItem(FUND_STORAGE_KEYS.refreshMs) || '30000',
    10,
  );
  const rawViewMode = repository.getItem(FUND_STORAGE_KEYS.viewMode);
  const viewMode: ViewMode = rawViewMode === 'list' ? 'list' : 'card';

  return {
    version: SNAPSHOT_VERSION,
    funds,
    refreshMs: Number.isFinite(refreshMs) ? refreshMs : 30000,
    holdings: sanitizeHoldings(
      fundCodes,
      repository.getJSON<Record<string, PersistedHolding>>(
        FUND_STORAGE_KEYS.holdings,
        {},
      ),
    ),
    pendingTrades,
    dcaPlans,
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

  const currentPlans = sanitizeDcaPlans(fundCodes, current.dcaPlans);
  const incomingPlans = sanitizeDcaPlans(fundCodes, incomingRaw.dcaPlans);

  return {
    snapshot: {
      version: SNAPSHOT_VERSION,
      funds,
      refreshMs:
        typeof incomingRaw.refreshMs === 'number' &&
        incomingRaw.refreshMs >= 5000
          ? incomingRaw.refreshMs
          : current.refreshMs,
      holdings,
      pendingTrades: Array.from(pendingTradeMap.values()),
      dcaPlans: mergeDcaPlans(currentPlans, incomingPlans),
      viewMode:
        incomingRaw.viewMode === 'list' || incomingRaw.viewMode === 'card'
          ? incomingRaw.viewMode
          : current.viewMode,
      exportedAt: incomingRaw.exportedAt || current.exportedAt,
    } satisfies FundSnapshot,
    appendedCodes,
  };
};
