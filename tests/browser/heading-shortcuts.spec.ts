import { expect, test, type Page } from '@playwright/test'

const runtimeErrors = new WeakMap<Page, string[]>()

test.beforeEach(({ page }) => {
  const errors: string[] = []
  runtimeErrors.set(page, errors)
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`)
  })
})

test.afterEach(({ page }) => {
  expect(runtimeErrors.get(page) ?? [], 'unexpected browser runtime errors').toEqual([])
})

for (const level of [1, 2, 3, 4, 5, 6]) {
  test(`respects nonconsecutive allowed heading levels when typing h${level}`, async ({ page }) => {
    await page.goto('/?story=basics--non-consecutive-heading-levels&mode=preview')
    const editor = page.locator('[contenteditable="true"]')
    await expect(editor).toBeVisible()
    await editor.click()
    await page.keyboard.type('#'.repeat(level) + ' Heading')

    if (level === 2 || level === 4) {
      await expect(editor.locator(`h${level}`)).toHaveText('Heading')
      await expect(editor.locator('p')).toHaveCount(0)
    } else {
      await expect(editor.locator('p')).toHaveText('#'.repeat(level) + ' Heading')
      await expect(editor.locator('h1, h2, h3, h4, h5, h6')).toHaveCount(0)
    }
  })
}
