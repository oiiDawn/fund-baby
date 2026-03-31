'use client';

import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { ChartColumnBigIcon, LayoutListIcon, Trash2Icon } from 'lucide-react';

import { AnimatePresence, motion } from 'framer-motion';

import { Stat } from '@/app/components/common';
import FundIntradayChart from '@/app/components/fund-intraday-chart';
import FundTrendChart from '@/app/components/fund-trend-chart';
import { GroupSummary } from '@/app/components/group-summary';
import { cn } from '@/lib/utils';
import { nowInTz } from '@/app/lib/date';
import { getFundValuationSnapshot } from '@/app/services/fund-trade';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type {
  DcaPlan,
  FundData,
  Holding,
  HoldingProfit,
  HoldingsMap,
  IntradayPoint,
  ViewMode,
} from '@/app/types';

interface ModalState {
  open: boolean;
  fund: FundData | null;
}

interface DashboardFundListProps {
  dcaPlans: DcaPlan[];
  displayFunds: FundData[];
  getHoldingProfit: (
    fund: FundData,
    holding: Holding | undefined,
  ) => HoldingProfit | null;
  holdings: HoldingsMap;
  intradayMap: Record<string, IntradayPoint[]>;
  isMobile: boolean;
  isTradingDay: boolean;
  refreshing: boolean;
  requestRemoveFund: (fund: FundData) => void;
  setActionModal: Dispatch<SetStateAction<ModalState>>;
  setHoldingModal: Dispatch<SetStateAction<ModalState>>;
  setSwipedFundCode: Dispatch<SetStateAction<string | null>>;
  setTopStocksModal: Dispatch<SetStateAction<ModalState>>;
  swipedFundCode: string | null;
  todayStr: string;
  viewMode: ViewMode;
}

type FundCardChartTab = 'trend' | 'intraday';

interface FundDcaSummary {
  totalCount: number;
  activeCount: number;
  nextRunDate: string | null;
}

function getFundDcaSummary(
  dcaPlans: DcaPlan[],
  fundCode: string,
): FundDcaSummary | null {
  const plans = dcaPlans.filter((plan) => plan.fundCode === fundCode);
  if (plans.length === 0) return null;

  const activePlans = plans
    .filter((plan) => plan.active)
    .sort((left, right) => left.nextRunDate.localeCompare(right.nextRunDate));

  return {
    totalCount: plans.length,
    activeCount: activePlans.length,
    nextRunDate: activePlans[0]?.nextRunDate ?? null,
  };
}

function DcaSummaryBadges({ summary }: { summary: FundDcaSummary | null }) {
  if (!summary) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <Badge variant="outline" className="rounded-full">
        {summary.activeCount > 0
          ? `定投 ${summary.activeCount}/${summary.totalCount}`
          : '定投已暂停'}
      </Badge>
      {summary.nextRunDate ? (
        <Badge variant="outline" className="rounded-full">
          下次 {summary.nextRunDate.replace(/^\d{4}-/, '')}
        </Badge>
      ) : null}
    </div>
  );
}

function getCardSpanClass(index: number, total: number): string {
  void index;
  if (total === 1) return 'col-span-12';
  if (total === 2) return 'col-span-12 md:col-span-6';
  return 'col-span-12 md:col-span-6 xl:col-span-6';
}

