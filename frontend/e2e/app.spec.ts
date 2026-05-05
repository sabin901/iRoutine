import { expect, test } from '@playwright/test'

test('public funnel links to the mock workspace', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Try sample dashboard' })).toBeVisible()
  await page.getByRole('link', { name: 'Try sample dashboard' }).click()
  await expect(page).toHaveURL('/dashboard?preview=true')
  await expect(page.getByText('Built onboarding flow and demo-data seeding')).toBeVisible()
})

test('dashboard auto-populates the sample workspace', async ({ page }) => {
  await page.goto('/dashboard')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await expect(page.getByText('Built onboarding flow and demo-data seeding')).toBeVisible()
  await expect(page.getByText('Reviewed product feedback themes and retention notes')).toBeVisible()
  await expect(page.getByText('First activation')).toHaveCount(0)

  await page.goto('/dashboard/finances')
  await expect(page.getByText('Monthly income')).toBeVisible()
  await expect(page.getByText('Emergency fund')).toBeVisible()
  await expect(page.getByText('No transactions yet')).toHaveCount(0)

  await page.goto('/dashboard/planner')
  await expect(page.getByText('Ship activation checklist')).toBeVisible()
  await expect(page.getByText('Morning plan')).toBeVisible()
  await expect(page.getByText('No tasks for today')).toHaveCount(0)

  await page.goto('/dashboard/insights')
  await expect(page.getByText('Pattern Review')).toBeVisible()
  await expect(page.getByText('Recommended next moves')).toBeVisible()
  await expect(page.getByText('Setup checklist')).toHaveCount(0)
})

test('dashboard forms accept core input', async ({ page }) => {
  await page.goto('/dashboard')
  await page.getByPlaceholder('What did you work on?').fill('E2E focus block')
  await page.getByRole('button', { name: 'Log Activity' }).click()
  await expect(page.getByText('Logged!')).toBeVisible()
})

test('settings exposes growth tools and beta feedback', async ({ page }) => {
  await page.goto('/dashboard/settings')
  await expect(page.getByRole('heading', { name: 'Beta Launch Command Center' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Weekly Digest' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Calendar Import' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Founder Analytics' })).toBeVisible()

  await page.getByLabel('What should we fix or double down on?').fill('The onboarding flow is much clearer now.')
  await page.getByRole('button', { name: 'Send feedback' }).click()
  await expect(page.getByText('Feedback saved')).toBeVisible()
})
