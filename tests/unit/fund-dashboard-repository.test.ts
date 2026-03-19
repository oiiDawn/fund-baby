import { beforeEach, describe, expect, it } from 'vitest';

import { createFundDashboardRepository } from '@/app/features/fund-dashboard/repository/fund-dashboard-repository';
import {
  buildSampleSnapshot,
  secondaryFund,
} from '@/tests/fixtures/funds/sample-data';

describe('fund-dashboard repository', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('loads bootstrap state from persisted dashboard storage', () => {
    const snapshot = buildSampleSnapshot({
      collapsedCodes: ['004253'],
      viewMode: 'list',
    });

    window.localStorage.setItem('funds', JSON.stringify(snapshot.funds));
    window.localStorage.setItem(
      'favorites',
      JSON.stringify(snapshot.favorites),
    );
    window.localStorage.setItem('groups', JSON.stringify(snapshot.groups));
    window.localStorage.setItem(
      'collapsedCodes',
      JSON.stringify(snapshot.collapsedCodes),
    );
    window.localStorage.setItem('refreshMs', String(snapshot.refreshMs));
    window.localStorage.setItem('holdings', JSON.stringify(snapshot.holdings));
    window.localStorage.setItem(
      'pendingTrades',
      JSON.stringify(snapshot.pendingTrades),
    );
    window.localStorage.setItem('viewMode', snapshot.viewMode);
    window.localStorage.setItem('theme', 'light');

    const repository = createFundDashboardRepository();
    const bootstrap = repository.loadBootstrapState();

    expect(bootstrap.funds).toHaveLength(1);
    expect(bootstrap.refreshMs).toBe(snapshot.refreshMs);
    expect(Array.from(bootstrap.favorites)).toEqual(snapshot.favorites);
    expect(Array.from(bootstrap.collapsedCodes)).toEqual(
      snapshot.collapsedCodes,
    );
    expect(bootstrap.viewMode).toBe('list');
    expect(bootstrap.theme).toBe('light');
  });

  it('merges imported snapshots through the repository facade', () => {
    const current = buildSampleSnapshot();
    const imported = buildSampleSnapshot({
      funds: [...current.funds, secondaryFund],
      favorites: [secondaryFund.code],
    });

    window.localStorage.setItem('funds', JSON.stringify(current.funds));
    window.localStorage.setItem('favorites', JSON.stringify(current.favorites));
    window.localStorage.setItem('groups', JSON.stringify(current.groups));
    window.localStorage.setItem(
      'collapsedCodes',
      JSON.stringify(current.collapsedCodes),
    );
    window.localStorage.setItem('refreshMs', String(current.refreshMs));
    window.localStorage.setItem('holdings', JSON.stringify(current.holdings));
    window.localStorage.setItem(
      'pendingTrades',
      JSON.stringify(current.pendingTrades),
    );
    window.localStorage.setItem('viewMode', current.viewMode);

    const repository = createFundDashboardRepository();
    const result = repository.mergeImportedSnapshot(
      imported,
      '2026-03-18T00:00:00.000Z',
    );

    expect(result.appendedCodes).toEqual([secondaryFund.code]);
    expect(result.snapshot.funds).toHaveLength(2);
    expect(result.snapshot.favorites).toContain(secondaryFund.code);
  });
});
