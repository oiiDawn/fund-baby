import { describe, expect, it } from 'vitest';

import {
  collectFundSnapshot,
  mergeFundSnapshots,
} from '@/app/features/fund-dashboard/services/fund-import-export';
import {
  buildSampleSnapshot,
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
          case 'favorites':
            return JSON.stringify([...snapshot.favorites, 'not-exists']);
          case 'groups':
            return JSON.stringify(snapshot.groups);
          case 'collapsedCodes':
            return JSON.stringify([...snapshot.collapsedCodes, 'ghost']);
          case 'refreshMs':
            return '30000';
          case 'holdings':
            return JSON.stringify(snapshot.holdings);
          case 'pendingTrades':
            return JSON.stringify(snapshot.pendingTrades);
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
    expect(result.favorites).toEqual([sampleFund.code]);
  });

  it('merges imported snapshots without duplicating funds or trades', () => {
    const current = buildSampleSnapshot();
    const imported = buildSampleSnapshot({
      funds: [sampleFund, secondaryFund],
      favorites: [secondaryFund.code],
    });

    const result = mergeFundSnapshots(current, imported);

    expect(result.appendedCodes).toEqual([secondaryFund.code]);
    expect(result.snapshot.funds).toHaveLength(2);
    expect(result.snapshot.favorites).toContain(secondaryFund.code);
    expect(result.snapshot.pendingTrades).toHaveLength(1);
  });
});
