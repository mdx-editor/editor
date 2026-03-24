import React from 'react'
import { MDXEditor, codeBlockPlugin, codeMirrorPlugin, diffSourcePlugin, toolbarPlugin, DiffSourceToggleWrapper, UndoRedo } from '../'
import { languages } from '@codemirror/language-data'

const sampleMarkdown = `
\`\`\`js
const x = 1
\`\`\`

\`\`\`javascript
const y = 2
\`\`\`

\`\`\`ts
const z: number = 3
\`\`\`

\`\`\`css
body { color: red; }
\`\`\`
`

/**
 * Uses the CodeMirror `languages` array directly from `@codemirror/language-data`.
 * All aliases and extensions are recognized in the language select.
 */
export function CodeMirrorLanguageData() {
  return (
    <MDXEditor
      onChange={console.log}
      markdown={sampleMarkdown}
      plugins={[
        codeBlockPlugin(),
        codeMirrorPlugin({
          codeBlockLanguages: languages
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

/**
 * Uses a subset of languages passed as a `CodeBlockLanguage[]` array with aliases.
 * A code block with language "js" or "javascript" will both resolve to the "JavaScript" entry.
 */
export function CodeMirrorLanguageArray() {
  return (
    <MDXEditor
      onChange={console.log}
      markdown={sampleMarkdown}
      plugins={[
        codeBlockPlugin(),
        codeMirrorPlugin({
          codeBlockLanguages: [
            { name: 'JavaScript', alias: ['js', 'javascript'] },
            { name: 'TypeScript', alias: ['ts', 'typescript'], extensions: ['ts', 'mts'] },
            { name: 'CSS', alias: ['css'] }
          ]
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

/**
 * Uses the legacy `Record<string, string>` format. Still works as before.
 */
export function CodeMirrorLanguageRecord() {
  return (
    <MDXEditor
      onChange={console.log}
      markdown={sampleMarkdown}
      plugins={[
        codeBlockPlugin(),
        codeMirrorPlugin({
          codeBlockLanguages: { jsx: 'JavaScript (React)', js: 'JavaScript', javascript: 'JavaScript', css: 'CSS' }
        })
      ]}
    />
  )
}
