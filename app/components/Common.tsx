'use client';

import { useState } from 'react';
import { CalendarDaysIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { zhCN } from 'react-day-picker/locale';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatDate, nowInTz, toTz } from '@/app/lib/date';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full justify-between border-border bg-background/70 text-left font-normal text-foreground"
          aria-label={value ? `已选择日期 ${value}` : '选择日期'}
        >
          <span>{value || '选择日期'}</span>
          <CalendarDaysIcon
            data-icon="inline-end"
            className="text-muted-foreground"
          />
        </Button>
      </PopoverAnchor>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          locale={zhCN}
          selected={value ? toTz(value).toDate() : undefined}
          disabled={(date) => date > nowInTz().endOf('day').toDate()}
          onSelect={(date) => {
            if (!date) return;
            onChange(formatDate(date.toISOString()));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
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

  const formatValue = (input: number) => Number(input).toFixed(decimals);

  const updateValue = (direction: 1 | -1) => {
    const current = parseFloat(value);
    const base = Number.isNaN(current) ? 0 : current;
    const next = direction > 0 ? base + step : Math.max(min, base - step);
    onChange(formatValue(next));
  };

  return (
    <InputGroup className="h-10 rounded-xl border-border bg-background/70">
      <InputGroupInput
        type="number"
        step="any"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="text-sm"
      />
      <InputGroupAddon align="inline-end" className="gap-1 pr-1.5">
        <InputGroupButton
          size="icon-xs"
          aria-label="增加数值"
          onClick={() => updateValue(1)}
        >
          <ChevronUpIcon />
        </InputGroupButton>
        <InputGroupButton
          size="icon-xs"
          aria-label="减少数值"
          onClick={() => updateValue(-1)}
        >
          <ChevronDownIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

interface StatProps {
  label: string;
  value: string;
  delta?: number | null;
  subValue?: string;
}

export function Stat({ label, value, delta, subValue }: StatProps) {
  const toneClass =
    delta != null
      ? delta > 0
        ? 'text-up'
        : delta < 0
          ? 'text-down'
          : 'text-foreground'
      : 'text-foreground';

  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border border-border/80 bg-background/50 px-3 py-2 text-left">
      <span className="truncate text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <span className={cn('font-mono text-base font-semibold', toneClass)}>
        {value}
      </span>
      {subValue ? (
        <span className="truncate text-xs text-muted-foreground">
          {subValue}
        </span>
      ) : null}
    </div>
  );
}
