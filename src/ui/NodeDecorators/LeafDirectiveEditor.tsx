import React from 'react'
import { LeafDirectiveEditorProps } from '../../types/NodeDecoratorsProps'
import { useEmitterValues } from '../../system/EditorSystemComponent'
import { NestedEditorsContext } from './NestedEditor'
import { LeafDirective } from 'mdast-util-directive'

export const LeafDirectiveEditor: React.FC<LeafDirectiveEditorProps<LeafDirective>> = ({ leafDirective, mdastNode, parentEditor }) => {
  const [customLeafDirectiveEditors] = useEmitterValues('customLeafDirectiveEditors')

  const Editor = React.useMemo(() => {
    return customLeafDirectiveEditors.find(({ testNode }) => testNode(mdastNode))?.Editor
  }, [customLeafDirectiveEditors, mdastNode])

  if (Editor) {
    return (
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      <NestedEditorsContext.Provider value={{ parentEditor, mdastNode, lexicalNode: leafDirective as any }}>
        <Editor mdastNode={mdastNode} parentEditor={parentEditor} leafDirective={leafDirective} />
      </NestedEditorsContext.Provider>
    )
  }

  return <pre>{JSON.stringify(mdastNode, null, 2)}</pre>
}
