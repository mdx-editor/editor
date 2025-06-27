import React, { useRef, useState } from 'react'

import { GenericJsxEditor, JsxComponentDescriptor, MDXEditor, MDXEditorMethods, jsxPlugin } from '..'

const BrowserWindowDescriptor: JsxComponentDescriptor = {
  name: 'BrowserWindow',
  kind: 'flow',
  hasChildren: true,
  props: [],
  Editor: GenericJsxEditor
}

const WORKING = `WORKING

<details>
    <summary>Some Details</summary>
    The details Body
</details>

<BrowserWindow>
Hello
</BrowserWindow>
`

const CRASHING = `CRASHING

<BrowserWindow>
Hello
<details>
    <summary>Some Details</summary>
    The details Body
</details>
</BrowserWindow>
`

export function Example() {
  const [source, setSource] = useState<'working' | 'crashing'>('crashing')
  const ref = useRef<MDXEditorMethods>(null)
  return (
    <div>
      <button
        onClick={() => {
          if (source === 'working') {
            setSource('crashing')
            ref.current?.setMarkdown(CRASHING)
          } else {
            setSource('working')
            ref.current?.setMarkdown(WORKING)
          }
        }}
      >
        Use {source === 'working' ? 'CRASHING' : 'WORKING'}
      </button>
      <MDXEditor
        ref={ref}
        markdown={source === 'working' ? WORKING : CRASHING}
        onError={(error) => {
          console.error('Error in editor', error)
        }}
        plugins={[
          jsxPlugin({
            jsxComponentDescriptors: [BrowserWindowDescriptor]
          })
        ]}
      />
    </div>
  )
}
