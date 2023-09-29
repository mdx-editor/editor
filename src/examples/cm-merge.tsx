import React from 'react'
import { MergeView } from '@codemirror/merge'
import { markdown as markdownLanguageSupport } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorState, EditorStateConfig, Extension } from '@codemirror/state'
import { EditorView, lineNumbers } from '@codemirror/view'
import { syntaxHighlighting } from '@codemirror/language'
import { basicLight } from 'cm6-theme-basic-light'
import { basicSetup } from 'codemirror'

const md1 = `
## Hello world

  This is a paragraph

Some more text.

Some more text.
Some more text.
Some more text.

!()[https://example.com/image.png]
`

const md2 = `
## Hello world some text

  This is a paragh

Some more text.

more
`

const commonStateConfigExtensions: Extension[] = [basicSetup, basicLight, markdownLanguageSupport(), lineNumbers()]

export function Example() {
  const cmMergeViewRef = React.useRef<MergeView | null>(null)
  const ref = React.useCallback((el: HTMLDivElement | null) => {
    if (el !== null) {
      cmMergeViewRef.current = new MergeView({
        renderRevertControl: () => {
          const el = document.createElement('button')
          el.classList.add('cm-merge-revert')
          el.appendChild(document.createTextNode('\u2B95'))
          return el
        },
        parent: el,
        orientation: 'a-b',
        revertControls: 'a-to-b',
        gutter: true,
        collapseUnchanged: { margin: 2, minSize: 3 },
        a: {
          doc: md1.trim(),
          extensions: [...commonStateConfigExtensions, EditorState.readOnly.of(true)]
        },
        b: {
          doc: md2.trim(),
          extensions: [
            ...commonStateConfigExtensions,
            EditorView.updateListener.of(({ state }) => {
              const md = state.doc.toString()
              console.log(md)
            })
          ]
        }
      })
    } else {
      cmMergeViewRef.current?.destroy()
      cmMergeViewRef.current = null
    }
  }, [])

  return <div ref={ref}>Hello</div>
}

export function Codemirror() {
  const ref = React.useCallback((el: HTMLDivElement | null) => {
    if (el !== null) {
      el.innerHTML = ''
      const e = new EditorView({
        parent: el,
        state: EditorState.create({ doc: md1, extensions: [markdownLanguageSupport(), basicLight] })
      })
    }
  }, [])

  return <div ref={ref}>Hello</div>
}
