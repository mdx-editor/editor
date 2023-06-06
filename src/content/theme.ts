import { EditorThemeClasses } from 'lexical'
import styles from './theme.module.css'

export const theme: EditorThemeClasses = {
  text: {
    bold: styles.bold,
    italic: styles.italic,
    underline: styles.underline,
    code: styles.code,
    strikethrough: styles.strikethrough,
    subscript: styles.subscript,
    superscript: styles.superscript,
    underlineStrikethrough: styles.underlineStrikethrough,
  },

  list: {
    nested: {
      listitem: styles.nestedListItem,
    },
  },

  admonition: {
    danger: styles.admonitionDanger,
    info: styles.admonitionInfo,
    note: styles.admonitionNote,
    tip: styles.admonitionTip,
    caution: styles.admonitionCaution,
  },
}
