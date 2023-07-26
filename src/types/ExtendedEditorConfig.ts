import { EditorConfig } from 'lexical'
import { JsxEditorProps, LeafDirectiveEditorProps } from './NodeDecoratorsProps'
import { LeafDirective } from 'mdast-util-directive'

export interface NodeDecoratorComponents {
  JsxEditor: React.FC<JsxEditorProps>
  LeafDirectiveEditor: React.FC<LeafDirectiveEditorProps<LeafDirective>>
}

export type ExtendedEditorConfig = EditorConfig & {
  theme: EditorConfig['theme'] & {
    nodeDecoratorComponents: NodeDecoratorComponents
  }
}
