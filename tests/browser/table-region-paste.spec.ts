import { expect, test, type Locator } from '@playwright/test'

async function paste(target: Locator, text: string, html = '') {
  await target.evaluate(
    (element, { text, html }) => {
      const data = new DataTransfer()
      data.setData('text/plain', text)
      if (html) data.setData('text/html', html)
      const event = new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true })
      // Firefox drops constructor clipboardData; preserve the synthetic payload.
      if (event.clipboardData?.getData('text/plain') !== text) {
        Object.defineProperty(event, 'clipboardData', { value: data })
      }
      if (event.clipboardData?.getData('text/plain') !== text) {
        throw new Error('Synthetic paste lost the clipboard payload')
      }
      element.dispatchEvent(event)
    },
    { text, html }
  )
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
  await expect(page.getByRole('textbox', { name: 'editable markdown', exact: true })).toBeFocused()
  await page.keyboard.press('ControlOrMeta+z')
  await expect(cells).toHaveCount(9)
  expect(await cells.allTextContents()).toEqual(original)
  await page.keyboard.press('ControlOrMeta+Shift+z')
  await expect(cells).toHaveCount(16)
  await expect(cells.nth(10)).toHaveText('x')
})

for (const [text, lastWord] of [
  ['\tindented', 'indented'],
  ['one\ttwo\tthree', 'three'],
  ['if (ready) {\n\trun()\n}', 'run()'],
  ['\tfoo()\n\tbar()', 'bar()'],
  ['\tA\tint\n\tB\tstring', 'string'],
  ['\techo build\n\ttouch output', 'output']
]) {
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
    await expect(cells.nth(8)).toContainText(lastWord)
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

test('toolbar Undo and Redo work immediately, with pending anchor text in the single baseline', async ({ page }) => {
  await page.goto('/?story=basics--table-region-paste&mode=preview')
  const cells = page.locator('tbody [contenteditable=true]')
  const undo = page.getByRole('radio', { name: /^Undo / })
  const redo = page.getByRole('radio', { name: /^Redo / })
  await expect(cells).toHaveCount(9)
  const original = await cells.nth(8).textContent()
  await cells.nth(8).click()
  await page.keyboard.press('End')
  await page.keyboard.type(' pending')
  await paste(cells.nth(8), 'x\ty\nz\tw')
  await expect(cells).toHaveCount(16)
  await expect(undo).toBeEnabled()
  await undo.click()
  await expect(cells).toHaveCount(9)
  await expect(cells.nth(8)).toHaveText(original + ' pending')
  await expect(undo).toBeDisabled()
  await expect(redo).toBeEnabled()
  await redo.click()
  await expect(cells).toHaveCount(16)
  await expect(cells.nth(10)).toHaveText('x')
})

test('repeated pastes remain separate immediate keyboard history steps', async ({ page }) => {
  await page.goto('/?story=basics--table-region-paste&mode=preview')
  const cells = page.locator('tbody [contenteditable=true]')
  await expect(cells).toHaveCount(9)
  const original = await cells.allTextContents()
  for (const value of ['first', 'second']) {
    await cells.nth(0).click()
    await paste(cells.nth(0), `${value}\trow\nlower\trow`)
    await expect(cells.nth(0)).toHaveText(value)
  }
  await page.keyboard.press('ControlOrMeta+z')
  await expect(cells.nth(0)).toHaveText('first')
  await page.keyboard.press('ControlOrMeta+z')
  expect(await cells.allTextContents()).toEqual(original)
  await page.keyboard.press('ControlOrMeta+Shift+z')
  await expect(cells.nth(0)).toHaveText('first')
  await page.keyboard.press('ControlOrMeta+Shift+z')
  await expect(cells.nth(0)).toHaveText('second')
})

test('paste in editable inline JSX preserves the component and neighboring cells', async ({ page }) => {
  await page.goto('/?story=basics--table-region-paste-inline-jsx&mode=preview')
  const cells = page.locator('tbody > tr > :is(th, td) > [contenteditable=true]')
  const nested = cells.nth(2).locator('[contenteditable=true]')
  await expect(cells).toHaveCount(4)
  await nested.click()
  await page.keyboard.press('End')
  await paste(nested, 'a\tb\nc\td')
  await expect(nested).toContainText('insidea')
  await expect(nested).toContainText('d')
  await expect(nested).toBeFocused()
  await expect(cells).toHaveCount(4)
  await expect(cells.nth(0)).toHaveText('a')
  await expect(cells.nth(1)).toHaveText('b')
  await expect(cells.nth(3)).toHaveText('d')
})

test('single-cell HTML inserts at the caret instead of replacing the region', async ({ page }) => {
  await page.goto('/?story=basics--table-region-paste&mode=preview')
  const cells = page.locator('table').first().locator(':scope > tbody > tr > :is(th, td) > [contenteditable=true]')
  await expect(cells).toHaveCount(9)
  const original = await cells.allTextContents()
  await cells.nth(8).click()
  await page.keyboard.press('End')
  await paste(cells.nth(8), 'one', '<table><tr><td>one</td></tr></table>')
  await expect(cells).toHaveCount(9)
  await expect(cells.nth(8)).toContainText(original[8])
  await expect(cells.nth(8)).toContainText('one')
  await expect(page.locator('table')).toHaveCount(1)
  await page.getByText('Outside the table.', { exact: true }).click()
  await expect(page.getByLabel('Current Markdown')).toContainText(original[8] + 'one')
  expect((await cells.allTextContents()).slice(0, 8)).toEqual(original.slice(0, 8))
})
