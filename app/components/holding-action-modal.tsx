'use client';

import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarClockIcon,
  PencilLineIcon,
  Trash2Icon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { FundData, Holding } from '@/app/types';

interface HoldingActionModalProps {
  fund: FundData | null;
  holding: Holding | undefined;
  onClose: () => void;
  onAction: (type: string) => void;
}

export function HoldingActionModal({
  fund,
  holding,
  onClose,
  onAction,
}: HoldingActionModalProps) {
  const hasHolding =
    !!holding && typeof holding.share === 'number' && holding.share > 0;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[360px] border-border bg-popover text-popover-foreground"
      >
        <DialogHeader>
          <DialogTitle>持仓操作</DialogTitle>
          <DialogDescription>
            {fund?.name} · #{fund?.code}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-11"
            onClick={() => onAction('buy')}
          >
            <ArrowUpIcon data-icon="inline-start" />
            加仓
          </Button>
          <Button
            variant="destructive"
            className="h-11"
            disabled={!hasHolding}
            onClick={() => onAction('sell')}
          >
            <ArrowDownIcon data-icon="inline-start" />
            减仓
          </Button>
          <Button
            variant="outline"
            className="col-span-2 h-11"
            onClick={() => onAction('dca')}
          >
            <CalendarClockIcon data-icon="inline-start" />
            定投计划
          </Button>
          <Button
            variant="outline"
            className="col-span-2 h-11"
            onClick={() => onAction('edit')}
          >
            <PencilLineIcon data-icon="inline-start" />
            {hasHolding ? '编辑持仓' : '设置持仓'}
          </Button>
          <Button
            variant="destructive"
            className="col-span-2 h-11"
            disabled={!hasHolding}
            onClick={() => onAction('clear')}
          >
            <Trash2Icon data-icon="inline-start" />
            清空持仓
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
