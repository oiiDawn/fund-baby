'use client';

import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchFundData,
  fetchIntradayData,
  fetchShanghaiIndexDate,
  fetchSmartFundNetValue,
  searchFunds,
} from '@/app/features/fund-dashboard/services/fund-api';
import type {
  HoldingProfit,
  IntradayPoint,
  PendingTrade,
  SortBy,
  SortOrder,
  TradeType,
  ToastType,
  ViewMode,
  FundData,
  FundGroup,
  Holding,
  HoldingsMap,
} from '@/app/types';
import { cn } from '@/app/lib/cn';
import { formatDate, nowInTz } from '@/app/lib/date';
import { panelClass } from '@/app/lib/ui';
import { AddFundPanel } from '@/app/features/fund-dashboard/components/add-fund-panel';
import { DashboardFilterBar } from '@/app/features/fund-dashboard/components/dashboard-filter-bar';
import { DashboardFundList } from '@/app/features/fund-dashboard/components/dashboard-fund-list';
import { DashboardHeader } from '@/app/features/fund-dashboard/components/dashboard-header';
import {
  AddFundToGroupModal,
  AddResultModal,
  ConfirmModal,
  GroupManageModal,
  GroupModal,
  SuccessModal,
} from '@/app/features/fund-dashboard/components/dashboard-management-modals';
import { DashboardSettingsModal } from '@/app/features/fund-dashboard/components/dashboard-settings-modal';
import {
  HoldingActionModal,
  HoldingEditModal,
  TopStocksModal,
  TradeModal,
  type TradeConfirmData,
} from '@/app/features/fund-dashboard/components/dashboard-trade-modals';
import {
  filterFundsByTab,
  dedupeFundsByCode,
  sortFunds,
} from '@/app/features/fund-dashboard/services/fund-collection';
import {
  loadFundBatch,
  resolveTradingDayStatus,
} from '@/app/features/fund-dashboard/services/fund-refresh';
import {
  getHoldingProfitForFund,
  processPendingTrades,
} from '@/app/features/fund-dashboard/services/fund-trade';
import { useDashboardModalEffects } from '@/app/features/fund-dashboard/hooks/use-dashboard-modal-effects';
import { useFundSearch } from '@/app/features/fund-dashboard/hooks/use-fund-search';
import { createFundDashboardRepository } from '@/app/features/fund-dashboard/repository/fund-dashboard-repository';
import type { FundSnapshot } from '@/app/features/fund-dashboard/types';

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

  // 收起/展开状态
  const [, setCollapsedCodes] = useState<Set<string>>(new Set());

  // 自选状态
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [groups, setGroups] = useState<FundGroup[]>([]); // [{ id, name, codes: [] }]
  const [currentTab, setCurrentTab] = useState('all');
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupManageOpen, setGroupManageOpen] = useState(false);
  const [addFundToGroupOpen, setAddFundToGroupOpen] = useState(false);

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
  const [clearConfirm, setClearConfirm] = useState<{ fund: FundData } | null>(
    null,
  );
  const [holdings, setHoldings] = useState<HoldingsMap>({});
  const [pendingTrades, setPendingTrades] = useState<PendingTrade[]>([]);

  const holdingsRef = useRef<HoldingsMap>(holdings);
  const pendingTradesRef = useRef<PendingTrade[]>(pendingTrades);
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
  }, [holdings, pendingTrades]);

  useEffect(() => {
    const savedTheme = storageHelper.loadBootstrapState().theme;
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, [storageHelper]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    storageHelper.saveTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const [isTradingDay, setIsTradingDay] = useState(true);
  const tabsRef = useRef<HTMLDivElement>(null);
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
  const displayFunds = sortFunds(
    filterFundsByTab(funds, currentTab, favorites, groups),
    sortBy,
    sortOrder,
    (fund) => getHoldingProfit(fund, holdings[fund.code]),
  );

  // 自动滚动选中 Tab 到可视区域
  useEffect(() => {
    if (!tabsRef.current) return;
    if (currentTab === 'all') {
      tabsRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      return;
    }
    const activeTab = tabsRef.current.querySelector('.tab.active');
    if (activeTab) {
      activeTab.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [currentTab]);

  // 鼠标拖拽滚动逻辑
  const [isDragging, setIsDragging] = useState(false);
  // Removed startX and scrollLeft state as we use movementX now
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

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
    const result = await processPendingTrades({
      holdings: holdingsRef.current,
      pendingTrades: pendingTradesRef.current,
      resolveNetValue: fetchSmartFundNetValue,
    });

    if (result.processedCount > 0) {
      setHoldings(result.holdings);
      storageHelper.saveHoldings(result.holdings);
      setPendingTrades(result.pendingTrades);
      storageHelper.savePendingTrades(result.pendingTrades);
      showToast(`已处理 ${result.processedCount} 笔待定交易`, 'success');
    }
  };

  const handleTrade = (fund: FundData, data: TradeConfirmData) => {
    // 如果没有价格（API失败），加入待处理队列
    if (!data.price || data.price === 0) {
      const pending = {
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
      };

      const next = [...pendingTrades, pending];
      setPendingTrades(next);
      storageHelper.savePendingTrades(next);

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

  const handleMouseDown = () => {
    if (!tabsRef.current) return;
    setIsDragging(true);
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !tabsRef.current) return;
    e.preventDefault();
    tabsRef.current.scrollLeft -= e.movementX;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!tabsRef.current) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    tabsRef.current.scrollLeft += delta;
  };

  const updateTabOverflow = () => {
    if (!tabsRef.current) return;
    const el = tabsRef.current;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    updateTabOverflow();
    const onResize = () => updateTabOverflow();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [groups, funds.length, favorites.size]);

  // 成功提示弹窗
  const [successModal, setSuccessModal] = useState<{
    open: boolean;
    message: string;
  }>({ open: false, message: '' });
  // 轻提示 (Toast)
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: ToastType;
  }>({ show: false, message: '', type: 'info' });
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: ToastType = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
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

  const toggleFavorite = (code: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      storageHelper.saveFavorites(next);
      if (next.size === 0) setCurrentTab('all');
      return next;
    });
  };

  const handleAddGroup = (name: string) => {
    const newGroup = {
      id: `group_${Date.now()}`,
      name,
      codes: [],
    };
    const next = [...groups, newGroup];
    setGroups(next);
    storageHelper.saveGroups(next);
    setCurrentTab(newGroup.id);
    setGroupModalOpen(false);
  };

  const handleUpdateGroups = (newGroups: FundGroup[]) => {
    setGroups(newGroups);
    storageHelper.saveGroups(newGroups);
    // 如果当前选中的分组被删除了，切换回“全部”
    if (
      currentTab !== 'all' &&
      currentTab !== 'fav' &&
      !newGroups.find((g) => g.id === currentTab)
    ) {
      setCurrentTab('all');
    }
  };

  const handleAddFundsToGroup = (codes: string[]) => {
    if (!codes || codes.length === 0) return;
    const next = groups.map((g) => {
      if (g.id === currentTab) {
        return {
          ...g,
          codes: Array.from(new Set([...g.codes, ...codes])),
        };
      }
      return g;
    });
    setGroups(next);
    storageHelper.saveGroups(next);
    setAddFundToGroupOpen(false);
    setSuccessModal({ open: true, message: `成功添加 ${codes.length} 支基金` });
  };

  const removeFundFromCurrentGroup = (code: string) => {
    const next = groups.map((g) => {
      if (g.id === currentTab) {
        return {
          ...g,
          codes: g.codes.filter((c) => c !== code),
        };
      }
      return g;
    });
    setGroups(next);
    storageHelper.saveGroups(next);
  };

  // 按 code 去重，保留第一次出现的项，避免列表重复
  // `refreshAll` intentionally stays out of the deps list here so bootstrapping
  // only runs against the persisted snapshot we just loaded.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    try {
      const bootstrap = storageHelper.loadBootstrapState();
      const rawFunds = storageHelper.getItem('funds');

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
      setCollapsedCodes(bootstrap.collapsedCodes);
      setFavorites(bootstrap.favorites);
      setPendingTrades(bootstrap.pendingTrades);
      setGroups(bootstrap.groups);
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

    // 同步删除分组中的失效代码
    const nextGroups = groups.map((g) => ({
      ...g,
      codes: g.codes.filter((c) => c !== removeCode),
    }));
    setGroups(nextGroups);
    storageHelper.saveGroups(nextGroups);

    // 同步删除展开收起状态
    setCollapsedCodes((prev) => {
      if (!prev.has(removeCode)) return prev;
      const nextSet = new Set(prev);
      nextSet.delete(removeCode);
      storageHelper.saveCollapsedCodes(nextSet);
      return nextSet;
    });

    // 同步删除自选状态
    setFavorites((prev) => {
      if (!prev.has(removeCode)) return prev;
      const nextSet = new Set(prev);
      nextSet.delete(removeCode);
      storageHelper.saveFavorites(nextSet);
      if (nextSet.size === 0) setCurrentTab('all');
      return nextSet;
    });

    // 同步删除持仓数据
    setHoldings((prev) => {
      if (!prev[removeCode]) return prev;
      const next = { ...prev };
      delete next[removeCode];
      storageHelper.saveHoldings(next);
      return next;
    });

    // 同步删除待处理交易
    setPendingTrades((prev) => {
      const next = prev.filter((trade) => trade?.fundCode !== removeCode);
      storageHelper.savePendingTrades(next);
      return next;
    });
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

        setFunds(snapshot.funds);
        setFavorites(new Set(snapshot.favorites));
        setGroups(snapshot.groups);
        setCollapsedCodes(new Set(snapshot.collapsedCodes));
        setRefreshMs(snapshot.refreshMs);
        setTempSeconds(Math.round(snapshot.refreshMs / 1000));
        setHoldings(snapshot.holdings as HoldingsMap);
        setPendingTrades(snapshot.pendingTrades);

        storageHelper.saveFunds(snapshot.funds);
        storageHelper.saveFavorites(snapshot.favorites);
        storageHelper.saveGroups(snapshot.groups);
        storageHelper.saveCollapsedCodes(snapshot.collapsedCodes);
        storageHelper.saveRefreshMs(snapshot.refreshMs);
        storageHelper.saveHoldings(snapshot.holdings as HoldingsMap);
        storageHelper.savePendingTrades(snapshot.pendingTrades);
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
    addFundToGroupOpen ||
    groupManageOpen ||
    groupModalOpen ||
    successModal.open ||
    holdingModal.open ||
    actionModal.open ||
    topStocksModal.open ||
    tradeModal.open ||
    !!clearConfirm ||
    !!fundDeleteConfirm;

  useDashboardModalEffects({
    isAnyModalOpen,
    isSettingsOpen: settingsOpen,
    onCloseSettings: () => setSettingsOpen(false),
  });

  const getGroupName = () => {
    if (currentTab === 'all') return '全部资产';
    if (currentTab === 'fav') return '自选资产';
    const group = groups.find((g) => g.id === currentTab);
    return group ? `${group.name}资产` : '分组资产';
  };

  const holdingsCount = Object.values(holdings).filter((holding) => {
    if (!holding) return false;
    const share = Number(holding.share ?? 0);
    return Number.isFinite(share) && share > 0;
  }).length;

  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-6 pt-32 md:px-6 md:pt-28">
      <DashboardHeader
        fundsCount={funds.length}
        holdingsCount={holdingsCount}
        isTradingDay={isTradingDay}
        refreshMs={refreshMs}
        refreshing={refreshing}
        theme={theme}
        onManualRefresh={manualRefresh}
        onOpenSettings={() => setSettingsOpen(true)}
        onToggleTheme={toggleTheme}
      />

      <section
        className="mb-5 grid gap-4 border-b border-border pb-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
        aria-label="基金资产概览"
      >
        <div className="border-b border-border pb-4 lg:border-b-0 lg:pb-0">
          <div className="mb-2 text-[0.74rem] font-bold uppercase tracking-[0.22em] text-gold">
            Fund Intelligence Console
          </div>
          <h1 className="mb-2 text-[clamp(1.7rem,2.8vw,2.3rem)] font-bold leading-tight">
            基金资产总览
          </h1>
          <p className="max-w-[44rem] text-[0.98rem] text-muted-strong">
            围绕估值、持仓、分组和交易节奏构建的一体化看板，帮助你更快把握仓位状态与资金波动。
          </p>
        </div>
        <div className="grid grid-cols-1 border-t border-l border-border sm:grid-cols-2">
          <div className="flex min-h-[92px] flex-col justify-between border-b border-r border-border px-4 py-3">
            <span className="text-[0.76rem] uppercase tracking-[0.08em] text-muted">
              监控基金
            </span>
            <strong className="text-[1.55rem] font-bold tracking-[0.04em]">
              {funds.length}
            </strong>
            <span className="text-sm text-muted">
              当前标签：{getGroupName()}
            </span>
          </div>
          <div className="flex min-h-[92px] flex-col justify-between border-b border-r border-border px-4 py-3">
            <span className="text-[0.76rem] uppercase tracking-[0.08em] text-muted">
              有效持仓
            </span>
            <strong className="text-[1.55rem] font-bold tracking-[0.04em]">
              {holdingsCount}
            </strong>
            <span className="text-sm text-muted">聚焦真实资产暴露</span>
          </div>
          <div className="flex min-h-[92px] flex-col justify-between border-b border-r border-border px-4 py-3">
            <span className="text-[0.76rem] uppercase tracking-[0.08em] text-muted">
              待处理交易
            </span>
            <strong className="text-[1.55rem] font-bold tracking-[0.04em]">
              {pendingTrades.length}
            </strong>
            <span className="text-sm text-muted">等待净值确认后入账</span>
          </div>
          <div className="flex min-h-[92px] flex-col justify-between border-b border-r border-border px-4 py-3">
            <span className="text-[0.76rem] uppercase tracking-[0.08em] text-muted">
              市场状态
            </span>
            <strong className="text-[1.55rem] font-bold tracking-[0.04em] text-gold">
              {isTradingDay ? 'OPEN' : 'CLOSED'}
            </strong>
            <span className="text-sm text-muted">
              {isTradingDay ? '估值与行情实时跟踪中' : '按最近交易日结算'}
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-4">
        <AddFundPanel
          dropdownRef={dropdownRef}
          error={error}
          funds={funds}
          isSearching={isSearching}
          loading={loading}
          refreshing={refreshing}
          searchResults={searchResults}
          searchTerm={searchTerm}
          selectedFunds={selectedFunds}
          showDropdown={showDropdown}
          onAddFund={addFund}
          onHandleSearchInput={handleSearchInput}
          onSetShowDropdown={setShowDropdown}
          onToggleSelectFund={toggleSelectFund}
        />

        <div className="col-span-12">
          <DashboardFilterBar
            canLeft={canLeft}
            canRight={canRight}
            currentTab={currentTab}
            favoritesSize={favorites.size}
            fundsLength={funds.length}
            groups={groups}
            sortBy={sortBy}
            sortOrder={sortOrder}
            tabsRef={tabsRef}
            viewMode={viewMode}
            onApplyViewMode={applyViewMode}
            onHandleMouseDown={handleMouseDown}
            onHandleMouseLeaveOrUp={handleMouseLeaveOrUp}
            onHandleMouseMove={handleMouseMove}
            onHandleWheel={handleWheel}
            onOpenAddGroup={() => setGroupModalOpen(true)}
            onOpenGroupManage={() => setGroupManageOpen(true)}
            onSetCurrentTab={setCurrentTab}
            onSetSortBy={setSortBy}
            onSetSortOrder={setSortOrder}
            onUpdateTabOverflow={updateTabOverflow}
          />

          <DashboardFundList
            currentTab={currentTab}
            displayFunds={displayFunds}
            favorites={favorites}
            funds={funds}
            getGroupName={getGroupName}
            getHoldingProfit={getHoldingProfit}
            holdings={holdings}
            intradayMap={intradayMap}
            isMobile={isMobile}
            isTradingDay={isTradingDay}
            refreshing={refreshing}
            removeFundFromCurrentGroup={removeFundFromCurrentGroup}
            requestRemoveFund={requestRemoveFund}
            setActionModal={setActionModal}
            setAddFundToGroupOpen={setAddFundToGroupOpen}
            setHoldingModal={setHoldingModal}
            setSwipedFundCode={setSwipedFundCode}
            setTopStocksModal={setTopStocksModal}
            swipedFundCode={swipedFundCode}
            todayStr={todayStr}
            toggleFavorite={toggleFavorite}
            viewMode={viewMode}
          />
        </div>
      </div>
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

      <div className="mt-6 pb-14 text-center text-xs text-muted">
        <p className="mb-2">
          数据源：实时估值与重仓直连东方财富，仅供个人学习及参考使用，不作为任何投资建议
        </p>
      </div>
      <AnimatePresence>
        {addResultOpen && (
          <AddResultModal
            failures={addFailures}
            onClose={() => setAddResultOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {addFundToGroupOpen && (
          <AddFundToGroupModal
            allFunds={funds}
            currentGroupCodes={
              groups.find((g) => g.id === currentTab)?.codes || []
            }
            onClose={() => setAddFundToGroupOpen(false)}
            onAdd={handleAddFundsToGroup}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {actionModal.open && (
          <HoldingActionModal
            fund={actionModal.fund}
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
              setPendingTrades((prev) => {
                const next = prev.filter((t) => t.id !== id);
                storageHelper.savePendingTrades(next);
                return next;
              });
              showToast('已撤销待处理交易', 'success');
            }}
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
        {groupManageOpen && (
          <GroupManageModal
            groups={groups}
            onClose={() => setGroupManageOpen(false)}
            onSave={handleUpdateGroups}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {groupModalOpen && (
          <GroupModal
            onClose={() => setGroupModalOpen(false)}
            onConfirm={handleAddGroup}
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

      {/* 全局轻提示 Toast */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={cn(
              panelClass,
              'fixed left-1/2 top-6 z-[9999] flex max-w-[90vw] items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium whitespace-nowrap shadow-soft',
              toast.type === 'error' &&
                'border-transparent bg-danger text-interactive-contrast',
              toast.type === 'success' &&
                'border-transparent bg-success text-interactive-contrast',
              toast.type === 'info' && 'bg-surface-floating text-text',
            )}
          >
            {toast.type === 'error' && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M12 8v4M12 16h.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
            {toast.type === 'success' && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
