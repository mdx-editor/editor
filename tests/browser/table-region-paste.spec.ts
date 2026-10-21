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
    const event = new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true })
    // Match the compatibility suite: Firefox drops constructor clipboardData.
    if (event.clipboardData?.getData('text/plain') !== 'x\t\ny\tz') {
      Object.defineProperty(event, 'clipboardData', { value: data })
    }
    if (event.clipboardData?.getData('text/plain') !== 'x\t\ny\tz') {
      throw new Error('Synthetic paste lost the rectangular clipboard payload')
    }
    element.dispatchEvent(event)
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

test('keeps keyboard Undo and Redo available after focusing a newly created paste cell', async ({ page }) => {
  await page.goto('/?story=basics--table&mode=preview')
  const cells = page.locator('tbody [contenteditable=true]')
  await expect(cells).toHaveCount(9)
  const original = await cells.allTextContents()
  await cells.nth(8).click()
  await cells.nth(8).evaluate((element) => {
    const data = new DataTransfer()
    data.setData('text/plain', 'x\t\ny\tz')
    const event = new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true })
    if (event.clipboardData?.getData('text/plain') !== 'x\t\ny\tz') {
      Object.defineProperty(event, 'clipboardData', { value: data })
    }
    if (event.clipboardData?.getData('text/plain') !== 'x\t\ny\tz') {
      throw new Error('Synthetic paste lost the rectangular clipboard payload')
    }
    element.dispatchEvent(event)
  })
  await expect(cells).toHaveCount(16)
  await cells.nth(15).click()
  await expect(cells.nth(15)).toBeFocused()
  await page.keyboard.press('ControlOrMeta+z')
  await expect(cells).toHaveCount(9)
  expect(await cells.allTextContents()).toEqual(original)
  await expect(cells.nth(8)).toBeFocused()
  await page.keyboard.press('ControlOrMeta+Shift+z')
  await expect(cells).toHaveCount(16)
  await expect(cells.nth(10)).toBeFocused()
  await expect(cells.nth(15)).toHaveText('z')
})
