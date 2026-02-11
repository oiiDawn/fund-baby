import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ success: false, msg: 'Code is required' }, { status: 400 });
  }

  try {
    // 1. 获取 CSRF Token 和 Cookie
    const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';
    
    const homeRes = await fetch('https://www.fund123.cn/fund', {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Upgrade-Insecure-Requests': '1',
        'Connection': 'keep-alive'
      }
    });

    if (!homeRes.ok) {
        return NextResponse.json({ success: false, msg: `Failed to access home page: ${homeRes.status}` });
    }
    
    const homeHtml = await homeRes.text();
    const cookie = homeRes.headers.get('set-cookie') || '';
    
    // 提取 CSRF Token
    let csrfToken = '';
    // 优先匹配 "csrf":"..." (最准确)
    const matchJson = homeHtml.match(/"csrf":"(.*?)"/);
    if (matchJson) {
      csrfToken = matchJson[1];
    } else {
      const matchMeta = homeHtml.match(/<meta\s+name="csrf-token"\s+content="(.*?)"/i);
      if (matchMeta) {
        csrfToken = matchMeta[1];
      } else {
          const matchScript = homeHtml.match(/csrf\s*[:=]\s*['"](.*?)['"]/i);
          if (matchScript) csrfToken = matchScript[1];
      }
    }

    // 2. 获取 Fund Key (productId)
    const searchUrl = `https://www.fund123.cn/api/fund/searchFund?_csrf=${encodeURIComponent(csrfToken || '')}`;
    const headers = {
        'Content-Type': 'application/json',
        'Cookie': cookie,
        'X-API-Key': 'foobar',
        'Origin': 'https://www.fund123.cn',
        'Referer': 'https://www.fund123.cn/fund',
        'User-Agent': UA,
        'Accept': 'json',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Connection': 'keep-alive'
    };

    const searchRes = await fetch(searchUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ fundCode: code })
    });

    let fundKey = code;
    if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.success && searchData.fundInfo && searchData.fundInfo.key) {
            fundKey = searchData.fundInfo.key;
        }
    }

    // 3. 请求 Intraday API
    // 获取当前北京时间
    const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Shanghai"}));
    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
    
    const apiUrl = `https://www.fund123.cn/api/fund/queryFundEstimateIntraday?_csrf=${encodeURIComponent(csrfToken || '')}`;
    
    const apiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        startTime: today,
        endTime: tomorrow,
        limit: 200,
        productId: fundKey, // 使用获取到的 Key
        format: true,
        source: 'WEALTHBFFWEB'
      })
    });

    if (!apiRes.ok) {
        return NextResponse.json({ success: false, msg: `API error: ${apiRes.status}` });
    }

    const data = await apiRes.json();
    
    // 格式化数据以匹配前端需求
    if (data.success && data.list) {
        const results = data.list.map(item => {
            const date = new Date(item.time);
            // 转换为北京时间字符串 HH:mm
            const timeStr = date.toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit',
                timeZone: 'Asia/Shanghai' 
            });
            return {
                time: timeStr,
                timestamp: item.time,
                value: parseFloat(item.forecastNetValue),
                growth: (parseFloat(item.forecastGrowth) * 100).toFixed(2)
            };
        });
        return NextResponse.json({ success: true, data: results });
    }

    return NextResponse.json({ success: false, msg: 'No data or API failure', raw: data });
    
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}