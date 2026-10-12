import { expect, test } from '@playwright/test'

const imageUrl = 'https://example.com/image-991.png'

test('saves an image inserted into a table before leaving the dialog (#991)', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route(imageUrl, (route) =>
    route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" />' })
  )
  await page.goto('/?story=bug-991--table-image-dialog&mode=preview')
  const cells = page.locator('table tbody [contenteditable="true"]')
  const source = cells.nth(2)
  // WebKit uses an additional, src-less img as a Lexical managed linebreak.
  const image = source.locator('img[src]')
  await source.click()
  await source.press('End')
  await page.getByRole('button', { name: 'Insert image', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('input[name="src"]').fill(imageUrl)
  await dialog.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(image).toHaveCount(1)
  await expect(image).toHaveAttribute('src', imageUrl)
  await expect(page.getByLabel('Saved Markdown', { exact: true })).toContainText(imageUrl)
  await cells.nth(3).click()
  await page.getByRole('button', { name: 'Reload saved Markdown', exact: true }).click()
  await expect(image).toHaveCount(1)
  await expect(image).toHaveAttribute('src', imageUrl)
  expect(errors).toEqual([])
})
