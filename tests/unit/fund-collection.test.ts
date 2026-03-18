import { describe, expect, it } from 'vitest';

import {
  dedupeFundsByCode,
  mergeGroups,
  mergeUpdatedFunds,
  sortFunds,
} from '@/app/features/fund-dashboard/services/fund-collection';
import {
  sampleFund,
  sampleGroups,
  secondaryFund,
} from '@/tests/fixtures/funds/sample-data';

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

  it('merges groups by id and deduplicates fund codes', () => {
    const result = mergeGroups(sampleGroups, [
      {
        id: '新能源',
        name: '新能源升级',
        codes: [sampleFund.code, secondaryFund.code],
      },
      { id: '红利', name: '红利', codes: [secondaryFund.code] },
    ]);

    expect(result).toEqual([
      {
        id: '新能源',
        name: '新能源升级',
        codes: [sampleFund.code, secondaryFund.code],
      },
      sampleGroups[1],
      { id: '红利', name: '红利', codes: [secondaryFund.code] },
    ]);
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
});
