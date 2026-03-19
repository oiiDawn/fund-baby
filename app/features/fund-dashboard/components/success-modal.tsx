'use client';

import { motion } from 'framer-motion';

import { cn } from '@/app/lib/cn';
import {
  modalCardClass,
  modalOverlayClass,
  primaryButtonClass,
} from '@/app/lib/ui';

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
          <div className="mb-4 text-5xl">🎉</div>
          <h3 className="mb-2 text-lg font-semibold">{message}</h3>
          <p className="text-sm text-muted">操作已完成，您可以继续使用。</p>
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
