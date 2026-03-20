'use client';

import {
  ArrowDownWideNarrowIcon,
  LayoutGridIcon,
  Rows4Icon,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { SortBy, SortOrder, ViewMode } from '@/app/types';

interface DashboardFilterBarProps {
  sortBy: SortBy;
  sortOrder: SortOrder;
  viewMode: ViewMode;
  onApplyViewMode: (mode: ViewMode) => void;
  onSetSortBy: (sortBy: SortBy) => void;
  onSetSortOrder: React.Dispatch<React.SetStateAction<SortOrder>>;
}

const sortOptions: Array<{ id: SortBy; label: string }> = [
  { id: 'default', label: '默认' },
  { id: 'yield', label: '涨跌幅' },
  { id: 'holding', label: '持有收益' },
];

export function DashboardFilterBar({
  sortBy,
  sortOrder,
  viewMode,
  onApplyViewMode,
  onSetSortBy,
  onSetSortOrder,
}: DashboardFilterBarProps) {
  return (
    <Card className="h-full border-border bg-card/95 shadow-panel">
      <CardHeader className="gap-1 border-b border-border/70 pb-4">
        <CardTitle className="text-base">查看</CardTitle>
        <CardDescription className="text-sm">
          切换视图和收益排序。
        </CardDescription>
      </CardHeader>

      <CardContent className="grid flex-1 content-start gap-4 pt-4">
        <section className="grid gap-2.5">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground">
            <LayoutGridIcon className="size-3.5" />
            视图
          </div>
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(next) => {
              if (next === 'card' || next === 'list') onApplyViewMode(next);
            }}
            className="grid w-full grid-cols-2 gap-2"
          >
            <ToggleGroupItem value="card" className="h-10 rounded-2xl">
              <LayoutGridIcon />
              卡片
            </ToggleGroupItem>
            <ToggleGroupItem value="list" className="h-10 rounded-2xl">
              <Rows4Icon />
              列表
            </ToggleGroupItem>
          </ToggleGroup>
        </section>

        <section className="grid gap-2.5 border-t border-border/70 pt-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground">
            <ArrowDownWideNarrowIcon className="size-3.5" />
            排序
          </div>
          <ToggleGroup
            type="single"
            value={sortBy}
            onValueChange={(next) => {
              if (!next) return;
              if (next === sortBy) {
                onSetSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                return;
              }
              onSetSortBy(next as SortBy);
              onSetSortOrder('desc');
            }}
            className="grid w-full grid-cols-3 gap-2"
          >
            {sortOptions.map((sortItem) => (
              <ToggleGroupItem
                key={sortItem.id}
                value={sortItem.id}
                className="h-10 rounded-2xl px-2 text-xs"
              >
                <span className="truncate">{sortItem.label}</span>
                {sortItem.id !== 'default' && sortBy === sortItem.id ? (
                  <span className="ml-1 text-[10px]">
                    {sortOrder === 'asc' ? '▲' : '▼'}
                  </span>
                ) : null}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </section>
      </CardContent>
    </Card>
  );
}
