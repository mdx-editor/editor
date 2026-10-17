import React from 'react'
import { MDXEditor, type MDXEditorMethods } from '../MDXEditor'
import { AdmonitionDirectiveDescriptor } from '../directive-editors/AdmonitionDirectiveDescriptor'
import { directivesPlugin } from '../plugins/directives'
import { GenericJsxEditor } from '../jsx-editors/GenericJsxEditor'
import { insertJsx$, jsxPlugin } from '../plugins/jsx'
import { tablePlugin } from '../plugins/table'
import { imagePlugin } from '../plugins/image'
import { toolbarPlugin } from '../plugins/toolbar'
import { Button } from '../plugins/toolbar/primitives/toolbar'
import { usePublisher } from '@mdxeditor/gurx'

const initialMarkdown = `Root content

:::tip
import Existing from '@existing'

Admonition content <Existing />

<img src="nested-image.png" alt="Nested image" />
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
  const [exported, setExported] = React.useState({ revision: 0, markdown: '' })
  const [revision, setRevision] = React.useState(0)
  return (
    <>
      <button
        type="button"
        onClick={() => {
          const saved = ref.current!.getMarkdown()
          setExported((previous) => ({ revision: previous.revision + 1, markdown: saved }))
        }}
      >
        Get Markdown
      </button>
      <button
        type="button"
        onClick={() => {
          const saved = ref.current!.getMarkdown()
          setMarkdown(saved)
          setExported((previous) => ({ ...previous, markdown: saved }))
          setRevision((value) => value + 1)
        }}
      >
        Reload saved Markdown
      </button>
      <MDXEditor
        key={revision}
        ref={ref}
        markdown={markdown}
        plugins={[
          directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
          tablePlugin(),
          imagePlugin(),
          jsxPlugin({
            jsxComponentDescriptors: [
              { name: 'Zazz', kind: 'flow', source: '@zazz', defaultExport: true, props: [], hasChildren: false, Editor: GenericJsxEditor },
              { name: 'Badge', kind: 'text', source: '@components', props: [], hasChildren: false, Editor: GenericJsxEditor },
              { name: '*', kind: 'text', source: '@fallback', props: [], hasChildren: false, Editor: GenericJsxEditor }
            ]
          }),
          toolbarPlugin({ toolbarContents: InsertComponents })
        ]}
      />
      <pre aria-label="Exported markdown" data-export-revision={exported.revision}>
        {exported.markdown}
      </pre>
    </>
  )
}
