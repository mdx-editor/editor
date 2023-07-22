import { EditorConfig } from 'lexical'
import {
  FrontmatterEditorProps,
  JsxEditorProps,
  SandpackEditorProps,
  CodeBlockEditorProps,
  TableEditorProps,
  ImageEditorProps,
  LeafDirectiveEditorProps
} from './NodeDecoratorsProps'
import { LeafDirective } from 'mdast-util-directive'

export interface NodeDecoratorComponents {
  FrontmatterEditor: React.FC<FrontmatterEditorProps>
  JsxEditor: React.FC<JsxEditorProps>
  SandpackEditor: React.FC<SandpackEditorProps>
  CodeBlockEditor: React.FC<CodeBlockEditorProps>
  TableEditor: React.FC<TableEditorProps>
  ImageEditor: React.FC<ImageEditorProps>
  LeafDirectiveEditor: React.FC<LeafDirectiveEditorProps<LeafDirective>>
}

export type ExtendedEditorConfig = EditorConfig & {
  theme: EditorConfig['theme'] & {
    nodeDecoratorComponents: NodeDecoratorComponents
  }
}
