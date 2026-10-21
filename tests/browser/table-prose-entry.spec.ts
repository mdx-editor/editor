import { expect, test, type Page } from '@playwright/test'

const storyUrl = '/?story=table-prose-entry--table-prose-entry&mode=preview'
const runtimeErrors = new WeakMap<Page, string[]>()
const rootEditor = (page: Page) => page.getByRole('textbox', { name: 'editable markdown', exact: true })
const paragraphs = (page: Page) => rootEditor(page).locator(':scope > p')

async function insert(page: Page, before: boolean, tableIndex = 0) {
  await page.getByRole('button', { name: 'Table menu', exact: true }).nth(tableIndex).click()
  await page.getByRole('button', { name: `Insert paragraph ${before ? 'before' : 'after'} table`, exact: true }).click()
  await expect(rootEditor(page)).toBeFocused()
}

async function save(page: Page) {
  await page.getByRole('button', { name: 'Save Markdown', exact: true }).click()
  return page.getByTestId('saved-markdown').innerText()
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  runtimeErrors.set(page, errors)
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(storyUrl)
  await expect(rootEditor(page).locator('table')).toHaveCount(2)
})

test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page) ?? []).toEqual([])
})

for (const before of [true, false]) {
  test(`inserts editable prose between adjacent tables using ${before ? 'Before' : 'After'} and saves/reloads`, async ({ page }) => {
    await insert(page, before, before ? 1 : 0)
    await page.keyboard.type('Between the tables')
    const prose = paragraphs(page).filter({ hasText: 'Between the tables' })
    await expect(prose).toHaveCount(1)
    expect(
      await prose.evaluate((paragraph) => [
        Boolean(paragraph.previousElementSibling?.querySelector('table')),
        Boolean(paragraph.nextElementSibling?.querySelector('table'))
      ])
    ).toEqual([true, true])
    const markdown = await save(page)
    expect(markdown).toBe('| First |\n| ----- |\n| One   |\n\nBetween the tables\n\n| Second |\n| ------ |\n| Two    |')
    await page.getByLabel('Document').selectOption({ label: 'Table between blocks' })
    await expect(rootEditor(page).locator('table')).toHaveCount(1)
    await expect(prose).toHaveCount(0)
    await page.getByRole('button', { name: 'Reload saved Markdown' }).click()
    await expect(rootEditor(page).locator('table')).toHaveCount(2)
    await expect(prose).toHaveCount(1)
    expect(
      await prose.evaluate((paragraph) => [
        Boolean(paragraph.previousElementSibling?.querySelector('table')),
        Boolean(paragraph.nextElementSibling?.querySelector('table'))
      ])
    ).toEqual([true, true])
    expect(await save(page)).toBe(markdown)
  })

  test(`preserves pending cell typing through one insertion Undo/Redo (${before ? 'Before' : 'After'})`, async ({ page }) => {
    const cells = rootEditor(page).locator('table').first().locator('tbody [contenteditable="true"]')
    const cell = cells.last()
    await cell.click()
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.type('Edited cell')
    await insert(page, before)
    await expect(paragraphs(page)).toHaveCount(2)
    await expect(cell).toHaveText('Edited cell')
    await page.keyboard.press('ControlOrMeta+z')
    await expect(paragraphs(page)).toHaveCount(1)
    await expect(cell).toHaveText('Edited cell')
    await page.keyboard.press('ControlOrMeta+Shift+z')
    await expect(paragraphs(page)).toHaveCount(2)
    await expect(cell).toHaveText('Edited cell')
    expect(await save(page)).toContain('Edited cell')
  })

  test(`inserts prose next to a nonempty neighboring block (${before ? 'Before' : 'After'})`, async ({ page }) => {
    await page.getByLabel('Document').selectOption({ label: 'Table between blocks' })
    await expect(rootEditor(page).locator('table')).toHaveCount(1)
    await insert(page, before)
    await page.keyboard.type('New prose')
    const markdown = await save(page)
    expect(markdown).toBe(
      before
        ? 'Existing prose\n\nNew prose\n\n| First |\n| ----- |\n| One   |\n\n***'
        : 'Existing prose\n\n| First |\n| ----- |\n| One   |\n\nNew prose\n\n***'
    )
  })
}

test('reuses empty paragraphs at the start and end without extra Undo steps', async ({ page }) => {
  await insert(page, true)
  await expect(paragraphs(page)).toHaveCount(2)
  await insert(page, true)
  await expect(paragraphs(page)).toHaveCount(2)
  await page.keyboard.press('ControlOrMeta+z')
  await expect(paragraphs(page)).toHaveCount(1)
  await page.keyboard.press('ControlOrMeta+Shift+z')
  await expect(paragraphs(page)).toHaveCount(2)
  await page.keyboard.type('Before the first table')
  await expect(paragraphs(page).first()).toHaveText('Before the first table')
  await insert(page, false, 1)
  await insert(page, false, 1)
  await expect(paragraphs(page)).toHaveCount(2)
  await page.keyboard.type('After the last table')
  await expect(paragraphs(page).last()).toHaveText('After the last table')
  const markdown = await save(page)
  expect(markdown.startsWith('Before the first table\n\n| First')).toBe(true)
  expect(markdown.endsWith('| Two    |\n\nAfter the last table')).toBe(true)
})

test('supports keyboard-only activation, visible focus and Escape cancellation', async ({ page }) => {
  const menu = page.getByRole('button', { name: 'Table menu', exact: true }).first()
  await page.getByRole('button', { name: 'Save Markdown', exact: true }).focus()
  for (let index = 0; index < 8 && !(await menu.evaluate((element) => document.activeElement === element)); index++) {
    await page.keyboard.press('Tab')
  }
  await expect(menu).toBeFocused()
  expect(await menu.evaluate((element) => getComputedStyle(element).opacity)).toBe('1')
  expect(await menu.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Insert paragraph before table', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(menu).toBeFocused()
  await expect(paragraphs(page)).toHaveCount(1)
  await page.keyboard.press('Enter')
  await page.keyboard.press('Space')
  await expect(rootEditor(page)).toBeFocused()
  await page.keyboard.type('Keyboard prose')
  await expect(paragraphs(page).first()).toHaveText('Keyboard prose')
})

test('does not change the document on import, hover, focus or menu cancellation and hides read-only actions', async ({ page }) => {
  const baseline = await save(page)
  await rootEditor(page).locator('table').first().hover()
  await rootEditor(page).locator('table').first().locator('tbody [contenteditable="true"]').first().click()
  await page.getByRole('button', { name: 'Table menu', exact: true }).first().click()
  await page.keyboard.press('Escape')
  await expect(paragraphs(page)).toHaveCount(1)
  expect(await save(page)).toBe(baseline)
  await page.getByLabel('Read only', { exact: true }).check()
  await expect(page.getByRole('button', { name: 'Table menu', exact: true })).toHaveCount(0)
  expect(await save(page)).toBe(baseline)
  await page.getByLabel('Read only', { exact: true }).uncheck()
  await insert(page, true)
  await page.keyboard.type('Editable again')
  await expect(paragraphs(page).first()).toHaveText('Editable again')
})
