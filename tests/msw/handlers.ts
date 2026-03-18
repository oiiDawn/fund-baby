import { http, HttpResponse } from 'msw';

import { sampleIntraday } from '@/tests/fixtures/funds/sample-data';

export const handlers = [
  http.get('https://web.ifzq.gtimg.cn/fund/newfund/fundSsgz/getSsgz', () =>
    HttpResponse.json({
      code: 0,
      data: {
        yesterdayDwjz: '1.2000',
        data: sampleIntraday.map((point) => [
          point.time.replace(':', ''),
          point.value,
          Number(point.growth),
        ]),
      },
    }),
  ),
];
