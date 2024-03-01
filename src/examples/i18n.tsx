import { MDXEditorI18nPartial } from '@/@types/i18n/i18n'
import React from 'react'
import { MDXEditor } from '..'
import { ALL_PLUGINS } from './_boilerplate'
import kitchenSinkMarkdown from './assets/kitchen-sink.md?raw'
import './dark-editor.css'

const slovenianLocale = {
  toolbar: {
    blockTypeSelect: {
      selectBlockTypeTooltip: 'Izberi vrsto bloka',
      placeholder: 'Vrsta bloka'
    },

    blockTypes: {
      paragraph: 'Odstavek',
      heading: 'Naslov',
      quote: 'Citat'
    },

    undo: 'Razveljavi',
    redo: 'Ponovno uveljavi',

    bold: 'Krepko',
    removeBold: 'Odstrani krepko',
    italic: 'Poševno',
    removeItalic: 'Odstrani poševno',
    underline: 'Podčrtano',
    removeUnderline: 'Odstrani podčrtano',
    strikethrough: 'Prečrtano',
    removeStrikethrough: 'Odstrani prečrtano',

    inlineCode: 'Oblika v vrstici',

    bulletedList: 'Seznam s pikami',
    removeBulletedList: 'Odstrani seznam s pikami',
    numberedList: 'Oštevilčen seznam',
    removeNumberedList: 'Odstrani oštevilčen seznam',
    checkList: 'Seznam s kljukicami',
    removeCheckList: 'Odstrani seznam s kljukicami',

    link: 'Ustvari povezavo',
    image: 'Vstavi sliko',
    table: 'Vstavi tabelo',

    codeBlock: 'Vstavi blok kode',
    sandpack: 'Vstavi Sandpack',
    admonition: 'Vstavi opozorilo',
    frontmatter: 'Vstavi predmaterijo',
    thematicBreak: 'Vstavi tematski prelom',

    richText: 'Obogateni besedilni način',
    diffMode: 'Način razlike',
    source: 'Vir'
  },

  codeBlock: {
    language: 'Jezik bloka kode',
    text: 'besedilo'
  },

  createLink: {
    url: 'URL',
    title: 'Naslov'
  },

  uploadImage: {
    uploadInstructions: 'Naloži sliko iz svoje naprave',
    addViaUrlInstructions: 'Ali dodaj sliko prek URL-ja:',
    alt: 'Alternativno besedilo',
    title: 'Naslov'
  },

  editor: {
    placeholder: 'Začnite tipkati svojo vsebino tukaj'
  },

  admonitions: {
    note: 'Opomba',
    tip: 'Namig',
    danger: 'Nevarnost',
    info: 'Informacija',
    caution: 'Previdnost'
  },

  dialogControls: {
    save: 'Shrani',
    cancel: 'Prekliči'
  }
} as MDXEditorI18nPartial

export const EnglishLocale = () => {
  return <MDXEditor markdown={kitchenSinkMarkdown} plugins={ALL_PLUGINS} />
}

export const SlovenianLocale = () => {
  return <MDXEditor markdown={kitchenSinkMarkdown} plugins={ALL_PLUGINS} i18n={slovenianLocale} />
}
