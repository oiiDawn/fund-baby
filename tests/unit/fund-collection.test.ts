import { describe, expect, it } from 'vitest';

import {
  dedupeFundsByCode,
  mergeUpdatedFunds,
  sortFunds,
} from '@/app/services/fund-collection';
import { sampleFund, secondaryFund } from '@/tests/fixtures/funds/sample-data';

describe('fund-collection services', () => {
  it('deduplicates funds by code and drops empty codes', () => {
    const result = dedupeFundsByCode([
      sampleFund,
      secondaryFund,
      { ...sampleFund, name: '重复基金' },
      { ...sampleFund, code: '' },
    ]);

    expect(result).toHaveLength(2);
    expect(result.map((fund) => fund.code)).toEqual([
      sampleFund.code,
      secondaryFund.code,
    ]);
  });

  it('merges updated funds into the current list', () => {
    const result = mergeUpdatedFunds(
      [sampleFund],
      [{ ...sampleFund, name: '已刷新基金' }, secondaryFund],
    );

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('已刷新基金');
    expect(result[1].code).toBe(secondaryFund.code);
  });

  it('sorts by holding profit descending when requested', () => {
    const result = sortFunds(
      [sampleFund, secondaryFund],
      'holding',
      'desc',
      (fund) =>
        fund.code === sampleFund.code
          ? { amount: 0, profitToday: 0, profitTotal: 100 }
          : { amount: 0, profitToday: 0, profitTotal: 20 },
    );

    expect(result[0].code).toBe(sampleFund.code);
  });

  it('sorts by valuation change fallback for yield ordering', () => {
    const withEstimate = {
      ...sampleFund,
      code: '100001',
      estPricedCoverage: 0.2,
      estGszzl: 1.5,
      gszzl: 0.1,
    };
    const withLatest = {
      ...sampleFund,
      code: '100002',
      estPricedCoverage: 0.2,
      estGszzl: undefined,
      gszzl: '0.9',
    };
    const withNegative = {
      ...sampleFund,
      code: '100003',
      estPricedCoverage: 0,
      estGszzl: undefined,
      gszzl: -0.6,
    };

    const result = sortFunds(
      [withNegative, withLatest, withEstimate],
      'yield',
      'desc',
      () => null,
    );

    expect(result.map((fund) => fund.code)).toEqual([
      withEstimate.code,
      withLatest.code,
      withNegative.code,
    ]);
  });

  it('sorts by fund name ascending when requested', () => {
    const result = sortFunds(
      [sampleFund, secondaryFund],
      'name',
      'asc',
      () => null,
    );

    expect(result.map((fund) => fund.code)).toEqual([
      secondaryFund.code,
      sampleFund.code,
    ]);
  });
});
