import React from 'react'
import {
  AdmonitionDirectiveDescriptor,
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  InsertAdmonition,
  MDXEditor,
  Separator,
  UndoRedo,
  directivesPlugin,
  headingsPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  toolbarPlugin
} from '..'

const fixture = `# Select and admonition surfaces

Open **Block type** and **Admonition** in the toolbar, and read the five admonitions below.

:::note
A note. This one has always worked, because \`--admonitionNoteBg\` derives from \`slate\`, and \`slate-dark.css\` is imported.
:::

:::tip
A tip — \`cyan\`.
:::

:::info
Some info — \`grass\`.
:::

:::caution
A caution — \`amber\`.
:::

:::danger
Danger — \`red\`.
:::
`

/**
 * Repro for https://github.com/mdx-editor/editor/issues/921, narrowed to the admonition scales.
 *
 * `tip`/`info`/`caution`/`danger` derive from the `cyan`/`grass`/`amber`/`red` scales, and only their
 * light stylesheets were imported — so those four backgrounds stayed light under dark text (1.63-1.78:1)
 * while `note`, which derives from `slate`, was imported both ways and looked right. Importing the four
 * dark counterparts is the fix.
 *
 * ⚠️ `--basePageBg` IS NOT PART OF THIS. It is intentionally a mutable semantic alias that a consumer
 * maps per colour mode — the Radix-recommended pattern for a surface that is white in light and a gray
 * step in dark, and the behaviour documented in #225. So this story maps it itself, exactly as a
 * consuming app does and as `dark-editor.css` does, rather than expecting a library default to switch.
 *
 * ⚠️ The alias must be set on the element carrying `.editorRoot` — i.e. via `className` — not on an
 * ancestor. `.editorRoot` declares `--basePageBg` itself, and a declaration on the element beats an
 * inherited one, so mapping it on a wrapper silently does nothing.
 *
 * With the page doing that documented job, the four admonition bands are the only thing `dark-theme`
 * still cannot reach without this PR.
 */

/**
 * What a consuming app supplies, and nothing more: a page background, and `--basePageBg` mapped for
 * dark mode (#225). Both stories share the inset so the two can be compared by flipping between them.
 */
const PAGE_CSS = `
  .bug-921-page { background: var(--slate-1); padding: 16px; }
  .bug-921-dark { --basePageBg: var(--slate-1); }
`

export function DarkThemeSurfaces() {
  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="bug-921-page dark-theme">
        <MDXEditor
          className="dark-theme bug-921-dark"
          markdown={fixture}
          plugins={[
            toolbarPlugin({
              toolbarContents: () => (
                <>
                  <UndoRedo />
                  <Separator />
                  <BoldItalicUnderlineToggles />
                  <Separator />
                  <BlockTypeSelect />
                  <Separator />
                  <InsertAdmonition />
                </>
              )
            }),
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
            markdownShortcutPlugin()
          ]}
        />
      </div>
    </>
  )
}

/** The same editor without `dark-theme`, so the two can be compared side by side. */
export function LightThemeSurfaces() {
  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="bug-921-page">
        <MDXEditor
          markdown={fixture}
          plugins={[
            toolbarPlugin({
              toolbarContents: () => (
                <>
                  <UndoRedo />
                  <Separator />
                  <BoldItalicUnderlineToggles />
                  <Separator />
                  <BlockTypeSelect />
                  <Separator />
                  <InsertAdmonition />
                </>
              )
            }),
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
            markdownShortcutPlugin()
          ]}
        />
      </div>
    </>
  )
}
