import { expect, test } from '@playwright/test'

for (const mode of ['source', 'diff']) {
  test(`insertMarkdown preserves ${mode} edits, selection, history and mode switches`, async ({ page }) => {
    const runtimeErrors: string[] = []
    page.on('pageerror', (error) => runtimeErrors.push(error.message))
    await page.goto('/?story=diff-source--insert-markdown&mode=preview')
    const richText = page.locator('.mdxeditor-rich-text-editor [contenteditable="true"]')
    await richText.click()
    await page.keyboard.press('ControlOrMeta+End')
    await page.getByRole('radio', { name: mode === 'source' ? 'Source mode' : 'Diff mode', exact: true }).click()
    const editor = page.locator(mode === 'source' ? '.mdxeditor-source-editor .cm-content' : '.cm-merge-b .cm-content')
    await editor.fill('Edited content')
    await editor.press('ControlOrMeta+Home')
    for (let index = 0; index < 7; index++) await editor.press('ArrowRight')
    const insert = page.getByRole('button', { name: 'Insert Markdown', exact: true })
    await insert.click()
    await expect(insert).toBeFocused()
    await expect(editor).toHaveText('Edited new content')
    await expect(page.getByLabel('Last change')).toHaveText('Edited new content')
    await page.getByRole('button', { name: 'Get Markdown', exact: true }).click()
    await expect(page.getByLabel('Current Markdown')).toHaveText('Edited new content')

    // Keyboard undo/redo exercises CodeMirror's actual browser history.
    await editor.press('ControlOrMeta+z')
    await expect(editor).toHaveText('Edited content')
    // Playwright preserves key casing; Shift+lowercase z is still interpreted as Undo.
    await editor.press('ControlOrMeta+Shift+Z')
    await expect(editor).toHaveText('Edited new content')
    await editor.press('Shift+ArrowLeft')
    await editor.press('Shift+ArrowLeft')
    await editor.press('Shift+ArrowLeft')
    await editor.press('Shift+ArrowLeft')
    await insert.click()
    await expect(editor).toHaveText('Edited new content')
    await insert.click()
    await expect(editor).toHaveText('Edited new new content')

    if (mode === 'diff') await expect(page.locator('.cm-merge-a .cm-content')).toHaveText('Unchanged comparison')
    await page.getByRole('radio', { name: 'Rich text', exact: true }).click()
    await expect(richText).toHaveText('Edited new new content')
    await page.getByRole('radio', { name: mode === 'source' ? 'Source mode' : 'Diff mode', exact: true }).click()
    await editor.press('ControlOrMeta+Home')
    await insert.click()
    await expect(editor).toHaveText('new Edited new new content')
    expect(runtimeErrors).toEqual([])
  })
}

for (const mode of ['source', 'diff']) {
  test(`preserves the ${mode} cursor across source views and resets to the rich-text value`, async ({ page }) => {
    const runtimeErrors: string[] = []
    page.on('pageerror', (error) => runtimeErrors.push(error.message))
    await page.goto('/?story=diff-source--insert-markdown&mode=preview')
    await page.getByRole('radio', { name: mode === 'source' ? 'Source mode' : 'Diff mode', exact: true }).click()
    const outgoing = page.locator(mode === 'source' ? '.mdxeditor-source-editor .cm-content' : '.cm-merge-b .cm-content')
    await outgoing.fill('Edited content')
    await outgoing.press('ControlOrMeta+End')
    await page.getByRole('radio', { name: mode === 'source' ? 'Diff mode' : 'Source mode', exact: true }).click()
    const incoming = page.locator(mode === 'source' ? '.cm-merge-b .cm-content' : '.mdxeditor-source-editor .cm-content')
    await page.getByRole('button', { name: 'Insert Markdown', exact: true }).click()
    await expect(incoming).toHaveText('Edited contentnew ')
    await incoming.press('ControlOrMeta+z')
    await expect(incoming).toHaveText('Edited content')
    await page.getByRole('button', { name: 'Reset Markdown', exact: true }).click()
    await expect(incoming).toHaveText('Original rich text')
    await page.getByRole('button', { name: 'Get Markdown', exact: true }).click()
    await expect(page.getByLabel('Current Markdown')).toHaveText('Original rich text')
    expect(runtimeErrors).toEqual([])
  })
}
