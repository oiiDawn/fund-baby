'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarClockIcon,
  PauseIcon,
  PencilLineIcon,
  PlayIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';

import { DatePicker, NumericInput } from '@/app/components/Common';
import { formatDate } from '@/app/lib/date';
import {
  getDcaFrequencyLabel,
  getDcaTimeSlotLabel,
  type DcaPlanDraft,
} from '@/app/services/fund-dca';
import type { DcaFrequency, DcaPlan, DcaTimeSlot, FundData } from '@/app/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface DcaPlanModalProps {
  fund: FundData | null;
  plans: DcaPlan[];
  onClose: () => void;
  onDelete: (planId: string) => void;
  onSave: (draft: DcaPlanDraft & { id?: string }) => void;
  onToggleActive: (planId: string, active: boolean) => void;
}

const DEFAULT_AMOUNT = '500';
const DEFAULT_FEE_RATE = '0.12';

export function DcaPlanModal({
  fund,
  plans,
  onClose,
  onDelete,
  onSave,
  onToggleActive,
}: DcaPlanModalProps) {
  const [editingPlanId, setEditingPlanId] = useState<string | 'new' | null>(
    null,
  );
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [feeRate, setFeeRate] = useState(DEFAULT_FEE_RATE);
  const [frequency, setFrequency] = useState<DcaFrequency>('weekly');
  const [timeSlot, setTimeSlot] = useState<DcaTimeSlot>('before_3pm');
  const [startDate, setStartDate] = useState(() => formatDate());
  const [active, setActive] = useState(true);

  const editingPlan = useMemo(
    () => plans.find((plan) => plan.id === editingPlanId),
    [editingPlanId, plans],
  );

  const resetForm = () => {
    setAmount(DEFAULT_AMOUNT);
    setFeeRate(DEFAULT_FEE_RATE);
    setFrequency('weekly');
    setTimeSlot('before_3pm');
    setStartDate(formatDate());
    setActive(true);
  };

  useEffect(() => {
    setEditingPlanId(null);
    resetForm();
  }, [fund?.code]);

  useEffect(() => {
    if (editingPlan) {
      setAmount(String(editingPlan.amount));
      setFeeRate(String(editingPlan.feeRate));
      setFrequency(editingPlan.frequency);
      setTimeSlot(editingPlan.timeSlot);
      setStartDate(editingPlan.startDate);
      setActive(editingPlan.active);
      return;
    }

    if (editingPlanId === 'new') {
      resetForm();
    }
  }, [editingPlan, editingPlanId]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fund) return;

    const parsedAmount = Number(amount);
    const parsedFeeRate = Number(feeRate);

    if (!parsedAmount || parsedAmount <= 0 || parsedFeeRate < 0 || !startDate)
      return;

    onSave({
      id: editingPlan?.id,
      fundCode: fund.code,
      fundName: fund.name,
      amount: parsedAmount,
      feeRate: parsedFeeRate,
      frequency,
      timeSlot,
      startDate,
      active,
    });

    setEditingPlanId(null);
    resetForm();
  };

  const isValid = Number(amount) > 0 && Number(feeRate) >= 0 && !!startDate;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[560px] border-border bg-popover text-popover-foreground"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <CalendarClockIcon />
            </div>
            <div>
              <DialogTitle>定投计划</DialogTitle>
              <DialogDescription className="mt-1">
                {fund?.name} · #{fund?.code}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="rounded-xl border border-border bg-background/60 p-3 text-sm text-muted-foreground">
            计划会在你打开应用或刷新数据时生成待处理买入记录，不会在后台自动执行。
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium text-foreground">已有计划</div>
                <div className="text-sm text-muted-foreground">
                  可为同一只基金配置多个定投计划。
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingPlanId('new')}
              >
                <PlusIcon data-icon="inline-start" />
                新建计划
              </Button>
            </div>

            {plans.length > 0 ? (
              <div className="grid gap-2">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="rounded-xl border border-border bg-background/55 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">
                          ¥{plan.amount.toFixed(2)} /{' '}
                          {getDcaFrequencyLabel(plan.frequency)}
                        </span>
                        <Badge variant="outline">
                          {plan.active ? '进行中' : '已暂停'}
                        </Badge>
                        <Badge variant="outline">
                          {getDcaTimeSlotLabel(plan.timeSlot)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPlanId(plan.id)}
                        >
                          <PencilLineIcon data-icon="inline-start" />
                          编辑
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onToggleActive(plan.id, !plan.active)}
                        >
                          {plan.active ? (
                            <PauseIcon data-icon="inline-start" />
                          ) : (
                            <PlayIcon data-icon="inline-start" />
                          )}
                          {plan.active ? '暂停' : '恢复'}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => onDelete(plan.id)}
                        >
                          <Trash2Icon data-icon="inline-start" />
                          删除
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>起始日 {plan.startDate}</span>
                      <span>下次执行 {plan.nextRunDate}</span>
                      <span>费率 {plan.feeRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-background/40 px-4 py-5 text-sm text-muted-foreground">
                还没有定投计划，点击“新建计划”即可开始。
              </div>
            )}
          </div>

          {editingPlanId ? (
            <form
              className="grid gap-4 rounded-2xl border border-border bg-background/65 p-4"
              onSubmit={handleSubmit}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-foreground">
                    {editingPlan ? '编辑计划' : '新建计划'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    设置金额、频率和执行时间窗口。
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingPlanId(null)}
                >
                  收起
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  <span className="text-muted-foreground">定投金额</span>
                  <NumericInput
                    value={amount}
                    onChange={setAmount}
                    step={100}
                    min={0}
                    placeholder="500"
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-muted-foreground">买入费率 (%)</span>
                  <NumericInput
                    value={feeRate}
                    onChange={setFeeRate}
                    step={0.01}
                    min={0}
                    placeholder="0.12"
                  />
                </label>
              </div>

              <div className="grid gap-2 text-sm">
                <span className="text-muted-foreground">频率</span>
                <ToggleGroup
                  type="single"
                  value={frequency}
                  onValueChange={(value) => {
                    if (
                      value === 'daily' ||
                      value === 'weekly' ||
                      value === 'monthly'
                    ) {
                      setFrequency(value);
                    }
                  }}
                  className="grid w-full grid-cols-3 gap-2"
                >
                  <ToggleGroupItem value="daily" className="h-10 rounded-xl">
                    每日
                  </ToggleGroupItem>
                  <ToggleGroupItem value="weekly" className="h-10 rounded-xl">
                    每周
                  </ToggleGroupItem>
                  <ToggleGroupItem value="monthly" className="h-10 rounded-xl">
                    每月
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="grid gap-2 text-sm">
                <span className="text-muted-foreground">执行时间</span>
                <ToggleGroup
                  type="single"
                  value={timeSlot}
                  onValueChange={(value) => {
                    if (value === 'before_3pm' || value === 'after_3pm') {
                      setTimeSlot(value);
                    }
                  }}
                  className="grid w-full grid-cols-2 gap-2"
                >
                  <ToggleGroupItem
                    value="before_3pm"
                    className="h-10 rounded-xl"
                  >
                    15:00 前
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="after_3pm"
                    className="h-10 rounded-xl"
                  >
                    15:00 后
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  <span className="text-muted-foreground">起始日期</span>
                  <DatePicker
                    value={startDate}
                    onChange={setStartDate}
                    disableFuture={false}
                  />
                </label>
                <div className="grid gap-2 text-sm">
                  <span className="text-muted-foreground">状态</span>
                  <ToggleGroup
                    type="single"
                    value={active ? 'active' : 'paused'}
                    onValueChange={(value) => {
                      if (value === 'active') setActive(true);
                      if (value === 'paused') setActive(false);
                    }}
                    className="grid w-full grid-cols-2 gap-2"
                  >
                    <ToggleGroupItem value="active" className="h-10 rounded-xl">
                      启用
                    </ToggleGroupItem>
                    <ToggleGroupItem value="paused" className="h-10 rounded-xl">
                      暂停
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>

              <DialogFooter className="bg-transparent p-0 pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setEditingPlanId(null)}
                >
                  取消
                </Button>
                <Button type="submit" disabled={!isValid}>
                  {editingPlan ? '保存计划' : '创建计划'}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
