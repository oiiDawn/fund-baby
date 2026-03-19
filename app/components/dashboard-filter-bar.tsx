'use client';

import { cn } from '@/app/lib/cn';
import {
  activeChipClass,
  activeTabClass,
  chipClass,
  panelClass,
  tabClass,
} from '@/app/lib/ui';

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
    <div
      className={cn(
        panelClass,
        'h-full rounded-[24px] px-5 py-5 md:px-6 md:py-6',
      )}
    >
      <div className="flex h-full flex-col gap-5">
        <div className="space-y-1.5">
          <div className="ui-overline text-muted">List Controls</div>
          <h2 className="text-base font-semibold tracking-[0.01em]">
            选择浏览方式与排序节奏
          </h2>
          <p className="text-sm leading-6 text-muted-strong">
            先决定看卡片还是列表，再按涨跌幅或持有收益切换主观察维度。
          </p>
        </div>

        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-muted">
              <GridIcon width="14" height="14" />
              视图
            </div>
            <div className="flex rounded-xl border border-border bg-transparent p-1">
              <button
                className={cn(
                  tabClass,
                  'h-10 flex-1 rounded-[10px] border-transparent px-0',
                  viewMode === 'card' && activeTabClass,
                )}
                onClick={() => onApplyViewMode('card')}
                title="卡片视图"
              >
                <GridIcon width="16" height="16" />
              </button>
              <button
                className={cn(
                  tabClass,
                  'h-10 flex-1 rounded-[10px] border-transparent px-0',
                  viewMode === 'list' && activeTabClass,
                )}
                onClick={() => onApplyViewMode('list')}
                title="表格视图"
              >
                <ListIcon width="16" height="16" />
              </button>
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-muted">
              <SortIcon width="14" height="14" />
              排序
            </div>
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
    </div>
  );
}
