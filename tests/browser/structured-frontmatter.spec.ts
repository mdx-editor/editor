import { expect, test } from '@playwright/test'

test('edits nested values, discards cancellation and undoes a save', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/?story=structured-frontmatter--structured-frontmatter&mode=preview')
  await page.getByRole('button', { name: /frontmatter/i }).click()
  await page.getByLabel('Frontmatter[2][1] value', { exact: true }).fill('/new.png')
  await page.getByLabel('Frontmatter[4] value', { exact: true }).check()
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  const markdown = page.getByLabel('Current Markdown')
  await expect(markdown).toContainText('/new.png')
  await expect(markdown).toContainText('draft: true')
  // Focus the root to select it as the active history editor.
  await page.getByRole('textbox', { name: 'editable markdown', exact: true }).click()
  await page.getByRole('radio', { name: /Undo/ }).click()
  await expect(markdown).toContainText('/old.png')
  await page.getByRole('radio', { name: /Redo/ }).click()
  await expect(markdown).toContainText('/new.png')
  await page.getByRole('button', { name: /frontmatter/i }).click()
  await page.getByLabel('Frontmatter[1] value', { exact: true }).fill('discarded')
  await page.keyboard.press('Escape')
  await expect(markdown).not.toContainText('discarded')
  expect(errors).toEqual([])
})
