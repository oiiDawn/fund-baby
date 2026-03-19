import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  sampleFund,
  sampleIntraday,
  sampleSearchResults,
  secondaryFund,
} from '@/tests/fixtures/funds/sample-data';

const fundApiMocks = vi.hoisted(() => ({
  fetchFundData: vi.fn(async (code: string) =>
    code === secondaryFund.code ? secondaryFund : sampleFund,
  ),
  fetchIntradayData: vi.fn(async () => sampleIntraday),
  fetchShanghaiIndexDate: vi.fn(async () => '20260318'),
  fetchSmartFundNetValue: vi.fn(async () => ({
    date: '2026-03-18',
    value: 1.25,
  })),
  searchFunds: vi.fn(async () => sampleSearchResults),
}));

vi.mock('@/app/features/fund-dashboard/services/fund-api', () => ({
  fetchFundData: fundApiMocks.fetchFundData,
  fetchIntradayData: fundApiMocks.fetchIntradayData,
  fetchShanghaiIndexDate: fundApiMocks.fetchShanghaiIndexDate,
  fetchSmartFundNetValue: fundApiMocks.fetchSmartFundNetValue,
  searchFunds: fundApiMocks.searchFunds,
}));

import HomePage from '@/app/page';

describe('HomePage integration', () => {
  beforeEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
    window.localStorage.setItem('funds', JSON.stringify([sampleFund]));
    window.localStorage.setItem('favorites', '[]');
    window.localStorage.setItem('groups', '[]');
    window.localStorage.setItem('collapsedCodes', '[]');
    window.localStorage.setItem('pendingTrades', '[]');
    window.localStorage.setItem('holdings', '{}');
    window.localStorage.setItem('viewMode', 'card');
    fundApiMocks.fetchFundData.mockClear();
    fundApiMocks.fetchIntradayData.mockClear();
    fundApiMocks.fetchShanghaiIndexDate.mockClear();
    fundApiMocks.fetchSmartFundNetValue.mockClear();
    fundApiMocks.searchFunds.mockClear();
  });

  it('renders the dashboard shell and opens settings', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    expect(
      screen.getByPlaceholderText('搜索基金名称或代码...'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('打开设置')).toBeInTheDocument();

    await user.click(screen.getByLabelText('打开设置'));
    expect(screen.getByRole('dialog', { name: '设置' })).toBeInTheDocument();

    await waitFor(() =>
      expect(fundApiMocks.fetchFundData).toHaveBeenCalledWith(sampleFund.code),
    );
  });

  it('calls search API after the debounce window', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    const input = screen.getByPlaceholderText('搜索基金名称或代码...');
    await user.type(input, '测试');

    await waitFor(
      () => expect(fundApiMocks.searchFunds).toHaveBeenCalledWith('测试'),
      {
        timeout: 1500,
      },
    );
  });
});
