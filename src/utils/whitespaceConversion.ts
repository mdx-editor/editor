export const WHITESPACE_MARKER = '\u00A0'

export function replaceWhitespace(str: string) {
  // Replace whitespace at the beginning of the string
  while (str.charAt(0) === ' ') {
    str = WHITESPACE_MARKER + str.slice(1)
  }

  // Replace whitespace at the end of the string
  while (str.charAt(str.length - 1) === ' ') {
    str = str.slice(0, -1) + WHITESPACE_MARKER
  }

  return str
}
