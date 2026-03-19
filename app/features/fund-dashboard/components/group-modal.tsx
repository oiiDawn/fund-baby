'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/app/lib/cn';
import {
  iconButtonGhostClass,
  inputClass,
  modalCardClass,
  modalHeaderClass,
  modalOverlayClass,
  primaryButtonClass,
  secondaryButtonClass,
  titleRowClass,
} from '@/app/lib/ui';

import { CloseIcon, PlusIcon } from '@/app/components/icons';

interface GroupModalProps {
  onClose: () => void;
  onConfirm: (name: string) => void;
}

export function GroupModal({ onClose, onConfirm }: GroupModalProps) {
  const [name, setName] = useState('');

  return (
    <motion.div
      className={modalOverlayClass}
      role="dialog"
      aria-modal="true"
      aria-label="新增分组"
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
            <PlusIcon width="20" height="20" />
            <span>新增分组</span>
          </div>
          <button className={iconButtonGhostClass} onClick={onClose}>
            <CloseIcon width="20" height="20" />
          </button>
        </div>
        <div className="mb-5">
          <label className="mb-2 block text-sm text-muted">
            分组名称（最多 8 个字）
          </label>
          <input
            className={inputClass}
            autoFocus
            placeholder="请输入分组名称..."
            value={name}
            onChange={(event) => {
              const value = event.target.value || '';
              setName(value.slice(0, 8));
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && name.trim()) onConfirm(name.trim());
            }}
          />
        </div>
        <div className="flex gap-3">
          <button
            className={cn(secondaryButtonClass, 'flex-1')}
            onClick={onClose}
          >
            取消
          </button>
          <button
            className={cn(primaryButtonClass, 'flex-1')}
            onClick={() => name.trim() && onConfirm(name.trim())}
            disabled={!name.trim()}
          >
            确定
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
