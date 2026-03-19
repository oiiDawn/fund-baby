import type {
  FundData,
  FundSearchResult,
  Holding,
  IntradayPoint,
  PendingTrade,
} from '@/app/types';
import type { FundSnapshot } from '@/app/features/fund-dashboard/types';

export const sampleFund: FundData = {
  code: '004253',
  name: '测试新能源基金',
  dwjz: '1.2345',
  gsz: 1.25,
  gztime: '2026-03-18 14:30',
  jzrq: '2026-03-17',
  gszzl: 1.2,
  zzl: 0.8,
  estPricedCoverage: 0.12,
  estGsz: 1.26,
  estGszzl: 1.6,
  holdings: [
    { code: '300750', name: '宁德时代', weight: '9.80%', change: 2.31 },
    { code: '002594', name: '比亚迪', weight: '8.10%', change: -1.1 },
  ],
  historyTrend: [
    { x: 1710633600000, y: 1.2, equityReturn: 0.2 },
    { x: 1710720000000, y: 1.22, equityReturn: 0.8 },
  ],
  yesterdayChange: 0.8,
};

export const secondaryFund: FundData = {
  ...sampleFund,
  code: '110022',
  name: '测试消费基金',
  gszzl: -0.6,
  estGszzl: -0.9,
};

export const sampleHolding: Holding = {
  share: 100,
  cost: 1.1,
};

export const samplePendingBuyTrade: PendingTrade = {
  id: 'pending-buy-1',
  fundCode: sampleFund.code,
  fundName: sampleFund.name,
  type: 'buy',
  share: null,
  amount: 1000,
  feeRate: 0.12,
  date: '2026-03-17',
  isAfter3pm: false,
};

export const samplePendingSellTrade: PendingTrade = {
  id: 'pending-sell-1',
  fundCode: sampleFund.code,
  fundName: sampleFund.name,
  type: 'sell',
  share: 20,
  date: '2026-03-17',
  isAfter3pm: false,
};

export const sampleSearchResults: FundSearchResult[] = [
  {
    CODE: sampleFund.code,
    NAME: sampleFund.name,
    TYPE: '股票型',
    CATEGORY: 700,
  },
  {
    CODE: secondaryFund.code,
    NAME: secondaryFund.name,
    TYPE: '混合型',
    CATEGORY: 700,
  },
];

export const sampleIntraday: IntradayPoint[] = [
  { time: '09:30', value: 1.21, growth: '0.52' },
  { time: '10:30', value: 1.23, growth: '2.18' },
  { time: '14:30', value: 1.25, growth: '3.84' },
];

export const buildSampleSnapshot = (
  overrides: Partial<FundSnapshot> = {},
): FundSnapshot => ({
  version: 1,
  funds: [sampleFund],
  collapsedCodes: [],
  refreshMs: 30000,
  holdings: {
    [sampleFund.code]: {
      share: sampleHolding.share,
      cost: sampleHolding.cost,
    },
  },
  pendingTrades: [samplePendingBuyTrade],
  viewMode: 'card',
  exportedAt: '2026-03-18T10:00:00.000Z',
  ...overrides,
});
