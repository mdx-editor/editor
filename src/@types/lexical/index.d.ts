import 'lexical'

export type AdmonitionKind = 'note' | 'tip' | 'danger' | 'info' | 'caution'

declare module 'lexical' {
  export type AdmonitionKind = 'note' | 'tip' | 'danger' | 'info' | 'caution'

  export interface EditorThemeClasses {
    admonition?: Record<AdmonitionKind, string>
    text?: Record<string, string>
    list?: Record<string, string | Record<string, string>>
  }
}
