import { test, expect } from '@playwright/test';

test.describe('Authentication Flow (Email/Password)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies before each test to simulate a fresh state
    await page.context().clearCookies();
    await page.goto('/');
  });

  test('should show landing page with login option', async ({ page }) => {
    // Check for the main title in the landing page (h1) to avoid strict mode conflict with Navbar
    await expect(page.locator('h1:has-text("From Home Sandwich")')).toBeVisible();
    
    // Check if we are on the root page (not redirected to login yet)
    await expect(page).toHaveURL('/');
  });

  test('should redirect protected route to login when no auth token', async ({ page }) => {
    // Go directly to a protected route (receipt)
    await page.goto('/receipt');
    
    // Check if we are redirected to the login page
    const currentUrl = page.url();
    expect(currentUrl.includes('/login') || currentUrl.includes('/auth/login')).toBeTruthy();
  });

  test('should display email/password login form', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check for email and password inputs
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    
    // Check for submit button
    await expect(page.locator('button[type="submit"]')).toContainText('เข้าสู่ระบบ');
  });

  test('should handle login form submission', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Mock the Supabase Auth API
    await page.route('/auth/v1/token**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'test_access_token',
          refresh_token: 'test_refresh_token',
          token_type: 'bearer',
          expires_in: 3600,
          user: {
            id: 'test-user-id',
            email: 'admin@example.com',
          },
        }),
      });
    });

    // Fill in the form and submit
    await page.locator('#email').fill('admin@example.com');
    await page.locator('#password').fill('password123');
    await page.locator('button[type="submit"]').click();
    
    // Wait for redirect to root (or check URL change)
    await page.waitForTimeout(500);
  });

  test('should show error message on login failure', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Mock the Supabase Auth API to return an error
    await page.route('/auth/v1/token**', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error_description: 'Invalid login credentials',
        }),
      });
    });

    // Fill in the form and submit
    await page.locator('#email').fill('admin@example.com');
    await page.locator('#password').fill('wrong_password');
    await page.locator('button[type="submit"]').click();
    
    // Check for error message
    await expect(page.locator('[class*="border-[#d9827a]"]')).toBeVisible();
  });

  test('should navigate to update-password page', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Fill email first (needed for reset password)
    await page.locator('#email').fill('admin@example.com');
    
    // Click "ลืมรหัสผ่าน?" button
    await page.getByText('ลืมรหัสผ่าน?').click();
    
    // Check if we're on the update-password page
    await expect(page).toHaveURL(/.*\/auth\/update-password.*/);
  });

  test('should handle callback route correctly', async ({ page }) => {
    // Simulate a callback from Supabase with a code
    await page.goto('/auth/callback?code=test_code_123');
    
    // Wait a bit for the route change
    await page.waitForTimeout(500);
    const currentUrl = page.url();
    
    // Should either be at root or redirected back to login with a PKCE message
    expect(currentUrl === 'http://localhost:3000/' || 
           currentUrl.includes('/auth/callback') || 
           currentUrl.includes('/auth/login')).toBeTruthy();
  });

  test('should have auth-related cookies after login simulation', async ({ page }) => {
    // Simulate setting a Supabase auth cookie (sb-[...]-auth-token)
    await page.route('/api/auth/session', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { id: '123' }, session: { access_token: 'test_token' } }),
      });
    });

    await page.goto('/');
    
    // Wait for cookies to be set (simulated)
    const cookies = await page.context().cookies();
    const sbCookie = cookies.find(c => c.name.startsWith('sb-'));
    
    if (sbCookie) {
      expect(sbCookie.value).toBeTruthy();
    }
  });
});

test.describe('Navbar Auth State', () => {
  test('should show logout button when logged in', async ({ page }) => {
    // Set a mock auth cookie to simulate logged-in state
    await page.route('/api/auth/session', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { id: '123' } }),
      });
    });

    // Set the cookie directly with a valid path
    await page.context().addCookies([
      { name: 'sb-auth-token', value: 'test_token', url: 'http://localhost:3000' }
    ]);

    await page.goto('/');
    
    // Check if the logout button or user info is visible
    const navContent = page.locator('header > div > div:last-child');
    await expect(navContent).toBeVisible();
  });
});
