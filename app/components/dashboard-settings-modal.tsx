'use client';

import type { RefObject } from 'react';

import { cn } from '@/app/lib/cn';
import {
  activeChipClass,
  chipClass,
  inputClass,
  modalCardClass,
  modalOverlayClass,
  primaryButtonClass,
  sectionLabelClass,
} from '@/app/lib/ui';

import { SettingsIcon } from '@/app/components/icons';

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
    <div
      className={modalOverlayClass}
      role="dialog"
      aria-modal="true"
      aria-label="设置"
      onClick={onClose}
    >
      <div
        className={cn(modalCardClass, 'max-w-[420px]')}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-2.5 text-base font-semibold">
          <SettingsIcon width="20" height="20" />
          <span>设置</span>
        </div>

        <div className="mb-4">
          <div className={sectionLabelClass}>刷新</div>
          <div className="mb-3 flex flex-wrap gap-2">
            {[10, 30, 60, 120, 300].map((seconds) => (
              <button
                key={seconds}
                type="button"
                className={cn(
                  chipClass,
                  tempSeconds === seconds && activeChipClass,
                )}
                onClick={() => onSetTempSeconds(seconds)}
                aria-pressed={tempSeconds === seconds}
              >
                {seconds} 秒
              </button>
            ))}
          </div>
          <input
            className={inputClass}
            type="number"
            min="10"
            step="5"
            value={tempSeconds}
            onChange={(event) => onSetTempSeconds(Number(event.target.value))}
            placeholder="自定义秒数"
          />
          {tempSeconds < 10 && (
            <div className="mt-2 text-sm text-danger">最小 10 秒</div>
          )}
        </div>

        <div className="mb-4">
          <div className={sectionLabelClass}>导出</div>
          <div className="flex gap-2">
            <button
              type="button"
              className={primaryButtonClass}
              onClick={onExportLocalData}
            >
              导出数据
            </button>
          </div>
          <div className="mb-2 mt-6 text-sm text-muted">导入</div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className={primaryButtonClass}
              onClick={() => importFileRef.current?.click?.()}
            >
              导入数据
            </button>
          </div>
          <input
            ref={importFileRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={onHandleImportFileChange}
          />
          {importMsg && (
            <div className="mt-2 text-sm text-muted">{importMsg}</div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            className={primaryButtonClass}
            onClick={onSaveSettings}
            disabled={tempSeconds < 10}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
