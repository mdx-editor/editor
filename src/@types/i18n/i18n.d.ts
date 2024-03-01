type BaseMDXEditorI18n = {
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
  }

  linkPreview: {
    // If this string contains a "$url" placeholder, it will be replaced with the actual URL.
    open: string
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

export type MDXEditorI18n = BaseMDXEditorI18n

/**
 * Take the complete i18n object and make all its properties optional, including all nested objects.
 * This allows for partial i18n objects to be passed to the I18nProvider, without the need
 * to provide a translation for every single string.
 */
type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

export type MDXEditorI18nPartial = DeepPartial<BaseMDXEditorI18n>
