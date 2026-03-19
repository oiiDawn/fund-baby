import { describe, expect, it } from 'vitest';

import {
  extractFundNetValueFromHtml,
  parseFundHoldingsHtml,
  parseSearchResults,
  parseShanghaiIndexDate,
  parseTencentFundQuote,
} from '@/app/api/providers/fund-parsers';

describe('fund api parsers', () => {
  it('extracts a fund net value from eastmoney html', () => {
    const html =
      '<table><tr><td>2026-03-18</td><td>1.2345</td></tr><tr><td>2026-03-17</td><td>1.2200</td></tr></table>';

    expect(extractFundNetValueFromHtml(html, '2026-03-18')).toBe(1.2345);
    expect(extractFundNetValueFromHtml(html, '2026-03-16')).toBeNull();
  });

  it('filters search results down to fund entries', () => {
    const results = parseSearchResults({
      Datas: [
        { CODE: '004253', NAME: '测试基金', CATEGORY: 700 },
        { CODE: '600000', NAME: '测试股票', CATEGORY: 100 },
      ],
    });

    expect(results).toEqual([
      { CODE: '004253', NAME: '测试基金', CATEGORY: 700 },
    ]);
  });

  it('parses tencent quote and shanghai index payloads', () => {
    expect(
      parseTencentFundQuote(
        'v_jj004253="~测试基金~x~x~x~1.2345~x~1.23~2026-03-18~"',
      ),
    ).toEqual({
      dwjz: '1.2345',
      zzl: 1.23,
      jzrq: '2026-03-18',
    });

    expect(
      parseShanghaiIndexDate(
        'x~x~x~x~x~x~x~x~x~x~x~x~x~x~x~x~x~x~x~x~x~x~x~x~x~x~x~x~x~x~20260318xxxx',
      ),
    ).toBe('20260318');
  });

  it('parses holdings rows from eastmoney archive html', () => {
    const html = `
      <table>
        <thead>
          <tr>
            <th>股票代码</th>
            <th>股票名称</th>
            <th>占净值比重</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>300750</td>
            <td>宁德时代</td>
            <td>9.80%</td>
          </tr>
        </tbody>
      </table>
    `;

    expect(parseFundHoldingsHtml(html)).toEqual([
      {
        code: '300750',
        name: '宁德时代',
        weight: '9.80%',
        change: null,
      },
    ]);
  });
});


