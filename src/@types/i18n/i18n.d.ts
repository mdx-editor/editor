type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

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
    italic: string
    underline: string
    strikethrough: string
    inlineCode: string

    bulletedList: string
    numberedList: string
    checkList: string

    link: string
    image: string
    table: string

    codeBlock: string
    sandpack: string
    admonition: string
    frontmatter: string
    thematicBreak: string

    richText: string
    diffMode: string
    source: string
  }

  createLink: {
    url: string
    title: string
  }

  uploadImage: {
    uploadInstructions: string
    addViaUrlInstructions: string
    alt: string
    title: string
  }

  codeBlock: {
    language: string
    text: string
  }

  editor: {
    placeholder: string
  }

  admonitions: {
    note: string
    tip: string
    danger: string
    info: string
    caution: string
  }

  dialogControls: {
    save: string
    cancel: string
  }
}

export type MDXEditorI18nPartial = DeepPartial<BaseMDXEditorI18n>
export type MDXEditorI18n = BaseMDXEditorI18n
