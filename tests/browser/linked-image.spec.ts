import { expect, test, type Locator, type Page } from '@playwright/test'

const storyUrl = '/?story=images--image-with-link-dialog&mode=preview'
const runtimeErrors = new WeakMap<Page, string[]>()

async function selectImage(image: Locator, shiftKey = false) {
  await image.click({ modifiers: shiftKey ? ['Shift'] : [] })
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  runtimeErrors.set(page, errors)
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`)
  })

  await page.goto(storyUrl)
  await expect(page.getByRole('img', { name: 'plain image' })).toBeVisible()
})

test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page) ?? [], 'unexpected browser runtime errors').toEqual([])
})

test('adds, validates, edits, and removes a link on a selected image', async ({ page }) => {
  const image = page.getByRole('img', { name: 'plain image' })
  const openDialog = page.getByRole('button', { name: 'Create link' })
  const urlInput = page.getByRole('dialog').getByRole('textbox').first()
  const markdown = page.getByLabel('Linked image Markdown')

  await selectImage(image)
  await openDialog.click()
  await urlInput.fill('http://invalid.example')
  await page.getByRole('button', { name: 'Set URL' }).click()
  await expect(urlInput).toBeVisible()
  await expect(image.locator('xpath=ancestor::a[1]')).toHaveCount(0)

  await urlInput.fill('https://created.example')
  await page.getByRole('button', { name: 'Set URL' }).click()
  await expect(image.locator('xpath=ancestor::a[1]')).toHaveAttribute('href', /created\.example/)
  await expect(markdown).toContainText('[![plain image](https://picsum.photos/200/300)](https://created.example)')

  await selectImage(image)
  await openDialog.click()
  await urlInput.fill('https://edited.example')
  await page.getByRole('button', { name: 'Set URL' }).click()
  await expect(image.locator('xpath=ancestor::a[1]')).toHaveAttribute('href', /edited\.example/)
  await expect(markdown).toContainText('[![plain image](https://picsum.photos/200/300)](https://edited.example)')

  await selectImage(image)
  await openDialog.click()
  await urlInput.fill('')
  await page.getByRole('button', { name: 'Set URL' }).click()
  await expect(image.locator('xpath=ancestor::a[1]')).toHaveCount(0)
  await expect(markdown).toContainText('![plain image](https://picsum.photos/200/300)')
  await expect(markdown).not.toContainText('https://edited.example')
})

test('does not consume the link shortcut for multiple selected images', async ({ page }) => {
  const editor = page.locator('.mdxeditor').first()
  await selectImage(page.getByRole('img', { name: 'plain image' }))
  await selectImage(page.getByRole('img', { name: 'linked image' }), true)

  const defaultPrevented = await editor.locator('[contenteditable="true"]').evaluate((element) => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      metaKey: true,
      bubbles: true,
      cancelable: true
    })
    element.dispatchEvent(event)
    return event.defaultPrevented
  })

  expect(defaultPrevented).toBe(false)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
