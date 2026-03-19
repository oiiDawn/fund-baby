'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import { CloseIcon, SettingsIcon } from '@/app/components/icons';
import { cn } from '@/app/lib/cn';
import {
  badgeClass,
  iconButtonGhostClass,
  inputClass,
  modalCardClass,
  modalHeaderClass,
  modalOverlayClass,
  primaryButtonClass,
  secondaryButtonClass,
  titleRowClass,
} from '@/app/lib/ui';
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

  const tabClass = (active: boolean) =>
    cn(
      'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--ui-focus-ring)]',
      active
        ? 'bg-primary text-interactive-contrast'
        : 'text-muted hover:bg-surface-soft hover:text-text',
    );

  return (
    <motion.div
      className={modalOverlayClass}
      role="dialog"
      aria-modal="true"
      aria-label="编辑持仓"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={cn(modalCardClass, 'max-w-[400px]')}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={modalHeaderClass}>
          <div className={titleRowClass}>
            <SettingsIcon width="20" height="20" />
            <span>设置持仓</span>
          </div>
          <button className={iconButtonGhostClass} onClick={onClose}>
            <CloseIcon width="20" height="20" />
          </button>
        </div>

        <div className="mb-4">
          <div className="mb-1 text-base font-semibold">{fund?.name}</div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-muted">#{fund?.code}</div>
            <div className={cn(badgeClass, 'text-xs')}>
              最新净值：
              <span className="font-semibold text-primary">{dwjz}</span>
            </div>
          </div>
        </div>

        <div className="mb-5 rounded-xl bg-surface-soft p-1">
          <div className="flex gap-0">
            <button
              type="button"
              className={tabClass(mode === 'amount')}
              onClick={() => handleModeChange('amount')}
            >
              按金额
            </button>
            <button
              type="button"
              className={tabClass(mode === 'share')}
              onClick={() => handleModeChange('share')}
            >
              按份额
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'amount' ? (
            <>
              <div className="mb-4">
                <label className="mb-2 block text-sm text-muted">
                  持有金额 <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  className={cn(inputClass, !amount && 'border-danger')}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="请输入持有总金额"
                />
              </div>
              <div className="mb-6">
                <label className="mb-2 block text-sm text-muted">
                  持有收益
                </label>
                <input
                  type="number"
                  step="any"
                  className={inputClass}
                  value={profit}
                  onChange={(event) => setProfit(event.target.value)}
                  placeholder="请输入持有总收益 (可为负)"
                />
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <label className="mb-2 block text-sm text-muted">
                  持有份额 <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  className={cn(inputClass, !share && 'border-danger')}
                  value={share}
                  onChange={(event) => setShare(event.target.value)}
                  placeholder="请输入持有份额"
                />
              </div>
              <div className="mb-6">
                <label className="mb-2 block text-sm text-muted">
                  持仓成本价 <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  className={cn(inputClass, !cost && 'border-danger')}
                  value={cost}
                  onChange={(event) => setCost(event.target.value)}
                  placeholder="请输入持仓成本价"
                />
              </div>
            </>
          )}

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
              disabled={!isValid}
            >
              保存
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

