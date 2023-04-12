import { SandpackCodeEditor, SandpackLayout, SandpackPreview, SandpackProvider, useSandpack } from '@codesandbox/sandpack-react'
import { CodeMirrorRef } from '@codesandbox/sandpack-react/dist/components/CodeEditor/CodeMirror'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createParagraphNode, $getNodeByKey } from 'lexical'
import React from 'react'
import { useEmitterValues, usePublisher } from '../../system'
import { SandpackPreset } from '../../system/Sandpack'
import { SandpackEditorProps } from '../../types/NodeDecoratorsProps'
import { parseCodeBlockMeta } from './parseCodeBlockMeta'

interface CodeUpdateEmitterProps {
  snippetFileName: string
  onChange: (code: string) => void
}

const CodeUpdateEmitter = ({ onChange, snippetFileName }: CodeUpdateEmitterProps) => {
  const { sandpack } = useSandpack()
  onChange(sandpack.files[snippetFileName].code)
  return null
}

export const SandpackEditor = ({ nodeKey, code, meta, onChange, focusEmitter }: SandpackEditorProps) => {
  const [editor] = useLexicalComposerContext()
  const setActiveSandpackNode = usePublisher('activeSandpackNode')
  const [config] = useEmitterValues('sandpackConfig')
  const codeMirrorRef = React.useRef<CodeMirrorRef>(null)

  let preset: SandpackPreset | undefined
  const metaObj = parseCodeBlockMeta(meta)
  if (typeof config === 'function') {
    preset = config(metaObj)
  } else {
    const presetName = metaObj.preset || config?.defaultPreset
    preset = config?.presets.find((p) => p.name === presetName)
    if (!preset) {
      throw new Error(`No preset found for name ${presetName}`)
    }
  }

  React.useEffect(() => {
    focusEmitter.subscribe(() => {
      codeMirrorRef?.current?.getCodemirror()?.focus()
    })
  }, [focusEmitter, codeMirrorRef])

  const wrappedOnChange = React.useCallback(
    (code: string) => {
      editor.update(() => {
        onChange(code)
      })
    },
    [onChange, editor]
  )

  const onFocusHandler = React.useCallback(() => {
    setActiveSandpackNode({ nodeKey })
  }, [nodeKey, setActiveSandpackNode])

  const onKeyDownHandler = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        const state = codeMirrorRef?.current?.getCodemirror()?.state
        if (state) {
          const docLength = state.doc.length
          const selectionEnd = state.selection.ranges[0].to

          if (docLength === selectionEnd) {
            editor.update(() => {
              const node = $getNodeByKey(nodeKey)!
              const nextSibling = node.getNextSibling()
              if (nextSibling) {
                codeMirrorRef?.current?.getCodemirror()?.contentDOM.blur()
                node.selectNext()
              } else {
                node.insertAfter($createParagraphNode())
              }
            })
          }
        }
      } else if (e.key === 'ArrowUp') {
        const state = codeMirrorRef?.current?.getCodemirror()?.state
        if (state) {
          const selectionStart = state.selection.ranges[0].from

          if (selectionStart === 0) {
            editor.update(() => {
              const node = $getNodeByKey(nodeKey)!
              const previousSibling = node.getPreviousSibling()
              if (previousSibling) {
                codeMirrorRef?.current?.getCodemirror()?.contentDOM.blur()
                node.selectPrevious()
              } else {
                // TODO: insert a paragraph before the sandpack node
              }
            })
          }
        }
      }
    },
    [editor, nodeKey]
  )

  React.useEffect(() => {
    const codeMirror = codeMirrorRef.current

    // TODO: This is a hack to get around the fact that the CodeMirror instance
    // is not available immediately after the component is mounted.
    setTimeout(() => {
      codeMirror?.getCodemirror()?.contentDOM?.addEventListener('focus', onFocusHandler)
      codeMirror?.getCodemirror()?.contentDOM?.addEventListener('keydown', onKeyDownHandler)
    }, 100)

    return () => {
      codeMirror?.getCodemirror()?.contentDOM.removeEventListener('focus', onFocusHandler)
      codeMirror?.getCodemirror()?.contentDOM.removeEventListener('keydown', onKeyDownHandler)
    }
  }, [codeMirrorRef, onFocusHandler, onKeyDownHandler])

  return (
    <SandpackProvider
      template={preset.sandpackTemplate}
      theme={preset.sandpackTheme}
      files={{
        [preset.snippetFileName]: code,
        ...Object.entries(preset.files || {}).reduce(
          (acc, [filePath, fileContents]) => ({ ...acc, ...{ [filePath]: { code: fileContents, readOnly: true } } }),
          {}
        ),
      }}
      customSetup={{
        dependencies: preset.dependencies,
      }}
    >
      <SandpackLayout>
        <SandpackCodeEditor showLineNumbers showInlineErrors ref={codeMirrorRef} />
        <SandpackPreview />
      </SandpackLayout>
      <CodeUpdateEmitter onChange={wrappedOnChange} snippetFileName={preset.snippetFileName} />
    </SandpackProvider>
  )
}
