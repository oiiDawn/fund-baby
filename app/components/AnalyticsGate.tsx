'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

interface AnalyticsGateProps {
  GA_ID: string;
}

export default function AnalyticsGate({ GA_ID }: AnalyticsGateProps) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    try {
      const href = window.location.href || '';
      setEnabled(href.includes('zhengshengning'));
    } catch {}
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
