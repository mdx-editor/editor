import { MDXEditorI18n } from '@/@types/i18n/i18n'
import React, { createContext } from 'react'
import defaultEnglishI18n from './i18n'

interface I18nContextProps {
  children: React.ReactNode
  i18n?: MDXEditorI18n
}

interface I18nContext {
  i18n: MDXEditorI18n
}

const I18nContext = createContext<I18nContext | null>(null)

export default function I18nProvider({ children, i18n }: I18nContextProps) {
  // Takes the default english localizations and overlays any partial i18n supplied via props
  const finalI18n: MDXEditorI18n = {
    ...defaultEnglishI18n,
    ...(i18n ?? {})
  }

  return (
    <>
      <I18nContext.Provider value={{ i18n: finalI18n }}>{children}</I18nContext.Provider>
    </>
  )
}
