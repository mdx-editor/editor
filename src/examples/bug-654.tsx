import React from 'react'
import {
  ChangeCodeMirrorLanguage,
  ConditionalContents,
  InsertCodeBlock,
  MDXEditor,
  UndoRedo,
  codeBlockPlugin,
  codeMirrorPlugin,
  toolbarPlugin
} from '..'

/** Repro for https://github.com/mdx-editor/editor/issues/654 */
export function ConditionalHistoryToolbar() {
  const [markdown, setMarkdown] = React.useState('')
  return (
    <>
      <p>Insert a code block, focus its code, then click the paragraph below it. Undo should remove the block; Redo should restore it.</p>
      <MDXEditor
        markdown=""
        onChange={setMarkdown}
        plugins={[
          toolbarPlugin({
            toolbarContents: () => (
              <ConditionalContents
                options={[
                  { when: (editor) => editor?.editorType === 'codeblock', contents: () => <ChangeCodeMirrorLanguage /> },
                  {
                    fallback: () => (
                      <>
                        <UndoRedo />
                        <InsertCodeBlock />
                      </>
                    )
                  }
                ]}
              />
            )
          }),
          codeBlockPlugin({ defaultCodeBlockLanguage: 'txt' }),
          codeMirrorPlugin({ codeBlockLanguages: { txt: 'Plain text' }, autoLoadLanguageSupport: false })
        ]}
      />
      <output aria-label="Current Markdown">{markdown}</output>
    </>
  )
}
