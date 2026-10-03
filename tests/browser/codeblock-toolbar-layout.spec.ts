import { expect, test, type Page } from '@playwright/test'

const runtimeErrors = new WeakMap<Page, string[]>()

async function expectToolbarAboveCode(page: Page) {
  const toolbar = page.locator('[class*="codeMirrorToolbar"]')
  const firstLine = page.locator('.cm-line').first()
  await expect(toolbar).toBeVisible()
  await expect(firstLine).toContainText('const message')
  await expect
    .poll(async () => {
      const toolbarBox = await toolbar.boundingBox()
      const lineBox = await firstLine.boundingBox()
      return toolbarBox !== null && lineBox !== null && toolbarBox.y + toolbarBox.height <= lineBox.y
    }, 'the toolbar must leave the entire first code line unobstructed')
    .toBe(true)
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  runtimeErrors.set(page, errors)
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/?story=bug-748--code-block-toolbar&mode=preview')
  await expect(page.locator('.cm-content')).toBeVisible()
})

test.afterEach(({ page }) => {
  expect(runtimeErrors.get(page) ?? []).toEqual([])
})

for (const width of [800, 320]) {
  test(`keeps the first line readable before and during editing at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await expectToolbarAboveCode(page)
    await page.locator('.cm-content').click()
    await expectToolbarAboveCode(page)
    await page.getByRole('combobox', { name: 'Language', exact: true }).hover()
    await expectToolbarAboveCode(page)

    await page.getByRole('checkbox', { name: 'Read only' }).check()
    await expect(page.getByRole('combobox', { name: 'Language', exact: true })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Delete code block', exact: true })).toBeDisabled()
    await expectToolbarAboveCode(page)
  })
}

test('keeps language selection and deletion accessible from the keyboard', async ({ page }) => {
  const language = page.getByRole('combobox', { name: 'Language', exact: true })
  await page.getByRole('textbox', { name: 'editable markdown', exact: true }).focus()
  await page.keyboard.press('Tab')
  await expect(language).toBeFocused()
  await page.keyboard.press('Space')
  await expect(page.getByRole('listbox')).toBeVisible()
  await expect(page.getByRole('option', { name: 'JavaScript', exact: true })).toBeFocused()
  await page.keyboard.press('End')
  // Radix defers moving focus after navigation keys with setTimeout.
  await expect(page.getByRole('option', { name: 'Plain text', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(language).toHaveText('Plain text')
  await expect(page.getByLabel('Current Markdown')).toContainText('```txt')
  await expect(page.locator('.cm-content')).toBeFocused()
  await expectToolbarAboveCode(page)

  await language.focus()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Delete code block', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('.cm-content')).toHaveCount(0)
  await expect(page.getByLabel('Current Markdown')).toBeEmpty()
})

test.describe('touch controls', () => {
  test.use({ hasTouch: true, viewport: { width: 375, height: 812 } })

  test('opens the language menu without hover and preserves the code', async ({ page }) => {
    const language = page.getByRole('combobox', { name: 'Language', exact: true })
    await expectToolbarAboveCode(page)
    await language.tap()
    const option = page.getByRole('option', { name: 'Plain text', exact: true })
    await expect(option).toBeVisible()
    await option.tap()
    await expect(language).toHaveText('Plain text')
    await expect(page.getByLabel('Current Markdown')).toContainText('```txt')
    await expectToolbarAboveCode(page)
  })
})
