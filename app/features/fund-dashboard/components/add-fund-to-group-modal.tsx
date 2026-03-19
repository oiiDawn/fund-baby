'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/app/lib/cn';
import {
  checkboxCheckedClass,
  checkboxClass,
  iconButtonGhostClass,
  modalCardClass,
  modalHeaderClass,
  modalOverlayClass,
  panelClass,
  primaryButtonClass,
  secondaryButtonClass,
  titleRowClass,
} from '@/app/lib/ui';

import { CloseIcon, PlusIcon } from '@/app/components/icons';
import type { FundData } from '@/app/types';

interface AddFundToGroupModalProps {
  allFunds: FundData[];
  currentGroupCodes: string[];
  onClose: () => void;
  onAdd: (codes: string[]) => void;
}

export function AddFundToGroupModal({
  allFunds,
  currentGroupCodes,
  onClose,
  onAdd,
}: AddFundToGroupModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const availableFunds = (allFunds || []).filter(
    (fund) => !(currentGroupCodes || []).includes(fund.code),
  );

  const toggleSelect = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  return (
    <motion.div
      className={modalOverlayClass}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={cn(modalCardClass, 'max-w-[500px]')}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={modalHeaderClass}>
          <div className={titleRowClass}>
            <PlusIcon width="20" height="20" />
            <span>添加基金到分组</span>
          </div>
          <button className={iconButtonGhostClass} onClick={onClose}>
            <CloseIcon width="20" height="20" />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto pr-1">
          {availableFunds.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-border px-4 py-10 text-center text-muted">
              <p>所有基金已在该分组中</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {availableFunds.map((fund) => (
                <div
                  key={fund.code}
                  className={cn(
                    panelClass,
                    'flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 transition',
                    selected.has(fund.code) &&
                      'border-[rgba(103,167,255,0.24)] bg-primary-soft',
                  )}
                  onClick={() => toggleSelect(fund.code)}
                >
                  <div
                    className={cn(
                      checkboxClass,
                      selected.has(fund.code) && checkboxCheckedClass,
                    )}
                  >
                    {selected.has(fund.code) && (
                      <div className="h-2.5 w-1.5 rotate-45 border-b-2 border-r-2 border-interactive-contrast" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{fund.name}</div>
                    <div className="text-xs text-muted">#{fund.code}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            className={cn(secondaryButtonClass, 'flex-1')}
            onClick={onClose}
          >
            取消
          </button>
          <button
            className={cn(primaryButtonClass, 'flex-1')}
            onClick={() => onAdd(Array.from(selected))}
            disabled={selected.size === 0}
          >
            确定 ({selected.size})
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
