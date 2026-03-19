import { nowInTz, toTz } from '@/app/lib/date';
import type { FundData, JsonpGzData, TencentQuoteData } from '@/app/types';
import { loadBrowserScript } from '@/app/features/fund-dashboard/api/providers/browser-script';
import {
  fetchEastMoneyFundHoldings,
  fetchEastMoneyFundNetValue,
  fetchEastMoneyFundTrend,
  fetchEastMoneySearchResults,
  fetchEastMoneyValuation,
  searchEastMoneyFundName,
} from '@/app/features/fund-dashboard/api/providers/eastmoney-provider';
import {
  fetchIntradayDataFromTencent,
  fetchShanghaiIndexDateFromTencent,
  fetchTencentFundQuote,
} from '@/app/features/fund-dashboard/api/providers/tencent-provider';

export const loadScript = loadBrowserScript;
export const fetchFundNetValue = fetchEastMoneyFundNetValue;
export const searchFunds = fetchEastMoneySearchResults;
export const fetchShanghaiIndexDate = fetchShanghaiIndexDateFromTencent;
export const fetchIntradayData = fetchIntradayDataFromTencent;

export const fetchSmartFundNetValue = async (
  code: string,
  startDate: string,
): Promise<{ date: string; value: number } | null> => {
  const today = nowInTz().startOf('day');
  let current = toTz(startDate).startOf('day');

  for (let index = 0; index < 30; index += 1) {
    if (current.isAfter(today)) break;

    const date = current.format('YYYY-MM-DD');
    const value = await fetchFundNetValue(code, date);
    if (value !== null) {
      return { date, value };
    }

    current = current.add(1, 'day');
  }

  return null;
};

export const fetchFundDataFallback = async (
  code: string,
): Promise<FundData> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('无浏览器环境');
  }

  const fundName = await searchEastMoneyFundName(code);
  const quote = await fetchTencentFundQuote(code);

  if (!quote?.dwjz) {
    throw new Error('未能获取到基金数据');
  }

  return {
    code,
    name: fundName || `未知基金(${code})`,
    dwjz: quote.dwjz,
    gsz: null,
    gztime: null,
    jzrq: quote.jzrq,
    gszzl: null,
    zzl: Number.isNaN(quote.zzl) ? null : quote.zzl,
    noValuation: true,
    holdings: [],
  };
};

function createFundDraft(valuation: JsonpGzData): Partial<FundData> {
  const gszzlValue = Number(valuation.gszzl);

  return {
    code: valuation.fundcode,
    name: valuation.name,
    dwjz: valuation.dwjz,
    gsz: valuation.gsz,
    gztime: valuation.gztime,
    jzrq: valuation.jzrq,
    gszzl: Number.isFinite(gszzlValue) ? gszzlValue : valuation.gszzl,
  };
}

function mergeTencentQuote(
  fundDraft: Partial<FundData>,
  quote: TencentQuoteData | null,
) {
  if (!quote) return fundDraft;

  const nextDraft = { ...fundDraft };
  if (quote.jzrq && (!nextDraft.jzrq || quote.jzrq >= nextDraft.jzrq)) {
    nextDraft.dwjz = quote.dwjz;
    nextDraft.jzrq = quote.jzrq;
    nextDraft.zzl = quote.zzl;
  }

  return nextDraft;
}

export const fetchFundData = async (code: string): Promise<FundData> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('无浏览器环境');
  }

  const valuation = await fetchEastMoneyValuation(code).catch(() => null);
  if (!valuation) {
    return fetchFundDataFallback(code);
  }

  const fundDraft = createFundDraft(valuation);
  const [quote, holdings, trend] = await Promise.all([
    fetchTencentFundQuote(code),
    fetchEastMoneyFundHoldings(code),
    fetchEastMoneyFundTrend(code),
  ]);

  return {
    ...(mergeTencentQuote(fundDraft, quote) as FundData),
    holdings,
    historyTrend: trend.historyTrend,
    yesterdayChange: trend.yesterdayChange,
  };
};
