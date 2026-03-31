'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownIcon, ArrowUpIcon, Repeat2Icon } from 'lucide-react';

import { DatePicker, NumericInput } from '@/app/components/common';
import { ConfirmModal } from '@/app/components/confirm-modal';
import { formatDate, nowInTz, toTz } from '@/app/lib/date';
import { fetchSmartFundNetValue } from '@/app/services/fund-api';
import { getFundValuationSnapshot } from '@/app/services/fund-trade';
import type {
  FeeMode,
  FundData,
  Holding,
  PendingTrade,
  TradeType,
} from '@/app/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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
    const valuation = fund ? getFundValuationSnapshot(fund) : null;
    setPrice(valuation?.nav ?? 0);
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

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[460px] border-border bg-popover text-popover-foreground"
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className={`flex size-10 items-center justify-center rounded-xl ${
                  isBuy
                    ? 'bg-primary/12 text-primary'
                    : 'bg-destructive/12 text-destructive'
                }`}
              >
                {showConfirm ? (
                  <Repeat2Icon />
                ) : isBuy ? (
                  <ArrowUpIcon />
                ) : (
                  <ArrowDownIcon />
                )}
              </div>
              <div>
                <DialogTitle>
                  {showConfirm
                    ? isBuy
                      ? '买入确认'
                      : '卖出确认'
                    : isBuy
                      ? '加仓'
                      : '减仓'}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {fund?.name} · #{fund?.code}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {!showConfirm && currentPendingTrades.length > 0 ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-300">
              <button
                type="button"
                onClick={() => setShowPendingList((prev) => !prev)}
              >
                当前有 {currentPendingTrades.length} 笔待处理交易
              </button>
            </div>
          ) : null}

          {showPendingList && !showConfirm ? (
            <div className="grid max-h-[180px] gap-2 overflow-y-auto">
              {currentPendingTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="rounded-xl border border-border bg-background/60 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {trade.type === 'buy' ? '买入' : '卖出'}
                      </span>
                      {trade.sourceType === 'dca' ? (
                        <Badge variant="outline">定投</Badge>
                      ) : null}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {trade.date}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {trade.share ? `${trade.share} 份` : `¥${trade.amount}`}
                  </div>
                  {trade.sourceType === 'dca' ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      由定投计划自动生成
                    </div>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setRevokeTrade(trade)}
                  >
                    撤销
                  </Button>
                </div>
              ))}
            </div>
          ) : null}

          {showConfirm ? (
            <div className="grid gap-4">
              <div className="rounded-2xl border border-border bg-background/60 p-4 text-sm">
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
                      value={
                        price ? `¥${estimatedReturn.toFixed(2)}` : '待计算'
                      }
                    />
                    <SummaryRow
                      label="费用"
                      value={
                        feeMode === 'rate' ? `${feeValue}%` : `¥${feeValue}`
                      }
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
                <SummaryRow label="日期" value={actualDate || date} />
                {!isBuy && holding ? (
                  <div className="mt-3 text-xs text-muted-foreground">
                    当前持仓 {holding.share.toFixed(2)} 份，可卖{' '}
                    {availableShare.toFixed(2)} 份
                  </div>
                ) : null}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirm(false)}
                >
                  返回修改
                </Button>
                <Button
                  type="button"
                  variant={isBuy ? 'default' : 'destructive'}
                  className="flex-1"
                  onClick={handleFinalConfirm}
                  disabled={loadingPrice}
                >
                  {isBuy ? '确认买入' : '确认卖出'}
                </Button>
              </div>
            </div>
          ) : (
            <form className="grid gap-4" onSubmit={handleSubmit}>
              {isBuy ? (
                <>
                  <label className="grid gap-2 text-sm">
                    <span className="text-muted-foreground">加仓金额</span>
                    <NumericInput
                      value={amount}
                      onChange={setAmount}
                      step={100}
                      min={0}
                      placeholder="请输入加仓金额"
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm">
                      <span className="text-muted-foreground">
                        买入费率 (%)
                      </span>
                      <NumericInput
                        value={feeRate}
                        onChange={setFeeRate}
                        step={0.01}
                        min={0}
                        placeholder="0.12"
                      />
                    </label>
                    <label className="grid gap-2 text-sm">
                      <span className="text-muted-foreground">买入日期</span>
                      <DatePicker value={date} onChange={setDate} />
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <label className="grid gap-2 text-sm">
                    <span className="text-muted-foreground">卖出份额</span>
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
                    {holding ? (
                      <span className="text-xs text-muted-foreground">
                        当前持仓: {holding.share.toFixed(2)} 份
                        {pendingSellShare > 0
                          ? `，冻结 ${pendingSellShare.toFixed(2)} 份`
                          : ''}
                      </span>
                    ) : null}
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {feeMode === 'rate' ? '卖出费率 (%)' : '卖出费用 (¥)'}
                      </span>
                      <NumericInput
                        value={feeValue}
                        onChange={setFeeValue}
                        step={feeMode === 'rate' ? 0.01 : 1}
                        min={0}
                        placeholder="0.00"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="justify-start px-0 text-primary hover:bg-transparent"
                        onClick={() =>
                          setFeeMode((mode) =>
                            mode === 'rate' ? 'amount' : 'rate',
                          )
                        }
                      >
                        切换为{feeMode === 'rate' ? '金额' : '费率'}
                      </Button>
                    </label>
                    <label className="grid gap-2 text-sm">
                      <span className="text-muted-foreground">卖出日期</span>
                      <DatePicker value={date} onChange={setDate} />
                    </label>
                  </div>
                </>
              )}

              <div className="grid gap-2">
                <span className="text-sm text-muted-foreground">交易时段</span>
                <ToggleGroup
                  type="single"
                  value={isAfter3pm ? 'after' : 'before'}
                  onValueChange={(value) => {
                    if (value === 'before') setIsAfter3pm(false);
                    if (value === 'after') setIsAfter3pm(true);
                  }}
                  className="grid w-full grid-cols-2 gap-2"
                >
                  <ToggleGroupItem value="before" className="h-10 rounded-xl">
                    15:00前
                  </ToggleGroupItem>
                  <ToggleGroupItem value="after" className="h-10 rounded-xl">
                    15:00后
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <Separator />

              <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-3 py-2">
                <span className="text-sm text-muted-foreground">参考净值</span>
                <Badge variant="outline">
                  {loadingPrice
                    ? '查询中...'
                    : price
                      ? price.toFixed(4)
                      : '待查询'}
                </Badge>
              </div>

              <div className="text-xs text-muted-foreground">
                {loadingPrice
                  ? '正在查询净值数据...'
                  : price
                    ? `已按 ${actualDate || date} 的净值估算交易。`
                    : '暂未拿到净值，确认后会进入待处理队列。'}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!isValid || loadingPrice}
                >
                  确定
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {revokeTrade ? (
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
      ) : null}
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
