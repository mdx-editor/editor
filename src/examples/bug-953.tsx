import React from 'react'
import {
  BoldItalicUnderlineToggles,
  CreateLink,
  DiffSourceToggleWrapper,
  ListsToggle,
  MDXEditor,
  Separator,
  diffSourcePlugin,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  toolbarPlugin
} from '..'

const brokenFixture = `# Full-height editor

Click in the red area below this text. The cursor stays an arrow and the editor does not receive focus, even though the editor root (green border) fills the parent.
`

const fixedFixture = `# Full-height editor

This editor has the \`mdxeditor-full-height\` class. The green contenteditable fills the editor, so clicking anywhere below this text focuses it. The diff-source plugin is on — switch to source/diff mode to verify those fill the height too.

The [scroll target](https://example.com) keeps its link dialog anchored while this area scrolls.

${Array.from({ length: 20 }, (_, index) => `Scrollable paragraph ${index + 1}.`).join('\n\n')}`

const sharedStyles = `
  .bug-953-parent {
    height: 80vh;
    display: flex;
    flex-direction: column;
    border: 2px solid black;
  }
  /* scoped under the parent because className is also applied to the popup container */
  .bug-953-parent .bug-953-editor {
    flex: 1;
    min-height: 0;
    border: 2px solid green;
    background: rgba(255, 0, 0, 0.15);
  }
  .bug-953-contenteditable {
    background: rgba(0, 128, 0, 0.15);
  }
`

const Frame: React.FC<{ children: React.ReactNode; styles?: string }> = ({ children, styles = '' }) => {
  const [focused, setFocused] = React.useState(false)

  return (
    <>
      <style>{sharedStyles + styles}</style>
      <p>
        Editor focused: <strong>{focused ? 'yes' : 'no'}</strong>
      </p>
      <div
        className="bug-953-parent"
        onFocus={() => {
          setFocused(true)
        }}
        onBlur={() => {
          setFocused(false)
        }}
      >
        {children}
      </div>
    </>
  )
}

/**
 * Repro for https://github.com/mdx-editor/editor/issues/953
 *
 * The editor root stretches to 100% of a fixed-height parent, but the
 * contenteditable does not: the intermediate wrappers have no height, so
 * min-height: 100% on the contenteditable resolves to nothing.
 *
 * Green = clickable/focusable contenteditable. Red = dead area inside the editor.
 */
export function DeadClickAreaRepro() {
  return (
    <Frame styles=".bug-953-contenteditable { min-height: 100%; }">
      <MDXEditor
        markdown={brokenFixture}
        className="bug-953-editor"
        contentEditableClassName="bug-953-contenteditable"
        plugins={[
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <BoldItalicUnderlineToggles options={['Bold', 'Italic']} />
                <Separator />
                <ListsToggle options={['bullet', 'number']} />
              </>
            )
          }),
          headingsPlugin(),
          listsPlugin(),
          markdownShortcutPlugin()
        ]}
      />
    </Frame>
  )
}

/**
 * The fix: the mdxeditor-full-height opt-in class makes every wrapper between
 * the root and the contenteditable participate in a flex column chain,
 * including the diff-source plugin wrappers.
 */
export function FullHeightOptInClass() {
  return (
    <Frame>
      <MDXEditor
        markdown={fixedFixture}
        className="mdxeditor-full-height bug-953-editor"
        contentEditableClassName="bug-953-contenteditable"
        plugins={[
          toolbarPlugin({
            toolbarContents: () => (
              <DiffSourceToggleWrapper>
                <BoldItalicUnderlineToggles options={['Bold', 'Italic']} />
                <Separator />
                <ListsToggle options={['bullet', 'number']} />
                <CreateLink />
              </DiffSourceToggleWrapper>
            )
          }),
          headingsPlugin(),
          listsPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          markdownShortcutPlugin(),
          diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: brokenFixture })
        ]}
      />
    </Frame>
  )
}
