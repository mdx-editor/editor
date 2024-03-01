import { MDXEditorI18n, MDXEditorI18nPartial } from '@/@types/i18n/i18n'
import React, { createContext } from 'react'
import defaultEnglishI18n from './i18n'

interface I18nContextProps {
  children: React.ReactNode
  i18n?: MDXEditorI18nPartial
}

interface I18nContext {
  i18n: MDXEditorI18n
}

const I18nContext = createContext<I18nContext | null>(null)

// TODO: Document how to use the hook in custom plugins
// Will it even work at this point?

export function I18nProvider({ children, i18n }: I18nContextProps) {
  // Takes the default english localizations and overlays any partial i18n supplied via props
  const finalI18n = {
    ...defaultEnglishI18n,
    ...i18n
  } as MDXEditorI18n

  return <I18nContext.Provider value={{ i18n: finalI18n }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = React.useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context.i18n
}
