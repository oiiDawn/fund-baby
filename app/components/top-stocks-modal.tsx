'use client';

import { motion } from 'framer-motion';

import { cn } from '@/app/lib/cn';
import {
  badgeClass,
  iconButtonGhostClass,
  modalCardClass,
  modalHeaderClass,
  modalOverlayClass,
  primaryButtonClass,
  titleRowClass,
} from '@/app/lib/ui';

import { CloseIcon, TrendLineIcon } from '@/app/components/icons';
import type { FundData } from '@/app/types';

interface TopStocksModalProps {
  fund: FundData | null;
  onClose: () => void;
}

export function TopStocksModal({ fund, onClose }: TopStocksModalProps) {
  return (
    <motion.div
      className={modalOverlayClass}
      role="dialog"
      aria-modal="true"
      aria-label="前10重仓股票"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={cn(modalCardClass, 'max-w-[520px] p-6')}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={modalHeaderClass}>
          <div className={titleRowClass}>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--ui-primary-border)] bg-primary-soft text-primary">
              <TrendLineIcon width="18" height="18" />
            </span>
            <span>前10重仓股票</span>
          </div>
          <button className={iconButtonGhostClass} onClick={onClose}>
            <CloseIcon width="20" height="20" />
          </button>
        </div>

        <div className="mb-4">
          <div className="mb-1 text-base font-semibold">{fund?.name}</div>
          <div className="text-xs text-muted">#{fund?.code}</div>
        </div>

        <div className="grid gap-2.5 text-[13px]">
          {Array.isArray(fund?.holdings) && fund.holdings.length > 0 ? (
            fund.holdings.map((holding, index) => (
              <div
                className="flex min-h-[52px] items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3.5 py-2.5"
                key={index}
              >
                <span className="truncate font-medium">{holding.name}</span>
                <div className="flex items-center gap-2">
                  {typeof holding.change === 'number' && (
                    <span
                      className={cn(
                        badgeClass,
                        holding.change > 0
                          ? 'text-up'
                          : holding.change < 0
                            ? 'text-down'
                            : '',
                      )}
                    >
                      {holding.change > 0 ? '+' : ''}
                      {holding.change.toFixed(2)}%
                    </span>
                  )}
                  <span className="text-xs text-muted">{holding.weight}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-5 text-center text-sm text-muted">
              暂无重仓数据
            </div>
          )}
        </div>

        <div className="mt-5 flex">
          <button
            className={cn(primaryButtonClass, 'w-full')}
            onClick={onClose}
          >
            关闭
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

