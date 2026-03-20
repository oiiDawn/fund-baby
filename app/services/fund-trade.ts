import type { Dayjs } from 'dayjs';

import { nowInTz, toTz } from '@/app/lib/date';
import type {
  FundData,
  Holding,
  HoldingProfit,
  PendingTrade,
} from '@/app/types';
import type { TradeSettlementResult } from '@/app/types';

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
    currentNav = Number(fund.dwjz);
    if (!currentNav) return null;

    if (canCalcTodayProfit) {
      const amount = holding.share * currentNav;
      const rate =
        fund.zzl !== undefined ? Number(fund.zzl) : Number(fund.gszzl) || 0;
      profitToday = amount - amount / (1 + rate / 100);
    }
  } else {
    currentNav =
      fund.estPricedCoverage && fund.estPricedCoverage > 0.05
        ? Number(fund.estGsz)
        : typeof fund.gsz === 'number'
          ? fund.gsz
          : Number(fund.dwjz);

    if (!currentNav) return null;

    if (canCalcTodayProfit) {
      const amount = holding.share * currentNav;
      const change =
        fund.estPricedCoverage && fund.estPricedCoverage > 0.05
          ? Number(fund.estGszzl) || 0
          : Number(fund.gszzl) || 0;
      profitToday = amount - amount / (1 + change / 100);
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
