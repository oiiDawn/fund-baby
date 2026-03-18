import type { Dayjs } from 'dayjs';

import { nowInTz } from '@/app/lib/date';
import type { FundData, IntradayPoint } from '@/app/types';
import {
  dedupeFundsByCode,
  mergeUpdatedFunds,
} from '@/app/features/fund-dashboard/services/fund-collection';

interface ResolveTradingDayStatusOptions {
  now?: Dayjs;
  indexDate: string | null;
  todayStr: string;
}

interface LoadFundBatchOptions {
  codes: string[];
  currentFunds: FundData[];
  fetchFund: (code: string) => Promise<FundData>;
  fetchIntraday: (code: string) => Promise<IntradayPoint[] | null>;
}

export const resolveTradingDayStatus = ({
  now = nowInTz(),
  indexDate,
  todayStr,
}: ResolveTradingDayStatusOptions) => {
  const isWeekend = now.day() === 0 || now.day() === 6;
  if (isWeekend) return false;
  if (!indexDate) return true;
  if (indexDate === todayStr.replace(/-/g, '')) return true;
  const minutes = now.hour() * 60 + now.minute();
  return minutes < 9 * 60 + 30;
};

export const loadFundBatch = async ({
  codes,
  currentFunds,
  fetchFund,
  fetchIntraday,
}: LoadFundBatchOptions) => {
  const uniqueCodes = Array.from(new Set(codes));
  const updatedFunds: FundData[] = [];
  const intradayMap: Record<string, IntradayPoint[]> = {};
  const failedCodes: string[] = [];

  for (const code of uniqueCodes) {
    try {
      const fund = await fetchFund(code);
      updatedFunds.push(fund);

      const intraday = await fetchIntraday(code);
      if (intraday?.length) {
        intradayMap[code] = intraday;
      }
    } catch {
      failedCodes.push(code);
      const previous = currentFunds.find((fund) => fund.code === code);
      if (previous) updatedFunds.push(previous);
    }
  }

  return {
    funds: mergeUpdatedFunds(currentFunds, dedupeFundsByCode(updatedFunds)),
    intradayMap,
    failedCodes,
  };
};
