'use client';

import { motion } from 'framer-motion';

import { cn } from '@/app/lib/cn';
import {
  dangerButtonClass,
  iconButtonGhostClass,
  modalCardClass,
  modalHeaderClass,
  modalOverlayClass,
  primaryButtonClass,
  secondaryButtonClass,
  titleRowClass,
} from '@/app/lib/ui';

import { CloseIcon, SettingsIcon } from '@/app/components/icons';
import type { FundData } from '@/app/types';

interface HoldingActionModalProps {
  fund: FundData | null;
  onClose: () => void;
  onAction: (type: string) => void;
}

export function HoldingActionModal({
  fund,
  onClose,
  onAction,
}: HoldingActionModalProps) {
  return (
    <motion.div
      className={modalOverlayClass}
      role="dialog"
      aria-modal="true"
      aria-label="持仓操作"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={cn(modalCardClass, 'max-w-[320px]')}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={modalHeaderClass}>
          <div className={titleRowClass}>
            <SettingsIcon width="20" height="20" />
            <span>持仓操作</span>
          </div>
          <button className={iconButtonGhostClass} onClick={onClose}>
            <CloseIcon width="20" height="20" />
          </button>
        </div>

        <div className="mb-5 text-center">
          <div className="mb-1 text-base font-semibold">{fund?.name}</div>
          <div className="text-xs text-muted">#{fund?.code}</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            className={cn(
              primaryButtonClass,
              'border border-[rgba(143,167,188,0.24)] bg-primary-soft text-primary hover:bg-primary-soft',
            )}
            onClick={() => onAction('buy')}
          >
            加仓
          </button>
          <button
            className={cn(
              dangerButtonClass,
              'border border-[rgba(181,122,119,0.24)] bg-danger-soft text-danger hover:bg-danger-soft',
            )}
            onClick={() => onAction('sell')}
          >
            减仓
          </button>
          <button
            className={cn(secondaryButtonClass, 'col-span-2')}
            onClick={() => onAction('edit')}
          >
            编辑持仓
          </button>
          <button
            className={cn(dangerButtonClass, 'col-span-2 mt-2')}
            onClick={() => onAction('clear')}
          >
            清空持仓
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

