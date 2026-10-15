import { expect, test } from '@playwright/test'

test('pastes a rectangle at the active cell and restores it with one Undo/Redo', async ({ page }) => {
  await page.goto('/?story=basics--table&mode=preview')
  const cells = page.locator('tbody [contenteditable=true]')
  await expect(cells).toHaveCount(9)
  const original = await cells.allTextContents()
  await cells.nth(8).click()
  await cells.nth(8).evaluate((element) => {
    const data = new DataTransfer()
    data.setData('text/plain', 'x\t\ny\tz')
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }))
  })
  await expect(cells).toHaveCount(16)
  await expect(cells.nth(10)).toHaveText('x')
  await expect(cells.nth(10)).toBeFocused()
  await page.keyboard.press('ControlOrMeta+z')
  await expect(cells).toHaveCount(9)
  expect(await cells.allTextContents()).toEqual(original)
  await page.keyboard.press('ControlOrMeta+Shift+z')
  await expect(cells).toHaveCount(16)
  await expect(cells.nth(10)).toHaveText('x')
})
