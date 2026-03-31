import type { Dayjs } from 'dayjs';

import { nowInTz, toTz } from '@/app/lib/date';
import type {
  FundData,
  Holding,
  HoldingProfit,
  PendingTrade,
} from '@/app/types';
import type { TradeSettlementResult } from '@/app/types';

const ESTIMATE_COVERAGE_THRESHOLD = 0.05;

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toPositiveNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export interface FundValuationSnapshot {
  nav: number | null;
  navText: string;
  change: number;
  changeText: string;
  usingEstimate: boolean;
}

export const getFundValuationSnapshot = (
  fund: FundData,
): FundValuationSnapshot => {
  const hasCoverage =
    Number(fund.estPricedCoverage) > ESTIMATE_COVERAGE_THRESHOLD;
  const estimatedNav = hasCoverage ? toPositiveNumber(fund.estGsz) : null;
  const latestNav = toPositiveNumber(fund.gsz) ?? toPositiveNumber(fund.dwjz);
  const nav = estimatedNav ?? latestNav;

  const estimatedChange = hasCoverage ? toFiniteNumber(fund.estGszzl) : null;
  const latestChange = toFiniteNumber(fund.gszzl);
  const change = estimatedChange ?? latestChange ?? 0;

  let changeText = '—';
  if (estimatedChange !== null || latestChange !== null) {
    const value = estimatedChange ?? latestChange ?? 0;
    changeText = `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  } else if (
    fund.gszzl !== null &&
    fund.gszzl !== undefined &&
    String(fund.gszzl).trim() !== ''
  ) {
    changeText = String(fund.gszzl);
  }

  return {
    nav,
    navText: nav !== null ? nav.toFixed(4) : '—',
    change,
    changeText,
    usingEstimate: estimatedNav !== null,
  };
};

interface GetHoldingProfitOptions {
  fund: FundData;
  holding?: Holding;
  isTradingDay: boolean;
  todayStr: string;
  now?: Dayjs;
}

interface ProcessPendingTradesOptions {
  holdings: Record<string, Holding>;
  pendingTrades: PendingTrade[];
  resolveNetValue: (
    fundCode: string,
    queryDate: string,
  ) => Promise<{ date: string; value: number } | null>;
}

export const getPendingTradeQueryDate = (trade: PendingTrade) =>
  trade.isAfter3pm
    ? toTz(trade.date).add(1, 'day').format('YYYY-MM-DD')
    : trade.date;

export const getHoldingProfitForFund = ({
  fund,
  holding,
  isTradingDay,
  todayStr,
  now = nowInTz(),
}: GetHoldingProfitOptions): HoldingProfit | null => {
  if (!holding || typeof holding.share !== 'number') return null;

  const isAfter9 = now.hour() >= 9;
  const hasTodayData = fund.jzrq === todayStr;
  const hasTodayValuation =
    typeof fund.gztime === 'string' && fund.gztime.startsWith(todayStr);
  const canCalcTodayProfit = hasTodayData || hasTodayValuation;
  const useValuation = isTradingDay && isAfter9 && !hasTodayData;

  let currentNav = 0;
  let profitToday: number | null = null;

  if (!useValuation) {
    const settledNav = toPositiveNumber(fund.dwjz);
    if (settledNav === null) return null;
    currentNav = settledNav;

    if (canCalcTodayProfit) {
      const amount = holding.share * currentNav;
      const settledChange =
        fund.zzl !== undefined && fund.zzl !== null
          ? Number(fund.zzl)
          : Number(fund.gszzl) || 0;
      profitToday = amount - amount / (1 + settledChange / 100);
    }
  } else {
    const valuation = getFundValuationSnapshot(fund);
    if (valuation.nav === null) return null;
    currentNav = valuation.nav;

    if (canCalcTodayProfit) {
      const amount = holding.share * currentNav;
      profitToday = amount - amount / (1 + valuation.change / 100);
    }
  }

  return {
    amount: holding.share * currentNav,
    profitToday,
    profitTotal:
      typeof holding.cost === 'number'
        ? (currentNav - holding.cost) * holding.share
        : null,
  };
};

export const processPendingTrades = async ({
  holdings,
  pendingTrades,
  resolveNetValue,
}: ProcessPendingTradesOptions): Promise<TradeSettlementResult> => {
  const nextHoldings = { ...holdings };
  const processedIds: string[] = [];

  for (const trade of pendingTrades) {
    const result = await resolveNetValue(
      trade.fundCode,
      getPendingTradeQueryDate(trade),
    );
    if (!result || result.value <= 0) continue;

    const currentHolding = nextHoldings[trade.fundCode] || {
      share: 0,
      cost: 0,
    };

    if (trade.type === 'buy') {
      const totalAmount = Number(trade.amount) || 0;
      const feeRate = Number(trade.feeRate) || 0;
      const netAmount = totalAmount / (1 + feeRate / 100);
      const share = netAmount / result.value;
      const newShare = currentHolding.share + share;
      const newCost =
        newShare > 0
          ? (currentHolding.cost * currentHolding.share + totalAmount) /
            newShare
          : 0;

      nextHoldings[trade.fundCode] = { share: newShare, cost: newCost };
      processedIds.push(trade.id);
      continue;
    }

    const sellShare = Number(trade.share) || 0;
    const newShare = Math.max(0, currentHolding.share - sellShare);
    nextHoldings[trade.fundCode] = {
      share: newShare,
      cost: newShare === 0 ? 0 : currentHolding.cost,
    };
    processedIds.push(trade.id);
  }

  return {
    holdings: nextHoldings,
    pendingTrades: pendingTrades.filter(
      (trade) => !processedIds.includes(trade.id),
    ),
    processedIds,
    processedCount: processedIds.length,
  };
};
