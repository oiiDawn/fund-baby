import { describe, expect, it } from 'vitest';

import type { FundSnapshot } from '@/app/types';
import {
  collectFundSnapshot,
  mergeFundSnapshots,
} from '@/app/services/fund-import-export';
import {
  buildSampleSnapshot,
  sampleDcaPlan,
  sampleFund,
  secondaryFund,
} from '@/tests/fixtures/funds/sample-data';

describe('fund-import-export services', () => {
  it('collects a sanitized snapshot from storage', () => {
    const snapshot = buildSampleSnapshot();
    const storage = {
      getItem(key: string) {
        switch (key) {
          case 'funds':
            return JSON.stringify([
              ...snapshot.funds,
              { ...sampleFund, code: '' },
            ]);
          case 'refreshMs':
            return '3000';
          case 'holdings':
            return JSON.stringify(snapshot.holdings);
          case 'pendingTrades':
            return JSON.stringify(snapshot.pendingTrades);
          case 'dcaPlans':
            return JSON.stringify(snapshot.dcaPlans);
          case 'viewMode':
            return 'card';
          default:
            return null;
        }
      },
      setItem() {},
      removeItem() {},
      clear() {},
    };

    const result = collectFundSnapshot(storage, '2026-03-18T00:00:00.000Z');

    expect(result.funds).toHaveLength(1);
    expect(result.refreshMs).toBe(30000);
    expect(result.dcaPlans).toHaveLength(1);
    expect(result).not.toHaveProperty('collapsedCodes');
  });

  it('merges imported snapshots without duplicating funds or trades', () => {
    const current = buildSampleSnapshot();
    const imported = buildSampleSnapshot({
      funds: [sampleFund, secondaryFund],
    });

    const result = mergeFundSnapshots(current, imported);

    expect(result.appendedCodes).toEqual([secondaryFund.code]);
    expect(result.snapshot.funds).toHaveLength(2);
    expect(result.snapshot.pendingTrades).toHaveLength(1);
  });

  it('keeps the newer dca plan record when merging imports', () => {
    const current = buildSampleSnapshot();
    const imported = buildSampleSnapshot({
      dcaPlans: [
        {
          ...sampleDcaPlan,
          amount: 800,
          updatedAt: '2026-03-20T10:00:00.000Z',
        },
      ],
    });

    const result = mergeFundSnapshots(current, imported);

    expect(result.snapshot.dcaPlans).toHaveLength(1);
    expect(result.snapshot.dcaPlans[0].amount).toBe(800);
  });

  it('filters malformed incoming arrays and invalid refresh/view values', () => {
    const current = buildSampleSnapshot({
      refreshMs: 45000,
      viewMode: 'list',
    });

    const imported = {
      ...buildSampleSnapshot({ funds: [sampleFund, secondaryFund] }),
      refreshMs: 2000,
      viewMode: 'table',
      pendingTrades: { bad: true },
      dcaPlans: { bad: true },
      holdings: ['bad'],
    } as unknown as Partial<FundSnapshot>;

    const result = mergeFundSnapshots(current, imported);

    expect(result.snapshot.refreshMs).toBe(45000);
    expect(result.snapshot.viewMode).toBe('list');
    expect(result.snapshot.pendingTrades).toEqual(current.pendingTrades);
    expect(result.snapshot.dcaPlans).toEqual(current.dcaPlans);
    expect(result.snapshot.holdings).toEqual(current.holdings);
  });

  it('ignores legacy favorites and groups when merging old payloads', () => {
    const current = buildSampleSnapshot();
    const imported = {
      ...buildSampleSnapshot({ funds: [sampleFund, secondaryFund] }),
      favorites: [secondaryFund.code],
      groups: [{ id: 'legacy', name: '旧分组', codes: [secondaryFund.code] }],
    } as Partial<FundSnapshot> & {
      favorites: string[];
      groups: Array<{ id: string; name: string; codes: string[] }>;
    };

    const result = mergeFundSnapshots(current, imported);

    expect(result.snapshot).not.toHaveProperty('favorites');
    expect(result.snapshot).not.toHaveProperty('groups');
    expect(result.snapshot.funds).toHaveLength(2);
  });
});
