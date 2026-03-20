'use client';

import type { RefObject } from 'react';
import Link from 'next/link';

import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '@/app/lib/cn';
import {
  buttonBaseClass,
  checkboxCheckedClass,
  checkboxClass,
  floatingPanelClass,
  iconButtonClass,
  inputInsetClass,
  panelClass,
  softButtonClass,
  subtleTextClass,
} from '@/app/lib/ui';

import {
  CloseIcon,
  MoonIcon,
  PlusIcon,
  RefreshIcon,
  SettingsIcon,
  SunIcon,
} from '@/app/components/icons';
import type { FundData, FundSearchResult } from '@/app/types';

interface AddFundPanelProps {
  dropdownRef: RefObject<HTMLDivElement | null>;
  error: string;
  funds: FundData[];
  hasFunds: boolean;
  isSearching: boolean;
  loading: boolean;
  refreshing: boolean;
  searchResults: FundSearchResult[];
  searchTerm: string;
  selectedFunds: FundSearchResult[];
  showDropdown: boolean;
  theme: string;
  onAddFund: (event?: React.FormEvent) => void;
  onHandleSearchInput: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onManualRefresh: () => void;
  onOpenSettings: () => void;
  onSetShowDropdown: (visible: boolean) => void;
  onToggleTheme: () => void;
  onToggleSelectFund: (fund: FundSearchResult) => void;
}

export function AddFundPanel({
  dropdownRef,
  error,
  funds,
  hasFunds,
  isSearching,
  loading,
  refreshing,
  searchResults,
  searchTerm,
  selectedFunds,
  showDropdown,
  theme,
  onAddFund,
  onHandleSearchInput,
  onManualRefresh,
  onOpenSettings,
  onSetShowDropdown,
  onToggleTheme,
  onToggleSelectFund,
}: AddFundPanelProps) {
  const helperText = selectedFunds.length
    ? `已选 ${selectedFunds.length} 项`
    : searchTerm.trim()
      ? '从结果中勾选后加入'
      : '支持名称或代码搜索';

  return (
    <div
      className={cn(
        panelClass,
        'ui-panel-accent h-full overflow-visible rounded-[24px] px-5 py-5 md:px-6 md:py-6',
      )}
      role="region"
      aria-label="添加基金"
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex max-w-[32rem] items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary"
              aria-hidden="true"
            >
              <PlusIcon width="18" height="18" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[clamp(1.2rem,1.1rem+0.45vw,1.5rem)] font-semibold leading-tight tracking-[0.01em]">
                添加基金
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Link
              href="https://github.com/zhengshengning/fund-baby"
              target="_blank"
              rel="noreferrer"
              className={cn(softButtonClass, 'h-10 px-3 text-sm')}
            >
              GitHub
            </Link>
            <button
              type="button"
              className={iconButtonClass}
              onClick={onToggleTheme}
              title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
              aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
            >
              {theme === 'dark' ? (
                <SunIcon width="18" height="18" />
              ) : (
                <MoonIcon width="18" height="18" />
              )}
            </button>
            <button
              type="button"
              className={iconButtonClass}
              onClick={onManualRefresh}
              title="立即刷新"
              aria-label="立即刷新"
              disabled={!hasFunds || refreshing}
            >
              <RefreshIcon
                width="18"
                height="18"
                className={refreshing ? 'animate-spin' : undefined}
              />
            </button>
            <button
              type="button"
              className={iconButtonClass}
              onClick={onOpenSettings}
              title="打开设置"
              aria-label="打开设置"
            >
              <SettingsIcon width="18" height="18" />
            </button>
          </div>
        </div>

        <div className="relative" ref={dropdownRef}>
          <form
            className="flex items-stretch gap-3 max-md:flex-col"
            onSubmit={onAddFund}
          >
            <div className="relative flex min-w-0 flex-1 flex-wrap items-center gap-2">
              {selectedFunds.length > 0 && (
                <div className="flex w-full flex-wrap gap-2">
                  {selectedFunds.map((fund) => (
                    <div
                      key={fund.CODE}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-soft px-3 py-1 text-sm text-muted-strong"
                    >
                      <span>{fund.NAME}</span>
                      <button
                        type="button"
                        onClick={() => onToggleSelectFund(fund)}
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted transition hover:bg-surface-soft hover:text-text"
                      >
                        <CloseIcon width="14" height="14" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                className={cn(
                  inputInsetClass,
                  'h-11 pr-10',
                )}
                placeholder="基金名称或代码"
                value={searchTerm}
                onChange={onHandleSearchInput}
                onFocus={() => onSetShowDropdown(true)}
              />
              {isSearching && (
                <div className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-border border-t-primary animate-spin" />
              )}
            </div>
            <button
              className={cn(
                buttonBaseClass,
                'bg-primary text-interactive-contrast hover:-translate-y-px hover:bg-primary-strong md:min-w-30',
              )}
              type="submit"
              disabled={loading || refreshing}
            >
              {loading ? '添加中…' : '加入'}
            </button>
          </form>

          <div className="mt-3 flex min-h-5 items-center justify-between gap-3 text-xs text-muted">
            <span>{helperText}</span>
            {funds.length > 0 && <span>当前 {funds.length} 只</span>}
          </div>

          <AnimatePresence>
            {showDropdown && (searchTerm.trim() || searchResults.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  floatingPanelClass,
                  'absolute left-0 right-0 top-full z-80 mt-3 max-h-105 overflow-hidden rounded-[18px]',
                )}
              >
                {searchResults.length > 0 ? (
                  <div className="max-h-105 overflow-y-auto p-2">
                    {searchResults.map((fund) => {
                      const isSelected = selectedFunds.some(
                        (selectedFund) => selectedFund.CODE === fund.CODE,
                      );
                      const isAlreadyAdded = funds.some(
                        (existingFund) => existingFund.code === fund.CODE,
                      );

                      return (
                        <div
                          key={fund.CODE}
                          className={cn(
                            'flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-transparent px-3 py-3 transition',
                            isSelected &&
                              'border-[color:var(--ui-primary-border)] bg-primary-soft',
                            !isSelected &&
                              !isAlreadyAdded &&
                              'hover:border-border hover:bg-surface-soft',
                            isAlreadyAdded &&
                              'cursor-not-allowed border-border bg-surface-soft opacity-70',
                          )}
                          onClick={() => {
                            if (isAlreadyAdded) return;
                            onToggleSelectFund(fund);
                          }}
                        >
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="truncate font-medium">
                              {fund.NAME}
                            </span>
                            <span className={subtleTextClass}>
                              #{fund.CODE} | {fund.TYPE}
                            </span>
                          </div>
                          {isAlreadyAdded ? (
                            <span className="text-xs font-medium text-muted-strong">
                              已添加
                            </span>
                          ) : (
                            <div
                              className={cn(
                                checkboxClass,
                                isSelected && checkboxCheckedClass,
                              )}
                            >
                              {isSelected && (
                                <div className="h-2.5 w-1.5 rotate-45 border-b-2 border-r-2 border-interactive-contrast" />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : searchTerm.trim() && !isSearching ? (
                  <div className="p-5 text-center text-sm text-muted">
                    未找到相关基金
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && <div className="text-sm text-danger">{error}</div>}
      </div>
    </div>
  );
}
