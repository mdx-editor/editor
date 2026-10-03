import React from 'react'
import { MDXEditor, type MDXEditorMethods } from '../MDXEditor'
import { AdmonitionDirectiveDescriptor } from '../directive-editors/AdmonitionDirectiveDescriptor'
import { directivesPlugin } from '../plugins/directives'
import { GenericJsxEditor } from '../jsx-editors/GenericJsxEditor'
import { insertJsx$, jsxPlugin } from '../plugins/jsx'
import { tablePlugin } from '../plugins/table'
import { toolbarPlugin } from '../plugins/toolbar'
import { Button } from '../plugins/toolbar/primitives/toolbar'
import { usePublisher } from '@mdxeditor/gurx'

const initialMarkdown = `Root content

:::tip
import Existing from '@existing'

Admonition content <Existing />
:::

| Header |
| ------ |
| Table content |
`

function InsertComponents() {
  const insertJsx = usePublisher(insertJsx$)
  return (
    <>
      <Button
        onClick={() => {
          insertJsx({ name: 'Zazz', kind: 'flow', props: {} })
        }}
      >
        Insert Zazz
      </Button>
      <Button
        onClick={() => {
          insertJsx({ name: 'Badge', kind: 'text', props: {} })
        }}
      >
        Insert Badge
      </Button>
    </>
  )
}

export const NestedJsxImports = () => {
  const ref = React.useRef<MDXEditorMethods>(null)
  const [markdown, setMarkdown] = React.useState(initialMarkdown)
  const [exported, setExported] = React.useState('')
  const [revision, setRevision] = React.useState(0)
  return (
    <>
      <MDXEditor
        key={revision}
        ref={ref}
        markdown={markdown}
        plugins={[
          directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
          tablePlugin(),
          jsxPlugin({
            jsxComponentDescriptors: [
              { name: 'Zazz', kind: 'flow', source: '@zazz', defaultExport: true, props: [], hasChildren: false, Editor: GenericJsxEditor },
              { name: 'Badge', kind: 'text', source: '@components', props: [], hasChildren: false, Editor: GenericJsxEditor },
              { name: '*', kind: 'text', props: [], hasChildren: false, Editor: GenericJsxEditor }
            ]
          }),
          toolbarPlugin({ toolbarContents: InsertComponents })
        ]}
      />
      <button
        type="button"
        onClick={() => {
          setExported(ref.current!.getMarkdown())
        }}
      >
        Get Markdown
      </button>
      <button
        type="button"
        onClick={() => {
          const saved = ref.current!.getMarkdown()
          setMarkdown(saved)
          setExported(saved)
          setRevision((value) => value + 1)
        }}
      >
        Reload saved Markdown
      </button>
      <pre aria-label="Exported markdown">{exported}</pre>
    </>
  )
}
