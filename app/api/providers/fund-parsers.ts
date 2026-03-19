import type {
  FundHolding,
  FundSearchResult,
  TencentQuoteData,
  TrendPoint,
} from '@/app/types';

export interface SearchApiItem extends FundSearchResult {
  CATEGORY?: number | string;
  CATEGORYDESC?: string;
}

export interface SearchApiResponse {
  Datas?: SearchApiItem[];
}

export function extractFundNetValueFromHtml(
  content: string,
  date: string,
): number | null {
  if (!content || content.includes('暂无数据')) return null;

  const rows = content.split('<tr>');
  for (const row of rows) {
    if (!row.includes(`<td>${date}</td>`)) continue;

    const cells = row.match(/<td[^>]*>(.*?)<\/td>/g);
    if (!cells || cells.length < 2) continue;

    const value = Number.parseFloat(cells[1].replace(/<[^>]+>/g, ''));
    return Number.isNaN(value) ? null : value;
  }

  return null;
}

export function parseSearchResults(
  response: SearchApiResponse,
): FundSearchResult[] {
  if (!response?.Datas) return [];

  return response.Datas.filter(
    (item) =>
      item.CATEGORY === 700 ||
      item.CATEGORY === '700' ||
      item.CATEGORYDESC === '鍩洪噾',
  );
}

export function parseTencentFundQuote(
  rawValue?: string,
): TencentQuoteData | null {
  if (!rawValue || rawValue.length <= 5) return null;

  const parts = rawValue.split('~');
  return {
    dwjz: parts[5],
    zzl: Number.parseFloat(parts[7]),
    jzrq: parts[8] ? parts[8].slice(0, 10) : '',
  };
}

export function parseShanghaiIndexDate(rawValue?: string): string | null {
  if (!rawValue) return null;

  const parts = rawValue.split('~');
  if (parts.length <= 30) return null;

  return parts[30].slice(0, 8);
}

export function parseFundHoldingsHtml(html: string): FundHolding[] {
  const headerRow =
    (html.match(/<thead[\s\S]*?<tr[\s\S]*?<\/tr>[\s\S]*?<\/thead>/i) ||
      [])[0] || '';
  const headerCells = (
    headerRow.match(/<th[\s\S]*?>([\s\S]*?)<\/th>/gi) || []
  ).map((header) => header.replace(/<[^>]*>/g, '').trim());

  let codeIndex = -1;
  let nameIndex = -1;
  let weightIndex = -1;

  headerCells.forEach((header, index) => {
    const text = header.replace(/\s+/g, '');
    if (
      codeIndex < 0 &&
      (text.includes('股票代码') || text.includes('证券代码'))
    ) {
      codeIndex = index;
    }
    if (
      nameIndex < 0 &&
      (text.includes('股票名称') || text.includes('证券名称'))
    ) {
      nameIndex = index;
    }
    if (
      weightIndex < 0 &&
      (text.includes('占净值比重') || text.includes('占比'))
    ) {
      weightIndex = index;
    }
  });

  const rows = html.match(/<tbody[\s\S]*?<\/tbody>/i) || [];
  const dataRows: string[] = rows.length
    ? rows[0].match(/<tr[\s\S]*?<\/tr>/gi) || []
    : html.match(/<tr[\s\S]*?<\/tr>/gi) || [];

  const holdings: FundHolding[] = [];

  for (const row of dataRows) {
    const cells = (row.match(/<td[\s\S]*?>([\s\S]*?)<\/td>/gi) || []).map(
      (cell) => cell.replace(/<[^>]*>/g, '').trim(),
    );
    if (!cells.length) continue;

    let code = '';
    let name = '';
    let weight = '';

    if (codeIndex >= 0 && cells[codeIndex]) {
      const match = cells[codeIndex].match(/(\d{6})/);
      code = match ? match[1] : cells[codeIndex];
    } else {
      const fallbackIndex = cells.findIndex((text) => /^\d{6}$/.test(text));
      if (fallbackIndex >= 0) code = cells[fallbackIndex];
    }

    if (nameIndex >= 0 && cells[nameIndex]) {
      name = cells[nameIndex];
    } else if (code) {
      const fallbackIndex = cells.findIndex(
        (text) => text && text !== code && !/%$/.test(text),
      );
      name = fallbackIndex >= 0 ? cells[fallbackIndex] : '';
    }

    if (weightIndex >= 0 && cells[weightIndex]) {
      const match = cells[weightIndex].match(/([\d.]+)\s*%/);
      weight = match ? `${match[1]}%` : cells[weightIndex];
    } else {
      const fallbackIndex = cells.findIndex((text) =>
        /\d+(?:\.\d+)?\s*%/.test(text),
      );
      if (fallbackIndex >= 0) {
        const match = cells[fallbackIndex].match(/([\d.]+)\s*%/);
        weight = match ? `${match[1]}%` : '';
      }
    }

    if (code || name || weight) {
      holdings.push({ code, name, weight, change: null });
    }
  }

  return holdings.slice(0, 10);
}

export function parseTrendSummary(trend: TrendPoint[]) {
  if (!Array.isArray(trend) || trend.length === 0) {
    return {
      historyTrend: [] as TrendPoint[],
      yesterdayChange: null as number | null,
    };
  }

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
}

