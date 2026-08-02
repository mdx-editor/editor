import { expect, test, type Page } from '@playwright/test'

const storyUrl = '/?story=bug-953--full-height-opt-in-class&mode=preview'
const runtimeErrors = new WeakMap<Page, string[]>()

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  runtimeErrors.set(page, errors)
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`)
  })

  await page.goto(storyUrl)
  await expect(page.getByRole('heading', { name: 'Full-height editor' })).toBeVisible()
})

test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page) ?? [], 'unexpected browser runtime errors').toEqual([])
})

test('keeps the link dialog anchored while the full-height editor scrolls', async ({ page }) => {
  const editor = page.locator('.mdxeditor.mdxeditor-full-height')
  const scroller = editor.locator('.mdxeditor-root-contenteditable')
  const link = editor.getByRole('link', { name: 'scroll target' })

  await expect
    .poll(() => scroller.evaluate((element) => element.scrollHeight > element.clientHeight))
    .toBe(true)

  await link.click()
  const preview = page.getByTestId('link-dialog-preview')
  await expect(preview).toBeVisible()

  const initialLinkBox = await link.boundingBox()
  const initialPreviewBox = await preview.boundingBox()
  expect(initialLinkBox).not.toBeNull()
  expect(initialPreviewBox).not.toBeNull()

  await scroller.evaluate((element) => element.scrollTo({ top: 80 }))

  await expect
    .poll(async () => {
      const linkBox = await link.boundingBox()
      const previewBox = await preview.boundingBox()
      if (!linkBox || !previewBox || !initialLinkBox || !initialPreviewBox) return false
      return linkBox.y < initialLinkBox.y - 40 && previewBox.y < initialPreviewBox.y - 40
    })
    .toBe(true)
})
