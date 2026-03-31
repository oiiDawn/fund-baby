'use client';

import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  fetchFundData,
  fetchIntradayData,
  fetchShanghaiIndexDate,
  fetchSmartFundNetValue,
  searchFunds,
} from '@/app/services/fund-api';
import type {
  DcaPlan,
  HoldingProfit,
  IntradayPoint,
  PendingTrade,
  SortBy,
  SortOrder,
  TradeType,
  ViewMode,
  FundData,
  Holding,
  HoldingsMap,
} from '@/app/types';
import { formatDate, nowInTz } from '@/app/lib/date';
import { AddFundPanel } from '@/app/components/add-fund-panel';
import { DashboardFilterBar } from '@/app/components/dashboard-filter-bar';
import { DashboardFundList } from '@/app/components/dashboard-fund-list';
import {
  AddResultModal,
  ConfirmModal,
  SuccessModal,
} from '@/app/components/dashboard-management-modals';
import { DashboardSettingsModal } from '@/app/components/dashboard-settings-modal';
import {
  DcaPlanModal,
  HoldingActionModal,
  HoldingEditModal,
  TopStocksModal,
  TradeModal,
  type TradeConfirmData,
} from '@/app/components/dashboard-trade-modals';
import { dedupeFundsByCode, sortFunds } from '@/app/services/fund-collection';
import {
  loadFundBatch,
  resolveTradingDayStatus,
} from '@/app/services/fund-refresh';
import {
  createDcaPlan,
  materializeDueDcaTrades,
  type DcaPlanDraft,
} from '@/app/services/fund-dca';
import {
  getHoldingProfitForFund,
  processPendingTrades,
} from '@/app/services/fund-trade';
import { useDashboardModalEffects } from '@/app/hooks/use-dashboard-modal-effects';
import { useFundSearch } from '@/app/hooks/use-fund-search';
import { createFundDashboardRepository } from '@/app/repository/fund-dashboard-repository';
import type { FundSnapshot } from '@/app/types';

interface SaveFilePickerWritable {
  write: (data: Blob) => Promise<void>;
  close: () => Promise<void>;
}

interface SaveFilePickerHandle {
  createWritable: () => Promise<SaveFilePickerWritable>;
}

interface SaveFilePickerWindow extends Window {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: Array<{
      description: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<SaveFilePickerHandle>;
}

function applyDocumentTheme(theme: string) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.classList.toggle('dark', theme !== 'light');
}

