import React from 'react'
import {
  MDXEditor,
  listsPlugin,
  diffSourcePlugin,
  toolbarPlugin,
  DiffSourceToggleWrapper,
  UndoRedo,
  codeBlockPlugin,
  codeMirrorPlugin,
  sandpackPlugin,
  CodeMirrorEditor
} from '..'
import { virtuosoSampleSandpackConfig } from './_boilerplate'

const listsMarkdown = `
* hello
* world
    * indented
  * more
* back
`

export function NestedLists() {
  return (
    <MDXEditor
      markdown={listsMarkdown}
      onChange={(md) => {
        console.log(md)
      }}
      plugins={[
        listsPlugin(),
        diffSourcePlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <DiffSourceToggleWrapper>
              <UndoRedo />
            </DiffSourceToggleWrapper>
          )
        })
      ]}
    />
  )
}

const listWithCode = `
* List item one
    \`\`\`tsx
    line one
    line two
    \`\`\`
* List item two
`

export function CodeInLists() {
  return (
    <MDXEditor
      markdown={listWithCode}
      onChange={(md) => {
        console.log(md)
      }}
      plugins={[
        listsPlugin(),
        codeBlockPlugin({
          codeBlockEditorDescriptors: [{ priority: -10, match: (_) => true, Editor: CodeMirrorEditor }]
        }),
        sandpackPlugin({ sandpackConfig: virtuosoSampleSandpackConfig }),
        codeMirrorPlugin({
          codeBlockLanguages: { jsx: 'JavaScript (react)', js: 'JavaScript', css: 'CSS', tsx: 'TypeScript (react)' }
        }),
        diffSourcePlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <DiffSourceToggleWrapper>
              <UndoRedo />
            </DiffSourceToggleWrapper>
          )
        })
      ]}
    />
  )
}
