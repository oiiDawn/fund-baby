import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  sampleFund,
  sampleHolding,
  sampleIntraday,
} from '@/tests/fixtures/funds/sample-data';

const fundApiMocks = vi.hoisted(() => ({
  fetchFundData: vi.fn(async () => sampleFund),
  fetchIntradayData: vi.fn(async () => sampleIntraday),
  fetchShanghaiIndexDate: vi.fn(async () => '20260318'),
  fetchSmartFundNetValue: vi.fn(async () => ({
    date: '2026-03-18',
    value: 1.25,
  })),
  searchFunds: vi.fn(async () => []),
}));

vi.mock('@/app/services/fund-api', () => ({
  fetchFundData: fundApiMocks.fetchFundData,
  fetchIntradayData: fundApiMocks.fetchIntradayData,
  fetchShanghaiIndexDate: fundApiMocks.fetchShanghaiIndexDate,
  fetchSmartFundNetValue: fundApiMocks.fetchSmartFundNetValue,
  searchFunds: fundApiMocks.searchFunds,
}));

import HomePage from '@/app/page';

describe('HomePage list view holdings', () => {
  beforeEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
    window.localStorage.setItem('funds', JSON.stringify([sampleFund]));
    window.localStorage.setItem('collapsedCodes', '[]');
    window.localStorage.setItem('pendingTrades', '[]');
    window.localStorage.setItem(
      'holdings',
      JSON.stringify({
        [sampleFund.code]: sampleHolding,
      }),
    );
    window.localStorage.setItem('viewMode', 'list');
    fundApiMocks.fetchFundData.mockClear();
    fundApiMocks.fetchIntradayData.mockClear();
    fundApiMocks.fetchShanghaiIndexDate.mockClear();
    fundApiMocks.fetchSmartFundNetValue.mockClear();
    fundApiMocks.searchFunds.mockClear();
  });

  it('opens the holding action modal from the desktop list amount cell', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    const actionTrigger = await screen.findByRole('button', {
      name: /¥123\.45/i,
    });

    await user.click(actionTrigger);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: '编辑持仓' }),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(fundApiMocks.fetchFundData).toHaveBeenCalledWith(sampleFund.code),
    );
  });
});
