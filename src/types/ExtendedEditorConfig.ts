import { EditorConfig } from 'lexical'
import { JsxEditorProps, SandpackEditorProps, CodeBlockEditorProps, LeafDirectiveEditorProps } from './NodeDecoratorsProps'
import { LeafDirective } from 'mdast-util-directive'

export interface NodeDecoratorComponents {
  JsxEditor: React.FC<JsxEditorProps>
  SandpackEditor: React.FC<SandpackEditorProps>
  CodeBlockEditor: React.FC<CodeBlockEditorProps>
  LeafDirectiveEditor: React.FC<LeafDirectiveEditorProps<LeafDirective>>
}

export type ExtendedEditorConfig = EditorConfig & {
  theme: EditorConfig['theme'] & {
    nodeDecoratorComponents: NodeDecoratorComponents
  }
}
