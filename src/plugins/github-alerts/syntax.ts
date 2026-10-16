import type { Extension as MdastExtension } from 'mdast-util-from-markdown'
import type { GitHubAlertType } from './GitHubAlertNode'

// Inspect a completed block quote instead of consuming inline bracket syntax.
// Otherwise a marker-like reference link can lose its destination.
export const githubAlertsFromMarkdown: MdastExtension = {
  exit: {
    blockQuote(token) {
      const node = this.stack[this.stack.length - 1]
      if (node.type === 'blockquote') {
        const paragraph = node.children.at(0)
        // Check the original spelling so escapes and character references remain literal.
        const marker = /^>[ \t]*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\r\n|[\r\n]|$)/.exec(this.sliceSerialize(token))
        if (paragraph?.type === 'paragraph' && marker) {
          const first = paragraph.children.at(0)
          if (first?.type === 'text') {
            first.data = { ...first.data, githubAlertMarker: true }
          } else if (first?.type === 'linkReference' && first.referenceType === 'shortcut') {
            // A definition elsewhere must not turn a real first-line alert marker into a link.
            paragraph.children[0] = {
              type: 'text',
              value: `[!${marker[1]}]`,
              data: { githubAlertMarker: true },
              position: first.position
            }
          }
        }
      }
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
