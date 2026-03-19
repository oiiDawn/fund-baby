'use client';

import { useEffect, useId, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/app/lib/cn';
import {
  iconButtonClass,
  inputClass,
  mutedTextClass,
  subtleTextClass,
  upTextClass,
  downTextClass,
} from '@/app/lib/ui';

import { CalendarIcon, MinusIcon, PlusIcon } from '@/app/components/icons';
import { formatDate, nowInTz, toTz } from '@/app/lib/date';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() =>
    value ? toTz(value) : nowInTz(),
  );
  const calendarId = useId();

  useEffect(() => {
    const close = () => setIsOpen(false);
    if (isOpen) window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [isOpen]);

  const year = currentMonth.year();
  const month = currentMonth.month();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(currentMonth.subtract(1, 'month').startOf('month'));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(currentMonth.add(1, 'month').startOf('month'));
  };

  const handleSelect = (e: React.MouseEvent, day: number) => {
    e.stopPropagation();
    const dateStr = formatDate(
      `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    );

    const today = nowInTz().startOf('day');
    const selectedDate = toTz(dateStr).startOf('day');

    if (selectedDate.isAfter(today)) return;

    onChange(dateStr);
    setIsOpen(false);
  };

  const daysInMonth = currentMonth.daysInMonth();
  const firstDayOfWeek = currentMonth.startOf('month').day();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border border-border bg-surface-inset px-3 text-left text-sm text-text transition duration-200 hover:border-border-strong hover:bg-surface-soft',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--ui-focus-ring)',
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen ? 'true' : 'false'}
        aria-haspopup="dialog"
        aria-controls={calendarId}
        aria-label={value ? `已选择日期 ${value}` : '选择日期'}
      >
        <span>{value || '选择日期'}</span>
        <CalendarIcon width="16" height="16" className="text-muted" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={calendarId}
            role="dialog"
            aria-label="选择日期"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-0 top-full z-10 mt-2 w-full rounded-[18px] border border-border bg-surface-floating p-3 shadow-panel"
          >
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevMonth}
                className={cn(iconButtonClass, 'h-6 w-6 rounded-md')}
                aria-label="上一个月"
                title="上一个月"
              >
                &lt;
              </button>
              <span className="text-sm font-semibold">
                {year}年 {month + 1}月
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className={cn(iconButtonClass, 'h-6 w-6 rounded-md')}
                aria-label="下一个月"
                title="下一个月"
              >
                &gt;
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
                <div key={d} className="mb-1 text-xs text-muted">
                  {d}
                </div>
              ))}
              {days.map((d, i) => {
                if (!d) return <div key={i} />;
                const dateStr = formatDate(
                  `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
                );
                const isSelected = value === dateStr;
                const today = nowInTz().startOf('day');
                const current = toTz(dateStr).startOf('day');
                const isToday = current.isSame(today);
                const isFuture = current.isAfter(today);

                return (
                  <button
                    type="button"
                    key={i}
                    onClick={(e) => handleSelect(e, d)}
                    disabled={isFuture}
                    aria-pressed={isSelected}
                    aria-current={isToday ? 'date' : undefined}
                    title={dateStr}
                    className={cn(
                      'flex h-7 items-center justify-center rounded-md border border-transparent text-[13px] transition',
                      isSelected &&
                        'bg-primary font-semibold text-interactive-contrast',
                      !isSelected &&
                        isToday &&
                        'bg-surface-strong font-semibold text-text',
                      !isSelected &&
                        !isToday &&
                        !isFuture &&
                        'text-text hover:bg-surface-strong',
                      isFuture && 'cursor-not-allowed text-muted opacity-30',
                    )}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface NumericInputProps {
  value: string;
  onChange: (value: string) => void;
  step?: number;
  min?: number;
  placeholder?: string;
}

export function NumericInput({
  value,
  onChange,
  step = 1,
  min = 0,
  placeholder,
}: NumericInputProps) {
  const decimals = String(step).includes('.')
    ? String(step).split('.')[1].length
    : 0;
  const fmt = (n: number) => Number(n).toFixed(decimals);
  const inc = () => {
    const v = parseFloat(value);
    const base = isNaN(v) ? 0 : v;
    const next = base + step;
    onChange(fmt(next));
  };
  const dec = () => {
    const v = parseFloat(value);
    const base = isNaN(v) ? 0 : v;
    const next = Math.max(min, base - step);
    onChange(fmt(next));
  };
  return (
    <div className="relative">
      <input
        type="number"
        step="any"
        className={cn(inputClass, 'pr-14 text-base md:text-[0.95rem]')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <div className="absolute right-1.5 top-1.5 flex flex-col gap-1.5">
        <button
          className={cn(iconButtonClass, 'h-4 w-11 rounded-md p-0')}
          type="button"
          onClick={inc}
          aria-label="增加数值"
          title="增加数值"
        >
          <PlusIcon width="14" height="14" />
        </button>
        <button
          className={cn(iconButtonClass, 'h-4 w-11 rounded-md p-0')}
          type="button"
          onClick={dec}
          aria-label="减少数值"
          title="减少数值"
        >
          <MinusIcon width="14" height="14" />
        </button>
      </div>
    </div>
  );
}

interface StatProps {
  label: string;
  value: string;
  delta?: number | null;
  subValue?: string;
}

export function Stat({ label, value, delta, subValue }: StatProps) {
  const dir =
    delta != null
      ? delta > 0
        ? upTextClass
        : delta < 0
          ? downTextClass
          : ''
      : '';
  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
      <span
        className={cn(
          mutedTextClass,
          'w-full truncate text-center text-[10px] md:text-xs',
        )}
      >
        {label}
      </span>
      <div className="flex flex-col items-center">
        <span
          className={cn(
            'whitespace-nowrap font-mono text-sm font-semibold leading-[1.2] md:text-base',
            dir,
          )}
        >
          {value}
        </span>
        {subValue && (
          <span className={cn(subtleTextClass, 'mt-0.5 font-medium')}>
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
}
