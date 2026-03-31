import { describe, expect, it, vi } from 'vitest';

import {
  getFundValuationSnapshot,
  getHoldingProfitForFund,
  getPendingTradeQueryDate,
  processPendingTrades,
} from '@/app/services/fund-trade';
import {
  sampleFund,
  sampleHolding,
  samplePendingBuyTrade,
  samplePendingSellTrade,
} from '@/tests/fixtures/funds/sample-data';

describe('fund-trade services', () => {
  it('prefers estimated valuation only when coverage and value are valid', () => {
    const fromEstimate = getFundValuationSnapshot(sampleFund);
    expect(fromEstimate.nav).toBeCloseTo(1.26, 4);
    expect(fromEstimate.change).toBeCloseTo(1.6, 4);
    expect(fromEstimate.usingEstimate).toBe(true);

    const fallbackFund = {
      ...sampleFund,
      estPricedCoverage: 0.12,
      estGsz: undefined,
      estGszzl: undefined,
      gsz: 1.23,
      gszzl: '0.78',
    };
    const fallback = getFundValuationSnapshot(fallbackFund);
    expect(fallback.nav).toBeCloseTo(1.23, 4);
    expect(fallback.change).toBeCloseTo(0.78, 4);
    expect(fallback.changeText).toBe('+0.78%');
    expect(fallback.usingEstimate).toBe(false);
  });

  it('uses valuation during trading hours when today NAV is unavailable', () => {
    const result = getHoldingProfitForFund({
      fund: sampleFund,
      holding: sampleHolding,
      isTradingDay: true,
      todayStr: '2026-03-18',
      now: {
        hour: () => 10,
      } as never,
    });

    expect(result?.amount).toBeCloseTo(126, 3);
  });

  it('moves after-3pm trades to the next day', () => {
    expect(
      getPendingTradeQueryDate({
        ...samplePendingBuyTrade,
        date: '2026-03-18',
        isAfter3pm: true,
      }),
    ).toBe('2026-03-19');
  });

  it('settles pending buy and sell trades with resolved net values', async () => {
    const resolveNetValue = vi.fn(async () => ({
      date: '2026-03-18',
      value: 1.25,
    }));

    const result = await processPendingTrades({
      holdings: {
        [sampleFund.code]: sampleHolding,
      },
      pendingTrades: [samplePendingBuyTrade, samplePendingSellTrade],
      resolveNetValue,
    });

    expect(resolveNetValue).toHaveBeenCalledTimes(2);
    expect(result.processedCount).toBe(2);
    expect(result.pendingTrades).toHaveLength(0);
    expect(result.holdings[sampleFund.code].share).toBeGreaterThan(
      sampleHolding.share - 20,
    );
  });
});
