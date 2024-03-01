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
      quote: 'Citat',
      heading: 'Naslov'
    },
    undo: 'Razveljavi',
    redo: 'Uveljavi',

    bold: 'Krepko',
    italic: 'Ležeče',
    underline: 'Podčrtano',
    strikethrough: 'Prečrtano',

    bulletedList: 'Označen seznam',
    numberedList: 'Oštevilčen seznam',
    checkList: 'Seznam s kljukicami',

    link: 'Povezava',
    image: 'Slika',
    table: 'Tabela',

    codeBlock: 'Koda',
    admonition: 'Opozorilo',
    frontmatter: 'Meta podatki',
    thematicBreak: 'Tematski prelom',

    richText: 'Obogaten tekst',
    diffMode: 'Način razlik',
    source: 'Izvorna koda'
  },

  createLink: {
    url: 'URL',
    title: 'Naslov'
  },

  uploadImage: {
    uploadInstructions: 'Povleci datoteke sem ali klikni za nalaganje',
    addViaUrlInstructions: 'Dodaj preko URL',
    alt: 'Alternativno besedilo',
    title: 'Naslov'
  },

  codeBlock: {
    language: 'Jezik',
    text: 'Koda'
  },

  editor: {
    placeholder: 'Začni tipkati ...'
  }
} as MDXEditorI18nPartial

export const EnglishLocale = () => {
  return <MDXEditor markdown={kitchenSinkMarkdown} plugins={ALL_PLUGINS} />
}

export const SlovenianLocale = () => {
  return <MDXEditor markdown={kitchenSinkMarkdown} plugins={ALL_PLUGINS} i18n={slovenianLocale} />
}
