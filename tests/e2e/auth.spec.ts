import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login form', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Check if login form elements are present
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Check for validation messages
    await expect(page.getByText('Username is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in valid credentials
    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Password').fill('password123');
    
    // Submit form
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Check if user is logged in
    await expect(page.getByText('Welcome, testuser')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in invalid credentials
    await page.getByLabel('Username').fill('invaliduser');
    await page.getByLabel('Password').fill('wrongpassword');
    
    // Submit form
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Check for error message
    await expect(page.getByText('Invalid username or password')).toBeVisible();
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.goto('/login');
    
    // Click register link
    await page.getByRole('link', { name: 'Create account' }).click();
    
    // Should be on registration page
    await expect(page).toHaveURL('/register');
    await expect(page.getByRole('button', { name: 'Register' })).toBeVisible();
  });
});

test.describe('Registration', () => {
  test('should successfully register new user', async ({ page }) => {
    await page.goto('/register');
    
    // Fill in registration form
    await page.getByLabel('Username').fill('newuser');
    await page.getByLabel('Email').fill('newuser@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');
    
    // Submit form
    await page.getByRole('button', { name: 'Register' }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Check if user is logged in
    await expect(page.getByText('Welcome, newuser')).toBeVisible();
  });

  test('should show error for duplicate username', async ({ page }) => {
    await page.goto('/register');
    
    // Fill in existing username
    await page.getByLabel('Username').fill('existinguser');
    await page.getByLabel('Email').fill('existing@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');
    
    // Submit form
    await page.getByRole('button', { name: 'Register' }).click();
    
    // Check for error message
    await expect(page.getByText('Username already exists')).toBeVisible();
  });
});

test.describe('PWA Features', () => {
  test('should be installable as PWA', async ({ page }) => {
    await page.goto('/');
    
    // Check for PWA manifest
    const manifest = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link?.getAttribute('href');
    });
    
    expect(manifest).toBeTruthy();
    
    // Check for service worker
    const hasServiceWorker = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    
    expect(hasServiceWorker).toBe(true);
  });

  test('should work offline', async ({ page }) => {
    await page.goto('/');
    
    // Wait for service worker to register
    await page.waitForFunction(() => {
      return navigator.serviceWorker?.ready;
    });
    
    // Go offline
    await page.context().setOffline(true);
    
    // Try to navigate to a page
    await page.goto('/dashboard');
    
    // Should show offline indicator or cached content
    await expect(page.getByText('Offline')).toBeVisible();
  });
}); 