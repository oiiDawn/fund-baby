'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { FundData, Holding } from '@/app/types';

interface HoldingEditModalProps {
  fund: FundData | null;
  holding: Holding | undefined;
  onClose: () => void;
  onSave: (data: { share: number | null; cost: number | null }) => void;
}

export function HoldingEditModal({
  fund,
  holding,
  onClose,
  onSave,
}: HoldingEditModalProps) {
  const [mode, setMode] = useState<'amount' | 'share'>('amount');
  const dwjz = Number(fund?.dwjz || fund?.gsz || 0);

  const [share, setShare] = useState('');
  const [cost, setCost] = useState('');
  const [amount, setAmount] = useState('');
  const [profit, setProfit] = useState('');

  useEffect(() => {
    if (!holding) return;

    const nextShare = holding.share || 0;
    const nextCost = holding.cost || 0;
    setShare(String(nextShare));
    setCost(String(nextCost));

    if (dwjz > 0) {
      const nextAmount = nextShare * dwjz;
      const nextProfit = (dwjz - nextCost) * nextShare;
      setAmount(nextAmount.toFixed(2));
      setProfit(nextProfit.toFixed(2));
    }
  }, [dwjz, holding]);

  const handleModeChange = (newMode: 'amount' | 'share') => {
    if (newMode === mode) return;
    setMode(newMode);

    if (newMode === 'share') {
      if (amount && dwjz > 0) {
        const parsedAmount = parseFloat(amount);
        const parsedProfit = parseFloat(profit || '0');
        const nextShare = parsedAmount / dwjz;
        const principal = parsedAmount - parsedProfit;
        const nextCost = nextShare > 0 ? principal / nextShare : 0;

        setShare(nextShare.toFixed(2));
        setCost(nextCost.toFixed(4));
      }
      return;
    }

    if (share && dwjz > 0) {
      const parsedShare = parseFloat(share);
      const parsedCost = parseFloat(cost || '0');
      const nextAmount = parsedShare * dwjz;
      const nextProfit = (dwjz - parsedCost) * parsedShare;

      setAmount(nextAmount.toFixed(2));
      setProfit(nextProfit.toFixed(2));
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let finalShare = 0;
    let finalCost = 0;

    if (mode === 'share') {
      if (!share || !cost) return;
      finalShare = Number(Number(share).toFixed(2));
      finalCost = Number(cost);
    } else {
      if (!amount || !dwjz) return;
      const parsedAmount = Number(amount);
      const parsedProfit = Number(profit || 0);
      const rawShare = parsedAmount / dwjz;
      finalShare = Number(rawShare.toFixed(2));
      const principal = parsedAmount - parsedProfit;
      finalCost = finalShare > 0 ? principal / finalShare : 0;
    }

    onSave({
      share: finalShare,
      cost: finalCost,
    });
    onClose();
  };

  const isValid =
    mode === 'share'
      ? share && cost && !isNaN(Number(share)) && !isNaN(Number(cost))
      : amount &&
        !isNaN(Number(amount)) &&
        (!profit || !isNaN(Number(profit))) &&
        dwjz > 0;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[420px] border-border bg-popover text-popover-foreground"
      >
        <DialogHeader>
          <DialogTitle>设置持仓</DialogTitle>
          <DialogDescription>
            {fund?.name} · #{fund?.code}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-3">
          <span className="text-sm text-muted-foreground">最新净值</span>
          <Badge>{dwjz || '—'}</Badge>
        </div>

        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => {
            if (value === 'amount' || value === 'share')
              handleModeChange(value);
          }}
          className="grid w-full grid-cols-2 gap-2"
        >
          <ToggleGroupItem value="amount" className="h-10 rounded-xl">
            按金额
          </ToggleGroupItem>
          <ToggleGroupItem value="share" className="h-10 rounded-xl">
            按份额
          </ToggleGroupItem>
        </ToggleGroup>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          {mode === 'amount' ? (
            <>
              <label className="grid gap-2 text-sm">
                <span className="text-muted-foreground">持有金额</span>
                <Input
                  type="number"
                  step="any"
                  className="h-10 rounded-xl border-border bg-background/70"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="请输入持有总金额"
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-muted-foreground">持有收益</span>
                <Input
                  type="number"
                  step="any"
                  className="h-10 rounded-xl border-border bg-background/70"
                  value={profit}
                  onChange={(event) => setProfit(event.target.value)}
                  placeholder="请输入持有总收益"
                />
              </label>
            </>
          ) : (
            <>
              <label className="grid gap-2 text-sm">
                <span className="text-muted-foreground">持有份额</span>
                <Input
                  type="number"
                  step="any"
                  className="h-10 rounded-xl border-border bg-background/70"
                  value={share}
                  onChange={(event) => setShare(event.target.value)}
                  placeholder="请输入持有份额"
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-muted-foreground">持仓成本价</span>
                <Input
                  type="number"
                  step="any"
                  className="h-10 rounded-xl border-border bg-background/70"
                  value={cost}
                  onChange={(event) => setCost(event.target.value)}
                  placeholder="请输入持仓成本价"
                />
              </label>
            </>
          )}

          <DialogFooter className="bg-transparent p-0 pt-2">
            <Button variant="outline" onClick={onClose} type="button">
              取消
            </Button>
            <Button type="submit" disabled={!isValid}>
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
