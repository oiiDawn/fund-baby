'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { EyeIcon, EyeOffIcon, PinIcon, PinOffIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type {
  FundData,
  Holding,
  HoldingProfit,
  HoldingsMap,
} from '@/app/types';

interface CountUpProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  style?: CSSProperties;
}

interface SummaryMetricProps {
  label: ReactNode;
  value: number;
  isMasked: boolean;
  metricSize: number;
  valueSuffix?: string;
  onValueClick?: () => void;
  valueTitle?: string;
}

function getSignedToneClass(value: number): string {
  if (value > 0) return 'text-up';
  if (value < 0) return 'text-down';
  return 'text-foreground';
}

function getSignedPrefix(value: number): string {
  if (value > 0) return '+';
  if (value < 0) return '-';
  return '';
}

function CountUp({
  value,
  prefix = '',
  suffix = '',
  decimals = 2,
  className = '',
  style = {},
}: CountUpProps): ReactNode {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    if (previousValue.current === value) return;

    const start = previousValue.current;
    const end = value;
    const duration = 600;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      const current = start + (end - start) * ease;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousValue.current = value;
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span className={className} style={style}>
      {prefix}
      {Math.abs(displayValue).toFixed(decimals)}
      {suffix}
    </span>
  );
}

function SummaryMetric({
  label,
  value,
  isMasked,
  metricSize,
  valueSuffix,
  onValueClick,
  valueTitle,
}: SummaryMetricProps): ReactNode {
  const content = isMasked ? (
    '******'
  ) : (
    <span className="font-mono font-semibold tracking-[0.02em]">
      <span>{getSignedPrefix(value)}</span>
      <CountUp
        value={Math.abs(value)}
        suffix={valueSuffix}
        className="font-mono [font-variant-numeric:tabular-nums]"
        style={{ fontSize: metricSize }}
      />
    </span>
  );

  return (
    <div
      className={cn(
        'flex min-w-36 flex-1 flex-col gap-1 rounded-2xl border border-border/70 bg-background/50 px-3.5 py-3',
        onValueClick && 'cursor-pointer',
      )}
      onClick={onValueClick}
      title={valueTitle}
      role={onValueClick ? 'button' : undefined}
      tabIndex={onValueClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onValueClick) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onValueClick();
        }
      }}
    >
      <span className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
      <div className={cn('leading-none', getSignedToneClass(value))}>
        {content}
      </div>
    </div>
  );
}

interface GroupSummaryProps {
  funds: FundData[];
  holdings: HoldingsMap;
  title: string;
  getProfit: (
    fund: FundData,
    holding: Holding | undefined,
  ) => HoldingProfit | null;
}

export function GroupSummary({
  funds,
  holdings,
  title,
  getProfit,
}: GroupSummaryProps): ReactNode {
  const [showPercent, setShowPercent] = useState(true);
  const [isMasked, setIsMasked] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [assetSize, setAssetSize] = useState(30);
  const [metricSize, setMetricSize] = useState(18);

  const summary = useMemo(() => {
    let totalAsset = 0;
    let totalProfitToday = 0;
    let totalHoldingReturn = 0;
    let totalCost = 0;
    let hasHolding = false;

    funds.forEach((fund) => {
      const holding = holdings[fund.code];
      const profit = getProfit(fund, holding);

      if (!profit) return;

      hasHolding = true;
      totalAsset += profit.amount;
      totalProfitToday += profit.profitToday;

      if (profit.profitTotal !== null) {
        totalHoldingReturn += profit.profitTotal;

        if (
          holding &&
          typeof holding.cost === 'number' &&
          typeof holding.share === 'number'
        ) {
          totalCost += holding.cost * holding.share;
        }
      }
    });

    return {
      totalAsset,
      totalProfitToday,
      totalHoldingReturn,
      hasHolding,
      returnRate: totalCost > 0 ? (totalHoldingReturn / totalCost) * 100 : 0,
    };
  }, [funds, holdings, getProfit]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const compact = window.innerWidth < 768;
    setAssetSize(compact ? 24 : 30);
    setMetricSize(compact ? 16 : 18);
  }, []);

  if (!summary.hasHolding) return null;

  return (
    <div className={isSticky ? 'sticky top-4 z-40' : ''}>
      <Card className="ui-panel-accent border-border bg-card/95 shadow-panel">
        <CardContent className="grid gap-4 px-4 py-4 sm:px-5 sm:py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold tracking-widest text-muted-foreground">
                  {title}
                </span>
              </div>
              <div className="mt-2 flex items-end gap-1 font-mono font-bold tracking-[0.03em]">
                <span className="mb-1 text-base">¥</span>
                {isMasked ? (
                  <span
                    style={{ fontSize: assetSize }}
                    className="relative top-0.5"
                  >
                    ******
                  </span>
                ) : (
                  <CountUp
                    value={summary.totalAsset}
                    style={{ fontSize: assetSize }}
                  />
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsMasked((value) => !value)}
                aria-label={isMasked ? '显示资产' : '隐藏资产'}
              >
                {isMasked ? <EyeOffIcon /> : <EyeIcon />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsSticky((value) => !value)}
                aria-label={isSticky ? '取消置顶' : '置顶摘要'}
              >
                {isSticky ? <PinOffIcon /> : <PinIcon />}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <SummaryMetric
              label="当日收益"
              value={summary.totalProfitToday}
              isMasked={isMasked}
              metricSize={metricSize}
            />
            <SummaryMetric
              label="持有收益"
              value={
                showPercent ? summary.returnRate : summary.totalHoldingReturn
              }
              isMasked={isMasked}
              metricSize={metricSize}
              valueSuffix={showPercent ? '%' : undefined}
              onValueClick={() => setShowPercent((value) => !value)}
              valueTitle="点击切换收益率/收益额"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
