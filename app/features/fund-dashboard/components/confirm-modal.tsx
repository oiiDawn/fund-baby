'use client';

import { motion } from 'framer-motion';

import { cn } from '@/app/lib/cn';
import {
  dangerButtonClass,
  modalCardClass,
  modalOverlayClass,
  secondaryButtonClass,
} from '@/app/lib/ui';

import { TrashIcon } from '@/app/components/icons';

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
}

export function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = '确定删除',
}: ConfirmModalProps) {
  return (
    <motion.div
      className={cn(modalOverlayClass, 'z-[10002]')}
      role="dialog"
      aria-modal="true"
      onClick={(event) => {
        event.stopPropagation();
        onCancel();
      }}
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
        <div className="mb-3 flex items-center gap-2.5 text-base font-semibold">
          <TrashIcon width="20" height="20" className="text-danger" />
          <span>{title}</span>
        </div>
        <p className="mb-6 text-sm leading-6 text-muted">{message}</p>
        <div className="flex gap-3">
          <button
            className={cn(secondaryButtonClass, 'flex-1')}
            onClick={onCancel}
          >
            取消
          </button>
          <button
            className={cn(dangerButtonClass, 'flex-1')}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
