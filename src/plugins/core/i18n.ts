import { useCellValue } from '@mdxeditor/gurx'
import { i18n$ } from './index'

export interface MDXEditorI18n {
  toolbar: {
    blockTypeSelect: {
      selectBlockTypeTooltip: string
      placeholder: string
    }

    blockTypes: {
      paragraph: string
      heading: string
      quote: string
    }

    undo: string
    redo: string

    bold: string
    removeBold: string
    italic: string
    removeItalic: string
    underline: string
    removeUnderline: string
    strikethrough: string
    removeStrikethrough: string
    inlineCode: string
    removeInlineCode: string

    bulletedList: string
    removeBulletedList: string
    numberedList: string
    removeNumberedList: string
    checkList: string
    removeCheckList: string

    link: string
    image: string
    table: string

    codeBlock: string
    sandpack: string
    admonition: string
    insertFrontmatter: string
    editFrontmatter: string
    thematicBreak: string

    richText: string
    diffMode: string
    source: string
    sourceMode: string
  }

  createLink: {
    url: string
    urlPlaceholder: string
    saveTooltip: string
    cancelTooltip: string
    title: string
  }

  uploadImage: {
    uploadInstructions: string
    addViaUrlInstructions: string
    alt: string
    title: string
    editImage: string
    autocompletePlaceholder: string
  }

  table: {
    insertRowAbove: string
    insertRowBelow: string
    deleteRow: string

    insertColumnLeft: string
    insertColumnRight: string
    deleteColumn: string

    textAlignment: string
    alignLeft: string
    alignCenter: string
    alignRight: string

    deleteTable: string
    columnMenu: string
    rowMenu: string
  }

  linkPreview: {
    open: string // If this string contains a "$url" placeholder, it will be replaced with the actual URL.
    edit: string
    copyToClipboard: string
    copied: string
    remove: string
  }

  codeBlock: {
    selectLanguage: string
    language: string
    text: string
  }

  sandpack: {
    deleteCodeBlock: string
  }

  editor: {
    placeholder: string
  }

  frontmatterEditor: {
    title: string
    key: string
    value: string
    addEntry: string
  }

  admonitions: {
    note: string
    tip: string
    danger: string
    info: string
    caution: string

    changeType: string
    placeholder: string
  }

  dialogControls: {
    save: string
    cancel: string
  }
}

/**
 * Take the complete i18n object and make all its properties optional, including all nested objects.
 * This allows for a partial i18n object to be passed into the editor without the need
 * to provide a translation for every single string.
 */
type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

export interface MDXEditorI18nPartial extends DeepPartial<MDXEditorI18n> {}

export const defaultEnglishI18n: MDXEditorI18n = {
  toolbar: {
    blockTypeSelect: {
      selectBlockTypeTooltip: 'Select block type',
      placeholder: 'Block type'
    },

    blockTypes: {
      paragraph: 'Paragraph',
      heading: 'Heading',
      quote: 'Quote'
    },

    undo: 'Undo',
    redo: 'Redo',

    bold: 'Bold',
    removeBold: 'Remove bold',
    italic: 'Italic',
    removeItalic: 'Remove italic',
    underline: 'Underline',
    removeUnderline: 'Remove underline',
    strikethrough: 'Strikethrough',
    removeStrikethrough: 'Remove strikethrough',
    inlineCode: 'Inline code format',
    removeInlineCode: 'Remove inline code format',

    bulletedList: 'Bulleted list',
    removeBulletedList: 'Remove bulleted list',
    numberedList: 'Numbered list',
    removeNumberedList: 'Remove numbered list',
    checkList: 'Check list',
    removeCheckList: 'Remove check list',

    link: 'Create link',
    image: 'Insert image',
    table: 'Insert table',

    codeBlock: 'Insert code block',
    sandpack: 'Insert Sandpack',
    admonition: 'Insert admonition',
    insertFrontmatter: 'Insert frontmatter',
    editFrontmatter: 'Edit frontmatter',

    thematicBreak: 'Insert thematic break',

    richText: 'Rich text',
    diffMode: 'Diff mode',
    source: 'Source',
    sourceMode: 'Source mode'
  },

  codeBlock: {
    selectLanguage: 'Select code block language',
    language: 'Code block language',
    text: 'text'
  },

  createLink: {
    url: 'URL',
    title: 'Title',
    urlPlaceholder: 'Enter URL',
    saveTooltip: 'Save',
    cancelTooltip: 'Cancel'
  },

  table: {
    insertRowAbove: 'Insert a row above this one',
    insertRowBelow: 'Insert a row below this one',
    deleteRow: 'Delete this row',

    insertColumnLeft: 'Insert a column to the left',
    insertColumnRight: 'Insert a column to the right',
    deleteColumn: 'Delete this column',

    textAlignment: 'Text alignment',
    alignLeft: 'Align left',
    alignCenter: 'Align center',
    alignRight: 'Align right',

    deleteTable: 'Delete table',
    columnMenu: 'Column menu',
    rowMenu: 'Row menu'
  },

  linkPreview: {
    open: 'Open $url in new tab',
    copyToClipboard: 'Copy to clipboard',
    copied: 'Copied!',
    edit: 'Edit link',
    remove: 'Remove link'
  },

  uploadImage: {
    uploadInstructions: 'Upload an image from your device',
    addViaUrlInstructions: 'Or add an image from an URL:',
    autocompletePlaceholder: 'Select or paste an image src',
    alt: 'Alt',
    title: 'Title',
    editImage: 'Edit image'
  },

  editor: {
    placeholder: 'Start typing your content here'
  },

  sandpack: {
    deleteCodeBlock: 'Delete this code block'
  },

  frontmatterEditor: {
    title: 'Edit document frontmatter',
    key: 'Key',
    value: 'Value',
    addEntry: 'Add entry'
  },

  admonitions: {
    note: 'Note',
    tip: 'Tip',
    danger: 'Danger',
    info: 'Info',
    caution: 'Caution',

    changeType: 'Select admonition type',
    placeholder: 'Admonition type'
  },

  dialogControls: {
    save: 'Save',
    cancel: 'Cancel'
  }
}

export function useI18n() {
  return useCellValue(i18n$)
}
