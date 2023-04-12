import { EditorConfig as LexicalEditorConfig, EditorThemeClasses as LexicalEditorThemeClasses } from 'lexical'

declare module 'lexical' {
  export type AdmonitionKind = 'note' | 'tip' | 'danger' | 'info' | 'caution'

  export type EditorThemeClasses = LexicalEditorThemeClasses & {
    admonition: {
      [key in AdmonitionKind]: string
    }
  }

  export type EditorConfig = LexicalEditorConfig & {
    theme: EditorThemeClasses
  }
}
