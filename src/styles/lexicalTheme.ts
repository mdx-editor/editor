import { EditorThemeClasses } from 'lexical'
import styles from './lexical-theme.module.css'

export const lexicalTheme: EditorThemeClasses = {
  text: {
    bold: styles.bold,
    italic: styles.italic,
    underline: styles.underline,
    code: styles.code,
    strikethrough: styles.strikethrough,
    subscript: styles.subscript,
    superscript: styles.superscript,
    underlineStrikethrough: styles.underlineStrikethrough
  },

  list: {
    listitem: styles.listitem,
    listitemChecked: styles.listItemChecked,
    listitemUnchecked: styles.listItemUnchecked,
    nested: {
      listitem: styles.nestedListItem
    }
  },

  admonition: {
    danger: styles.admonitionDanger,
    info: styles.admonitionInfo,
    note: styles.admonitionNote,
    tip: styles.admonitionTip,
    caution: styles.admonitionCaution
  }
}