export function DashboardFundList({
  dcaPlans,
  displayFunds,
  getHoldingProfit,
  holdings,
  intradayMap,
  isMobile,
  isTradingDay,
  refreshing,
  requestRemoveFund,
  setActionModal,
  setHoldingModal,
  setSwipedFundCode: _setSwipedFundCode,
  setTopStocksModal,
  swipedFundCode: _swipedFundCode,
  todayStr,
  viewMode,
}: DashboardFundListProps) {
  if (displayFunds.length === 0) {
    return (
      <Card className="border-border bg-card/90 text-center shadow-panel">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-14">
          <div className="flex size-[72px] items-center justify-center rounded-[20px] border border-border bg-background/70 text-muted-foreground">
            <LayoutListIcon className="size-8" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">
              还没有基金
            </div>
            <div className="text-sm text-muted-foreground">
              在上方搜索后加入
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <GroupSummary
        funds={displayFunds}
        holdings={holdings}
        title="监控资产"
        getProfit={getHoldingProfit}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {viewMode === 'card' ? (
            <div className="grid grid-cols-12 gap-4">
              <AnimatePresence mode="popLayout">
                {displayFunds.map((fund, index) => (
                  <motion.div
                    layout="position"
                    key={fund.code}
                    className={cn(
                      getCardSpanClass(index, displayFunds.length),
                      'h-full',
                    )}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FundCard
                      dcaPlans={dcaPlans}
                      fund={fund}
                      getHoldingProfit={getHoldingProfit}
                      holdings={holdings}
                      intradayMap={intradayMap}
                      refreshing={refreshing}
                      requestRemoveFund={requestRemoveFund}
                      setActionModal={setActionModal}
                      setHoldingModal={setHoldingModal}
                      setTopStocksModal={setTopStocksModal}
                      todayStr={todayStr}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <Card className="overflow-hidden border-border bg-card/95 shadow-panel">
              {!isMobile ? (
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="pl-5">基金名称</TableHead>
                      <TableHead className="text-right">
                        涨跌幅 · 净值
                      </TableHead>
                      <TableHead className="text-right">当日盈亏</TableHead>
                      <TableHead className="text-right">持有收益</TableHead>
                      <TableHead className="text-right">持仓金额</TableHead>
                      <TableHead className="pr-5 text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayFunds.map((fund) => (
                      <DesktopListRow
                        key={fund.code}
                        dcaPlans={dcaPlans}
                        fund={fund}
                        getHoldingProfit={getHoldingProfit}
                        holdings={holdings}
                        isTradingDay={isTradingDay}
                        refreshing={refreshing}
                        requestRemoveFund={requestRemoveFund}
                        setActionModal={setActionModal}
                        setHoldingModal={setHoldingModal}
                        todayStr={todayStr}
                      />
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <CardContent className="grid gap-3 p-3">
                  {displayFunds.map((fund) => (
                    <MobileListRow
                      key={fund.code}
                      dcaPlans={dcaPlans}
                      fund={fund}
                      getHoldingProfit={getHoldingProfit}
                      holdings={holdings}
                      isTradingDay={isTradingDay}
                      refreshing={refreshing}
                      requestRemoveFund={requestRemoveFund}
                      setActionModal={setActionModal}
                      setHoldingModal={setHoldingModal}
                      todayStr={todayStr}
                    />
                  ))}
                </CardContent>
              )}
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

function FundCard({
  dcaPlans,
  fund,
  getHoldingProfit,
  holdings,
  intradayMap,
  refreshing,
  requestRemoveFund,
  setActionModal,
  setHoldingModal,
  setTopStocksModal,
  todayStr,
}: {
  dcaPlans: DcaPlan[];
  fund: FundData;
  getHoldingProfit: (
    fund: FundData,
    holding: Holding | undefined,
  ) => HoldingProfit | null;
  holdings: HoldingsMap;
  intradayMap: Record<string, IntradayPoint[]>;
  refreshing: boolean;
  requestRemoveFund: (fund: FundData) => void;
  setActionModal: Dispatch<SetStateAction<ModalState>>;
  setHoldingModal: Dispatch<SetStateAction<ModalState>>;
  setTopStocksModal: Dispatch<SetStateAction<ModalState>>;
  todayStr: string;
}) {
  const [activeChartTab, setActiveChartTab] =
    useState<FundCardChartTab>('trend');
  const hasHistoryTrend =
    Array.isArray(fund.historyTrend) && fund.historyTrend.length > 0;
  const hasIntraday =
    Array.isArray(intradayMap[fund.code]) && intradayMap[fund.code].length > 0;
  const hasTopHoldings =
    Array.isArray(fund.holdings) && fund.holdings.length > 0;
  const lastIntradayTime = hasIntraday
    ? intradayMap[fund.code][intradayMap[fund.code].length - 1].time
    : '暂无数据';
  const dcaSummary = getFundDcaSummary(dcaPlans, fund.code);

  return (
    <Card className="ui-panel-accent h-full border-border bg-card/95 shadow-panel">
      <CardHeader className="gap-3 border-b border-border/70 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-[1.02rem]">
              {fund.name}
            </CardTitle>
            <CardDescription className="mt-1 text-sm">
              #{fund.code} ·{' '}
              {(fund.noValuation
                ? fund.jzrq || '-'
                : fund.gztime || fund.time || '-'
              )?.replace(/^\d{4}-/, '')}
            </CardDescription>
            <DcaSummaryBadges summary={dcaSummary} />
          </div>
          <div className="flex items-center gap-2">
            {fund.jzrq === todayStr ? (
              <Badge variant="outline" className="rounded-full">
                已收盘
              </Badge>
            ) : null}
            <Button
              variant="destructive"
              size="icon"
              onClick={() => !refreshing && requestRemoveFund(fund)}
              title="删除"
              disabled={refreshing}
            >
              <Trash2Icon />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-4">
        <CardStatsRow
          fund={fund}
          getHoldingProfit={getHoldingProfit}
          holdings={holdings}
          setActionModal={setActionModal}
          setHoldingModal={setHoldingModal}
          todayStr={todayStr}
        />

        <CardChartPanel
          activeTab={activeChartTab}
          hasIntraday={hasIntraday}
          hasHistoryTrend={hasHistoryTrend}
          intradayData={intradayMap[fund.code] ?? []}
          lastIntradayTime={lastIntradayTime}
          onTabChange={setActiveChartTab}
          trendData={fund.historyTrend ?? []}
        />
      </CardContent>

      <CardFooter className="flex flex-col items-start gap-3 border-t border-border/70 bg-transparent p-4 pt-0 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-muted-foreground">
          {fund.estPricedCoverage > 0.05
            ? `基于 ${Math.round(fund.estPricedCoverage * 100)}% 持仓估算`
            : '估算覆盖不足时回落到原始估值'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            hasTopHoldings && setTopStocksModal({ open: true, fund })
          }
          disabled={!hasTopHoldings}
        >
          <ChartColumnBigIcon data-icon="inline-start" />前 10 重仓
        </Button>
      </CardFooter>
    </Card>
  );
}

function CardChartPanel({
  activeTab,
  hasIntraday,
  hasHistoryTrend,
  intradayData,
  lastIntradayTime,
  onTabChange,
  trendData,
}: {
  activeTab: FundCardChartTab;
  hasIntraday: boolean;
  hasHistoryTrend: boolean;
  intradayData: IntradayPoint[];
  lastIntradayTime: string;
  onTabChange: (tab: FundCardChartTab) => void;
  trendData: FundData['historyTrend'];
}) {
  const currentTab =
    activeTab === 'intraday' && hasIntraday
      ? 'intraday'
      : hasHistoryTrend
        ? 'trend'
        : hasIntraday
          ? 'intraday'
          : 'trend';

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/50 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">
            {currentTab === 'trend' ? '近 90 日净值' : '当日分时估值'}
          </div>
          <div className="text-xs text-muted-foreground">
            {currentTab === 'intraday'
              ? `更新至 ${lastIntradayTime}`
              : '观察中期趋势变化'}
          </div>
        </div>
        <ToggleGroup
          type="single"
          value={currentTab}
          onValueChange={(value) => {
            if (value === 'trend' || value === 'intraday') onTabChange(value);
          }}
          className="grid w-full max-w-[16rem] grid-cols-2 gap-2"
        >
          <ToggleGroupItem
            value="trend"
            disabled={!hasHistoryTrend}
            className="h-9 rounded-xl text-xs"
          >
            近 90 日
          </ToggleGroupItem>
          <ToggleGroupItem
            value="intraday"
            disabled={!hasIntraday}
            className="h-9 rounded-xl text-xs"
          >
            当日分时
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex h-[180px] items-center justify-center overflow-hidden rounded-xl bg-background/80 sm:h-[200px]">
        {currentTab === 'trend' && hasHistoryTrend ? (
          <div className="h-full w-full">
            <FundTrendChart data={trendData ?? []} />
          </div>
        ) : null}
        {currentTab === 'intraday' && hasIntraday ? (
          <div className="h-full w-full">
            <FundIntradayChart data={intradayData} />
          </div>
        ) : null}
        {((currentTab === 'trend' && !hasHistoryTrend) ||
          (currentTab === 'intraday' && !hasIntraday)) && (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center">
            <div className="text-sm font-medium text-foreground">
              {currentTab === 'trend' ? '暂无走势数据' : '暂无分时数据'}
            </div>
            <div className="text-xs leading-6 text-muted-foreground">
              {currentTab === 'trend'
                ? '这只基金还没有可展示的近 90 日净值曲线。'
                : '这只基金暂时没有当日分时估值。'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DesktopListRow({
  dcaPlans,
  fund,
  getHoldingProfit,
  holdings,
  isTradingDay,
  refreshing,
  requestRemoveFund,
  setActionModal,
  setHoldingModal,
  todayStr,
}: {
  dcaPlans: DcaPlan[];
  fund: FundData;
  getHoldingProfit: (
    fund: FundData,
    holding: Holding | undefined,
  ) => HoldingProfit | null;
  holdings: HoldingsMap;
  isTradingDay: boolean;
  refreshing: boolean;
  requestRemoveFund: (fund: FundData) => void;
  setActionModal: Dispatch<SetStateAction<ModalState>>;
  setHoldingModal: Dispatch<SetStateAction<ModalState>>;
  todayStr: string;
}) {
  const dcaSummary = getFundDcaSummary(dcaPlans, fund.code);

  return (
    <TableRow>
      <TableCell className="min-w-[16rem] py-3.5 pl-5">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold">{fund.name}</span>
          {fund.jzrq === todayStr ? (
            <Badge variant="outline">已收盘</Badge>
          ) : null}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          #{fund.code} ·{' '}
          {(fund.noValuation
            ? fund.jzrq || '-'
            : fund.gztime || fund.time || '-'
          ).replace(/^\d{4}-/, '')}
        </div>
        <DcaSummaryBadges summary={dcaSummary} />
      </TableCell>
      <TableCell className="py-3.5 text-right">
        <ListRowChangeCell
          fund={fund}
          isTradingDay={isTradingDay}
          todayStr={todayStr}
          className="items-end text-right"
        />
      </TableCell>
      <TableCell className="py-3.5 text-right">
        <ListRowTodayProfitCell
          fund={fund}
          getHoldingProfit={getHoldingProfit}
          holdings={holdings}
          className="text-right"
        />
      </TableCell>
      <TableCell className="py-3.5 text-right">
        <ListRowTotalProfitCell
          fund={fund}
          getHoldingProfit={getHoldingProfit}
          holdings={holdings}
          className="text-right"
        />
      </TableCell>
      <TableCell className="py-3.5 text-right">
        <ListRowHoldingAmountCell
          fund={fund}
          getHoldingProfit={getHoldingProfit}
          holdings={holdings}
          setActionModal={setActionModal}
          setHoldingModal={setHoldingModal}
          compact
        />
      </TableCell>
      <TableCell className="py-3.5 pr-5 text-right">
        <Button
          variant="destructive"
          size="icon"
          onClick={() => !refreshing && requestRemoveFund(fund)}
          title="删除"
          disabled={refreshing}
        >
          <Trash2Icon />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function MobileListRow({
  dcaPlans,
  fund,
  getHoldingProfit,
  holdings,
  isTradingDay,
  refreshing,
  requestRemoveFund,
  setActionModal,
  setHoldingModal,
  todayStr,
}: {
  dcaPlans: DcaPlan[];
  fund: FundData;
  getHoldingProfit: (
    fund: FundData,
    holding: Holding | undefined,
  ) => HoldingProfit | null;
  holdings: HoldingsMap;
  isTradingDay: boolean;
  refreshing: boolean;
  requestRemoveFund: (fund: FundData) => void;
  setActionModal: Dispatch<SetStateAction<ModalState>>;
  setHoldingModal: Dispatch<SetStateAction<ModalState>>;
  todayStr: string;
}) {
  const dcaSummary = getFundDcaSummary(dcaPlans, fund.code);

  return (
    <Card className="border-border bg-background/65 shadow-none">
      <CardHeader className="gap-2 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-[0.95rem]">
              {fund.name}
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              #{fund.code} ·{' '}
              {(fund.noValuation
                ? fund.jzrq || '-'
                : fund.gztime || fund.time || '-'
              ).replace(/^\d{4}-/, '')}
            </CardDescription>
            <DcaSummaryBadges summary={dcaSummary} />
          </div>
          <Button
            variant="destructive"
            size="icon"
            onClick={() => !refreshing && requestRemoveFund(fund)}
            disabled={refreshing}
          >
            <Trash2Icon />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 pt-0">
        <div className="grid grid-cols-2 gap-2.5">
          <MetricBlock label="涨跌幅">
            <ListRowChangeCell
              fund={fund}
              isTradingDay={isTradingDay}
              todayStr={todayStr}
              className="items-start text-left"
            />
          </MetricBlock>
          <MetricBlock label="当日盈亏">
            <ListRowTodayProfitCell
              fund={fund}
              getHoldingProfit={getHoldingProfit}
              holdings={holdings}
              className="text-left"
            />
          </MetricBlock>
          <MetricBlock label="持有收益">
            <ListRowTotalProfitCell
              fund={fund}
              getHoldingProfit={getHoldingProfit}
              holdings={holdings}
              className="text-left"
            />
          </MetricBlock>
          <MetricBlock label="更新时间">
            <div className="text-sm font-medium text-foreground">
              {(fund.noValuation
                ? fund.jzrq || '-'
                : fund.gztime || fund.time || '-'
              ).replace(/^\d{4}-/, '')}
            </div>
          </MetricBlock>
        </div>

        <ListRowHoldingAmountCell
          fund={fund}
          getHoldingProfit={getHoldingProfit}
          holdings={holdings}
          setActionModal={setActionModal}
          setHoldingModal={setHoldingModal}
        />
      </CardContent>
    </Card>
  );
}

function MetricBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/55 px-3 py-2.5">
      <div className="mb-1 text-[11px] font-medium tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function ListRowChangeCell({
  fund,
  isTradingDay,
  todayStr,
  className,
}: {
  fund: FundData;
  isTradingDay: boolean;
  todayStr: string;
  className?: string;
}) {
  const now = nowInTz();
  const isAfter9 = now.hour() >= 9;
  const hasTodayData = fund.jzrq === todayStr;
  const shouldHideChange = isTradingDay && isAfter9 && !hasTodayData;

  if (!shouldHideChange || fund.noValuation) {
    const changeValue =
      fund.zzl !== undefined && fund.zzl !== null
        ? `${fund.zzl > 0 ? '+' : ''}${Number(fund.zzl).toFixed(2)}%`
        : '—';

    return (
      <div className={cn('flex flex-col gap-0.5', className)}>
        <span
          className={cn(
            'text-sm font-semibold',
            fund.zzl > 0 ? 'text-up' : fund.zzl < 0 ? 'text-down' : '',
          )}
        >
          {changeValue}
        </span>
        <span className="text-xs text-muted-foreground">
          {fund.dwjz ?? '—'}
        </span>
      </div>
    );
  }

  const valuation = getFundValuationSnapshot(fund);
  const estValue = valuation.navText;
  const estChange = valuation.change;
  const estChangeText = valuation.changeText;

  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <span
        className={cn(
          'text-sm font-semibold',
          estChange > 0 ? 'text-up' : estChange < 0 ? 'text-down' : '',
        )}
      >
        {estChangeText}
      </span>
      <span className="text-xs text-muted-foreground">{estValue}</span>
    </div>
  );
}

function ListRowTodayProfitCell({
  fund,
  getHoldingProfit,
  holdings,
  className,
}: {
  fund: FundData;
  getHoldingProfit: (
    fund: FundData,
    holding: Holding | undefined,
  ) => HoldingProfit | null;
  holdings: HoldingsMap;
  className?: string;
}) {
  const holding = holdings[fund.code];
  const profit = getHoldingProfit(fund, holding);
  const profitValue = profit ? profit.profitToday : null;
  const hasProfit = profitValue !== null;

  return (
    <div className={cn('text-sm font-semibold', className)}>
      <span
        className={cn(
          hasProfit
            ? profitValue > 0
              ? 'text-up'
              : profitValue < 0
                ? 'text-down'
                : ''
            : 'text-muted-foreground',
        )}
      >
        {hasProfit
          ? `${profitValue > 0 ? '+' : profitValue < 0 ? '-' : ''}¥${Math.abs(profitValue).toFixed(2)}`
          : '—'}
      </span>
    </div>
  );
}

function ListRowTotalProfitCell({
  fund,
  getHoldingProfit,
  holdings,
  className,
}: {
  fund: FundData;
  getHoldingProfit: (
    fund: FundData,
    holding: Holding | undefined,
  ) => HoldingProfit | null;
  holdings: HoldingsMap;
  className?: string;
}) {
  const holding = holdings[fund.code];
  const profit = getHoldingProfit(fund, holding);
  const total = profit ? profit.profitTotal : null;
  const principal =
    holding && holding.cost && holding.share ? holding.cost * holding.share : 0;
  const ratio =
    total !== null && principal > 0 ? (total / principal) * 100 : null;

  return total !== null ? (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <span
        className={cn(
          'text-sm font-semibold',
          total > 0 ? 'text-up' : total < 0 ? 'text-down' : '',
        )}
      >
        {`${total > 0 ? '+' : total < 0 ? '-' : ''}¥${Math.abs(total).toFixed(2)}`}
      </span>
      {ratio !== null ? (
        <span className="text-xs text-muted-foreground">
          {`${ratio > 0 ? '+' : ''}${ratio.toFixed(2)}%`}
        </span>
      ) : null}
    </div>
  ) : (
    <span className={cn('text-muted-foreground', className)}>—</span>
  );
}

function ListRowHoldingAmountCell({
  fund,
  getHoldingProfit,
  holdings,
  setActionModal,
  setHoldingModal: _setHoldingModal,
  compact = false,
}: {
  fund: FundData;
  getHoldingProfit: (
    fund: FundData,
    holding: Holding | undefined,
  ) => HoldingProfit | null;
  holdings: HoldingsMap;
  setActionModal: Dispatch<SetStateAction<ModalState>>;
  setHoldingModal: Dispatch<SetStateAction<ModalState>>;
  compact?: boolean;
}) {
  const holding = holdings[fund.code];
  const profit = getHoldingProfit(fund, holding);

  if (compact) {
    return profit ? (
      <button
        type="button"
        className="font-mono text-sm font-semibold text-foreground transition hover:text-primary"
        onClick={() => setActionModal({ open: true, fund })}
        title="持仓操作"
      >
        ¥{profit.amount.toFixed(2)}
      </button>
    ) : (
      <button
        type="button"
        className="text-sm text-muted-foreground transition hover:text-foreground"
        onClick={() => setActionModal({ open: true, fund })}
        title="持仓操作"
      >
        未设置
      </button>
    );
  }

  return profit ? (
    <Button
      variant="outline"
      size="sm"
      className="rounded-xl font-mono sm:w-auto"
      onClick={() => setActionModal({ open: true, fund })}
      title="持仓操作"
    >
      ¥{profit.amount.toFixed(2)}
    </Button>
  ) : (
    <Button
      variant="outline"
      size="sm"
      className="rounded-xl sm:w-auto"
      onClick={() => setActionModal({ open: true, fund })}
      title="持仓操作"
    >
      未设置
    </Button>
  );
}

function CardStatsRow({
  fund,
  getHoldingProfit,
  holdings,
  setActionModal,
  setHoldingModal,
  todayStr,
}: {
  fund: FundData;
  getHoldingProfit: (
    fund: FundData,
    holding: Holding | undefined,
  ) => HoldingProfit | null;
  holdings: HoldingsMap;
  setActionModal: Dispatch<SetStateAction<ModalState>>;
  setHoldingModal: Dispatch<SetStateAction<ModalState>>;
  todayStr: string;
}) {
  const holding = holdings[fund.code];
  const profit = getHoldingProfit(fund, holding);
  const hasTodayData = fund.jzrq === todayStr;
  const showActual = hasTodayData || fund.noValuation;
  const totalProfitRatio =
    profit?.profitTotal != null && holding?.cost && holding?.share
      ? (profit.profitTotal / (holding.cost * holding.share)) * 100
      : null;
  const valuation = getFundValuationSnapshot(fund);

  return (
    <div className="grid gap-3">
      <ListRowHoldingAmountCell
        fund={fund}
        getHoldingProfit={getHoldingProfit}
        holdings={holdings}
        setActionModal={setActionModal}
        setHoldingModal={setHoldingModal}
      />

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-3">
        <Stat
          label={showActual ? '实际涨跌幅' : '估值涨跌幅'}
          value={
            showActual
              ? fund.zzl !== undefined
                ? `${fund.zzl > 0 ? '+' : ''}${Number(fund.zzl).toFixed(2)}%`
                : '—'
              : valuation.changeText
          }
          delta={showActual ? fund.zzl : valuation.change}
          subValue={showActual ? String(fund.dwjz) : valuation.navText}
        />

        {profit && profit.profitToday !== null ? (
          <Stat
            label="当日盈亏"
            value={`${profit.profitToday > 0 ? '+' : profit.profitToday < 0 ? '-' : ''}¥${Math.abs(profit.profitToday).toFixed(2)}`}
            delta={profit.profitToday}
          />
        ) : (
          <Stat label="当日盈亏" value="—" />
        )}

        {profit?.profitTotal !== null && profit ? (
          <Stat
            label="持有收益"
            value={`${profit.profitTotal > 0 ? '+' : profit.profitTotal < 0 ? '-' : ''}¥${Math.abs(profit.profitTotal).toFixed(2)}`}
            delta={profit.profitTotal}
            subValue={
              totalProfitRatio !== null
                ? `${totalProfitRatio > 0 ? '+' : ''}${totalProfitRatio.toFixed(2)}%`
                : undefined
            }
          />
        ) : (
          <Stat label="持有收益" value="—" />
        )}
      </div>
    </div>
  );
}
