// Text node formatting
export const DEFAULT_FORMAT = 0 as const
export const IS_BOLD = 0b1 as const
export const IS_ITALIC = 0b10 as const
export const IS_STRIKETHROUGH = 0b100 as const
export const IS_UNDERLINE = 0b1000 as const
export const IS_CODE = 0b10000 as const
export const IS_SUBSCRIPT = 0b100000 as const
export const IS_SUPERSCRIPT = 0b1000000 as const
export const IS_HIGHLIGHT = 0b10000000 as const

export type FORMAT =
  | typeof DEFAULT_FORMAT
  | typeof IS_BOLD
  | typeof IS_ITALIC
  | typeof IS_STRIKETHROUGH
  | typeof IS_UNDERLINE
  | typeof IS_CODE
  | typeof IS_SUBSCRIPT
  | typeof IS_SUPERSCRIPT
  | typeof IS_HIGHLIGHT
