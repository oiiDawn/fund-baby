'use client';

import type { RefObject } from 'react';
import { DownloadIcon, Settings2Icon, UploadIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface DashboardSettingsModalProps {
  importFileRef: RefObject<HTMLInputElement | null>;
  importMsg: string;
  tempSeconds: number;
  onClose: () => void;
  onExportLocalData: () => void;
  onHandleImportFileChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  onSaveSettings: (event?: React.MouseEvent) => void;
  onSetTempSeconds: (seconds: number) => void;
}

export function DashboardSettingsModal({
  importFileRef,
  importMsg,
  tempSeconds,
  onClose,
  onExportLocalData,
  onHandleImportFileChange,
  onSaveSettings,
  onSetTempSeconds,
}: DashboardSettingsModalProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[460px] border-border bg-popover text-popover-foreground"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <Settings2Icon />
            </div>
            <div>
              <DialogTitle>设置</DialogTitle>
              <DialogDescription className="mt-1">
                调整刷新频率并管理本地数据。
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-5">
          <section className="grid gap-3">
            <div className="text-sm font-medium">刷新频率</div>
            <ToggleGroup
              type="single"
              value={String(tempSeconds)}
              onValueChange={(value) => {
                if (value) onSetTempSeconds(Number(value));
              }}
              className="flex w-full flex-wrap gap-2"
            >
              {[10, 30, 60, 120, 300].map((seconds) => (
                <ToggleGroupItem
                  key={seconds}
                  value={String(seconds)}
                  className="rounded-full"
                >
                  {seconds} 秒
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Input
              className="h-10 rounded-xl border-border bg-background/70"
              type="number"
              min="10"
              step="5"
              value={tempSeconds}
              onChange={(event) => onSetTempSeconds(Number(event.target.value))}
              placeholder="自定义秒数"
            />
            {tempSeconds < 10 ? (
              <div className="text-sm text-destructive">最小 10 秒</div>
            ) : null}
          </section>

          <section className="grid gap-3">
            <div className="text-sm font-medium">数据管理</div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onExportLocalData}
              >
                <DownloadIcon data-icon="inline-start" />
                导出数据
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => importFileRef.current?.click?.()}
              >
                <UploadIcon data-icon="inline-start" />
                导入数据
              </Button>
            </div>
            <input
              ref={importFileRef}
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={onHandleImportFileChange}
            />
            {importMsg ? (
              <div className="text-sm text-muted-foreground">{importMsg}</div>
            ) : null}
          </section>
        </div>

        <DialogFooter className="bg-transparent p-0 pt-2">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={onSaveSettings} disabled={tempSeconds < 10}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
