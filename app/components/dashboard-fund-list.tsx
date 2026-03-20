'use client';

import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { Stat } from '@/app/components/common';
import FundIntradayChart from '@/app/components/fund-intraday-chart';
import FundTrendChart from '@/app/components/fund-trend-chart';
import { SettingsIcon, TrashIcon } from '@/app/components/icons';
import { cn } from '@/app/lib/cn';
import { nowInTz } from '@/app/lib/date';
import {
  activeTabClass,
  emptyStateClass,
  iconButtonClass,
  iconButtonDangerClass,
  panelClass,
  secondaryButtonClass,
  subtleTextClass,
  tabClass,
  upTextClass,
  downTextClass,
} from '@/app/lib/ui';
import { GroupSummary } from '@/app/components/group-summary';
import type {
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

const desktopTableColumns =
  'grid grid-cols-[minmax(180px,2fr)_minmax(130px,1.4fr)_minmax(110px,1.2fr)_minmax(110px,1.2fr)_minmax(110px,1.2fr)_100px] items-center gap-4 px-6';

const cardShellClass = cn(
  panelClass,
  'ui-panel-accent rounded-[var(--ui-radius-lg)] p-[var(--space-md)]',
);

const cardSectionClass =
  'rounded-[var(--ui-radius-md)] border border-border bg-surface-soft transition duration-200';

const cardActionButtonClass = cn(
  secondaryButtonClass,
  'h-11 w-full justify-between rounded-[var(--ui-radius-md)] px-[var(--space-sm)] text-[0.8125rem] font-medium tracking-[0.01em]',
);

type FundCardChartTab = 'trend' | 'intraday';

function getCardSpanClass(index: number, total: number): string {
  void index;
  if (total === 1) return 'col-span-12';
  if (total === 2) return 'col-span-12 md:col-span-6';
  return 'col-span-12 md:col-span-6 xl:col-span-6';
}

export function DashboardFundList({
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
  setSwipedFundCode,
  setTopStocksModal,
  swipedFundCode,
  todayStr,
  viewMode,
}: DashboardFundListProps) {
  if (displayFunds.length === 0) {
    return (
      <div className={cn(emptyStateClass, 'px-5 py-[60px]')}>
        <div className="mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-[20px] border border-border bg-surface-soft text-muted-strong">
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <path
              d="M6.5 12.5h21"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M9 8.5h7l2.2 3H25a2 2 0 0 1 2 2v10A2.5 2.5 0 0 1 24.5 26h-15A2.5 2.5 0 0 1 7 23.5v-13A2 2 0 0 1 9 8.5Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M12 19h10"
              stroke="var(--ui-gold)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="space-y-1">
          <div className="text-sm font-medium text-muted-strong">
            还没有基金
          </div>
          <div className="text-sm text-muted">在上方搜索后加入</div>
        </div>
      </div>
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
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FundCard
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
            <div className={cn(panelClass, 'overflow-hidden rounded-[22px]')}>
              {!isMobile && (
                <div
                  className={cn(
                    desktopTableColumns,
                    'border-b border-border bg-surface-soft py-4 text-[0.76rem] font-semibold uppercase tracking-[0.12em] text-muted-strong',
                  )}
                >
                  <div className="text-left">基金名称</div>
                  <div className="text-right">涨跌幅 · 净值</div>
                  <div className="text-right">当日盈亏</div>
                  <div className="text-right">持有收益</div>
                  <div className="text-right">持仓金额</div>
                  <div className="text-center">操作</div>
                </div>
              )}

              <AnimatePresence mode="popLayout">
                {displayFunds.map((fund) => (
                  <motion.div
                    layout="position"
                    key={fund.code}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="relative overflow-hidden"
                  >
                    {isMobile ? (
                      <MobileListRow
                        fund={fund}
                        getHoldingProfit={getHoldingProfit}
                        holdings={holdings}
                        isTradingDay={isTradingDay}
                        refreshing={refreshing}
                        requestRemoveFund={requestRemoveFund}
                        setActionModal={setActionModal}
                        setHoldingModal={setHoldingModal}
                        setSwipedFundCode={setSwipedFundCode}
                        swipedFundCode={swipedFundCode}
                        todayStr={todayStr}
                      />
                    ) : (
                      <DesktopListRow
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
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

function FundCard({
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

  const summaryBlock = (
    <div className="flex min-w-0 flex-col gap-[var(--space-md)]">
      <div className="flex items-start justify-between gap-[var(--space-sm)]">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold tracking-[0.01em]">
            {fund.name}
          </div>
          <div className={subtleTextClass}>#{fund.code}</div>
        </div>
        <div className="flex items-start gap-2 text-right">
          <div className="text-[0.75rem] text-muted">
            <span className="block text-[0.68rem] uppercase tracking-[0.1em]">
              更新时间
            </span>
            <strong className="block text-[0.9375rem] font-semibold text-muted-strong">
              {(fund.noValuation
                ? fund.jzrq || '-'
                : fund.gztime || fund.time || '-'
              )?.replace(/^\d{4}-/, '')}
            </strong>
          </div>
          <button
            className={cn(iconButtonClass, iconButtonDangerClass, 'h-7 w-7')}
            onClick={() => !refreshing && requestRemoveFund(fund)}
            title="删除"
            disabled={refreshing}
          >
            <TrashIcon width="14" height="14" />
          </button>
        </div>
      </div>

      <CardStatsRow
        fund={fund}
        getHoldingProfit={getHoldingProfit}
        holdings={holdings}
        setActionModal={setActionModal}
        setHoldingModal={setHoldingModal}
        todayStr={todayStr}
      />
    </div>
  );

  const footnoteBlock = (
    <div className="flex min-h-9 items-center text-[0.72rem] tracking-[0.01em] text-muted">
      <span>
        {fund.estPricedCoverage > 0.05
          ? `基于 ${Math.round(fund.estPricedCoverage * 100)}% 持仓估算`
          : '估算覆盖不足时回落到原始估值'}
      </span>
    </div>
  );

  return (
    <div className={cn(cardShellClass, 'flex h-full min-h-[460px] flex-col')}>
      {summaryBlock}
      <div className="mt-4 flex flex-1 flex-col gap-3">
        <CardChartPanel
          activeTab={activeChartTab}
          hasIntraday={hasIntraday}
          hasHistoryTrend={hasHistoryTrend}
          intradayData={intradayMap[fund.code] ?? []}
          lastIntradayTime={lastIntradayTime}
          onTabChange={setActiveChartTab}
          trendData={fund.historyTrend ?? []}
        />
        <div className="mt-auto flex flex-col gap-3">
          {footnoteBlock}
          <CardHoldingsButton
            available={hasTopHoldings}
            onClick={() => setTopStocksModal({ open: true, fund })}
          />
        </div>
      </div>
    </div>
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

  const currentLabel =
    currentTab === 'trend' ? '近90日净值走势' : '当日分时估值';
  const currentMeta =
    currentTab === 'intraday' && hasIntraday
      ? `更新至 ${lastIntradayTime}`
      : currentTab === 'trend'
        ? '近90日'
        : '暂无数据';

  return (
    <div className={cn(cardSectionClass, 'flex flex-col overflow-hidden')}>
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-[var(--space-sm)] py-[var(--space-sm)]">
        <div className="flex flex-1 rounded-xl border border-border bg-transparent p-1">
          <button
            type="button"
            className={cn(
              tabClass,
              'h-9 flex-1 rounded-[10px] border-transparent px-3 text-xs',
              currentTab === 'trend' && activeTabClass,
              !hasHistoryTrend && 'cursor-not-allowed opacity-40',
            )}
            onClick={() => hasHistoryTrend && onTabChange('trend')}
            disabled={!hasHistoryTrend}
          >
            近90日净值
          </button>
          <button
            type="button"
            className={cn(
              tabClass,
              'h-9 flex-1 rounded-[10px] border-transparent px-3 text-xs',
              currentTab === 'intraday' && activeTabClass,
              !hasIntraday && 'cursor-not-allowed opacity-40',
            )}
            onClick={() => hasIntraday && onTabChange('intraday')}
            disabled={!hasIntraday}
          >
            当日分时
          </button>
        </div>
        <div className="text-right">
          <div className="text-[0.75rem] font-medium text-muted-strong">
            {currentLabel}
          </div>
          <div className="text-[0.68rem] tracking-[0.01em] text-muted">
            {currentMeta}
          </div>
        </div>
      </div>
      <div className="px-[var(--space-sm)] py-[var(--space-sm)]">
        <div className="flex h-[210px] items-center justify-center rounded-[var(--ui-radius-sm)] bg-surface-inset">
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
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center">
              <div className="text-sm font-medium text-muted-strong">
                {currentTab === 'trend' ? '暂无走势数据' : '暂无分时数据'}
              </div>
              <div className="text-xs text-muted">
                {currentTab === 'trend'
                  ? '这只基金还没有可展示的近90日净值曲线'
                  : '这只基金暂时没有当日分时估值'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CardHoldingsButton({
  available,
  onClick,
}: {
  available: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        cardActionButtonClass,
        !available && 'cursor-not-allowed opacity-50 hover:translate-y-0',
      )}
      onClick={(event) => {
        event.stopPropagation();
        if (!available) return;
        onClick();
      }}
      disabled={!available}
    >
      <span>前10重仓股票</span>
      <span className="text-[0.72rem] tracking-[0.01em] text-muted">
        {available ? '查看详情' : '暂无重仓数据'}
      </span>
    </button>
  );
}

function DesktopListRow({
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
  return (
    <div
      className={cn(
        desktopTableColumns,
        'border-b border-border bg-transparent py-3.5 transition hover:bg-surface-soft last:border-b-0',
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="truncate text-sm font-semibold">{fund.name}</span>
          {fund.jzrq === todayStr && (
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-success-soft text-[10px] text-success">
              ✓
            </span>
          )}
        </div>
        <span className={subtleTextClass}>
          #{fund.code} ·{' '}
          {(fund.noValuation
            ? fund.jzrq || '-'
            : fund.gztime || fund.time || '-'
          ).replace(/^\d{4}-/, '')}
        </span>
      </div>
      <ListRowChangeCell
        fund={fund}
        isTradingDay={isTradingDay}
        todayStr={todayStr}
        className="items-end text-right"
      />
      <ListRowTodayProfitCell
        fund={fund}
        getHoldingProfit={getHoldingProfit}
        holdings={holdings}
        className="text-right"
      />
      <ListRowTotalProfitCell
        fund={fund}
        getHoldingProfit={getHoldingProfit}
        holdings={holdings}
        className="text-right"
      />
      <ListRowHoldingAmountCell
        fund={fund}
        getHoldingProfit={getHoldingProfit}
        holdings={holdings}
        setActionModal={setActionModal}
        setHoldingModal={setHoldingModal}
      />
      <div className="flex justify-center">
        <button
          className={cn(iconButtonClass, iconButtonDangerClass)}
          onClick={() => !refreshing && requestRemoveFund(fund)}
          title="删除"
          disabled={refreshing}
        >
          <TrashIcon width="16" height="16" />
        </button>
      </div>
    </div>
  );
}

function MobileListRow({
  fund,
  getHoldingProfit,
  holdings,
  isTradingDay,
  refreshing,
  requestRemoveFund,
  setActionModal,
  setHoldingModal,
  setSwipedFundCode,
  swipedFundCode,
  todayStr,
}: {
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
  setSwipedFundCode: Dispatch<SetStateAction<string | null>>;
  swipedFundCode: string | null;
  todayStr: string;
}) {
  const holding = holdings[fund.code];
  const profit = getHoldingProfit(fund, holding);

  return (
    <>
      <div
        className="absolute inset-y-0 right-0 flex w-20 cursor-pointer items-center justify-center gap-1 bg-danger text-sm font-semibold text-interactive-contrast"
        onClick={(event) => {
          event.stopPropagation();
          if (!refreshing) requestRemoveFund(fund);
        }}
      >
        <TrashIcon width="18" height="18" />
        <span>删除</span>
      </div>
      <motion.div
        className="m-3 rounded-2xl border border-border bg-card p-3"
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        dragDirectionLock
        animate={{ x: swipedFundCode === fund.code ? -80 : 0 }}
        onDragEnd={(_event, { offset }) => {
          if (offset.x < -40) setSwipedFundCode(fund.code);
          else setSwipedFundCode(null);
        }}
        onClick={(event) => {
          if (swipedFundCode === fund.code) {
            event.stopPropagation();
            setSwipedFundCode(null);
          }
        }}
      >
        <div className="mb-3 flex items-start justify-between gap-3 border-b border-border pb-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{fund.name}</div>
            <div className={subtleTextClass}>#{fund.code}</div>
          </div>
          <div className="text-right">
            {profit ? (
              <button
                className={cn(secondaryButtonClass, 'h-8 px-3 text-xs')}
                onClick={() => setActionModal({ open: true, fund })}
              >
                ¥{profit.amount.toFixed(2)}
              </button>
            ) : (
              <button
                className={cn(secondaryButtonClass, 'h-8 px-3 text-xs')}
                onClick={() => setHoldingModal({ open: true, fund })}
              >
                未设置
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className={subtleTextClass}>涨跌幅</div>
            <ListRowChangeCell
              fund={fund}
              isTradingDay={isTradingDay}
              todayStr={todayStr}
              className="items-start text-left"
            />
          </div>
          <div>
            <div className={subtleTextClass}>当日盈亏</div>
            <ListRowTodayProfitCell
              fund={fund}
              getHoldingProfit={getHoldingProfit}
              holdings={holdings}
              className="text-left"
            />
          </div>
          <div>
            <div className={subtleTextClass}>持有收益</div>
            <ListRowTotalProfitCell
              fund={fund}
              getHoldingProfit={getHoldingProfit}
              holdings={holdings}
              className="text-left"
            />
          </div>
          <div>
            <div className={subtleTextClass}>更新时间</div>
            <div className="text-sm font-medium text-muted-strong">
              {(fund.noValuation
                ? fund.jzrq || '-'
                : fund.gztime || fund.time || '-'
              ).replace(/^\d{4}-/, '')}
            </div>
          </div>
        </div>
      </motion.div>
    </>
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
            'text-sm font-bold',
            fund.zzl > 0 ? upTextClass : fund.zzl < 0 ? downTextClass : '',
          )}
        >
          {changeValue}
        </span>
        <span className="text-[10px] font-medium text-muted opacity-80">
          {fund.dwjz ?? '—'}
        </span>
      </div>
    );
  }

  const estValue =
    fund.estPricedCoverage > 0.05 ? fund.estGsz.toFixed(4) : (fund.gsz ?? '—');
  const estChange =
    fund.estPricedCoverage > 0.05 ? fund.estGszzl : Number(fund.gszzl) || 0;
  const estChangeText =
    fund.estPricedCoverage > 0.05
      ? `${fund.estGszzl > 0 ? '+' : ''}${fund.estGszzl.toFixed(2)}%`
      : typeof fund.gszzl === 'number'
        ? `${fund.gszzl > 0 ? '+' : ''}${fund.gszzl.toFixed(2)}%`
        : (fund.gszzl ?? '—');

  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <span
        className={cn(
          'text-sm font-bold',
          estChange > 0 ? upTextClass : estChange < 0 ? downTextClass : '',
        )}
      >
        {estChangeText}
      </span>
      <span className="text-[10px] font-medium text-muted opacity-80">
        {estValue}
      </span>
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
    <div className={cn('text-sm font-bold', className)}>
      <span
        className={cn(
          hasProfit
            ? profitValue > 0
              ? upTextClass
              : profitValue < 0
                ? downTextClass
                : ''
            : 'text-muted',
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
          'text-sm font-bold',
          total > 0 ? upTextClass : total < 0 ? downTextClass : '',
        )}
      >
        {`${total > 0 ? '+' : total < 0 ? '-' : ''}¥${Math.abs(total).toFixed(2)}`}
      </span>
      {ratio !== null && (
        <span className="text-[10px] text-muted opacity-80">
          {`${ratio > 0 ? '+' : ''}${ratio.toFixed(2)}%`}
        </span>
      )}
    </div>
  ) : (
    <span className={cn('text-muted', className)}>—</span>
  );
}

function ListRowHoldingAmountCell({
  fund,
  getHoldingProfit,
  holdings,
  setActionModal,
  setHoldingModal,
}: {
  fund: FundData;
  getHoldingProfit: (
    fund: FundData,
    holding: Holding | undefined,
  ) => HoldingProfit | null;
  holdings: HoldingsMap;
  setActionModal: Dispatch<SetStateAction<ModalState>>;
  setHoldingModal: Dispatch<SetStateAction<ModalState>>;
}) {
  const holding = holdings[fund.code];
  const profit = getHoldingProfit(fund, holding);

  return (
    <div className="flex justify-end">
      {profit ? (
        <button
          className={cn(secondaryButtonClass, 'h-9 px-3 text-xs')}
          onClick={() => setActionModal({ open: true, fund })}
          title="持仓操作"
        >
          ¥{profit.amount.toFixed(2)}
        </button>
      ) : (
        <button
          className={cn(secondaryButtonClass, 'h-9 px-3 text-xs')}
          onClick={() => setHoldingModal({ open: true, fund })}
          title="设置持仓"
        >
          未设置
        </button>
      )}
    </div>
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

  const valuationStat = (
    <Stat
      label={showActual ? '实际涨跌幅' : '估值涨跌幅'}
      value={
        showActual
          ? fund.zzl !== undefined
            ? `${fund.zzl > 0 ? '+' : ''}${Number(fund.zzl).toFixed(2)}%`
            : '—'
          : fund.estPricedCoverage > 0.05
            ? `${fund.estGszzl > 0 ? '+' : ''}${fund.estGszzl.toFixed(2)}%`
            : typeof fund.gszzl === 'number'
              ? `${fund.gszzl > 0 ? '+' : ''}${fund.gszzl.toFixed(2)}%`
              : (fund.gszzl ?? '—')
      }
      delta={
        showActual
          ? fund.zzl
          : fund.estPricedCoverage > 0.05
            ? fund.estGszzl
            : Number(fund.gszzl) || 0
      }
      subValue={
        showActual
          ? String(fund.dwjz)
          : fund.estPricedCoverage > 0.05
            ? fund.estGsz.toFixed(4)
            : fund.gsz != null
              ? String(fund.gsz)
              : '—'
      }
    />
  );

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {profit ? (
        <button
          className="flex min-w-0 flex-col items-center gap-1 rounded-[var(--ui-radius-sm)] px-2 py-1 text-center transition hover:bg-surface-soft"
          onClick={() => setActionModal({ open: true, fund })}
        >
          <span className="inline-flex items-center gap-1 text-[10px] text-muted md:text-xs">
            持仓金额{' '}
            <SettingsIcon width="12" height="12" style={{ opacity: 0.7 }} />
          </span>
          <span className="font-mono text-sm font-semibold md:text-base">
            ¥{profit.amount.toFixed(2)}
          </span>
        </button>
      ) : (
        <div className="flex min-w-0 flex-col items-center gap-1 px-2 py-1 text-center">
          <span className="text-[10px] text-muted md:text-xs">持仓金额</span>
          <button
            className="inline-flex items-center gap-1 text-sm font-medium text-muted"
            onClick={() => setHoldingModal({ open: true, fund })}
          >
            未设置 <SettingsIcon width="12" height="12" />
          </button>
        </div>
      )}
      {valuationStat}
      {profit && profit.profitToday !== null ? (
        <div className="flex min-w-0 flex-col items-center gap-1 px-2 py-1 text-center">
          <span className="text-[10px] text-muted md:text-xs">当日盈亏</span>
          <span
            className={cn(
              'font-mono text-sm font-semibold md:text-base',
              profit.profitToday > 0
                ? upTextClass
                : profit.profitToday < 0
                  ? downTextClass
                  : '',
            )}
          >
            {profit.profitToday > 0 ? '+' : profit.profitToday < 0 ? '-' : ''}¥
            {Math.abs(profit.profitToday).toFixed(2)}
          </span>
        </div>
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
  );
}
