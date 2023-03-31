/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { createTheme, createThemeContract } from '@vanilla-extract/css'

interface ThemeVars {
  [key: string]: string | null | ThemeVars
}

function pathValue(object: ThemeVars, path: string) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return path.split('.').reduce((o, i) => o[i] as any, object)
}

function cloneAndReplaceValues(values: ThemeVars, callback: (value: string) => string | null) {
  return Object.keys(values).reduce((acc, key) => {
    const value = values[key]
    if (typeof value === 'string') {
      acc[key] = callback(value)
    } else {
      acc[key] = cloneAndReplaceValues(value!, callback)
    }
    return acc
  }, {} as ThemeVars)
}

export function createTokenizedTheme<T extends ThemeVars>(vars: T) {
  const varNames = createThemeContract(cloneAndReplaceValues(vars, () => null) as any)
  const theme = createTheme(
    varNames,
    cloneAndReplaceValues(vars, (value) => {
      if (value.startsWith('$')) {
        return pathValue(varNames, value.slice(1)) as unknown as string
      } else {
        return value
      }
    }) as any
  )

  return [theme, varNames] as unknown as [string, ReturnType<typeof createThemeContract<T>>]
}