export default function FundDashboardPage() {
  const storageHelper = useMemo(() => createFundDashboardRepository(), []);
  const [funds, setFunds] = useState<FundData[]>([]);
  const [intradayMap, setIntradayMap] = useState<
    Record<string, IntradayPoint[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('dark');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshingRef = useRef(false);

  // 刷新频率状态
  const [refreshMs, setRefreshMs] = useState(30000);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempSeconds, setTempSeconds] = useState(30);

  // 全局刷新状态
  const [refreshing, setRefreshing] = useState(false);

  // 排序状态
  const [sortBy, setSortBy] = useState<SortBy>('default');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 视图模式
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [addResultOpen, setAddResultOpen] = useState(false);
  const [addFailures, setAddFailures] = useState<
    { code: string; name?: string }[]
  >([]);
  const [holdingModal, setHoldingModal] = useState<{
    open: boolean;
    fund: FundData | null;
  }>({ open: false, fund: null });
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    fund: FundData | null;
  }>({ open: false, fund: null });
  const [topStocksModal, setTopStocksModal] = useState<{
    open: boolean;
    fund: FundData | null;
  }>({ open: false, fund: null });
  const [tradeModal, setTradeModal] = useState<{
    open: boolean;
    fund: FundData | null;
    type: TradeType;
  }>({ open: false, fund: null, type: 'buy' });
  const [dcaModal, setDcaModal] = useState<{
    open: boolean;
    fund: FundData | null;
  }>({ open: false, fund: null });
  const [clearConfirm, setClearConfirm] = useState<{ fund: FundData } | null>(
    null,
  );
  const [holdings, setHoldings] = useState<HoldingsMap>({});
  const [pendingTrades, setPendingTrades] = useState<PendingTrade[]>([]);
  const [dcaPlans, setDcaPlans] = useState<DcaPlan[]>([]);

  const holdingsRef = useRef<HoldingsMap>(holdings);
  const pendingTradesRef = useRef<PendingTrade[]>(pendingTrades);
  const dcaPlansRef = useRef<DcaPlan[]>(dcaPlans);
  const {
    error,
    isSearching,
    searchResults,
    searchTerm,
    selectedFunds,
    showDropdown,
    handleSearchInput,
    resetSearch,
    setError,
    setShowDropdown,
    toggleSelectFund,
  } = useFundSearch({
    searchFunds,
    existingFunds: funds,
  });

  useEffect(() => {
    holdingsRef.current = holdings;
    pendingTradesRef.current = pendingTrades;
    dcaPlansRef.current = dcaPlans;
  }, [dcaPlans, holdings, pendingTrades]);

  const persistPendingTrades = (nextPendingTrades: PendingTrade[]) => {
    pendingTradesRef.current = nextPendingTrades;
    setPendingTrades(nextPendingTrades);
    storageHelper.savePendingTrades(nextPendingTrades);
  };

  const persistDcaPlans = (nextDcaPlans: DcaPlan[]) => {
    dcaPlansRef.current = nextDcaPlans;
    setDcaPlans(nextDcaPlans);
    storageHelper.saveDcaPlans(nextDcaPlans);
  };

  useEffect(() => {
    const savedTheme = storageHelper.loadBootstrapState().theme;
    setTheme(savedTheme);
    applyDocumentTheme(savedTheme);
  }, [storageHelper]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    storageHelper.saveTheme(next);
    applyDocumentTheme(next);
  };

  const [isTradingDay, setIsTradingDay] = useState(true);
  const [fundDeleteConfirm, setFundDeleteConfirm] = useState<{
    code: string;
    name: string;
  } | null>(null);

  const todayStr = formatDate();

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => setIsMobile(window.innerWidth <= 640);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  // 存储当前被划开的基金代码
  const [swipedFundCode, setSwipedFundCode] = useState<string | null>(null);

  // 点击页面其他区域时收起删除按钮
  useEffect(() => {
    const handleClickOutside = (e) => {
      // 检查点击事件是否来自删除按钮
      // 如果点击的是 .swipe-action-bg 或其子元素，不执行收起逻辑
      if (e.target.closest('.swipe-action-bg')) {
        return;
      }

      if (swipedFundCode) {
        setSwipedFundCode(null);
      }
    };

    if (swipedFundCode) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [swipedFundCode]);

  // 检查交易日状态
  const checkTradingDay = useCallback(async () => {
    const now = nowInTz();
    try {
      const dateStr = await fetchShanghaiIndexDate();
      setIsTradingDay(
        resolveTradingDayStatus({ now, indexDate: dateStr, todayStr }),
      );
    } catch {
      setIsTradingDay(
        resolveTradingDayStatus({ now, indexDate: null, todayStr }),
      );
    }
  }, [todayStr]);

  useEffect(() => {
    checkTradingDay();
    // 每分钟检查一次
    const timer = setInterval(checkTradingDay, 60000);
    return () => clearInterval(timer);
  }, [checkTradingDay]);

  // 计算持仓收益
  const getHoldingProfit = (
    fund: FundData,
    holding: Holding | undefined,
  ): HoldingProfit | null => {
    return getHoldingProfitForFund({
      fund,
      holding,
      isTradingDay,
      todayStr,
    });
  };

  // 过滤和排序后的基金列表
  const displayFunds = sortFunds(funds, sortBy, sortOrder, (fund) =>
    getHoldingProfit(fund, holdings[fund.code]),
  );

  const handleSaveHolding = (
    code: string,
    data: { share: number | null; cost: number | null },
  ) => {
    setHoldings((prev) => {
      const next = { ...prev };
      if (data.share === null && data.cost === null) {
        delete next[code];
      } else {
        next[code] = data;
      }
      storageHelper.saveHoldings(next);
      return next;
    });
    setHoldingModal({ open: false, fund: null });
  };

  const handleAction = (type: string, fund: FundData) => {
    setActionModal({ open: false, fund: null });
    if (type === 'edit') {
      setHoldingModal({ open: true, fund });
    } else if (type === 'clear') {
      setClearConfirm({ fund });
    } else if (type === 'dca') {
      setDcaModal({ open: true, fund });
    } else if (type === 'buy' || type === 'sell') {
      setTradeModal({ open: true, fund, type });
    }
  };

  const handleClearConfirm = () => {
    if (clearConfirm?.fund) {
      handleSaveHolding(clearConfirm.fund.code, { share: null, cost: null });
    }
    setClearConfirm(null);
  };

  const processPendingQueue = async () => {
    const dcaResult = materializeDueDcaTrades({
      dcaPlans: dcaPlansRef.current,
      pendingTrades: pendingTradesRef.current,
    });

    if (dcaResult.changed) {
      persistDcaPlans(dcaResult.dcaPlans);
      persistPendingTrades(dcaResult.pendingTrades);
      if (dcaResult.generatedCount > 0) {
        showToast(
          `已生成 ${dcaResult.generatedCount} 笔定投待处理交易`,
          'success',
        );
      }
    }

    const result = await processPendingTrades({
      holdings: holdingsRef.current,
      pendingTrades: dcaResult.pendingTrades,
      resolveNetValue: fetchSmartFundNetValue,
    });

    if (result.processedCount > 0) {
      holdingsRef.current = result.holdings;
      setHoldings(result.holdings);
      storageHelper.saveHoldings(result.holdings);
      persistPendingTrades(result.pendingTrades);
      showToast(`已处理 ${result.processedCount} 笔待定交易`, 'success');
    }
  };

  const handleTrade = (fund: FundData, data: TradeConfirmData) => {
    // 如果没有价格（API失败），加入待处理队列
    if (!data.price || data.price === 0) {
      const pending: PendingTrade = {
        id: crypto.randomUUID(),
        fundCode: fund.code,
        fundName: fund.name,
        type: tradeModal.type,
        share: data.share,
        amount: 'totalCost' in data ? data.totalCost : undefined,
        feeRate:
          tradeModal.type === 'buy' && 'feeRate' in data ? data.feeRate : 0,
        feeMode: 'feeMode' in data ? data.feeMode : undefined,
        feeValue: 'feeValue' in data ? data.feeValue : undefined,
        date: data.date,
        isAfter3pm: data.isAfter3pm,
        timestamp: Date.now(),
        sourceType: 'manual',
      };

      const next = [...pendingTrades, pending];
      persistPendingTrades(next);

      setTradeModal({ open: false, fund: null, type: 'buy' });
      showToast('净值暂未更新，已加入待处理队列', 'info');
      return;
    }

    const current = holdings[fund.code] || { share: 0, cost: 0 };
    const isBuy = tradeModal.type === 'buy';

    let newShare, newCost;

    if (isBuy) {
      newShare = current.share + data.share;

      // 如果传递了 totalCost（即买入总金额），则用它来计算新成本
      // 否则回退到用 share * price 计算（减仓或旧逻辑）
      const buyCost =
        'totalCost' in data ? data.totalCost : data.price * data.share;

      // 加权平均成本 = (原持仓成本 * 原份额 + 本次买入总花费) / 新总份额
      // 注意：这里默认将手续费也计入成本（如果 totalCost 包含了手续费）
      newCost = (current.cost * current.share + buyCost) / newShare;
    } else {
      newShare = Math.max(0, current.share - data.share);
      // 减仓不改变单位成本，只减少份额
      newCost = current.cost;
      if (newShare === 0) newCost = 0;
    }

    handleSaveHolding(fund.code, { share: newShare, cost: newCost });
    setTradeModal({ open: false, fund: null, type: 'buy' });
  };

  // 成功提示弹窗
  const [successModal, setSuccessModal] = useState<{
    open: boolean;
    message: string;
  }>({ open: false, message: '' });

  const handleSaveDcaPlan = (draft: DcaPlanDraft & { id?: string }) => {
    const now = nowInTz();
    const existingPlan = draft.id
      ? dcaPlans.find((plan) => plan.id === draft.id)
      : undefined;

    const nextPlan = existingPlan
      ? {
          ...existingPlan,
          fundName: draft.fundName,
          amount: draft.amount,
          feeRate: draft.feeRate,
          frequency: draft.frequency,
          timeSlot: draft.timeSlot,
          startDate: draft.startDate,
          nextRunDate:
            existingPlan.frequency === draft.frequency &&
            existingPlan.timeSlot === draft.timeSlot &&
            existingPlan.startDate === draft.startDate
              ? existingPlan.nextRunDate
              : draft.startDate > existingPlan.nextRunDate
                ? draft.startDate
                : existingPlan.nextRunDate,
          active: draft.active,
          updatedAt: now.toISOString(),
        }
      : createDcaPlan(draft, now);

    const nextDcaPlans = existingPlan
      ? dcaPlans.map((plan) => (plan.id === existingPlan.id ? nextPlan : plan))
      : [...dcaPlans, nextPlan];

    persistDcaPlans(nextDcaPlans);
    setDcaModal({ open: false, fund: null });
    showToast(existingPlan ? '定投计划已更新' : '定投计划已创建', 'success');
    void processPendingQueue();
  };

  const handleDeleteDcaPlan = (planId: string) => {
    persistDcaPlans(dcaPlans.filter((plan) => plan.id !== planId));
    persistPendingTrades(
      pendingTrades.filter((trade) => trade.sourcePlanId !== planId),
    );
    showToast('定投计划已删除', 'success');
  };

  const handleToggleDcaPlanActive = (planId: string, active: boolean) => {
    persistDcaPlans(
      dcaPlans.map((plan) =>
        plan.id === planId
          ? { ...plan, active, updatedAt: nowInTz().toISOString() }
          : plan,
      ),
    );
    showToast(active ? '定投计划已恢复' : '定投计划已暂停', 'success');
    if (active) void processPendingQueue();
  };
  const showToast = (
    message: string,
    type: 'success' | 'info' | 'error' = 'info',
  ) => {
    toast[type](message, { duration: 3000 });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowDropdown]);

  const applyViewMode = useCallback(
    (mode: ViewMode) => {
      if (mode !== 'card' && mode !== 'list') return;
      setViewMode(mode);
      storageHelper.saveViewMode(mode);
    },
    [storageHelper],
  );

  // 按 code 去重，保留第一次出现的项，避免列表重复
  // `refreshAll` intentionally stays out of the deps list here so bootstrapping
  // only runs against the persisted snapshot we just loaded.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    try {
      const bootstrap = storageHelper.loadBootstrapState();
      const rawFunds = storageHelper.getItem('funds');
      const dcaBootstrap = materializeDueDcaTrades({
        dcaPlans: bootstrap.dcaPlans,
        pendingTrades: bootstrap.pendingTrades,
      });
      const restoredPendingTrades = dcaBootstrap.pendingTrades;
      const restoredDcaPlans = dcaBootstrap.dcaPlans;

      if (dcaBootstrap.changed) {
        storageHelper.savePendingTrades(restoredPendingTrades);
        storageHelper.saveDcaPlans(restoredDcaPlans);
      }

      holdingsRef.current = bootstrap.holdings;
      pendingTradesRef.current = restoredPendingTrades;
      dcaPlansRef.current = restoredDcaPlans;

      if (rawFunds === null) {
        // 首次访问，添加默认基金 004253 (信达澳银新能源产业股票)
        const defaultCode = '004253';
        fetchFundData(defaultCode)
          .then((data) => {
            setFunds([data]);
            storageHelper.saveFunds([data]);
            fetchIntradayData(defaultCode).then((intra) => {
              if (intra)
                setIntradayMap((prev) => ({ ...prev, [defaultCode]: intra }));
            });
          })
          .catch((e) => console.error('Default fund load failed', e));
      } else {
        const saved = JSON.parse(rawFunds || '[]');
        if (Array.isArray(saved) && saved.length) {
          const deduped = dedupeFundsByCode(saved);
          setFunds(deduped);
          storageHelper.saveFunds(deduped);
          const codes = Array.from(new Set(deduped.map((f) => f.code)));
          if (codes.length) refreshAll(codes);
        }
      }

      setRefreshMs(bootstrap.refreshMs);
      setTempSeconds(Math.round(bootstrap.refreshMs / 1000));
      setPendingTrades(restoredPendingTrades);
      setDcaPlans(restoredDcaPlans);
      setHoldings(bootstrap.holdings);
      setViewMode(bootstrap.viewMode);
    } catch {}
  }, [storageHelper]);

  // This timer is recreated from the latest fund list and refresh interval only.
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const codes = Array.from(new Set(funds.map((f) => f.code)));
      if (codes.length) refreshAll(codes);
    }, refreshMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [funds, refreshMs]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const refreshAll = async (codes: string[]) => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    try {
      const result = await loadFundBatch({
        codes,
        currentFunds: funds,
        fetchFund: fetchFundData,
        fetchIntraday: fetchIntradayData,
      });

      if (Object.keys(result.intradayMap).length > 0) {
        setIntradayMap((prev) => ({ ...prev, ...result.intradayMap }));
      }

      setFunds(result.funds);
      storageHelper.saveFunds(result.funds);
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
      try {
        await processPendingQueue();
      } catch {
        showToast('待交易队列计算出错', 'error');
      }
    }
  };

  const requestRemoveFund = (fund: FundData) => {
    const h = holdings[fund.code];
    const hasHolding = h && typeof h.share === 'number' && h.share > 0;
    if (hasHolding) {
      setFundDeleteConfirm({ code: fund.code, name: fund.name });
    } else {
      removeFund(fund.code);
    }
  };

  const addFund = async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    setError('');
    const manualTokens = String(searchTerm || '')
      .split(/[^0-9A-Za-z]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    const selectedCodes = Array.from(
      new Set([
        ...selectedFunds.map((f) => f.CODE),
        ...manualTokens.filter((t) => /^\d{6}$/.test(t)),
      ]),
    );
    if (selectedCodes.length === 0) {
      setError('请输入或选择基金代码');
      return;
    }
    setLoading(true);
    try {
      const newFunds: FundData[] = [];
      const failures: Array<{ code: string; name?: string }> = [];
      const nameMap: Record<string, string> = {};
      selectedFunds.forEach((f) => {
        nameMap[f.CODE] = f.NAME;
      });
      for (const c of selectedCodes) {
        if (funds.some((f) => f.code === c)) continue;
        try {
          const data = await fetchFundData(c);
          newFunds.push(data);
        } catch {
          failures.push({ code: c, name: nameMap[c] });
        }
      }
      if (newFunds.length === 0) {
        setError('未添加任何新基金');
      } else {
        const next = dedupeFundsByCode([...newFunds, ...funds]);
        setFunds(next);
        storageHelper.saveFunds(next);
      }
      resetSearch();
      if (failures.length > 0) {
        setAddFailures(failures);
        setAddResultOpen(true);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '添加失败');
    } finally {
      setLoading(false);
    }
  };

  const removeFund = (removeCode: string) => {
    const next = funds.filter((f) => f.code !== removeCode);
    setFunds(next);
    storageHelper.saveFunds(next);

    // 同步删除持仓数据
    setHoldings((prev) => {
      if (!prev[removeCode]) return prev;
      const next = { ...prev };
      delete next[removeCode];
      storageHelper.saveHoldings(next);
      return next;
    });

    // 同步删除待处理交易
    persistPendingTrades(
      pendingTradesRef.current.filter(
        (trade) => trade?.fundCode !== removeCode,
      ),
    );

    // 同步删除定投计划
    persistDcaPlans(
      dcaPlansRef.current.filter((plan) => plan.fundCode !== removeCode),
    );
  };

  const manualRefresh = async () => {
    if (refreshingRef.current) return;
    const codes = Array.from(new Set(funds.map((f) => f.code)));
    if (!codes.length) return;
    await refreshAll(codes);
  };

  const saveSettings = (e?: React.MouseEvent) => {
    e?.preventDefault?.();
    const ms = Math.max(10, Number(tempSeconds)) * 1000;
    setRefreshMs(ms);
    storageHelper.saveRefreshMs(ms);
    setSettingsOpen(false);
  };

  const importFileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState('');

  const collectLocalPayload = () =>
    storageHelper.collectSnapshot(nowInTz().toISOString());

  const exportLocalData = async () => {
    try {
      const payload = collectLocalPayload();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const pickerWindow = window as SaveFilePickerWindow;
      if (pickerWindow.showSaveFilePicker) {
        const handle = await pickerWindow.showSaveFilePicker({
          suggestedName: `realtime-fund-config-${Date.now()}.json`,
          types: [
            { description: 'JSON', accept: { 'application/json': ['.json'] } },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        setSuccessModal({ open: true, message: '导出成功' });
        setSettingsOpen(false);
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `realtime-fund-config-${Date.now()}.json`;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        URL.revokeObjectURL(url);
        setSuccessModal({ open: true, message: '导出成功' });
        setSettingsOpen(false);
      };
      const onVisibility = () => {
        if (document.visibilityState === 'hidden') return;
        finish();
        document.removeEventListener('visibilitychange', onVisibility);
      };
      document.addEventListener('visibilitychange', onVisibility, {
        once: true,
      });
      a.click();
      setTimeout(finish, 3000);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const handleImportFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      const data = JSON.parse(text) as Partial<FundSnapshot>;
      if (data && typeof data === 'object') {
        const { snapshot, appendedCodes } = storageHelper.mergeImportedSnapshot(
          data,
          nowInTz().toISOString(),
        );

        holdingsRef.current = snapshot.holdings as HoldingsMap;
        pendingTradesRef.current = snapshot.pendingTrades;
        dcaPlansRef.current = snapshot.dcaPlans;
        setFunds(snapshot.funds);
        setRefreshMs(snapshot.refreshMs);
        setTempSeconds(Math.round(snapshot.refreshMs / 1000));
        setHoldings(snapshot.holdings as HoldingsMap);
        setPendingTrades(snapshot.pendingTrades);
        setDcaPlans(snapshot.dcaPlans);

        storageHelper.saveFunds(snapshot.funds);
        storageHelper.saveRefreshMs(snapshot.refreshMs);
        storageHelper.saveHoldings(snapshot.holdings as HoldingsMap);
        storageHelper.savePendingTrades(snapshot.pendingTrades);
        storageHelper.saveDcaPlans(snapshot.dcaPlans);
        applyViewMode(snapshot.viewMode);

        if (appendedCodes.length) {
          const allCodes = snapshot.funds.map((f) => f.code);
          await refreshAll(allCodes);
        }

        setSuccessModal({ open: true, message: '导入成功' });
        setSettingsOpen(false); // 导入成功自动关闭设置弹框
        if (importFileRef.current) importFileRef.current.value = '';
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportMsg('导入失败，请检查文件格式');
      setTimeout(() => setImportMsg(''), 4000);
      if (importFileRef.current) importFileRef.current.value = '';
    }
  };

  const isAnyModalOpen =
    settingsOpen ||
    addResultOpen ||
    successModal.open ||
    holdingModal.open ||
    actionModal.open ||
    topStocksModal.open ||
    tradeModal.open ||
    dcaModal.open ||
    !!clearConfirm ||
    !!fundDeleteConfirm;

  useDashboardModalEffects({
    isAnyModalOpen,
    isSettingsOpen: settingsOpen,
    onCloseSettings: () => setSettingsOpen(false),
  });

  return (
    <div className="mx-auto flex max-w-[1360px] flex-col gap-5 px-4 py-5 md:px-6 md:py-6 xl:gap-6 xl:px-8">
      <section
        className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.85fr)] xl:items-stretch"
        aria-label="基金工作台控制区"
      >
        <AddFundPanel
          dropdownRef={dropdownRef}
          error={error}
          funds={funds}
          hasFunds={funds.length > 0}
          isSearching={isSearching}
          loading={loading}
          refreshing={refreshing}
          searchResults={searchResults}
          searchTerm={searchTerm}
          selectedFunds={selectedFunds}
          showDropdown={showDropdown}
          theme={theme}
          onAddFund={addFund}
          onHandleSearchInput={handleSearchInput}
          onManualRefresh={manualRefresh}
          onOpenSettings={() => setSettingsOpen(true)}
          onSetShowDropdown={setShowDropdown}
          onToggleTheme={toggleTheme}
          onToggleSelectFund={toggleSelectFund}
        />

        <DashboardFilterBar
          sortBy={sortBy}
          sortOrder={sortOrder}
          viewMode={viewMode}
          onApplyViewMode={applyViewMode}
          onSetSortBy={setSortBy}
          onSetSortOrder={setSortOrder}
        />
      </section>

      <section className="flex flex-col gap-4" aria-label="基金监控列表">
        <DashboardFundList
          dcaPlans={dcaPlans}
          displayFunds={displayFunds}
          getHoldingProfit={getHoldingProfit}
          holdings={holdings}
          intradayMap={intradayMap}
          isMobile={isMobile}
          isTradingDay={isTradingDay}
          refreshing={refreshing}
          requestRemoveFund={requestRemoveFund}
          setActionModal={setActionModal}
          setHoldingModal={setHoldingModal}
          setSwipedFundCode={setSwipedFundCode}
          setTopStocksModal={setTopStocksModal}
          swipedFundCode={swipedFundCode}
          todayStr={todayStr}
          viewMode={viewMode}
        />
      </section>
      <AnimatePresence>
        {fundDeleteConfirm && (
          <ConfirmModal
            title="删除确认"
            message={`基金 "${fundDeleteConfirm.name}" 存在持仓记录。删除后将移除该基金及其持仓数据，是否继续？`}
            confirmText="确定删除"
            onConfirm={() => {
              removeFund(fundDeleteConfirm.code);
              setFundDeleteConfirm(null);
            }}
            onCancel={() => setFundDeleteConfirm(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {addResultOpen && (
          <AddResultModal
            failures={addFailures}
            onClose={() => setAddResultOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {actionModal.open && (
          <HoldingActionModal
            fund={actionModal.fund}
            holding={holdings[actionModal.fund?.code]}
            onClose={() => setActionModal({ open: false, fund: null })}
            onAction={(type) => handleAction(type, actionModal.fund)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {topStocksModal.open && (
          <TopStocksModal
            fund={topStocksModal.fund}
            onClose={() => setTopStocksModal({ open: false, fund: null })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {tradeModal.open && (
          <TradeModal
            type={tradeModal.type}
            fund={tradeModal.fund}
            holding={holdings[tradeModal.fund?.code]}
            onClose={() =>
              setTradeModal({ open: false, fund: null, type: 'buy' })
            }
            onConfirm={(data) => handleTrade(tradeModal.fund, data)}
            pendingTrades={pendingTrades}
            onDeletePending={(id) => {
              persistPendingTrades(
                pendingTrades.filter((trade) => trade.id !== id),
              );
              showToast('已撤销待处理交易', 'success');
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {dcaModal.open && (
          <DcaPlanModal
            fund={dcaModal.fund}
            plans={dcaPlans.filter(
              (plan) => plan.fundCode === dcaModal.fund?.code,
            )}
            onClose={() => setDcaModal({ open: false, fund: null })}
            onDelete={handleDeleteDcaPlan}
            onSave={handleSaveDcaPlan}
            onToggleActive={handleToggleDcaPlanActive}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {clearConfirm && (
          <ConfirmModal
            title="清空持仓"
            message={`确定要清空“${clearConfirm.fund?.name}”的所有持仓记录吗？此操作不可恢复。`}
            onConfirm={handleClearConfirm}
            onCancel={() => setClearConfirm(null)}
            confirmText="确认清空"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {holdingModal.open && (
          <HoldingEditModal
            fund={holdingModal.fund}
            holding={holdings[holdingModal.fund?.code]}
            onClose={() => setHoldingModal({ open: false, fund: null })}
            onSave={(data) => handleSaveHolding(holdingModal.fund?.code, data)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successModal.open && (
          <SuccessModal
            message={successModal.message}
            onClose={() => setSuccessModal({ open: false, message: '' })}
          />
        )}
      </AnimatePresence>

      {settingsOpen && (
        <DashboardSettingsModal
          importFileRef={importFileRef}
          importMsg={importMsg}
          tempSeconds={tempSeconds}
          onClose={() => setSettingsOpen(false)}
          onExportLocalData={exportLocalData}
          onHandleImportFileChange={handleImportFileChange}
          onSaveSettings={saveSettings}
          onSetTempSeconds={setTempSeconds}
        />
      )}
    </div>
  );
}
