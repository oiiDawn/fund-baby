import { expect, test } from '@playwright/test';

import { mockFundApi, seedLocalStorage } from './mock-fund-api';

test.beforeEach(async ({ page }) => {
  await seedLocalStorage(page);
  await mockFundApi(page);
});

test('renders stored dashboard data and opens settings', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('测试新能源基金')).toBeVisible();
  await page.getByLabel('打开设置').click();
  await expect(page.getByRole('dialog', { name: '设置' })).toBeVisible();
});

test('searches and adds a second fund', async ({ page }) => {
  await page.goto('/');

  await page.getByPlaceholder('搜索基金名称或代码...').fill('测试');
  await expect(page.getByText('测试消费基金')).toBeVisible();
  await page.getByText('测试消费基金').click();
  await page.getByRole('button', { name: '加入监控', exact: true }).click();

  await expect(page.getByText('测试消费基金').last()).toBeVisible();
});
