import type {
  FundHolding,
  FundSearchResult,
  JsonpGzData,
  TrendPoint,
} from '@/app/types';
import { loadBrowserScript } from '@/app/features/fund-dashboard/api/providers/browser-script';
import {
  extractFundNetValueFromHtml,
  parseFundHoldingsHtml,
  parseSearchResults,
  type SearchApiResponse,
} from '@/app/features/fund-dashboard/api/providers/fund-parsers';
import { enrichHoldingsWithTencentQuotes } from '@/app/features/fund-dashboard/api/providers/tencent-provider';

export async function fetchEastMoneyFundNetValue(
  code: string,
  date: string,
): Promise<number | null> {
  if (typeof window === 'undefined') return null;

  const url = `https://fundf10.eastmoney.com/F10DataApi.aspx?type=lsjz&code=${code}&page=1&per=1&sdate=${date}&edate=${date}`;
  try {
    await loadBrowserScript(url);
    const content = window.apidata?.content || '';
    return extractFundNetValueFromHtml(content, date);
  } catch {
    return null;
  }
}

export async function fetchEastMoneyValuation(
  code: string,
): Promise<JsonpGzData | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://fundgz.1234567.com.cn/js/${code}.js?rt=${Date.now()}`;
    const originalJsonpgz = window.jsonpgz;

    window.jsonpgz = (json: JsonpGzData) => {
      window.jsonpgz = originalJsonpgz;
      if (!json || typeof json !== 'object') {
        resolve(null);
        return;
      }

      resolve(json);
    };

    script.onerror = () => {
      window.jsonpgz = originalJsonpgz;
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      reject(new Error('鍩洪噾数据加载失败'));
    };

    document.body.appendChild(script);
    setTimeout(() => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    }, 5000);
  });
}

export async function fetchEastMoneySearchResults(
  value: string,
): Promise<FundSearchResult[]> {
  if (!value.trim()) return [];
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return [];
  }

  const callbackName = `SuggestData_${Date.now()}`;
  const url = `https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?m=1&key=${encodeURIComponent(value)}&callback=${callbackName}&_=${Date.now()}`;

  return new Promise((resolve, reject) => {
    (window as Record<string, unknown>)[callbackName] = (
      data: SearchApiResponse,
    ) => {
      delete (window as Record<string, unknown>)[callbackName];
      resolve(parseSearchResults(data));
    };

    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
    script.onerror = () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      delete (window as Record<string, unknown>)[callbackName];
      reject(new Error('鎼滅储璇锋眰澶辫触'));
    };
    document.body.appendChild(script);
  });
}

export async function searchEastMoneyFundName(code: string): Promise<string> {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return '';
  }

  const callbackName = `SuggestData_fallback_${Date.now()}`;
  const url = `https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?m=1&key=${encodeURIComponent(code)}&callback=${callbackName}&_=${Date.now()}`;

  return new Promise((resolve) => {
    (window as Record<string, unknown>)[callbackName] = (
      data: SearchApiResponse,
    ) => {
      const matched = data?.Datas?.find((item) => item.CODE === code);
      delete (window as Record<string, unknown>)[callbackName];
      resolve(matched?.NAME || matched?.SHORTNAME || '');
    };

    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
    script.onerror = () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      delete (window as Record<string, unknown>)[callbackName];
      resolve('');
    };
    document.body.appendChild(script);

    setTimeout(() => {
      if ((window as Record<string, unknown>)[callbackName]) {
        delete (window as Record<string, unknown>)[callbackName];
        resolve('');
      }
    }, 3000);
  });
}

export async function fetchEastMoneyFundHoldings(
  code: string,
): Promise<FundHolding[]> {
  const holdingsUrl = `https://fundf10.eastmoney.com/FundArchivesDatas.aspx?type=jjcc&code=${code}&topline=10&year=&month=&_=${Date.now()}`;

  try {
    await loadBrowserScript(holdingsUrl);
    const html = window.apidata?.content || '';
    const holdings = parseFundHoldingsHtml(html);
    return enrichHoldingsWithTencentQuotes(holdings);
  } catch {
    return [];
  }
}

export async function fetchEastMoneyFundTrend(code: string): Promise<{
  historyTrend: TrendPoint[];
  yesterdayChange: number | null;
}> {
  try {
    const pingUrl = `https://fund.eastmoney.com/pingzhongdata/${code}.js?v=${Date.now()}`;
    await loadBrowserScript(pingUrl);

    const trend = Array.isArray(window.Data_netWorthTrend)
      ? window.Data_netWorthTrend
      : [];
    const historyTrend = trend.slice(-90).map((item) => ({
      x: item.x,
      y: item.y,
      equityReturn: item.equityReturn,
    }));
    const previousPoint = historyTrend[historyTrend.length - 2];

    return {
      historyTrend,
      yesterdayChange:
        previousPoint && typeof previousPoint.equityReturn === 'number'
          ? previousPoint.equityReturn
          : null,
    };
  } catch {
    return { historyTrend: [], yesterdayChange: null };
  }
}
