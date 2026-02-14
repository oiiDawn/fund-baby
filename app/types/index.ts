import type { SupabaseClient } from '@supabase/supabase-js';

// ── 基金持仓股票 ──
export interface FundHolding {
  code: string;
  name: string;
  weight: string;
  change: number | null;
}

// ── 历史净值趋势点 ──
export interface TrendPoint {
  x: number;
  y: number;
  equityReturn?: number;
  unitMoney?: string;
}

// ── 分时数据点 ──
export interface IntradayPoint {
  time: string;
  value: number;
  growth: string;
}

// ── 核心基金数据 ──
export interface FundData {
  code: string;
  name: string;
  dwjz: string | number;
  gsz: string | number | null;
  gztime?: string | null;
  jzrq?: string;
  gszzl: number | string | null;
  zzl?: number | null;
  noValuation?: boolean;
  holdings?: FundHolding[];
  historyTrend?: TrendPoint[];
  yesterdayChange?: number | null;
  time?: string;
  // 估值相关
  estPricedCoverage?: number;
  estGsz?: number;
  estGszzl?: number;
}

// ── 用户持仓 ──
export interface Holding {
  share: number;
  cost: number;
}

export type HoldingsMap = Record<string, Holding>;

// ── 待处理交易 ──
export interface PendingTrade {
  id: string;
  fundCode: string;
  fundName?: string;
  type: 'buy' | 'sell';
  share: number | null;
  amount?: number | null;
  feeRate?: number;
  feeMode?: string;
  feeValue?: string | number;
  date: string;
  isAfter3pm: boolean;
  timestamp?: number;
}

// ── 基金分组 ──
export interface FundGroup {
  id: string;
  name: string;
  codes: string[];
}

// ── 搜索结果 ──
export interface FundSearchResult {
  CODE: string;
  NAME: string;
  SHORTNAME?: string;
  TYPE?: string;
  CATEGORY?: number | string;
  CATEGORYDESC?: string;
}

// ── API 响应类型 ──
export interface JsonpGzData {
  fundcode: string;
  name: string;
  dwjz: string;
  gsz: string;
  gztime: string;
  jzrq: string;
  gszzl: string;
}

export interface TencentQuoteData {
  dwjz: string;
  zzl: number;
  jzrq: string;
}

// ── 云同步数据结构 ──
export interface CloudSyncPayload {
  funds: FundData[];
  favorites: string[];
  groups: FundGroup[];
  collapsedCodes: string[];
  refreshMs: number;
  holdings: HoldingsMap;
  pendingTrades: PendingTrade[];
  viewMode: ViewMode;
  exportedAt: string;
}

// ── UI 状态类型 ──
export type ViewMode = 'card' | 'list';
export type SortBy = 'default' | 'name' | 'yield' | 'holding';
export type SortOrder = 'asc' | 'desc';
export type TradeType = 'buy' | 'sell';
export type FeeMode = 'rate' | 'amount';
export type ToastType = 'info' | 'success' | 'error';

// ── 持仓收益计算结果 ──
export interface HoldingProfit {
  amount: number;
  profitToday: number | null;
  profitTotal: number | null;
}

// ── Window 全局声明 (JSONP 回调) ──
declare global {
  interface Window {
    jsonpgz?: (json: JsonpGzData) => void;
    apidata?: { content: string };
    Data_netWorthTrend?: TrendPoint[];
    [key: string]: unknown;
  }
}
