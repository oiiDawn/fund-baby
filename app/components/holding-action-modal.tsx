'use client';

import {
  ArrowDownIcon,
  ArrowUpIcon,
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
import type { FundData } from '@/app/types';

interface HoldingActionModalProps {
  fund: FundData | null;
  onClose: () => void;
  onAction: (type: string) => void;
}

export function HoldingActionModal({
  fund,
  onClose,
  onAction,
}: HoldingActionModalProps) {
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
            onClick={() => onAction('sell')}
          >
            <ArrowDownIcon data-icon="inline-start" />
            减仓
          </Button>
          <Button
            variant="outline"
            className="col-span-2 h-11"
            onClick={() => onAction('edit')}
          >
            <PencilLineIcon data-icon="inline-start" />
            编辑持仓
          </Button>
          <Button
            variant="destructive"
            className="col-span-2 h-11"
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
