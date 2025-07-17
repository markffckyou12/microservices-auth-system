import { test, expect } from '@playwright/test';

test.describe('User Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the users page
    await page.goto('/users');
  });

  test('should display user management page', async ({ page }) => {
    // Check if the page loads correctly
    await expect(page.getByText('User Management')).toBeVisible();
    await expect(page.getByPlaceholder('Search users...')).toBeVisible();
    await expect(page.getByText('Create User')).toBeVisible();
  });

  test('should display user list with virtual scrolling', async ({ page }) => {
    // Wait for the user list to load
    await page.waitForSelector('[data-testid="user-list"]');
    
    // Check if users are displayed
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('@john.doe')).toBeVisible();
    await expect(page.getByText('john.doe@example.com')).toBeVisible();
  });

  test('should handle search functionality', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search users...');
    
    // Type in search
    await searchInput.fill('john');
    await searchInput.press('Enter');
    
    // Should filter results
    await expect(page.getByText('John Doe')).toBeVisible();
  });

  test('should handle status filtering', async ({ page }) => {
    // Click on status filter
    await page.getByText('All Users').click();
    
    // Select active users
    await page.getByText('Active Users').click();
    
    // Should show only active users
    await expect(page.getByText('Active')).toBeVisible();
  });

  test('should handle user selection', async ({ page }) => {
    // Wait for user list to load
    await page.waitForSelector('[data-testid="user-list"]');
    
    // Click on first user checkbox
    const checkbox = page.locator('input[type="checkbox"]').nth(1);
    await checkbox.check();
    
    // Should show selection count
    await expect(page.getByText('1 user(s) selected')).toBeVisible();
  });

  test('should handle select all functionality', async ({ page }) => {
    // Wait for user list to load
    await page.waitForSelector('[data-testid="user-list"]');
    
    // Click select all checkbox
    const selectAllCheckbox = page.locator('input[type="checkbox"]').first();
    await selectAllCheckbox.check();
    
    // Should show all users selected
    await expect(page.getByText(/user\(s\) selected/)).toBeVisible();
  });

  test('should navigate to user detail page', async ({ page }) => {
    // Wait for user list to load
    await page.waitForSelector('[data-testid="user-list"]');
    
    // Click view button for first user
    await page.getByText('View').first().click();
    
    // Should navigate to user detail page
    await expect(page.getByText('User Details')).toBeVisible();
  });

  test('should handle bulk operations', async ({ page }) => {
    // Wait for user list to load
    await page.waitForSelector('[data-testid="user-list"]');
    
    // Select a user
    const checkbox = page.locator('input[type="checkbox"]').nth(1);
    await checkbox.check();
    
    // Click bulk operations button
    await page.getByText('Bulk Operations').click();
    
    // Should show bulk operations menu
    await expect(page.getByText('Activate Selected')).toBeVisible();
    await expect(page.getByText('Deactivate Selected')).toBeVisible();
    await expect(page.getByText('Delete Selected')).toBeVisible();
  });

  test('should handle export functionality', async ({ page }) => {
    // Click export button
    await page.getByText('Export').click();
    
    // Should show export options
    await expect(page.getByText('Export Users')).toBeVisible();
    await expect(page.getByText('CSV')).toBeVisible();
    await expect(page.getByText('Excel')).toBeVisible();
  });

  test('should display performance monitor', async ({ page }) => {
    // Scroll to performance monitor
    await page.getByText('Performance Monitor').scrollIntoViewIfNeeded();
    
    // Should show performance metrics
    await expect(page.getByText('Load Time')).toBeVisible();
    await expect(page.getByText('Render Time')).toBeVisible();
    await expect(page.getByText('Memory Usage')).toBeVisible();
  });

  test('should display security audit', async ({ page }) => {
    // Scroll to security audit
    await page.getByText('Security Audit').scrollIntoViewIfNeeded();
    
    // Should show security metrics
    await expect(page.getByText('Security Score')).toBeVisible();
    await expect(page.getByText('Vulnerabilities')).toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Should still display main elements
    await expect(page.getByText('User Management')).toBeVisible();
    await expect(page.getByPlaceholder('Search users...')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Should display properly on tablet
    await expect(page.getByText('User Management')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Focus on search input
    await page.getByPlaceholder('Search users...').focus();
    
    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to navigate with keyboard
    await expect(page.getByText('Create User')).toBeFocused();
  });

  test('should handle accessibility features', async ({ page }) => {
    // Check for proper ARIA labels
    await expect(page.getByPlaceholder('Search users...')).toHaveAttribute('aria-label');
    
    // Check for proper heading structure
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();
  });
}); 