import React from 'react'
import mermaid from 'mermaid'
import { CodeBlockEditorDescriptor, useCodeBlockEditorContext, MDXEditor, codeBlockPlugin } from '..'
import mmdMarkdown from './assets/mermaid-code.md?raw'

mermaid.initialize({ startOnLoad: true })

const MermaidPreview: React.FC<{ code: string }> = ({ code }) => {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (ref.current) {
      void mermaid.render('graphDiv', code).then(({ svg }) => {
        ref.current!.innerHTML = svg
      })
    }
  }, [code])

  return <div ref={ref}>{code}</div>
}

const MermaidCodeEditorDescriptor: CodeBlockEditorDescriptor = {
  match: (language, _meta) => {
    return language === 'mermaid' || language == 'mmd'
  },
  priority: 0,
  Editor: (props) => {
    const cb = useCodeBlockEditorContext()
    const [code, setCode] = React.useState(props.code)

    return (
      <div
        onKeyDown={(e) => {
          e.nativeEvent.stopImmediatePropagation()
        }}
      >
        <div style={{ display: 'flex' }}>
          <textarea
            style={{ flex: 1 }}
            rows={3}
            cols={20}
            defaultValue={props.code}
            onChange={(e) => {
              setCode(e.target.value)
              cb.setCode(e.target.value)
            }}
          />
          <div style={{ flex: 1 }}>
            <MermaidPreview code={code} />
          </div>
        </div>
      </div>
    )
  }
}

export function CodeBlock() {
  return (
    <MDXEditor
      onChange={console.log}
      markdown={mmdMarkdown}
      plugins={[codeBlockPlugin({ codeBlockEditorDescriptors: [MermaidCodeEditorDescriptor] })]}
    />
  )
}
