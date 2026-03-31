import { getFundValuationSnapshot } from '@/app/services/fund-trade';
import type { FundData, HoldingProfit, SortBy, SortOrder } from '@/app/types';

export const dedupeFundsByCode = <T extends { code?: string | null }>(
  list: T[],
): T[] => {
  const seen = new Set<string>();

  return list.filter((item) => {
    const code = String(item?.code || '').trim();
    if (!code || seen.has(code)) return false;
    seen.add(code);
    return true;
  });
};

export const mergeUpdatedFunds = (
  currentFunds: FundData[],
  updatedFunds: FundData[],
) => {
  const merged = [...currentFunds];

  updatedFunds.forEach((fund) => {
    const index = merged.findIndex((item) => item.code === fund.code);
    if (index >= 0) {
      merged[index] = fund;
      return;
    }
    merged.push(fund);
  });

  return dedupeFundsByCode(merged);
};

export const sortFunds = (
  funds: FundData[],
  sortBy: SortBy,
  sortOrder: SortOrder,
  getHoldingProfit: (fund: FundData) => HoldingProfit | null,
) =>
  [...funds].sort((left, right) => {
    if (sortBy === 'yield') {
      const leftValue = getFundValuationSnapshot(left).change;
      const rightValue = getFundValuationSnapshot(right).change;
      return sortOrder === 'asc'
        ? leftValue - rightValue
        : rightValue - leftValue;
    }

    if (sortBy === 'holding') {
      const leftValue =
        getHoldingProfit(left)?.profitTotal ?? Number.NEGATIVE_INFINITY;
      const rightValue =
        getHoldingProfit(right)?.profitTotal ?? Number.NEGATIVE_INFINITY;
      return sortOrder === 'asc'
        ? leftValue - rightValue
        : rightValue - leftValue;
    }

    if (sortBy === 'name') {
      return sortOrder === 'asc'
        ? left.name.localeCompare(right.name, 'zh-CN')
        : right.name.localeCompare(left.name, 'zh-CN');
    }

    return 0;
  });
