import { EditorThemeClasses } from 'lexical'

export const theme: EditorThemeClasses = {
  text: {
    bold: 'bold',
    code: 'code',
    italic: 'italic',
    strikethrough: 'strikethrough',
    subscript: 'subscript',
    superscript: 'superscript',
    underline: 'underline',
    underlineStrikethrough: 'underlineStrikethrough',
  },

  list: {
    nested: {
      listitem: 'nestedListItem',
    },
  },

  admonition: {
    danger: 'danger',
    info: 'info',
    note: 'note',
    tip: 'tip',
    caution: 'caution',
  },
}
