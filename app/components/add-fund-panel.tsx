'use client';

import type { RefObject } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '@/app/lib/cn';
import {
  buttonBaseClass,
  checkboxCheckedClass,
  checkboxClass,
  floatingPanelClass,
  inputClass,
  panelClass,
  subtleTextClass,
} from '@/app/lib/ui';

import { CloseIcon, PlusIcon } from '@/app/components/icons';
import type { FundData, FundSearchResult } from '@/app/types';

interface AddFundPanelProps {
  dropdownRef: RefObject<HTMLDivElement | null>;
  error: string;
  funds: FundData[];
  isSearching: boolean;
  loading: boolean;
  refreshing: boolean;
  searchResults: FundSearchResult[];
  searchTerm: string;
  selectedFunds: FundSearchResult[];
  showDropdown: boolean;
  onAddFund: (event?: React.FormEvent) => void;
  onHandleSearchInput: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSetShowDropdown: (visible: boolean) => void;
  onToggleSelectFund: (fund: FundSearchResult) => void;
}

export function AddFundPanel({
  dropdownRef,
  error,
  funds,
  isSearching,
  loading,
  refreshing,
  searchResults,
  searchTerm,
  selectedFunds,
  showDropdown,
  onAddFund,
  onHandleSearchInput,
  onSetShowDropdown,
  onToggleSelectFund,
}: AddFundPanelProps) {
  return (
    <div
      className={cn(
        panelClass,
        'col-span-12 overflow-visible rounded-[22px] bg-[linear-gradient(135deg,rgba(103,167,255,0.1),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.015),transparent_36%),var(--ui-surface-elevated)] p-5',
      )}
      role="region"
      aria-label="添加基金"
    >
      <div className="flex items-start justify-between gap-4 max-sm:flex-col">
        <div className="mb-3 flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"
            aria-hidden="true"
          >
            <PlusIcon width="18" height="18" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-base font-semibold">纳入监控基金</span>
            <span className="text-sm text-muted">
              支持基金名称、六位代码与批量勾选，统一纳入资产监控池
            </span>
          </div>
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
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-[rgba(255,255,255,0.04)] px-3 py-1 text-sm"
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
                inputClass,
                'bg-[rgba(7,16,24,0.62)] pr-10 data-[theme=light]:bg-white',
              )}
              placeholder="搜索基金名称或代码..."
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
            {loading ? '添加中…' : '加入监控'}
          </button>
        </form>

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
                            'border-[rgba(103,167,255,0.24)] bg-primary-soft',
                          !isSelected &&
                            !isAlreadyAdded &&
                            'hover:border-border hover:bg-[rgba(255,255,255,0.035)]',
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

      {error && <div className="mt-2 text-sm text-danger">{error}</div>}
    </div>
  );
}

