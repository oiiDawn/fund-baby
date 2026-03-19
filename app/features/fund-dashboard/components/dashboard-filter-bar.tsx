'use client';

import type { RefObject } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '@/app/lib/cn';
import {
  activeChipClass,
  activeTabClass,
  chipClass,
  iconButtonClass,
  panelClass,
  tabClass,
} from '@/app/lib/ui';

import { GridIcon, ListIcon, PlusIcon, SortIcon } from '@/app/components/icons';
import type { FundGroup, SortBy, SortOrder, ViewMode } from '@/app/types';

interface DashboardFilterBarProps {
  canLeft: boolean;
  canRight: boolean;
  currentTab: string;
  favoritesSize: number;
  fundsLength: number;
  groups: FundGroup[];
  sortBy: SortBy;
  sortOrder: SortOrder;
  tabsRef: RefObject<HTMLDivElement | null>;
  viewMode: ViewMode;
  onApplyViewMode: (mode: ViewMode) => void;
  onHandleMouseDown: () => void;
  onHandleMouseLeaveOrUp: () => void;
  onHandleMouseMove: (event: React.MouseEvent) => void;
  onHandleWheel: (event: React.WheelEvent) => void;
  onOpenAddGroup: () => void;
  onOpenGroupManage: () => void;
  onSetCurrentTab: (tab: string) => void;
  onSetSortBy: (sortBy: SortBy) => void;
  onSetSortOrder: React.Dispatch<React.SetStateAction<SortOrder>>;
  onUpdateTabOverflow: () => void;
}

export function DashboardFilterBar({
  canLeft,
  canRight,
  currentTab,
  favoritesSize,
  fundsLength,
  groups,
  sortBy,
  sortOrder,
  tabsRef,
  viewMode,
  onApplyViewMode,
  onHandleMouseDown,
  onHandleMouseLeaveOrUp,
  onHandleMouseMove,
  onHandleWheel,
  onOpenAddGroup,
  onOpenGroupManage,
  onSetCurrentTab,
  onSetSortBy,
  onSetSortOrder,
  onUpdateTabOverflow,
}: DashboardFilterBarProps) {
  return (
    <div className={cn(panelClass, 'mb-3 rounded-[20px] px-4 py-3')}>
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="min-w-0 flex-1 overflow-hidden"
          data-mask-left={canLeft}
          data-mask-right={canRight}
        >
          <div
            className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]"
            ref={tabsRef}
            onMouseDown={onHandleMouseDown}
            onMouseLeave={onHandleMouseLeaveOrUp}
            onMouseUp={onHandleMouseLeaveOrUp}
            onMouseMove={onHandleMouseMove}
            onWheel={onHandleWheel}
            onScroll={onUpdateTabOverflow}
          >
            <AnimatePresence mode="popLayout">
              <motion.button
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                key="all"
                className={cn(tabClass, currentTab === 'all' && activeTabClass)}
                onClick={() => onSetCurrentTab('all')}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 30,
                  mass: 1,
                }}
              >
                全部 ({fundsLength})
              </motion.button>
              <motion.button
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                key="fav"
                className={cn(tabClass, currentTab === 'fav' && activeTabClass)}
                onClick={() => onSetCurrentTab('fav')}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 30,
                  mass: 1,
                }}
              >
                自选 ({favoritesSize})
              </motion.button>
              {groups.map((group) => (
                <motion.button
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key={group.id}
                  className={cn(
                    tabClass,
                    currentTab === group.id && activeTabClass,
                  )}
                  onClick={() => onSetCurrentTab(group.id)}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                    mass: 1,
                  }}
                >
                  {group.name} ({group.codes.length})
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>
        {groups.length > 0 && (
          <button
            className={iconButtonClass}
            onClick={onOpenGroupManage}
            title="管理分组"
          >
            <SortIcon width="16" height="16" />
          </button>
        )}
        <button
          className={iconButtonClass}
          onClick={onOpenAddGroup}
          title="新增分组"
        >
          <PlusIcon width="16" height="16" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3">
        <div className="flex rounded-md border border-border bg-transparent p-0.5">
          <button
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-[4px] transition',
              viewMode === 'card'
                ? 'bg-primary text-interactive-contrast'
                : 'text-muted',
            )}
            onClick={() => onApplyViewMode('card')}
            title="卡片视图"
          >
            <GridIcon width="16" height="16" />
          </button>
          <button
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-[4px] transition',
              viewMode === 'list'
                ? 'bg-primary text-interactive-contrast'
                : 'text-muted',
            )}
            onClick={() => onApplyViewMode('list')}
            title="表格视图"
          >
            <ListIcon width="16" height="16" />
          </button>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-muted">
            <SortIcon width="14" height="14" />
            排序
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'default' as SortBy, label: '默认' },
              { id: 'yield' as SortBy, label: '涨跌幅' },
              { id: 'holding' as SortBy, label: '持有收益' },
            ].map((sortItem) => (
              <button
                key={sortItem.id}
                className={cn(
                  chipClass,
                  sortBy === sortItem.id && activeChipClass,
                )}
                onClick={() => {
                  if (sortBy === sortItem.id) {
                    onSetSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                  } else {
                    onSetSortBy(sortItem.id);
                    onSetSortOrder('desc');
                  }
                }}
              >
                <span>{sortItem.label}</span>
                {sortItem.id !== 'default' && sortBy === sortItem.id && (
                  <span className="inline-flex flex-col text-[8px] leading-none">
                    <span
                      className={
                        sortOrder === 'asc' ? 'opacity-100' : 'opacity-30'
                      }
                    >
                      ▲
                    </span>
                    <span
                      className={
                        sortOrder === 'desc' ? 'opacity-100' : 'opacity-30'
                      }
                    >
                      ▼
                    </span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
