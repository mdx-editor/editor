export const WHITESPACE_MARKER = '\u00A0'

const WHITESPACE_REGEX = /^\s+|\s+$/g
export function replaceWhitespace(str: string) {
  return str.replace(WHITESPACE_REGEX, (spaces) => WHITESPACE_MARKER.repeat(spaces.length))
}
