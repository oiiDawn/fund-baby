'use client';

import { ChartColumnBigIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { FundData } from '@/app/types';

interface TopStocksModalProps {
  fund: FundData | null;
  onClose: () => void;
}

export function TopStocksModal({ fund, onClose }: TopStocksModalProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[560px] border-border bg-popover text-popover-foreground"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <ChartColumnBigIcon />
            </div>
            <div>
              <DialogTitle>前 10 重仓股票</DialogTitle>
              <div className="mt-1 text-sm text-muted-foreground">
                {fund?.name} · #{fund?.code}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[360px]">
          <div className="grid gap-2.5 pr-4 text-[13px]">
            {Array.isArray(fund?.holdings) && fund.holdings.length > 0 ? (
              fund.holdings.map((holding, index) => (
                <div
                  className="flex min-h-[52px] items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-3.5 py-2.5"
                  key={index}
                >
                  <span className="truncate font-medium">{holding.name}</span>
                  <div className="flex items-center gap-2">
                    {typeof holding.change === 'number' ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          holding.change > 0
                            ? 'text-up'
                            : holding.change < 0
                              ? 'text-down'
                              : '',
                        )}
                      >
                        {holding.change > 0 ? '+' : ''}
                        {holding.change.toFixed(2)}%
                      </Badge>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      {holding.weight}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-5 text-center text-sm text-muted-foreground">
                暂无重仓数据
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="bg-transparent p-0 pt-2">
          <Button className="w-full" onClick={onClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
