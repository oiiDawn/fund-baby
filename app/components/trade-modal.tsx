'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { DatePicker, NumericInput } from '@/app/components/common';
import {
  CloseIcon,
  MinusIcon,
  PlusIcon,
  SwitchIcon,
} from '@/app/components/icons';
import { cn } from '@/app/lib/cn';
import { formatDate, nowInTz, toTz } from '@/app/lib/date';
import {
  iconButtonGhostClass,
  modalCardClass,
  modalHeaderClass,
  modalOverlayClass,
  primaryButtonClass,
  secondaryButtonClass,
  titleRowClass,
} from '@/app/lib/ui';
import { fetchSmartFundNetValue } from '@/app/services/fund-api';
import type {
  FeeMode,
  FundData,
  Holding,
  PendingTrade,
  TradeType,
} from '@/app/types';

import { ConfirmModal } from '@/app/components/confirm-modal';

interface BaseTradeConfirmData {
  price: number;
  date: string;
  isAfter3pm: boolean;
}

export interface BuyTradeConfirmData extends BaseTradeConfirmData {
  share: number | null;
  totalCost: number;
  feeRate: number;
}

export interface SellTradeConfirmData extends BaseTradeConfirmData {
  share: number;
  feeMode: FeeMode;
  feeValue: string;
}

export type TradeConfirmData = BuyTradeConfirmData | SellTradeConfirmData;

interface TradeModalProps {
  type: TradeType;
  fund: FundData | null;
  holding: Holding | undefined;
  onClose: () => void;
  onConfirm: (data: TradeConfirmData) => void;
  pendingTrades?: PendingTrade[];
  onDeletePending?: (id: string) => void;
}

