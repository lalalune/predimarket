import { test, expect, Page, BrowserContext } from '@playwright/test';
import { MetaMask, getMetaMask, launch } from 'dappwright';

const TEST_SEED_PHRASE = 'test test test test test test test test test test test junk';
const TEST_PASSWORD = 'Test1234!';
const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Anvil default

const L2_RPC_URL = process.env.L2_RPC_URL || process.env.JEJU_RPC_URL || `http://localhost:${process.env.L2_RPC_PORT || '9545'}`;
const PREDIMARKET_URL = process.env.PREDIMARKET_URL || `http://localhost:${process.env.PREDIMARKET_PORT || '4005'}`;

test.describe('Wallet Connection with Dappwright', () => {
  let page: Page;
  let metamask: MetaMask;
  let context: BrowserContext;

  test.beforeAll(async () => {
    // Launch browser with MetaMask
    const result = await launch({
      headless: false, // MetaMask requires headful mode
      metamaskVersion: 'v11.16.17',
    });
    
    context = result.context;
    page = await context.newPage();
    metamask = await getMetaMask(page);
    
    // Setup MetaMask
    await metamask.importSeed(TEST_SEED_PHRASE);
    
    // Add custom network (Jeju local)
    await metamask.addNetwork({
      networkName: 'Jeju Local',
      rpc: L2_RPC_URL,
      chainId: process.env.PREDIMARKET_CHAIN_ID || process.env.CHAIN_ID || '1337',
      symbol: 'ETH'
    });
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('should connect wallet via Rainbow Kit', async () => {
    await page.goto(PREDIMARKET_URL);
    
    // Wait for page load
    await expect(page.getByText('Predimarket')).toBeVisible();
    
    // Click connect button
    await page.getByRole('button', { name: /Connect/i }).click();
    
    // Wait for wallet modal
    await expect(page.getByText('MetaMask')).toBeVisible();
    
    // Click MetaMask option
    await page.getByText('MetaMask').click();
    
    // Approve connection in MetaMask
    await metamask.approve();
    
    // Wait for connection success
    await expect(page.getByText(/0x/)).toBeVisible({ timeout: 10000 });
  });

  test('should display connected wallet address', async () => {
    await page.goto(PREDIMARKET_URL);
    
    // Should show connected address (truncated)
    const addressButton = page.getByRole('button', { name: /0x[a-fA-F0-9]{4}\.\.\./ });
    await expect(addressButton).toBeVisible();
  });

  test('should navigate to a market and show trading interface', async () => {
    await page.goto(PREDIMARKET_URL);
    
    // Wait for markets to load
    await page.waitForSelector('[data-testid="market-card"]', { timeout: 15000 });
    
    // Click on first market
    await page.locator('[data-testid="market-card"]').first().click();
    
    // Should show trading interface
    await expect(page.getByText('Place Bet')).toBeVisible();
    await expect(page.getByText('YES')).toBeVisible();
    await expect(page.getByText('NO')).toBeVisible();
  });
});

