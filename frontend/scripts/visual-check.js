const { chromium } = require('@playwright/test')

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })

  for (const route of ['/', '/demo']) {
    await page.goto(`http://127.0.0.1:3000${route}`, { waitUntil: 'networkidle' })
    const name = route === '/' ? 'home' : route.replace(/\W+/g, '-').replace(/^-|-$/g, '')
    await page.screenshot({ path: `test-results/${name}.png`, fullPage: true })
    const errors = await page.locator('text=/Unhandled|Error|Failed|Application error/i').count()
    console.log(`${route}: errors=${errors}`)
  }

  await page.goto('http://127.0.0.1:3000/dashboard', { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  const seedButton = page.getByRole('button', { name: 'Seed demo data' })
  if (await seedButton.isVisible()) {
    await seedButton.click()
    await page.waitForTimeout(500)
  }

  for (const route of ['/dashboard', '/dashboard/finances', '/dashboard/planner', '/dashboard/insights', '/dashboard/settings']) {
    await page.goto(`http://127.0.0.1:3000${route}`, { waitUntil: 'networkidle' })
    const name = route.replace(/\W+/g, '-').replace(/^-|-$/g, '')
    await page.screenshot({ path: `test-results/${name}.png`, fullPage: true })
    const errors = await page.locator('text=/Unhandled|Error|Failed|Application error/i').count()
    console.log(`${route}: errors=${errors}`)
  }

  await browser.close()
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
