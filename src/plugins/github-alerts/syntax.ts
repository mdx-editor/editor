import type { Extension as SyntaxExtension, State, Tokenizer } from 'micromark-util-types'
import type { Extension as MdastExtension } from 'mdast-util-from-markdown'
import { markdownLineEnding } from 'micromark-util-character'
import { GITHUB_ALERT_TYPES, type GitHubAlertType } from './GitHubAlertNode'

declare module 'micromark-util-types' {
  interface TokenTypeMap {
    githubAlertMarker: 'githubAlertMarker'
  }
}

const tokenize: Tokenizer = function (effects, ok, nok) {
  let value = ''
  const start: State = (code) => {
    effects.enter('githubAlertMarker')
    return consume(code)
  }
  const consume: State = (code) => {
    if (code === null || markdownLineEnding(code)) return nok(code)
    value += String.fromCharCode(code)
    effects.consume(code)
    if (code === 93) return end
    if (value.length > 12) return nok(code)
    return consume
  }
  const end: State = (code) => {
    if (!GITHUB_ALERT_TYPES.some((type) => value === `[!${type}]`)) return nok(code)
    if (code !== null && !markdownLineEnding(code)) return nok(code)
    effects.exit('githubAlertMarker')
    return ok(code)
  }
  return start
}

export const githubAlertsSyntax: SyntaxExtension = { text: { 91: { name: 'githubAlertMarker', tokenize } } }
export const githubAlertsFromMarkdown: MdastExtension = {
  enter: {
    githubAlertMarker(token) {
      this.enter({ type: 'text', value: '', data: { githubAlertMarker: true } }, token)
    }
  },
  exit: {
    githubAlertMarker(token) {
      const node = this.stack[this.stack.length - 1]
      if (node.type === 'text') node.value = this.sliceSerialize(token)
      this.exit(token)
    }
  }
}

declare module 'mdast' {
  interface BlockquoteData {
    githubAlertType?: GitHubAlertType
  }
  interface TextData {
    githubAlertMarker?: boolean
  }
}
