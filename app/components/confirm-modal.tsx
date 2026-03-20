'use client';

import { Trash2Icon } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
}

export function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = '确定删除',
}: ConfirmModalProps) {
  return (
    <AlertDialog open onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="border-border bg-popover text-popover-foreground">
        <AlertDialogHeader className="sm:text-left">
          <AlertDialogMedia className="bg-destructive/12 text-destructive">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>取消</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
