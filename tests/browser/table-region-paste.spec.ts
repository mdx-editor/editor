import { expect, test, type Locator } from '@playwright/test'

async function paste(target: Locator, text: string) {
  await target.evaluate((element, text) => {
    const data = new DataTransfer()
    data.setData('text/plain', text)
    const event = new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true })
    // Firefox drops constructor clipboardData; preserve the synthetic payload.
    if (event.clipboardData?.getData('text/plain') !== text) {
      Object.defineProperty(event, 'clipboardData', { value: data })
    }
    if (event.clipboardData?.getData('text/plain') !== text) {
      throw new Error('Synthetic paste lost the clipboard payload')
    }
    element.dispatchEvent(event)
  }, text)
}

test('pastes a rectangle and restores it with one Undo/Redo in the parent editor', async ({ page }) => {
  await page.goto('/?story=basics--table-region-paste&mode=preview')
  const cells = page.locator('tbody [contenteditable=true]')
  await expect(cells).toHaveCount(9)
  const original = await cells.allTextContents()
  await cells.nth(8).click()
  await paste(cells.nth(8), 'x\t\ny\tz')
  await expect(cells).toHaveCount(16)
  await expect(cells.nth(10)).toHaveText('x')
  await expect(cells.nth(10)).toBeFocused()
  // No custom routing from a cell's local history into the parent history.
  await page.keyboard.press('ControlOrMeta+z')
  await expect(cells).toHaveCount(16)
  await page.getByText('Outside the table.', { exact: true }).click()
  await page.keyboard.press('ControlOrMeta+z')
  await expect(cells).toHaveCount(9)
  expect(await cells.allTextContents()).toEqual(original)
  await page.keyboard.press('ControlOrMeta+Shift+z')
  await expect(cells).toHaveCount(16)
  await expect(cells.nth(10)).toHaveText('x')
})

for (const text of ['\tindented', 'one\ttwo\tthree', 'if (ready) {\n\trun()\n}']) {
  test(`leaves non-grid text in the current cell: ${JSON.stringify(text)}`, async ({ page }) => {
    await page.goto('/?story=basics--table-region-paste&mode=preview')
    const cells = page.locator('tbody [contenteditable=true]')
    await expect(cells).toHaveCount(9)
    const original = await cells.allTextContents()
    await cells.nth(8).click()
    await page.keyboard.press('End')
    await paste(cells.nth(8), text)
    await expect(cells).toHaveCount(9)
    await expect(cells.nth(8)).toContainText(original[8])
    await expect(cells.nth(8)).toContainText(text.includes('run()') ? 'run()' : text.includes('indented') ? 'indented' : 'three')
    expect((await cells.allTextContents()).slice(0, 8)).toEqual(original.slice(0, 8))
  })
}

test('keeps ordinary cell typing undo and redo local after a region paste', async ({ page }) => {
  await page.goto('/?story=basics--table-region-paste&mode=preview')
  const cells = page.locator('tbody [contenteditable=true]')
  await expect(cells).toHaveCount(9)
  const original = await cells.nth(0).textContent()
  await cells.nth(8).click()
  await paste(cells.nth(8), 'x\ty\nz\tw')
  await expect(cells).toHaveCount(16)
  await cells.nth(0).click()
  await page.keyboard.press('End')
  await page.keyboard.type(' local')
  await expect(cells.nth(0)).toHaveText(original + ' local')
  await page.keyboard.press('ControlOrMeta+z')
  await expect(cells.nth(0)).toHaveText(original!)
  await expect(cells.nth(10)).toHaveText('x')
  await page.keyboard.press('ControlOrMeta+Shift+z')
  await expect(cells.nth(0)).toHaveText(original + ' local')
  await expect(cells.nth(10)).toHaveText('x')
})

for (const kind of ['directive', 'jsx', 'multilevel']) {
  test(`nested ${kind} paste preserves pending text and repeated root keyboard history`, async ({ page }) => {
    await page.goto('/?story=nested-history--committed-cells&mode=preview')
    await page.getByLabel('Container').selectOption(kind)
    const cells = page.locator('tbody [contenteditable=true]')
    const markdown = page.getByLabel('Current Markdown')
    await expect(cells).toHaveCount(4)
    await cells.nth(2).click()
    await page.keyboard.press('End')
    await page.keyboard.type(' pending')
    await paste(cells.nth(2), 'first\trow\nlower\trow')
    await expect(cells.nth(2)).toHaveText('first')
    await expect(cells.nth(2)).toBeFocused()
    await page.getByText('Outside the table.', { exact: true }).click()
    await page.keyboard.press('ControlOrMeta+z')
    await expect(cells.nth(2)).toHaveText('c pending')
    await expect(markdown).toContainText('c pending')
    await page.keyboard.press('ControlOrMeta+Shift+z')
    await expect(cells.nth(2)).toHaveText('first')
    await cells.nth(2).click()
    await paste(cells.nth(2), 'second\trow\nlower\trow')
    await page.getByText('Outside the table.', { exact: true }).click()
    await page.keyboard.press('ControlOrMeta+z')
    await expect(cells.nth(2)).toHaveText('first')
    await page.keyboard.press('ControlOrMeta+z')
    await expect(cells.nth(2)).toHaveText('c pending')
    await page.keyboard.press('ControlOrMeta+Shift+z')
    await expect(cells.nth(2)).toHaveText('first')
    await page.keyboard.press('ControlOrMeta+Shift+z')
    await expect(cells.nth(2)).toHaveText('second')
    await expect(markdown).toContainText('second')
  })
}
