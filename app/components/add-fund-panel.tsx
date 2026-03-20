'use client';

import type { RefObject } from 'react';
import Link from 'next/link';
import {
  CheckIcon,
  GithubIcon,
  LoaderCircleIcon,
  MoonStarIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Settings2Icon,
  SunIcon,
  XIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
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
  return (
    <Card className="ui-panel-accent h-full border-border bg-card/95 shadow-panel">
      <CardHeader className="border-b border-border/70 pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <PlusIcon className="size-4.5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg font-semibold tracking-[0.01em]">
                添加基金
              </CardTitle>
            </div>
          </div>

          <CardAction className="mt-0 flex flex-wrap items-center gap-2 self-start">
            <Button variant="outline" size="sm" asChild>
              <Link
                href="https://github.com/zhengshengning/fund-baby"
                target="_blank"
                rel="noreferrer"
              >
                <GithubIcon data-icon="inline-start" />
                GitHub
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onToggleTheme}
              title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
              aria-label={
                theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'
              }
            >
              {theme === 'dark' ? <SunIcon /> : <MoonStarIcon />}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onManualRefresh}
              title="立即刷新"
              aria-label="立即刷新"
              disabled={!hasFunds || refreshing}
            >
              <RefreshCwIcon className={cn(refreshing && 'animate-spin')} />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onOpenSettings}
              title="打开设置"
              aria-label="打开设置"
            >
              <Settings2Icon />
            </Button>
          </CardAction>
        </div>
      </CardHeader>

      <CardContent className="grid flex-1 content-start gap-4 pt-4">
        {selectedFunds.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedFunds.map((fund) => (
              <Badge
                key={fund.CODE}
                variant="secondary"
                className="h-8 rounded-full px-3 text-sm"
              >
                <span className="max-w-[10rem] truncate">{fund.NAME}</span>
                <button
                  type="button"
                  className="inline-flex items-center text-muted-foreground transition hover:text-foreground"
                  onClick={() => onToggleSelectFund(fund)}
                  aria-label={`移除 ${fund.NAME}`}
                >
                  <XIcon className="size-3.5" />
                </button>
              </Badge>
            ))}
          </div>
        ) : null}

        <Popover
          open={
            showDropdown &&
            (searchTerm.trim().length > 0 || searchResults.length > 0)
          }
          onOpenChange={onSetShowDropdown}
        >
          <div className="relative" ref={dropdownRef}>
            <PopoverAnchor asChild>
              <form
                className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]"
                onSubmit={onAddFund}
              >
                <div className="relative min-w-0">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-11 rounded-2xl border-border/80 bg-background/70 pl-10 pr-10 text-[15px]"
                    placeholder="搜索基金名称或代码..."
                    value={searchTerm}
                    onChange={onHandleSearchInput}
                    onFocus={() => onSetShowDropdown(true)}
                    aria-label="搜索基金名称或代码"
                  />
                  {isSearching ? (
                    <LoaderCircleIcon className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  ) : null}
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-11 rounded-2xl px-5 md:min-w-30"
                  disabled={loading || refreshing}
                >
                  {loading ? (
                    <>
                      <LoaderCircleIcon
                        data-icon="inline-start"
                        className="animate-spin"
                      />
                      添加中
                    </>
                  ) : (
                    '加入'
                  )}
                </Button>
              </form>
            </PopoverAnchor>

            <PopoverContent
              align="start"
              sideOffset={10}
              className="w-[var(--radix-popover-trigger-width)] border-border bg-popover/98 p-1"
            >
              <Command shouldFilter={false} className="bg-transparent p-0">
                <CommandList>
                  <CommandEmpty className="py-6 text-sm text-muted-foreground">
                    {searchTerm.trim() && !isSearching
                      ? '未找到相关基金'
                      : '输入关键字开始搜索'}
                  </CommandEmpty>
                  {searchResults.length > 0 ? (
                    <CommandGroup heading="搜索结果">
                      <ScrollArea className="max-h-80">
                        <div className="flex flex-col gap-1">
                          {searchResults.map((fund) => {
                            const isSelected = selectedFunds.some(
                              (selectedFund) => selectedFund.CODE === fund.CODE,
                            );
                            const isAlreadyAdded = funds.some(
                              (existingFund) => existingFund.code === fund.CODE,
                            );

                            return (
                              <CommandItem
                                key={fund.CODE}
                                value={`${fund.CODE}-${fund.NAME}`}
                                disabled={isAlreadyAdded}
                                data-checked={isSelected}
                                className="rounded-xl px-3 py-3"
                                onSelect={() => {
                                  if (isAlreadyAdded) return;
                                  onToggleSelectFund(fund);
                                }}
                              >
                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                  <span className="truncate font-medium">
                                    {fund.NAME}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    #{fund.CODE} · {fund.TYPE}
                                  </span>
                                </div>
                                {isAlreadyAdded ? (
                                  <Badge variant="outline">已添加</Badge>
                                ) : isSelected ? (
                                  <Badge className="gap-1 rounded-full">
                                    <CheckIcon className="size-3" />
                                    已选
                                  </Badge>
                                ) : null}
                              </CommandItem>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </CommandGroup>
                  ) : null}
                </CommandList>
              </Command>
            </PopoverContent>
          </div>
        </Popover>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
