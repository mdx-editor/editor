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

test('restores undo and redo after returning from a code block toolbar', async ({ page }) => {
  await page.goto('/?story=bug-654--conditional-history-toolbar&mode=preview')
  const undo = page.getByRole('radio', { name: /Undo/ })
  const redo = page.getByRole('radio', { name: /Redo/ })
  const root = page.getByRole('textbox', { name: 'editable markdown', exact: true })
  const code = page.locator('.cm-content')
  const markdown = page.getByLabel('Current Markdown', { exact: true })
  await expect(undo).toBeDisabled()
  await expect(redo).toBeDisabled()
  await root.click()
  await page.getByRole('button', { name: /Insert Code Block/i }).click()
  await code.click()
  await expect(page.getByRole('combobox', { name: 'Code block language', exact: true })).toBeVisible()
  await expect(undo).toHaveCount(0)
  await expect(markdown).toHaveText('```txt\n```')

  await root.locator('p').last().click()
  await expect(undo).toBeEnabled()
  await expect(redo).toBeDisabled()
  await undo.click()
  await expect(code).toHaveCount(0)
  await expect(markdown).toBeEmpty()
  await expect(redo).toBeEnabled()
  await redo.click()
  await expect(code).toBeVisible()
  await expect(markdown).toHaveText('```txt\n```')
})
