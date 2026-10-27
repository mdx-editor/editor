import { expect, test } from '@playwright/test'

test('announces upload progress, preserves failed input and retries', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('https://example.com/**', (route) =>
    route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" />' })
  )
  await page.goto('/?story=image-upload-lifecycle--upload-lifecycle&mode=preview')
  await page.getByRole('textbox').click()
  await page.keyboard.press('End')
  await page.getByRole('button', { name: 'Insert image', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('input[type="file"]').setInputFiles({ name: 'image.png', mimeType: 'image/png', buffer: Buffer.from('image') })
  await dialog.getByLabel('Alt:', { exact: true }).fill('Preserved description')
  await dialog.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(dialog.getByRole('status')).toContainText('Uploading image')
  await expect(dialog.getByRole('button', { name: 'Save', exact: true })).toBeDisabled()
  await dialog.locator('form').evaluate((form) => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
  await expect(page.getByLabel('Upload attempts', { exact: true })).toHaveText('1')
  await page.evaluate(() => window.settleImageDialogUpload!(true))
  await expect(dialog.getByRole('alert')).toContainText('Image upload failed')
  await expect(dialog.getByLabel('Alt:', { exact: true })).toHaveValue('Preserved description')
  await dialog.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByLabel('Upload attempts', { exact: true })).toHaveText('2')
  await page.evaluate(() => window.settleImageDialogUpload!(false))
  await expect(dialog).toHaveCount(0)
  await expect(page.getByLabel('Saved Markdown', { exact: true })).toContainText(
    '![Preserved description](https://example.com/upload-lifecycle.png)'
  )
  expect(errors).toEqual([])
})

for (const dismissal of ['Cancel', 'Escape']) {
  test(`ignores a late upload after ${dismissal} and reopening`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/?story=image-upload-lifecycle--upload-lifecycle&mode=preview')
    await page.getByRole('textbox').click()
    await page.getByRole('button', { name: 'Insert image', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await dialog.locator('input[type="file"]').setInputFiles({ name: 'image.png', mimeType: 'image/png', buffer: Buffer.from('image') })
    await dialog.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(dialog.getByRole('status')).toBeVisible()
    if (dismissal === 'Cancel') await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
    else await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await page.getByRole('button', { name: 'Insert image', exact: true }).click()
    await page.evaluate(() => window.settleImageDialogUpload!(false))
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('status')).toHaveCount(0)
    await expect(page.getByLabel('Saved Markdown', { exact: true })).not.toContainText('upload-lifecycle.png')
    expect(errors).toEqual([])
  })
}

test('does not insert a pending upload into a replacement document', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/?story=image-upload-lifecycle--upload-lifecycle&mode=preview')
  await page.getByRole('textbox').click()
  await page.getByRole('button', { name: 'Insert image', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('input[type="file"]').setInputFiles({ name: 'old.png', mimeType: 'image/png', buffer: Buffer.from('image') })
  await dialog.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(dialog.getByRole('status')).toBeVisible()
  await page.evaluate(() => window.replaceImageDialogDocument!('Replacement document'))
  await expect(dialog).toHaveCount(0)
  await page.evaluate(() => window.settleImageDialogUpload!(false))
  await expect(page.getByRole('textbox')).toHaveText('Replacement document')
  await expect(page.getByLabel('Saved Markdown', { exact: true })).toHaveText('Replacement document')
  expect(errors).toEqual([])
})

test('keeps an idle URL dialog and its fields during a parent Markdown resync', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" />' })
  )
  await page.goto('/?story=image-upload-lifecycle--upload-lifecycle&mode=preview')
  await page.getByRole('textbox').click()
  await page.getByRole('button', { name: 'Insert image', exact: true }).click()
  const dialog = page.getByRole('dialog')
  const src = 'https://example.com/idle-url.png'
  await dialog.locator('input[name="src"]').fill(src)
  await dialog.getByLabel('Alt:', { exact: true }).fill('Retained URL description')
  await dialog.getByLabel('Title:', { exact: true }).fill('Retained URL title')
  await page.evaluate(() => window.replaceImageDialogDocument!('Parent resync\n\n\nNon-normalized Markdown'))
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('input[name="src"]')).toHaveValue(src)
  await expect(dialog.getByLabel('Alt:', { exact: true })).toHaveValue('Retained URL description')
  await expect(dialog.getByLabel('Title:', { exact: true })).toHaveValue('Retained URL title')
  await expect(page.getByLabel('Upload attempts', { exact: true })).toHaveText('0')
  await dialog.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByLabel('Saved Markdown', { exact: true })).toContainText(src)
})
