import { expect, test } from '@playwright/test'

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
