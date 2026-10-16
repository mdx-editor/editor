import { expect, test } from '@playwright/test'

const story = '/?story=github-alerts--git-hub-alerts&mode=preview'

test('edits an alert, changes type, and undoes the type change', async ({ page }) => {
  await page.goto(story)
  const alert = page.locator('[data-github-alert="NOTE"]')
  await expect(alert).toBeVisible()
  await alert.locator('p').first().click()
  await page.getByRole('combobox', { name: 'GitHub alert', exact: true }).click()
  await page.getByRole('option', { name: 'WARNING', exact: true }).click()
  await expect(page.locator('[data-github-alert="WARNING"]')).toBeVisible()
  await page.getByRole('button', { name: 'Get Markdown', exact: true }).click()
  await expect(page.getByLabel('Current Markdown')).toContainText('> [!WARNING]')
  await page.getByRole('radio', { name: /Undo/ }).click()
  await expect(page.locator('[data-github-alert="NOTE"]')).toBeVisible()
  await page.getByLabel('Read only', { exact: true }).check()
  await expect(page.getByRole('combobox', { name: 'GitHub alert', exact: true })).toBeDisabled()
})

test('round trips through source mode and edits alert body', async ({ page }) => {
  await page.goto(story)
  await page.getByRole('radio', { name: 'Source mode', exact: true }).click()
  const source = page.locator('.cm-content[contenteditable="true"]')
  await expect(source).toContainText('[!NOTE]')
  await source.fill('> [!IMPORTANT]\n> Updated **body**\n>\n> * Nested item')
  await page.getByRole('radio', { name: 'Rich text', exact: true }).click()
  const alert = page.locator('[data-github-alert="IMPORTANT"]')
  await expect(alert).toContainText('Updated body')
  await expect(alert.locator('li')).toHaveText(['Nested item'])
  await page.getByRole('button', { name: 'Get Markdown', exact: true }).click()
  await expect(page.getByLabel('Current Markdown')).toContainText('> [!IMPORTANT]')
  await expect(page.getByLabel('Current Markdown')).not.toContainText(':::')
})
