import { MDXEditorI18n } from '@/@types/i18n/i18n'

const defaultEnglishI18n: MDXEditorI18n = {
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
    source: 'Source'
  },

  codeBlock: {
    selectLanguage: 'Select code block language',
    language: 'Code block language',
    text: 'text'
  },

  createLink: {
    url: 'URL',
    title: 'Title'
  },

  uploadImage: {
    uploadInstructions: 'Upload an image from your device',
    addViaUrlInstructions: 'Or add an image from an URL:',
    alt: 'Alt',
    title: 'Title',
    editImage: 'Edit image'
  },

  editor: {
    placeholder: 'Start typing your content here'
  },

  sandpack: {
    deleteCodeBlock: 'Delete this code block',
  }

  admonitions: {
    note: 'Note',
    tip: 'Tip',
    danger: 'Danger',
    info: 'Info',
    caution: 'Caution'
  },

  dialogControls: {
    save: 'Save',
    cancel: 'Cancel'
  }
}

export default defaultEnglishI18n
