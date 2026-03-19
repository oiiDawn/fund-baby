'use client';

import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/app/lib/cn';
import { iconButtonClass, iconButtonGhostClass } from '@/app/lib/ui';

import githubImg from '@/app/assets/github.svg';
import {
  MoonIcon,
  RefreshIcon,
  SettingsIcon,
  SunIcon,
} from '@/app/components/icons';

interface DashboardHeaderProps {
  fundsCount: number;
  holdingsCount: number;
  isTradingDay: boolean;
  refreshMs: number;
  refreshing: boolean;
  theme: string;
  onManualRefresh: () => void;
  onOpenSettings: () => void;
  onToggleTheme: () => void;
}

export function DashboardHeader({
  fundsCount,
  holdingsCount,
  isTradingDay,
  refreshMs,
  refreshing,
  theme,
  onManualRefresh,
  onOpenSettings,
  onToggleTheme,
}: DashboardHeaderProps) {
  return (
    <div className="fixed inset-x-4 top-4 z-50 flex flex-wrap items-center gap-3 rounded-[10px] border border-border-strong bg-surface-elevated/95 px-4 py-3 backdrop-blur-xl max-sm:inset-x-0 max-sm:top-0 max-sm:rounded-none max-sm:border-x-0 max-sm:border-t-0">
      {refreshing && (
        <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden rounded-t-[10px] max-sm:rounded-none">
          <div className="h-full w-full animate-pulse bg-[linear-gradient(90deg,var(--ui-gold),var(--ui-primary),transparent_72%)]" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-border-strong"
          aria-hidden="true"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="var(--ui-accent)"
              strokeWidth="1.8"
            />
            <path
              d="M5 14c2-4 7-6 14-5"
              stroke="var(--ui-primary)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M8 16.5h8"
              stroke="var(--ui-gold)"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="min-w-0">
          <span className="block text-base font-bold tracking-[0.04em]">
            养基小宝
          </span>
          <p className="m-0 text-[0.72rem] uppercase tracking-[0.16em] text-muted">
            基金监控终端
          </p>
        </div>
      </div>
      <div
        className="flex min-h-10 flex-1 flex-wrap items-stretch overflow-hidden border-x border-border max-lg:w-full max-lg:border-r-0 max-sm:flex-col max-sm:border-l-0"
        aria-label="市场与资产状态"
      >
        <div className="inline-flex min-h-10 items-center gap-2.5 border-r border-border px-4 max-sm:border-b max-sm:border-r-0">
          <span className="text-[0.68rem] uppercase tracking-[0.14em] text-muted">
            市场
          </span>
          <strong>{isTradingDay ? 'OPEN' : 'CLOSED'}</strong>
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              isTradingDay ? 'bg-danger' : 'bg-success',
            )}
            aria-hidden="true"
          />
        </div>
        <div className="flex flex-1 flex-wrap">
          <span className="inline-flex min-h-10 items-center gap-2.5 border-l border-border px-4 first:border-l-0 max-sm:border-l-0 max-sm:border-t">
            <span className="text-[0.68rem] uppercase tracking-[0.14em] text-muted">
              基金
            </span>
            <strong>{fundsCount}</strong>
          </span>
          <span className="inline-flex min-h-10 items-center gap-2.5 border-l border-border px-4 max-sm:border-l-0 max-sm:border-t">
            <span className="text-[0.68rem] uppercase tracking-[0.14em] text-muted">
              持仓
            </span>
            <strong>{holdingsCount}</strong>
          </span>
          <span className="inline-flex min-h-10 items-center gap-2.5 border-l border-border px-4 max-sm:border-l-0 max-sm:border-t">
            <span className="text-[0.68rem] uppercase tracking-[0.14em] text-muted">
              轮询
            </span>
            <strong>{Math.round(refreshMs / 1000)}s</strong>
          </span>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2 max-sm:w-full max-sm:justify-end">
        <Link
          href="https://github.com/zhengshengning/fund-baby"
          target="_blank"
          rel="noreferrer"
          aria-label="项目Github地址"
          title="项目Github地址"
          className="inline-flex"
        >
          <Image
            alt="项目Github地址"
            src={githubImg}
            width={30}
            height={30}
            className="h-[30px] w-[30px] cursor-pointer"
          />
        </Link>
        <button
          className={cn(iconButtonGhostClass, 'h-[30px] w-[30px]')}
          onClick={onToggleTheme}
          title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
        >
          {theme === 'dark' ? (
            <SunIcon width="20" height="20" />
          ) : (
            <MoonIcon width="20" height="20" />
          )}
        </button>
        <button
          className={iconButtonClass}
          aria-label="立即刷新"
          onClick={onManualRefresh}
          disabled={refreshing || fundsCount === 0}
          aria-busy={refreshing}
          title="立即刷新"
        >
          <RefreshIcon
            className={refreshing ? 'animate-spin' : undefined}
            width="18"
            height="18"
          />
        </button>
        <button
          className={iconButtonClass}
          aria-label="打开设置"
          onClick={onOpenSettings}
          title="设置"
        >
          <SettingsIcon width="18" height="18" />
        </button>
      </div>
    </div>
  );
}
