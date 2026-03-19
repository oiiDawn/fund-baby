'use client';

import { motion } from 'framer-motion';

import { cn } from '@/app/lib/cn';
import {
  badgeClass,
  modalCardClass,
  modalOverlayClass,
  primaryButtonClass,
} from '@/app/lib/ui';
import { CheckCircleIcon } from '@/app/components/icons';

interface SuccessModalProps {
  message: string;
  onClose: () => void;
}

export function SuccessModal({ message, onClose }: SuccessModalProps) {
  return (
    <motion.div
      className={modalOverlayClass}
      role="dialog"
      aria-modal="true"
      aria-label="成功提示"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={cn(modalCardClass, 'max-w-[360px]')}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="py-5 text-center">
          <div className="mb-4 flex justify-center">
            <div
              className={cn(
                badgeClass,
                'h-16 w-16 justify-center rounded-[20px] border-[color:var(--ui-primary-border)] bg-primary-soft text-primary',
              )}
            >
              <CheckCircleIcon width="30" height="30" />
            </div>
          </div>
          <h3 className="mb-2 text-lg font-semibold">{message}</h3>
          <p className="text-sm text-muted">操作已完成，状态已经同步更新。</p>
          <button
            className={cn(primaryButtonClass, 'mt-6 w-full')}
            onClick={onClose}
          >
            关闭
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
