'use client';

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from 'react';

import {
  EyeIcon,
  EyeOffIcon,
  PinIcon,
  PinOffIcon,
} from '@/app/components/icons';
import { cn } from '@/app/lib/cn';
import {
  iconButtonClass,
  panelClass,
  upTextClass,
  downTextClass,
} from '@/app/lib/ui';
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
  if (value > 0) return upTextClass;
  if (value < 0) return downTextClass;
  return '';
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
  const metricValueClass = cn(
    'inline-flex min-h-[28px] w-full items-baseline justify-start gap-0.5 bg-transparent p-0 text-left sm:justify-end sm:text-right',
    metricSize <= 14 && 'gap-0',
    getSignedToneClass(value),
    onValueClick && 'cursor-pointer',
  );

  const metricValue = isMasked ? (
    '******'
  ) : (
    <span className="font-mono font-bold tracking-[0.02em] [font-variant-numeric:tabular-nums]">
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
    <div className="flex flex-col items-start sm:items-end">
      <div className="mb-1 flex min-h-5 w-full items-center text-xs leading-5 text-muted">
        <span>{label}</span>
      </div>
      {onValueClick ? (
        <div
          className={metricValueClass}
          style={{ fontSize: metricSize }}
          onClick={onValueClick}
          title={valueTitle}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onValueClick();
            }
          }}
        >
          {metricValue}
        </div>
      ) : (
        <div className={metricValueClass} style={{ fontSize: metricSize }}>
          {metricValue}
        </div>
      )}
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
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [assetSize, setAssetSize] = useState(24);
  const [metricSize, setMetricSize] = useState(18);
  const [winW, setWinW] = useState(() =>
    typeof window === 'undefined' ? 0 : window.innerWidth,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onResize = () => setWinW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  useLayoutEffect(() => {
    const element = rowRef.current;
    if (!element) return;

    const tooTall = element.clientHeight > 80;
    if (tooTall) {
      setAssetSize((size) => Math.max(16, size - 1));
      setMetricSize((size) => Math.max(12, size - 1));
    }
  }, [
    winW,
    summary.totalAsset,
    summary.totalProfitToday,
    summary.totalHoldingReturn,
    summary.returnRate,
    showPercent,
    assetSize,
    metricSize,
  ]);

  if (!summary.hasHolding) return null;

  return (
    <div className={isSticky ? 'sticky top-24 z-40 max-md:top-28' : ''}>
      <div
        className={cn(
          panelClass,
          'mb-3 rounded-[22px] bg-[radial-gradient(circle_at_top_right,rgba(103,167,255,0.14),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_24%),var(--ui-surface-elevated)] px-5 py-4',
        )}
      >
        <button
          className={cn(
            iconButtonClass,
            'absolute right-4 top-4 hidden h-6 w-6 rounded-md max-sm:inline-flex',
          )}
          onClick={() => setIsSticky((value) => !value)}
        >
          {isSticky ? (
            <PinIcon width="14" height="14" />
          ) : (
            <PinOffIcon width="14" height="14" />
          )}
        </button>
        <div
          ref={rowRef}
          className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4"
        >
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <div className="text-xs uppercase tracking-[0.08em] text-muted">
                {title}
              </div>
              <button
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted transition hover:bg-surface-soft hover:text-text"
                onClick={() => setIsMasked((value) => !value)}
                aria-label={isMasked ? '显示资产' : '隐藏资产'}
              >
                {isMasked ? (
                  <EyeOffIcon width="16" height="16" />
                ) : (
                  <EyeIcon width="16" height="16" />
                )}
              </button>
            </div>
            <div className="flex items-end gap-1 font-mono font-bold tracking-[0.03em]">
              <span className="mb-1 text-base">¥</span>
              {isMasked ? (
                <span
                  style={{ fontSize: assetSize }}
                  className="relative top-1"
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
          <div className="flex flex-wrap justify-end gap-x-8 gap-y-4 max-sm:w-full max-sm:justify-start">
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
              valueTitle="点击切换主次显示"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

