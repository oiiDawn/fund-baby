import type { Dayjs } from 'dayjs';

import { nowInTz, toTz } from '@/app/lib/date';
import type {
  DcaFrequency,
  DcaPlan,
  DcaTimeSlot,
  PendingTrade,
} from '@/app/types';

const DCA_FREQUENCIES = ['daily', 'weekly', 'monthly'] as const;
const DCA_TIME_SLOTS = ['before_3pm', 'after_3pm'] as const;

export interface DcaPlanDraft {
  fundCode: string;
  fundName?: string;
  amount: number;
  feeRate: number;
  frequency: DcaFrequency;
  timeSlot: DcaTimeSlot;
  startDate: string;
  active: boolean;
}

interface MaterializeDueDcaTradesOptions {
  dcaPlans: DcaPlan[];
  pendingTrades: PendingTrade[];
  now?: Dayjs;
}

const isIsoDate = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

const normalizeNumber = (value: unknown) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
};

const normalizePositiveNumber = (value: unknown) => {
  const next = normalizeNumber(value);
  return next !== null && next > 0 ? next : null;
};

const normalizeTimestamp = (value: unknown, fallbackDate: string) =>
  typeof value === 'string' && value.length > 0
    ? value
    : toTz(fallbackDate).startOf('day').toISOString();

export const isDcaFrequency = (value: unknown): value is DcaFrequency =>
  typeof value === 'string' && DCA_FREQUENCIES.includes(value as DcaFrequency);

export const isDcaTimeSlot = (value: unknown): value is DcaTimeSlot =>
  typeof value === 'string' && DCA_TIME_SLOTS.includes(value as DcaTimeSlot);

export const createDcaPlanId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    return crypto.randomUUID();

  return `dca-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const getNextDcaRunDate = ({
  frequency,
  startDate,
  fromDate,
}: {
  frequency: DcaFrequency;
  startDate: string;
  fromDate: string;
}) => {
  const anchor = toTz(startDate).startOf('day');
  const current = toTz(fromDate).startOf('day');

  if (frequency === 'daily') return current.add(1, 'day').format('YYYY-MM-DD');
  if (frequency === 'weekly')
    return current.add(1, 'week').format('YYYY-MM-DD');

  const nextMonth = current.add(1, 'month').startOf('day');
  const targetDay = Math.min(anchor.date(), nextMonth.daysInMonth());
  return nextMonth.date(targetDay).format('YYYY-MM-DD');
};

export const getDcaEvaluationDate = ({
  timeSlot,
  now = nowInTz(),
}: {
  timeSlot: DcaTimeSlot;
  now?: Dayjs;
}) => {
  if (timeSlot === 'before_3pm') return now.format('YYYY-MM-DD');
  return now.hour() >= 15
    ? now.format('YYYY-MM-DD')
    : now.subtract(1, 'day').format('YYYY-MM-DD');
};

export const isDcaPlanDue = (plan: DcaPlan, now = nowInTz()) =>
  plan.active &&
  plan.nextRunDate <= getDcaEvaluationDate({ timeSlot: plan.timeSlot, now });

export const createDcaPlan = (
  draft: DcaPlanDraft,
  now = nowInTz(),
): DcaPlan => ({
  id: createDcaPlanId(),
  fundCode: draft.fundCode,
  fundName: draft.fundName,
  amount: Number(draft.amount),
  feeRate: Number(draft.feeRate) || 0,
  frequency: draft.frequency,
  timeSlot: draft.timeSlot,
  startDate: draft.startDate,
  nextRunDate: draft.startDate,
  active: draft.active,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
});

export const sanitizeDcaPlans = (
  fundCodes: Set<string>,
  input: unknown,
): DcaPlan[] => {
  if (!Array.isArray(input)) return [];

  return input.reduce<DcaPlan[]>((acc, item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return acc;

    const record = item as Record<string, unknown>;
    const id =
      typeof record.id === 'string' && record.id.length > 0 ? record.id : null;
    const fundCode =
      typeof record.fundCode === 'string' && fundCodes.has(record.fundCode)
        ? record.fundCode
        : null;
    const amount = normalizePositiveNumber(record.amount);
    const feeRate = normalizeNumber(record.feeRate);
    const startDate = isIsoDate(record.startDate) ? record.startDate : null;
    const nextRunDate = isIsoDate(record.nextRunDate)
      ? record.nextRunDate
      : startDate;

    if (
      !id ||
      !fundCode ||
      amount === null ||
      feeRate === null ||
      !startDate ||
      !nextRunDate ||
      !isDcaFrequency(record.frequency) ||
      !isDcaTimeSlot(record.timeSlot)
    ) {
      return acc;
    }

    acc.push({
      id,
      fundCode,
      fundName:
        typeof record.fundName === 'string' && record.fundName.length > 0
          ? record.fundName
          : undefined,
      amount,
      feeRate: Math.max(0, feeRate),
      frequency: record.frequency,
      timeSlot: record.timeSlot,
      startDate,
      nextRunDate,
      active: record.active !== false,
      createdAt: normalizeTimestamp(record.createdAt, startDate),
      updatedAt: normalizeTimestamp(record.updatedAt, nextRunDate),
    });

    return acc;
  }, []);
};

const hasPendingOccurrence = (
  pendingTrades: PendingTrade[],
  planId: string,
  runDate: string,
) =>
  pendingTrades.some(
    (trade) =>
      trade.type === 'buy' &&
      trade.sourcePlanId === planId &&
      trade.date === runDate,
  );

const createPendingTradeFromPlan = (
  plan: DcaPlan,
  runDate: string,
): PendingTrade => ({
  id: createDcaPlanId(),
  fundCode: plan.fundCode,
  fundName: plan.fundName,
  type: 'buy',
  share: null,
  amount: plan.amount,
  feeRate: plan.feeRate,
  date: runDate,
  isAfter3pm: plan.timeSlot === 'after_3pm',
  timestamp: Date.now(),
  sourceType: 'dca',
  sourcePlanId: plan.id,
});

export const materializeDueDcaTrades = ({
  dcaPlans,
  pendingTrades,
  now = nowInTz(),
}: MaterializeDueDcaTradesOptions) => {
  const nextPendingTrades = [...pendingTrades];
  const nextPlans = dcaPlans.map((plan) => ({ ...plan }));
  let generatedCount = 0;
  let advancedCount = 0;

  for (const plan of nextPlans) {
    if (!plan.active) continue;

    while (isDcaPlanDue(plan, now)) {
      const runDate = plan.nextRunDate;

      if (!hasPendingOccurrence(nextPendingTrades, plan.id, runDate)) {
        nextPendingTrades.push(createPendingTradeFromPlan(plan, runDate));
        generatedCount += 1;
      }

      plan.nextRunDate = getNextDcaRunDate({
        frequency: plan.frequency,
        startDate: plan.startDate,
        fromDate: runDate,
      });
      plan.updatedAt = now.toISOString();
      advancedCount += 1;
    }
  }

  return {
    dcaPlans: nextPlans,
    pendingTrades: nextPendingTrades,
    generatedCount,
    advancedCount,
    changed: generatedCount > 0 || advancedCount > 0,
  };
};

export const getDcaFrequencyLabel = (frequency: DcaFrequency) => {
  switch (frequency) {
    case 'daily':
      return '每日';
    case 'weekly':
      return '每周';
    case 'monthly':
      return '每月';
    default:
      return frequency;
  }
};

export const getDcaTimeSlotLabel = (timeSlot: DcaTimeSlot) =>
  timeSlot === 'before_3pm' ? '15:00 前' : '15:00 后';
