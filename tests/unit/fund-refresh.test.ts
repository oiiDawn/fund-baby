import { describe, expect, it, vi } from 'vitest';

import {
  loadFundBatch,
  resolveTradingDayStatus,
} from '@/app/services/fund-refresh';
import {
  sampleFund,
  sampleIntraday,
  secondaryFund,
} from '@/tests/fixtures/funds/sample-data';

describe('fund-refresh services', () => {
  it('marks weekends as non-trading days', () => {
    const result = resolveTradingDayStatus({
      now: {
        day: () => 6,
        hour: () => 10,
        minute: () => 0,
      } as never,
      indexDate: '20260320',
      todayStr: '2026-03-21',
    });

    expect(result).toBe(false);
  });

  it('loads funds and keeps previous data when refresh fails', async () => {
    const fetchFund = vi.fn(async (code: string) => {
      if (code === secondaryFund.code) throw new Error('boom');
      return sampleFund;
    });
    const fetchIntraday = vi.fn(async () => sampleIntraday);

    const result = await loadFundBatch({
      codes: [sampleFund.code, secondaryFund.code],
      currentFunds: [sampleFund, secondaryFund],
      fetchFund,
      fetchIntraday,
    });

    expect(result.failedCodes).toEqual([secondaryFund.code]);
    expect(result.funds.map((fund) => fund.code)).toEqual([
      sampleFund.code,
      secondaryFund.code,
    ]);
    expect(result.intradayMap[sampleFund.code]).toEqual(sampleIntraday);
  });
});
