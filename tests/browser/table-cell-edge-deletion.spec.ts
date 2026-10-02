import { expect, test, type Locator, type Page } from '@playwright/test'

const storyUrl = '/?story=basics--table&mode=preview'

type FocusWindow = Window & { focusEscapes: string[] }

// The first cell of every row holds the row menu.
function cellEditor(page: Page, colIndex: number, rowIndex: number) {
  return page.locator(`tbody tr:nth-child(${rowIndex + 1}) > :nth-child(${colIndex + 2}) [contenteditable="true"]`)
}

async function trackFocusLeaving(cell: Locator) {
  await cell.evaluate((editor) => {
    const escapes: string[] = []
    ;(window as unknown as FocusWindow).focusEscapes = escapes
    document.addEventListener(
      'focusin',
      (event) => {
        const target = event.target as HTMLElement
        if (!editor.contains(target)) {
          escapes.push(target.closest('td, th')?.textContent ?? target.tagName)
        }
      },
      true
    )
  })
}

function focusEscapes(page: Page) {
  return page.evaluate(() => (window as unknown as FocusWindow).focusEscapes)
}

test.beforeEach(async ({ page }) => {
  await page.goto(storyUrl)
  await expect(cellEditor(page, 1, 1)).toHaveText('Title')
})

const scenarios = [
  { name: 'Backspace in an empty cell', content: '', caret: 'end', key: 'Backspace' },
  { name: 'Delete in an empty cell', content: '', caret: 'end', key: 'Delete' },
  { name: 'Backspace at the start of a cell', content: 'x', caret: 'start', key: 'Backspace' },
  { name: 'Delete at the end of a cell', content: 'x', caret: 'end', key: 'Delete' }
] as const

for (const { name, content, caret, key } of scenarios) {
  test(`keeps focus in the cell on ${name}`, async ({ page }) => {
    const cell = cellEditor(page, 1, 1)
    await cell.click()
    await page.keyboard.press('ControlOrMeta+a')
    if (content === '') {
      await page.keyboard.press('Backspace')
    } else {
      await page.keyboard.type(content)
    }
    if (caret === 'start') {
      await page.keyboard.press('ArrowLeft')
    }
    await expect(cell).toHaveText(content)

    await trackFocusLeaving(cell)
    // A single bounce settles in some environments; the second press is what locked up the page.
    await page.keyboard.press(key)
    await page.keyboard.press(key)

    expect(await focusEscapes(page)).toEqual([])
    await expect(cell).toBeFocused()
    await expect(cell).toHaveText(content)
  })
}
