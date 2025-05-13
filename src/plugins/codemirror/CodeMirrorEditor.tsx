import { useCellValues } from '@mdxeditor/gurx'
import React from 'react'
import styles from '../../styles/ui.module.css'
import { CodeBlockEditorProps } from '../codeblock'
import { useCodeBlockEditorContext } from '../codeblock/CodeBlockNode'
import { iconComponentFor$, readOnly$, useTranslation } from '../core'

import { languages } from '@codemirror/language-data'
import { EditorState, Extension } from '@codemirror/state'
import { EditorView, lineNumbers } from '@codemirror/view'
import { basicLight } from 'cm6-theme-basic-light'
import { basicSetup } from 'codemirror'
import { codeBlockLanguages$, codeMirrorAutoLoadLanguageSupport$, codeMirrorExtensions$ } from '.'
import { useCodeMirrorRef } from '../sandpack/useCodeMirrorRef'
import { Select } from '../toolbar/primitives/select'

export const COMMON_STATE_CONFIG_EXTENSIONS: Extension[] = []
const EMPTY_VALUE = '__EMPTY_VALUE__'

export const CodeMirrorEditor = ({ language, nodeKey, code, focusEmitter }: CodeBlockEditorProps) => {
  const t = useTranslation()
  const { parentEditor, lexicalNode } = useCodeBlockEditorContext()
  const [readOnly, codeMirrorExtensions, autoLoadLanguageSupport, iconComponentFor, codeBlockLanguages] = useCellValues(
    readOnly$,
    codeMirrorExtensions$,
    codeMirrorAutoLoadLanguageSupport$,
    iconComponentFor$,
    codeBlockLanguages$
  )

  const codeMirrorRef = useCodeMirrorRef(nodeKey, 'codeblock', language, focusEmitter)
  const { setCode } = useCodeBlockEditorContext()
  const editorViewRef = React.useRef<EditorView | null>(null)
  const elRef = React.useRef<HTMLDivElement | null>(null)

  const setCodeRef = React.useRef(setCode)
  setCodeRef.current = setCode
  codeMirrorRef.current = {
    getCodemirror: () => editorViewRef.current!
  }

  React.useEffect(() => {
    void (async () => {
      const extensions = [
        ...codeMirrorExtensions,
        basicSetup,
        basicLight,
        lineNumbers(),
        EditorView.lineWrapping,
        EditorView.updateListener.of(({ state }) => {
          setCodeRef.current(state.doc.toString())
        })
      ]
      if (readOnly) {
        extensions.push(EditorState.readOnly.of(true))
      }
      if (language !== '' && autoLoadLanguageSupport) {
        const languageData = languages.find((l) => {
          return l.name === language || l.alias.includes(language) || l.extensions.includes(language)
        })
        if (languageData) {
          try {
            const languageSupport = await languageData.load()
            extensions.push(languageSupport.extension)
          } catch (e) {
            console.warn('failed to load language support for', language)
          }
        }
      }
      elRef.current!.innerHTML = ''
      editorViewRef.current = new EditorView({
        parent: elRef.current!,
        state: EditorState.create({ doc: code, extensions })
      })
    })()
    return () => {
      editorViewRef.current?.destroy()
      editorViewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, language])

  React.useEffect(() => {
    const handleTabKey = (e: Event) => {
      const keyboardEvent = e as KeyboardEvent
      console.log('Key pressed:', keyboardEvent.key) // Log the key pressed
      if (keyboardEvent.key === 'Tab') {
        console.log('Tab key detected, preventing default behavior.') // Log Tab key detection
        keyboardEvent.preventDefault()
        keyboardEvent.stopPropagation()
        const state = editorViewRef.current?.state
        if (state) {
          console.log('Editor state found.') // Log state availability
          console.log('Selection details:', {
            from: state.selection.main.from,
            to: state.selection.main.to,
            empty: state.selection.main.empty
          }) // Log selection details

          const changes = {
            from: state.selection.main.from,
            to: state.selection.main.empty ? state.selection.main.from : state.selection.main.to,
            insert: '\t'
          }
          console.log('Changes to apply:', changes) // Log changes

          const transaction = state.update({
            changes,
            selection: { anchor: changes.from + 1, head: changes.from + 1 } // Move cursor after the tab character
          })
          editorViewRef.current?.dispatch(transaction)

          console.log('Transaction dispatched:', transaction) // Log transaction details
        } else {
          console.log('No editor state available.') // Log missing state
        }
      }
    }

    const observer = new MutationObserver(() => {
      const codeMirrorElement = elRef.current?.querySelector('.cm-content')
      if (codeMirrorElement) {
        console.log('CodeMirror element found, adding event listener.') // Log element availability
        codeMirrorElement.addEventListener('keydown', handleTabKey as EventListener)
        observer.disconnect() // Stop observing once the element is found
      }
    })

    if (elRef.current) {
      observer.observe(elRef.current, { childList: true, subtree: true })
    }

    return () => {
      observer.disconnect()
      const codeMirrorElement = elRef.current?.querySelector('.cm-content')
      if (codeMirrorElement) {
        console.log('Removing event listener from CodeMirror element.') // Log cleanup
        codeMirrorElement.removeEventListener('keydown', handleTabKey as EventListener)
      }
    }
  }, [editorViewRef])

  return (
    <div
      className={styles.codeMirrorWrapper}
      onKeyDown={(e) => {
        e.stopPropagation()
      }}
    >
      <div className={styles.codeMirrorToolbar}>
        <Select
          disabled={readOnly}
          value={language}
          onChange={(language) => {
            parentEditor.update(() => {
              lexicalNode.setLanguage(language === EMPTY_VALUE ? '' : language)
              setTimeout(() => {
                parentEditor.update(() => {
                  lexicalNode.getLatest().select()
                })
              })
            })
          }}
          triggerTitle={t('codeBlock.selectLanguage', 'Select code block language')}
          placeholder={t('codeBlock.inlineLanguage', 'Language')}
          items={Object.entries(codeBlockLanguages).map(([value, label]) => ({ value: value ? value : EMPTY_VALUE, label }))}
        />
        <button
          className={styles.iconButton}
          type="button"
          disabled={readOnly}
          title={t('codeblock.delete', 'Delete code block')}
          onClick={(e) => {
            e.preventDefault()
            parentEditor.update(() => {
              lexicalNode.remove()
            })
          }}
        >
          {iconComponentFor('delete_small')}
        </button>
      </div>
      <div ref={elRef} />
    </div>
  )
}
