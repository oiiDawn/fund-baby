'use client';

import { cn } from '@/app/lib/cn';
import { activeChipClass, chipClass, panelClass } from '@/app/lib/ui';

import { GridIcon, ListIcon, SortIcon } from '@/app/components/icons';
import type { SortBy, SortOrder, ViewMode } from '@/app/types';

interface DashboardFilterBarProps {
  sortBy: SortBy;
  sortOrder: SortOrder;
  viewMode: ViewMode;
  onApplyViewMode: (mode: ViewMode) => void;
  onSetSortBy: (sortBy: SortBy) => void;
  onSetSortOrder: React.Dispatch<React.SetStateAction<SortOrder>>;
}

export function DashboardFilterBar({
  sortBy,
  sortOrder,
  viewMode,
  onApplyViewMode,
  onSetSortBy,
  onSetSortOrder,
}: DashboardFilterBarProps) {
  return (
    <div className={cn(panelClass, 'mb-3 rounded-[20px] px-4 py-3')}>
      <div className="mb-3 text-sm text-muted-strong">
        监控列表支持卡片与表格切换，并可按涨跌幅或持有收益排序。
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
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

