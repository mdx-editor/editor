import 'lexical'
import { EditorConfig as LexicalEditorConfig, EditorThemeClasses as LexicalEditorThemeClasses } from 'lexical'

declare module 'lexical' {
  export type AdmonitionKind = 'note' | 'tip' | 'danger' | 'info' | 'caution'

  type EditorThemeClasses = LexicalEditorThemeClasses & {
    admonition: {
      [key in AdmonitionKind]: string
    }
    someMore: string
  }

  declare type EditorConfig = LexicalEditorConfig & {
    theme: EditorThemeClasses
  }
}