export function TradeModal({
  type,
  fund,
  holding,
  onClose,
  onConfirm,
  pendingTrades = [],
  onDeletePending,
}: TradeModalProps) {
  const isBuy = type === 'buy';
  const [amount, setAmount] = useState('');
  const [share, setShare] = useState('');
  const [feeRate, setFeeRate] = useState('0');
  const [feeMode, setFeeMode] = useState<FeeMode>('rate');
  const [feeValue, setFeeValue] = useState('0');
  const [date, setDate] = useState(() => formatDate());
  const [isAfter3pm, setIsAfter3pm] = useState(nowInTz().hour() >= 15);
  const [calcShare, setCalcShare] = useState<string | null>(null);
  const [price, setPrice] = useState(0);
  const [actualDate, setActualDate] = useState<string | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPendingList, setShowPendingList] = useState(false);
  const [revokeTrade, setRevokeTrade] = useState<PendingTrade | null>(null);

  const currentPendingTrades = useMemo(() => {
    return pendingTrades.filter((trade) => trade.fundCode === fund?.code);
  }, [fund, pendingTrades]);

  const pendingSellShare = useMemo(() => {
    return currentPendingTrades
      .filter((trade) => trade.type === 'sell')
      .reduce((acc, trade) => acc + (Number(trade.share) || 0), 0);
  }, [currentPendingTrades]);

  const availableShare = holding
    ? Math.max(0, holding.share - pendingSellShare)
    : 0;

  useEffect(() => {
    if (showPendingList && currentPendingTrades.length === 0) {
      setShowPendingList(false);
    }
  }, [currentPendingTrades, showPendingList]);

  useEffect(() => {
    const estimatePrice = (() => {
      if (
        fund?.estPricedCoverage &&
        fund.estPricedCoverage > 0.05 &&
        fund?.estGsz
      ) {
        return fund.estGsz;
      }
      if (typeof fund?.gsz === 'number') return fund.gsz;
      return Number(fund?.dwjz) || 0;
    })();

    setPrice(estimatePrice);
  }, [fund]);

  useEffect(() => {
    if (!date || !fund?.code) return;

    setLoadingPrice(true);
    setActualDate(null);

    let queryDate = date;
    if (isAfter3pm) {
      queryDate = toTz(date).add(1, 'day').format('YYYY-MM-DD');
    }

    fetchSmartFundNetValue(fund.code, queryDate)
      .then((result) => {
        if (result) {
          setPrice(result.value);
          setActualDate(result.date);
          return;
        }

        setPrice(0);
        setActualDate(null);
      })
      .finally(() => setLoadingPrice(false));
  }, [date, fund, isAfter3pm]);

  useEffect(() => {
    if (!isBuy) return;

    const parsedAmount = parseFloat(amount);
    const parsedFeeRate = parseFloat(feeRate);

    if (parsedAmount > 0 && !isNaN(parsedFeeRate)) {
      if (price > 0) {
        const nextShare = parsedAmount / (1 + parsedFeeRate / 100) / price;
        setCalcShare(nextShare.toFixed(2));
      } else {
        setCalcShare('待确认');
      }
      return;
    }

    setCalcShare(null);
  }, [amount, feeRate, isBuy, price]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBuy) {
      if (!amount || !feeRate || !date || calcShare === null) return;
    } else if (!share || !date) {
      return;
    }

    setShowConfirm(true);
  };

  const handleFinalConfirm = () => {
    if (isBuy) {
      onConfirm({
        share: calcShare === '待确认' ? null : Number(calcShare),
        price: Number(price),
        totalCost: Number(amount),
        date,
        isAfter3pm,
        feeRate: Number(feeRate),
      });
      return;
    }

    onConfirm({
      share: Number(share),
      price: Number(price),
      date: actualDate || date,
      isAfter3pm,
      feeMode,
      feeValue,
    });
  };

  const isValid = isBuy
    ? !!amount && !!feeRate && !!date && calcShare !== null
    : !!share && !!date;

  const sellAmount = (Number(share) || 0) * (price || 0);
  const sellFee =
    feeMode === 'rate'
      ? sellAmount * ((Number(feeValue) || 0) / 100)
      : Number(feeValue) || 0;
  const estimatedReturn = sellAmount - sellFee;

  const timeToggleClass = (active: boolean) =>
    cn(
      'flex-1 rounded-md px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--ui-focus-ring)]',
      active
        ? 'bg-primary text-interactive-contrast'
        : 'text-muted hover:bg-surface-soft hover:text-text',
    );

  return (
    <motion.div
      className={modalOverlayClass}
      role="dialog"
      aria-modal="true"
      aria-label={isBuy ? '加仓' : '减仓'}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={cn(modalCardClass, 'max-w-[420px]')}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={modalHeaderClass}>
          <div className={titleRowClass}>
            <span
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-xl border',
                isBuy
                  ? 'border-[color:var(--ui-primary-border)] bg-primary-soft text-primary'
                  : 'border-[color:var(--ui-danger-border)] bg-danger-soft text-danger',
              )}
              aria-hidden="true"
            >
              {showConfirm ? (
                <SwitchIcon width="18" height="18" />
              ) : isBuy ? (
                <PlusIcon width="18" height="18" />
              ) : (
                <MinusIcon width="18" height="18" />
              )}
            </span>
            <span>
              {showConfirm
                ? isBuy
                  ? '买入确认'
                  : '卖出确认'
                : isBuy
                  ? '加仓'
                  : '减仓'}
            </span>
          </div>
          <button className={iconButtonGhostClass} onClick={onClose}>
            <CloseIcon width="20" height="20" />
          </button>
        </div>

        {!showConfirm && currentPendingTrades.length > 0 && (
          <div className="mb-4 rounded-lg border border-warning-border bg-warning-soft px-3 py-2 text-xs">
            <button
              type="button"
              onClick={() => setShowPendingList((prev) => !prev)}
              className="text-warning"
            >
              当前有 {currentPendingTrades.length} 笔待处理交易
            </button>
          </div>
        )}

        {showPendingList && !showConfirm && (
          <div className="mb-4 max-h-[180px] overflow-y-auto">
            {currentPendingTrades.map((trade) => (
              <div
                key={trade.id}
                className="mb-2 rounded-lg bg-surface-soft p-3 last:mb-0"
              >
                <div className="flex items-center justify-between">
                  <span>{trade.type === 'buy' ? '买入' : '卖出'}</span>
                  <span className="text-xs text-muted">{trade.date}</span>
                </div>
                <div className="mt-1 text-xs text-muted">
                  {trade.share ? `${trade.share} 份` : `¥${trade.amount}`}
                </div>
                <button
                  type="button"
                  className={cn(secondaryButtonClass, 'mt-2 h-8 px-3 text-xs')}
                  onClick={() => setRevokeTrade(trade)}
                >
                  撤销
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mb-4">
          <div className="mb-1 text-base font-semibold">{fund?.name}</div>
          <div className="text-xs text-muted">#{fund?.code}</div>
        </div>

        {showConfirm ? (
          <div className="grid gap-3">
            <div className="rounded-xl bg-surface-soft p-4 text-sm">
              {isBuy ? (
                <>
                  <SummaryRow
                    label="买入金额"
                    value={`¥${Number(amount).toFixed(2)}`}
                  />
                  <SummaryRow label="费率" value={`${feeRate}%`} />
                  <SummaryRow
                    label="预估份额"
                    value={
                      calcShare === '待确认' ? '待确认' : `${calcShare} 份`
                    }
                  />
                </>
              ) : (
                <>
                  <SummaryRow
                    label="卖出份额"
                    value={`${Number(share).toFixed(2)} 份`}
                  />
                  <SummaryRow
                    label="预计回款"
                    value={price ? `¥${estimatedReturn.toFixed(2)}` : '待计算'}
                  />
                  <SummaryRow
                    label="费用"
                    value={feeMode === 'rate' ? `${feeValue}%` : `¥${feeValue}`}
                  />
                </>
              )}
              <SummaryRow
                label="参考净值"
                value={
                  loadingPrice
                    ? '查询中...'
                    : price
                      ? price.toFixed(4)
                      : '待查询'
                }
              />
              <SummaryRow label="日期" value={date} />
              {!isBuy && holding && (
                <div className="mt-2 text-xs text-muted">
                  当前持仓 {holding.share.toFixed(2)} 份，可卖{' '}
                  {availableShare.toFixed(2)} 份
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                className={cn(secondaryButtonClass, 'flex-1')}
                onClick={() => setShowConfirm(false)}
              >
                返回修改
              </button>
              <button
                type="button"
                className={cn(
                  isBuy
                    ? primaryButtonClass
                    : `${secondaryButtonClass} flex-1 border-[color:var(--ui-danger-border)] bg-danger-soft text-danger hover:bg-danger-soft`,
                )}
                onClick={handleFinalConfirm}
                disabled={loadingPrice}
              >
                {isBuy ? '确认买入' : '确认卖出'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {isBuy ? (
              <>
                <div className="mb-4">
                  <label className="mb-2 block text-sm text-muted">
                    加仓金额
                  </label>
                  <NumericInput
                    value={amount}
                    onChange={setAmount}
                    step={100}
                    min={0}
                    placeholder="请输入加仓金额"
                  />
                </div>
                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-muted">
                      买入费率 (%)
                    </label>
                    <NumericInput
                      value={feeRate}
                      onChange={setFeeRate}
                      step={0.01}
                      min={0}
                      placeholder="0.12"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-muted">
                      买入日期
                    </label>
                    <DatePicker value={date} onChange={setDate} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <label className="mb-2 block text-sm text-muted">
                    卖出份额
                  </label>
                  <NumericInput
                    value={share}
                    onChange={setShare}
                    step={1}
                    min={0}
                    placeholder={
                      holding
                        ? `最多可卖 ${availableShare.toFixed(2)} 份`
                        : '请输入卖出份额'
                    }
                  />
                  {holding && (
                    <div className="mt-1.5 text-xs text-muted">
                      当前持仓: {holding.share.toFixed(2)} 份
                      {pendingSellShare > 0 &&
                        `，冻结 ${pendingSellShare.toFixed(2)} 份`}
                    </div>
                  )}
                </div>
                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-muted">
                      {feeMode === 'rate' ? '卖出费率 (%)' : '卖出费用 (¥)'}
                    </label>
                    <NumericInput
                      value={feeValue}
                      onChange={setFeeValue}
                      step={feeMode === 'rate' ? 0.01 : 1}
                      min={0}
                      placeholder="0.00"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFeeMode((mode) =>
                          mode === 'rate' ? 'amount' : 'rate',
                        )
                      }
                      className="mt-2 text-xs text-primary"
                    >
                      切换为{feeMode === 'rate' ? '金额' : '费率'}
                    </button>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-muted">
                      卖出日期
                    </label>
                    <DatePicker value={date} onChange={setDate} />
                  </div>
                </div>
              </>
            )}

            <div className="mb-4">
              <label className="mb-2 block text-sm text-muted">交易时段</label>
              <div className="flex gap-2 rounded-lg bg-surface-inset p-1">
                <button
                  type="button"
                  onClick={() => setIsAfter3pm(false)}
                  className={timeToggleClass(!isAfter3pm)}
                >
                  15:00前
                </button>
                <button
                  type="button"
                  onClick={() => setIsAfter3pm(true)}
                  className={timeToggleClass(isAfter3pm)}
                >
                  15:00后
                </button>
              </div>
            </div>

            <div className="mb-4 text-xs text-muted">
              {loadingPrice
                ? '正在查询净值数据...'
                : price
                  ? `参考净值: ${price.toFixed(4)}`
                  : '暂未拿到净值，确认后会进入待处理队列'}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                className={cn(secondaryButtonClass, 'flex-1')}
                onClick={onClose}
              >
                取消
              </button>
              <button
                type="submit"
                className={cn(primaryButtonClass, 'flex-1')}
                disabled={!isValid || loadingPrice}
              >
                确定
              </button>
            </div>
          </form>
        )}
      </motion.div>

      <AnimatePresence>
        {revokeTrade && (
          <ConfirmModal
            title="撤销交易"
            message={`确定要撤销这笔 ${revokeTrade.share ? `${revokeTrade.share}份` : `¥${revokeTrade.amount}`} 的${revokeTrade.type === 'buy' ? '买入' : '卖出'}申请吗？`}
            onConfirm={() => {
              onDeletePending?.(revokeTrade.id);
              setRevokeTrade(null);
            }}
            onCancel={() => setRevokeTrade(null)}
            confirmText="确认撤销"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}

