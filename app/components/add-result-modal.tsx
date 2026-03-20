'use client';

import { AlertTriangleIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AddResultModalProps {
  failures: { code: string; name?: string }[];
  onClose: () => void;
}

export function AddResultModal({ failures, onClose }: AddResultModalProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[420px] border-border bg-popover text-popover-foreground"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/12 text-amber-500">
              <AlertTriangleIcon />
            </div>
            <div>
              <DialogTitle>部分未添加</DialogTitle>
              <DialogDescription className="mt-1">
                以下基金暂时没有可用估值数据。
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-2 sm:grid-cols-2">
          {failures.map((item, index) => (
            <div
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-3 py-2.5"
              key={index}
            >
              <span className="truncate text-sm font-medium">
                {item.name || '未知名称'}
              </span>
              <Badge variant="outline">#{item.code}</Badge>
            </div>
          ))}
        </div>

        <DialogFooter className="bg-transparent p-0 pt-2">
          <Button onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
