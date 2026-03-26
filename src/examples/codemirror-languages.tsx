import React from 'react'
import { MDXEditor, codeBlockPlugin, codeMirrorPlugin } from '../'
import { languages } from '@codemirror/language-data'
import { python } from '@codemirror/lang-python'
import { EditorView, keymap } from '@codemirror/view'
import { toggleLineComment } from '@codemirror/commands'

const simpleSampleMarkdown = `
With \`js\` language:

\`\`\`js
const x = 1
\`\`\`

With \`ts\` language:

\`\`\`ts
const z: number = 3
\`\`\`
`

const aliasSampleMarkdown = `
With \`js\` language:

\`\`\`js
const x = 1
\`\`\`

With \`javascript\` (alias) language:

\`\`\`javascript
const y = 2
\`\`\`

With \`ts\` language:

\`\`\`ts
const z: number = 3
\`\`\`

With \`typescript\` (alias) language:

\`\`\`typescript
const z: number = 3
\`\`\`
`

const supportSampleMarkdown = `
JS is **not** loaded:

\`\`\`js
const x = 1
\`\`\`

Python support is loaded:

\`\`\`python
def greet(name):
    message = f"Hello, {name}!"
    print(message)
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
      markdown={aliasSampleMarkdown}
      plugins={[
        codeBlockPlugin(),
        codeMirrorPlugin({
          codeBlockLanguages: languages
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
      markdown={aliasSampleMarkdown}
      plugins={[
        codeBlockPlugin(),
        codeMirrorPlugin({
          codeBlockLanguages: [
            { name: 'JavaScript', alias: ['js', 'javascript'] },
            { name: 'TypeScript', alias: ['ts', 'typescript'] }
          ]
        })
      ]}
    />
  )
}

/**
 * Uses `CodeBlockLanguage[]` with pre-loaded `support` for Python.
 * JavaScript and CSS have no `support` and are auto-loaded as usual.
 */
export function CodeMirrorLanguageWithSupport() {
  return (
    <MDXEditor
      onChange={console.log}
      markdown={supportSampleMarkdown}
      plugins={[
        codeBlockPlugin(),
        codeMirrorPlugin({
          codeBlockLanguages: [
            { name: 'JavaScript', alias: ['js', 'javascript'] },
            { name: 'Python', alias: ['py', 'python'], support: python() }
          ],
          // Disable auto-load to test support load is working well
          autoLoadLanguageSupport: false
        })
      ]}
    />
  )
}

/**
 * Passes custom CodeMirror extensions to all code block editors.
 * Here we add a custom tab size and a custom theme via EditorView.theme.
 */
export function CodeMirrorExtensions() {
  return (
    <MDXEditor
      onChange={console.log}
      markdown={simpleSampleMarkdown}
      plugins={[
        codeBlockPlugin(),
        codeMirrorPlugin({
          codeBlockLanguages: { js: 'JavaScript', ts: 'TypeScript' },
          codeMirrorExtensions: [
            keymap.of([{ key: 'Cmd-:', run: toggleLineComment }]),
            EditorView.theme({
              '&': { backgroundColor: '#f5f5f5' },
              '.cm-content': { fontFamily: '"Fira Code", monospace' },
              '.cm-gutters': { backgroundColor: 'orange !important' },
              '.cm-activeLineGutter': { backgroundColor: 'yellow !important' }
            })
          ]
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
      markdown={aliasSampleMarkdown}
      plugins={[
        codeBlockPlugin(),
        codeMirrorPlugin({
          codeBlockLanguages: { js: 'JavaScript', javascript: 'JavaScript', ts: 'TypeScript', typescript: 'TypeScript' }
        })
      ]}
    />
  )
}
