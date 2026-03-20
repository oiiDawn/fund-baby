'use client';

import { CircleCheckBigIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SuccessModalProps {
  message: string;
  onClose: () => void;
}

export function SuccessModal({ message, onClose }: SuccessModalProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[360px] border-border bg-popover text-popover-foreground"
      >
        <DialogHeader className="items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-[1.25rem] bg-primary/12 text-primary">
            <CircleCheckBigIcon className="size-8" />
          </div>
          <DialogTitle className="mt-2 text-lg">{message}</DialogTitle>
        </DialogHeader>
        <Button className="w-full" onClick={onClose}>
          知道了
        </Button>
      </DialogContent>
    </Dialog>
  );
}
