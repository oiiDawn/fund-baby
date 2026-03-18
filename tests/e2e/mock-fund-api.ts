import type { Page } from '@playwright/test';

const sampleFund = {
  code: '004253',
  name: '测试新能源基金',
  dwjz: '1.2345',
  gsz: '1.2500',
  gszzl: '1.20',
  jzrq: '2026-03-17',
  gztime: '2026-03-18 14:30',
};

const secondaryFund = {
  code: '110022',
  name: '测试消费基金',
  dwjz: '1.1000',
  gsz: '1.0900',
  gszzl: '-0.60',
  jzrq: '2026-03-17',
  gztime: '2026-03-18 14:30',
};

const holdingsTable = `
<table>
  <thead>
    <tr>
      <th>股票代码</th>
      <th>股票名称</th>
      <th>占净值比重</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>300750</td><td>宁德时代</td><td>9.80%</td></tr>
    <tr><td>002594</td><td>比亚迪</td><td>8.10%</td></tr>
  </tbody>
</table>`;

const buildQuote = (name: string, dwjz: string, zzl: string, date: string) =>
  `0~${name}~0~0~0~${dwjz}~0~${zzl}~${date}~`;

const buildSearchResponse = (callback: string) =>
  `${callback}(${JSON.stringify({
    Datas: [
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
    ],
  })});`;

const buildTrendResponse = () =>
  `var Data_netWorthTrend = ${JSON.stringify([
    { x: 1710633600000, y: 1.2, equityReturn: 0.2 },
    { x: 1710720000000, y: 1.22, equityReturn: 0.8 },
    { x: 1710806400000, y: 1.24, equityReturn: 1.1 },
  ])};`;

const buildShanghaiQuote = () => {
  const parts = new Array(31).fill('0');
  parts[1] = '上证指数';
  parts[30] = '20260318150000';
  return `var v_sh000001="${parts.join('~')}";`;
};

export const seedLocalStorage = (page: Page) =>
  page.addInitScript(() => {
    const funds = [
      {
        code: '004253',
        name: '测试新能源基金',
        dwjz: '1.2345',
        gsz: 1.25,
        gztime: '2026-03-18 14:30',
        jzrq: '2026-03-17',
        gszzl: 1.2,
        zzl: 0.8,
        holdings: [],
      },
    ];
    localStorage.setItem('funds', JSON.stringify(funds));
    localStorage.setItem('favorites', '[]');
    localStorage.setItem('groups', '[]');
    localStorage.setItem('collapsedCodes', '[]');
    localStorage.setItem('pendingTrades', '[]');
    localStorage.setItem('holdings', '{}');
    localStorage.setItem('refreshMs', '30000');
    localStorage.setItem('viewMode', 'card');
  });

export const mockFundApi = async (page: Page) => {
  await page.route('https://fundsuggest.eastmoney.com/**', async (route) => {
    const url = new URL(route.request().url());
    const callback = url.searchParams.get('callback') || 'callback';
    await route.fulfill({
      contentType: 'application/javascript',
      body: buildSearchResponse(callback),
    });
  });

  await page.route('https://fundgz.1234567.com.cn/**', async (route) => {
    const url = route.request().url();
    const code = url.includes(secondaryFund.code)
      ? secondaryFund.code
      : sampleFund.code;
    const fund = code === secondaryFund.code ? secondaryFund : sampleFund;
    await route.fulfill({
      contentType: 'application/javascript',
      body: `jsonpgz(${JSON.stringify({
        fundcode: fund.code,
        name: fund.name,
        dwjz: fund.dwjz,
        gsz: fund.gsz,
        gztime: fund.gztime,
        jzrq: fund.jzrq,
        gszzl: fund.gszzl,
      })});`,
    });
  });

  await page.route('https://qt.gtimg.cn/**', async (route) => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get('q') || '';

    if (query === 'sh000001') {
      await route.fulfill({
        contentType: 'application/javascript',
        body: buildShanghaiQuote(),
      });
      return;
    }

    if (query.startsWith('jj')) {
      const code = query.replace('jj', '');
      const fund = code === secondaryFund.code ? secondaryFund : sampleFund;
      await route.fulfill({
        contentType: 'application/javascript',
        body: `var v_jj${code}="${buildQuote(fund.name, fund.dwjz, fund.gszzl, `${fund.jzrq} 15:00:00`)}";`,
      });
      return;
    }

    await route.fulfill({
      contentType: 'application/javascript',
      body: 'var v_s_sz300750="0~宁德时代~0~0~0~2.31"; var v_s_sz002594="0~比亚迪~0~0~0~-1.10";',
    });
  });

  await page.route(
    'https://fundf10.eastmoney.com/FundArchivesDatas.aspx**',
    async (route) => {
      await route.fulfill({
        contentType: 'application/javascript',
        body: `var apidata = { content: ${JSON.stringify(holdingsTable)} };`,
      });
    },
  );

  await page.route(
    'https://fundf10.eastmoney.com/F10DataApi.aspx**',
    async (route) => {
      const url = new URL(route.request().url());
      const date = url.searchParams.get('sdate') || '2026-03-18';
      await route.fulfill({
        contentType: 'application/javascript',
        body: `var apidata = { content: ${JSON.stringify(`<table><tr><td>${date}</td><td>1.2500</td></tr></table>`)} };`,
      });
    },
  );

  await page.route(
    'https://fund.eastmoney.com/pingzhongdata/**',
    async (route) => {
      await route.fulfill({
        contentType: 'application/javascript',
        body: buildTrendResponse(),
      });
    },
  );

  await page.route(
    'https://web.ifzq.gtimg.cn/fund/newfund/fundSsgz/getSsgz**',
    async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          data: {
            yesterdayDwjz: '1.2000',
            data: [
              ['0930', 1.21, 0.52],
              ['1030', 1.23, 2.18],
              ['1430', 1.25, 3.84],
            ],
          },
        }),
      });
    },
  );
};
