'use client';

import { motion } from 'framer-motion';

import { cn } from '@/app/lib/cn';
import {
  badgeClass,
  iconButtonGhostClass,
  listItemClass,
  modalCardClass,
  modalHeaderClass,
  modalOverlayClass,
  primaryButtonClass,
  titleRowClass,
} from '@/app/lib/ui';

import { CloseIcon, UpdateIcon } from '@/app/components/icons';

interface AddResultModalProps {
  failures: { code: string; name?: string }[];
  onClose: () => void;
}

export function AddResultModal({ failures, onClose }: AddResultModalProps) {
  return (
    <motion.div
      className={modalOverlayClass}
      role="dialog"
      aria-modal="true"
      aria-label="添加结果"
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
        <div className={cn(modalHeaderClass, 'mb-3')}>
          <div className={titleRowClass}>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-warning-border bg-warning-soft text-warning">
              <UpdateIcon width="18" height="18" />
            </span>
            <span>部分未添加</span>
          </div>
          <button className={iconButtonGhostClass} onClick={onClose}>
            <CloseIcon width="20" height="20" />
          </button>
        </div>
        <div className="mb-3 text-sm text-muted">
          以下基金暂无估值：
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {failures.map((item, index) => (
            <div className={listItemClass} key={index}>
              <span className="truncate">{item.name || '未知名称'}</span>
              <div>
                <span className={badgeClass}>#{item.code}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button className={primaryButtonClass} onClick={onClose}>
            关闭
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
