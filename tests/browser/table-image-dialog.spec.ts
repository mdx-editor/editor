import { expect, test, type Page } from '@playwright/test'

const imageUrl = 'https://example.com/image-991.png'
const oldImageUrl = 'https://example.com/old-991.png'
const runtimeErrors = new WeakMap<Page, string[]>()

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  runtimeErrors.set(page, errors)
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`)
  })
  // Unfulfilled image requests would surface as console errors.
  await page.route('https://example.com/**', (route) =>
    route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" />' })
  )
})

test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page) ?? [], 'unexpected browser runtime errors').toEqual([])
})

test('saves an image inserted into a table before leaving the dialog (#991)', async ({ page }) => {
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
})

test('saves an edit to an existing table image before leaving the dialog (#991)', async ({ page }) => {
  await page.goto('/?story=bug-991--table-existing-image&mode=preview')
  const cells = page.locator('table tbody [contenteditable="true"]')
  const source = cells.nth(2)
  const image = source.locator('img[src]')
  await expect(image).toHaveAttribute('src', oldImageUrl)
  await source.getByRole('button', { name: 'Edit image', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('input[name="src"]').fill(imageUrl)
  await dialog.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(image).toHaveAttribute('src', imageUrl)
  await cells.nth(3).click()
  const saved = page.getByLabel('Saved Markdown', { exact: true })
  await expect(saved).toContainText(imageUrl)
  await expect(saved).not.toContainText(oldImageUrl)
  await page.getByRole('button', { name: 'Reload saved Markdown', exact: true }).click()
  await expect(image).toHaveCount(1)
  await expect(image).toHaveAttribute('src', imageUrl)
})

for (const source of ['cell', 'root'] as const) {
  test(`keeps a ${source} paste upload that finishes after moving to another cell`, async ({ page }) => {
    await page.goto('/?story=bug-991--table-late-upload&mode=preview')
    const cells = page.locator('table tbody [contenteditable="true"]')
    const target = cells.nth(3)
    const pasteTarget = source === 'cell' ? cells.nth(2) : page.getByText('Outside the table.', { exact: true })
    await pasteTarget.click()
    await page.keyboard.press('End')
    await pasteTarget.evaluate((element) => {
      const clipboardData = new DataTransfer()
      clipboardData.items.add(new File(['image'], 'image.png', { type: 'image/png' }))
      element.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }))
    })
    await target.click()
    await page.keyboard.type('typing')
    await page.evaluate(() => {
      window.finishTableImageUpload!()
    })

    await expect(page.getByLabel('Saved Markdown', { exact: true })).toContainText('https://example.com/late-991.png')
    const imageContainer = source === 'cell' ? cells.nth(2) : page.locator('.mdxeditor-root-contenteditable [contenteditable] > p')
    await expect(imageContainer.locator('img[src="https://example.com/late-991.png"]')).toHaveCount(1)
    // The user keeps working in the cell they moved to.
    await expect(target.locator('xpath=ancestor::td')).toHaveAttribute('data-active', 'true')
    await page.keyboard.type(' more')
    await expect(target).toHaveText('Btyping more')
  })
}
