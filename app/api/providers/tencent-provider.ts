import type { FundHolding, IntradayPoint, TencentQuoteData } from '@/app/types';
import {
  parseShanghaiIndexDate,
  parseTencentFundQuote,
} from '@/app/api/providers/fund-parsers';

function getStockQuoteSymbol(code: string): string | null {
  if (/^\d{6}$/.test(code)) {
    const prefix =
      code.startsWith('6') || code.startsWith('9')
        ? 'sh'
        : code.startsWith('4') || code.startsWith('8')
          ? 'bj'
          : 'sz';
    return `s_${prefix}${code}`;
  }

  if (/^\d{5}$/.test(code)) {
    return `s_hk${code}`;
  }

  return null;
}

export async function fetchTencentFundQuote(
  code: string,
): Promise<TencentQuoteData | null> {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return null;
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `https://qt.gtimg.cn/q=jj${code}`;
    script.onload = () => {
      const rawValue = (window as Record<string, unknown>)[`v_jj${code}`] as
        | string
        | undefined;
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      resolve(parseTencentFundQuote(rawValue));
    };
    script.onerror = () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      resolve(null);
    };
    document.body.appendChild(script);
  });
}

export async function enrichHoldingsWithTencentQuotes(
  holdings: FundHolding[],
): Promise<FundHolding[]> {
  const needQuotes = holdings.filter(
    (holding) => /^\d{6}$/.test(holding.code) || /^\d{5}$/.test(holding.code),
  );

  if (!needQuotes.length || typeof document === 'undefined') {
    return holdings;
  }

  const symbols = needQuotes
    .map((holding) => getStockQuoteSymbol(String(holding.code || '')))
    .filter(Boolean)
    .join(',');

  if (!symbols) return holdings;

  await new Promise<void>((resolve) => {
    const script = document.createElement('script');
    script.src = `https://qt.gtimg.cn/q=${symbols}`;
    script.onload = () => {
      needQuotes.forEach((holding) => {
        const symbol = getStockQuoteSymbol(String(holding.code || ''));
        if (!symbol) return;

        const variableName = `v_${symbol}`;
        const dataString = (window as Record<string, unknown>)[variableName] as
          | string
          | undefined;
        if (!dataString) return;

        const parts = dataString.split('~');
        if (parts.length > 5) {
          holding.change = Number.parseFloat(parts[5]);
        }
      });

      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      resolve();
    };
    script.onerror = () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      resolve();
    };
    document.body.appendChild(script);
  });

  return holdings;
}

export async function fetchShanghaiIndexDateFromTencent(): Promise<
  string | null
> {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return null;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://qt.gtimg.cn/q=sh000001&_t=${Date.now()}`;
    script.onload = () => {
      const rawValue = (window as Record<string, unknown>).v_sh000001 as
        | string
        | undefined;
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      resolve(parseShanghaiIndexDate(rawValue));
    };
    script.onerror = () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      reject(new Error('鎸囨暟数据加载失败'));
    };
    document.body.appendChild(script);
  });
}

export async function fetchIntradayDataFromTencent(
  code: string,
): Promise<IntradayPoint[] | null> {
  try {
    const url = `https://web.ifzq.gtimg.cn/fund/newfund/fundSsgz/getSsgz?app=web&symbol=jj${code}&_=${Date.now()}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const result = await response.json();
    if (result.code !== 0 || !result.data || !Array.isArray(result.data.data)) {
      return null;
    }

    const { data: list, yesterdayDwjz } = result.data;
    const yesterdayValue = Number.parseFloat(yesterdayDwjz);
    if (!yesterdayValue) return null;

    return list.map((item: [string, number, number]) => {
      const timeStr = item[0];
      const value = Number(item[1]);

      return {
        time: `${timeStr.slice(0, 2)}:${timeStr.slice(2)}`,
        value,
        growth: (((value - yesterdayValue) / yesterdayValue) * 100).toFixed(2),
      };
    });
  } catch (error) {
    console.error('获取分时数据失败', code, error);
    return null;
  }
}
