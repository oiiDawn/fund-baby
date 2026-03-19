'use client';

import type { Dispatch, SetStateAction } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { Stat } from '@/app/components/common';
import FundIntradayChart from '@/app/components/fund-intraday-chart';
import FundTrendChart from '@/app/components/fund-trend-chart';
import { ChevronIcon, SettingsIcon, TrashIcon } from '@/app/components/icons';
import { cn } from '@/app/lib/cn';
import { nowInTz } from '@/app/lib/date';
import {
  emptyStateClass,
  iconButtonClass,
  iconButtonDangerClass,
  panelClass,
  secondaryButtonClass,
  subtleTextClass,
  upTextClass,
  downTextClass,
} from '@/app/lib/ui';
import { GroupSummary } from '@/app/features/fund-dashboard/components/group-summary';
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
  'rounded-[22px] bg-[radial-gradient(circle_at_top_right,rgba(103,167,255,0.1),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.018),transparent_24%),var(--ui-surface-elevated)] p-4',
);

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
        <div className="mb-5 text-sm text-muted">尚未添加基金</div>
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
                {displayFunds.map((fund) => (
                  <motion.div
                    layout="position"
                    key={fund.code}
                    className="col-span-12 md:col-span-6"
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
                    'border-b border-border bg-surface-soft py-4 text-[0.78rem] font-bold uppercase tracking-[0.08em] text-muted-strong',
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
  return (
    <div className={cardShellClass}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold">{fund.name}</div>
          <div className={subtleTextClass}>#{fund.code}</div>
        </div>
        <div className="flex items-start gap-2 text-right">
          <div className="text-xs text-muted">
            <strong className="block text-sm font-semibold text-muted-strong">
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

      <div className="mb-3 flex flex-wrap gap-4">
        <CardStatsRow
          fund={fund}
          getHoldingProfit={getHoldingProfit}
          holdings={holdings}
          setActionModal={setActionModal}
          setHoldingModal={setHoldingModal}
          todayStr={todayStr}
        />
      </div>

      {Array.isArray(fund.historyTrend) && fund.historyTrend.length > 0 && (
        <details className="mb-3 border-t border-border pt-3 first:border-t-0 first:pt-0">
          <summary className="flex cursor-pointer items-center gap-1 text-xs text-muted-strong">
            <ChevronIcon
              width="12"
              height="12"
              className="transition duration-200 group-open:rotate-90"
            />
            <span>近90日净值走势</span>
          </summary>
          <div className="mt-2 h-[180px]">
            <FundTrendChart data={fund.historyTrend} />
          </div>
        </details>
      )}

      {intradayMap[fund.code] && intradayMap[fund.code].length > 0 && (
        <details className="mb-3 border-t border-border pt-3">
          <summary className="flex cursor-pointer items-center justify-between gap-2 text-xs text-muted-strong">
            <div className="flex items-center gap-1">
              <ChevronIcon
                width="12"
                height="12"
                className="transition duration-200 group-open:rotate-90"
              />
              <span>当日分时估值</span>
            </div>
            <span className="text-[10px] text-muted">
              {intradayMap[fund.code][intradayMap[fund.code].length - 1].time}
            </span>
          </summary>
          <div className="mt-2 h-[180px] rounded-lg bg-surface-soft">
            <FundIntradayChart data={intradayMap[fund.code]} />
          </div>
        </details>
      )}

      {fund.estPricedCoverage > 0.05 && (
        <div className="mb-2 text-right text-[10px] text-muted">
          基于 {Math.round(fund.estPricedCoverage * 100)}% 持仓估算
        </div>
      )}

      <button
        className="flex w-full items-center gap-1 text-left text-xs text-muted-strong"
        onClick={(event) => {
          event.stopPropagation();
          setTopStocksModal({ open: true, fund });
        }}
      >
        <ChevronIcon width="12" height="12" />
        <span>前10重仓股票</span>
        <span className="ml-auto text-[10px] text-muted">点击查看详情</span>
      </button>
    </div>
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
        'border-b border-border bg-transparent py-3.5 transition hover:bg-[rgba(255,255,255,0.03)] last:border-b-0',
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

  if (!profit) {
    return (
      <>
        <div className="flex min-w-[96px] flex-col items-center gap-1">
          <span className="text-[10px] text-muted md:text-xs">持仓金额</span>
          <button
            className="inline-flex items-center gap-1 text-sm font-medium text-muted"
            onClick={() => setHoldingModal({ open: true, fund })}
          >
            未设置 <SettingsIcon width="12" height="12" />
          </button>
        </div>
        {valuationStat}
      </>
    );
  }

  return (
    <>
      <button
        className="flex min-w-[96px] flex-col items-center gap-1"
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

      {valuationStat}

      <div className="flex min-w-[96px] flex-col items-center gap-1">
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
      {profit.profitTotal !== null && (
        <Stat
          label="持有收益"
          value={`${profit.profitTotal > 0 ? '+' : profit.profitTotal < 0 ? '-' : ''}¥${Math.abs(profit.profitTotal).toFixed(2)}`}
          delta={profit.profitTotal}
          subValue={`${(holding.cost * holding.share ? (profit.profitTotal / (holding.cost * holding.share)) * 100 : 0) > 0 ? '+' : ''}${(holding.cost * holding.share ? (profit.profitTotal / (holding.cost * holding.share)) * 100 : 0).toFixed(2)}%`}
        />
      )}
    </>
  );
}
