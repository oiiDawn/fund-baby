import { describe, expect, it } from 'vitest';

import {
  createDcaPlan,
  getDcaEvaluationDate,
  getNextDcaRunDate,
  materializeDueDcaTrades,
} from '@/app/services/fund-dca';
import { toTz } from '@/app/lib/date';
import {
  sampleDcaPlan,
  samplePendingBuyTrade,
  sampleFund,
} from '@/tests/fixtures/funds/sample-data';

describe('fund-dca services', () => {
  it('computes the next monthly run date with month-end clamping', () => {
    expect(
      getNextDcaRunDate({
        frequency: 'monthly',
        startDate: '2026-01-31',
        fromDate: '2026-01-31',
      }),
    ).toBe('2026-02-28');
  });

  it('delays after-3pm plans until the afternoon of the due date', () => {
    expect(
      getDcaEvaluationDate({
        timeSlot: 'after_3pm',
        now: toTz('2026-03-18').hour(10),
      }),
    ).toBe('2026-03-17');
  });

  it('creates and advances due dca trades without duplicating occurrences', () => {
    const result = materializeDueDcaTrades({
      dcaPlans: [sampleDcaPlan],
      pendingTrades: [],
      now: toTz('2026-03-18').hour(10),
    });

    expect(result.generatedCount).toBe(1);
    expect(result.pendingTrades).toHaveLength(1);
    expect(result.pendingTrades[0]).toMatchObject({
      sourceType: 'dca',
      sourcePlanId: sampleDcaPlan.id,
      date: '2026-03-17',
      amount: sampleDcaPlan.amount,
    });
    expect(result.dcaPlans[0].nextRunDate).toBe('2026-03-24');
  });

  it('advances past an already-materialized occurrence without generating duplicates', () => {
    const pending = {
      ...samplePendingBuyTrade,
      id: 'generated-dca-trade',
      date: sampleDcaPlan.nextRunDate,
      amount: sampleDcaPlan.amount,
      sourceType: 'dca' as const,
      sourcePlanId: sampleDcaPlan.id,
    };

    const result = materializeDueDcaTrades({
      dcaPlans: [sampleDcaPlan],
      pendingTrades: [pending],
      now: toTz('2026-03-18').hour(10),
    });

    expect(result.generatedCount).toBe(0);
    expect(result.pendingTrades).toHaveLength(1);
    expect(result.dcaPlans[0].nextRunDate).toBe('2026-03-24');
  });

  it('creates a new dca plan with the selected start date as the first run', () => {
    const plan = createDcaPlan(
      {
        fundCode: sampleFund.code,
        fundName: sampleFund.name,
        amount: 300,
        feeRate: 0.12,
        frequency: 'daily',
        timeSlot: 'before_3pm',
        startDate: '2026-03-20',
        active: true,
      },
      toTz('2026-03-18').hour(10),
    );

    expect(plan.startDate).toBe('2026-03-20');
    expect(plan.nextRunDate).toBe('2026-03-20');
  });
});
