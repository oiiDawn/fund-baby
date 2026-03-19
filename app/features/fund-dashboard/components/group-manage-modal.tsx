'use client';

import { useState } from 'react';
import { AnimatePresence, Reorder, motion } from 'framer-motion';

import {
  CloseIcon,
  DragIcon,
  PlusIcon,
  SettingsIcon,
  TrashIcon,
} from '@/app/components/icons';
import { cn } from '@/app/lib/cn';
import { nowInTz } from '@/app/lib/date';
import {
  iconButtonClass,
  iconButtonDangerClass,
  iconButtonGhostClass,
  inputInsetClass,
  modalCardClass,
  modalHeaderClass,
  modalOverlayClass,
  panelClass,
  primaryButtonClass,
  titleRowClass,
} from '@/app/lib/ui';
import type { FundGroup } from '@/app/types';

import { ConfirmModal } from '@/app/features/fund-dashboard/components/confirm-modal';

interface GroupManageModalProps {
  groups: FundGroup[];
  onClose: () => void;
  onSave: (groups: FundGroup[]) => void;
}

export function GroupManageModal({
  groups,
  onClose,
  onSave,
}: GroupManageModalProps) {
  const [items, setItems] = useState<FundGroup[]>(groups);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleReorder = (newOrder: FundGroup[]) => {
    setItems(newOrder);
  };

  const handleRename = (id: string, newName: string) => {
    const truncatedName = (newName || '').slice(0, 8);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, name: truncatedName } : item,
      ),
    );
  };

  const handleDeleteClick = (id: string, name: string) => {
    const itemToDelete = items.find((item) => item.id === id);
    const isNew = !groups.find((group) => group.id === id);
    const isEmpty =
      itemToDelete && (!itemToDelete.codes || itemToDelete.codes.length === 0);

    if (isNew || isEmpty) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }

    setDeleteConfirm({ id, name });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    setItems((prev) => prev.filter((item) => item.id !== deleteConfirm.id));
    setDeleteConfirm(null);
  };

  const handleAddRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `group_${nowInTz().valueOf()}`,
        name: '',
        codes: [],
      },
    ]);
  };

  const handleConfirm = () => {
    const hasEmpty = items.some((item) => !item.name.trim());
    if (hasEmpty) return;
    onSave(items);
    onClose();
  };

  const isAllValid = items.every((item) => item.name.trim() !== '');

  return (
    <motion.div
      className={modalOverlayClass}
      role="dialog"
      aria-modal="true"
      aria-label="管理分组"
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
            <SettingsIcon width="20" height="20" />
            <span>管理分组</span>
          </div>
          <button className={iconButtonGhostClass} onClick={onClose}>
            <CloseIcon width="20" height="20" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {items.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-border px-4 py-10 text-center text-muted">
              <div className="mb-3 text-3xl opacity-50">📂</div>
              <p>暂无自定义分组</p>
            </div>
          ) : (
            <Reorder.Group
              axis="y"
              values={items}
              onReorder={handleReorder}
              className="grid gap-2"
            >
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <Reorder.Item
                    key={item.id}
                    value={item}
                    className={cn(
                      panelClass,
                      'flex items-center gap-3 rounded-2xl px-3 py-3',
                    )}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 35,
                      mass: 1,
                      layout: { duration: 0.2 },
                    }}
                  >
                    <div className="flex cursor-grab items-center px-1 text-muted active:cursor-grabbing">
                      <DragIcon width="18" height="18" />
                    </div>
                    <input
                      className={cn(
                        inputInsetClass,
                        'flex-1 border',
                        !item.name.trim() && 'border-danger',
                      )}
                      value={item.name}
                      onChange={(event) =>
                        handleRename(item.id, event.target.value)
                      }
                      placeholder="请输入分组名称..."
                    />
                    <button
                      className={cn(iconButtonClass, iconButtonDangerClass)}
                      onClick={() => handleDeleteClick(item.id, item.name)}
                      title="删除分组"
                    >
                      <TrashIcon width="16" height="16" />
                    </button>
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>
          )}
          <button
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-soft px-4 py-2.5 text-sm text-muted transition hover:border-border-strong hover:bg-surface-strong hover:text-text"
            onClick={handleAddRow}
          >
            <PlusIcon width="16" height="16" />
            <span>新增分组</span>
          </button>
        </div>

        <div className="mt-6">
          {!isAllValid && (
            <div className="mb-3 text-center text-sm text-danger">
              所有分组名称均不能为空
            </div>
          )}
          <button
            className={cn(primaryButtonClass, 'w-full')}
            onClick={handleConfirm}
            disabled={!isAllValid}
          >
            完成
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {deleteConfirm && (
          <ConfirmModal
            title="删除确认"
            message={`确定要删除分组 "${deleteConfirm.name}" 吗？分组内的基金不会被删除。`}
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
