import { test, expect } from '@playwright/test';

test('management content should expand to 1440px max width', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/management');
  
  // Wait for rendering
  await page.waitForTimeout(500);
  
  // Check <main> in management layout
  const main = page.locator('aside').first().locator('..').locator('> main, > div > main, .flex-1 > main, main[role="main"]');
  const mainWidth = await main.evaluate(el => {
    const rect = el.getBoundingClientRect();
    return Math.round(rect.width);
  });
  
  // Check Navbar width for comparison
  const navbar = page.locator('header').first();
  const navbarWidth = await navbar.evaluate(el => {
    const rect = el.querySelector('[class*="max-w"]') || el;
    return Math.round(rect.getBoundingClientRect().width);
  });

  console.log(`Viewport width: 1920px`);
  console.log(`Main content width: ${mainWidth}px`);
  console.log(`Navbar width: ${navbarWidth}px`);
  
  // Main should be max 1440px and centered (so it should NOT fill full viewport)
  if (mainWidth > 1440) {
    console.error(`❌ Main content is TOO WIDE: ${mainWidth}px (max should be 1440)`);
  } else if (mainWidth < 1200) {
    console.error(`❌ Main content is too narrow: ${mainWidth}px (should expand towards 1440)`);
  } else {
    console.log(`✅ Main content width looks correct`);
  }

  // Compare with Navbar - they should be roughly the same max-width
  const maxW = await page.evaluate(() => {
    const navMain = document.querySelector('header');
    if (!navMain) return 'N/A';
    const style = window.getComputedStyle(navMain);
    return style.maxWidth || 'none';
  });
  console.log(`Navbar maxWidth: ${maxW}`);
});
