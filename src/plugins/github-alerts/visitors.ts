import { $createParagraphNode, type ElementNode } from 'lexical'
import type * as Mdast from 'mdast'
import { defaultHandlers, type Options } from 'mdast-util-to-markdown'
import type { MdastImportVisitor } from '../../importMarkdownToLexical'
import type { LexicalExportVisitor } from '../../exportMarkdownFromLexical'
import { $createGitHubAlertNode, $isGitHubAlertNode, type GitHubAlertNode, type GitHubAlertType } from './GitHubAlertNode'

function parseAlert(node: Mdast.Blockquote): { type: GitHubAlertType; children: Mdast.Blockquote['children'] } | null {
  const first = node.children.at(0)
  if (first?.type !== 'paragraph') return null
  const text = first.children.at(0)
  if (text?.type !== 'text' || !text.data?.githubAlertMarker) return null
  // A marker must occupy the entire first line. Do not consume unknown or inline markers.
  const match = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\r\n|[\r\n]|$)/.exec(text.value)
  if (!match) return null
  const remainingText = text.value.slice(match[0].length)
  const paragraphChildren = [
    ...(remainingText ? [{ ...text, value: remainingText }] : []),
    ...first.children
      .slice(1)
      .map((child, index) =>
        index === 0 && child.type === 'text' ? { ...child, value: child.value.replace(/^(?:\r\n|[\r\n])/, '') } : child
      )
      .filter((child) => child.type !== 'text' || child.value !== '')
  ]
  const children = [
    ...(paragraphChildren.length ? [{ ...first, children: paragraphChildren } as Mdast.Paragraph] : []),
    ...node.children.slice(1)
  ]
  return { type: match[1] as GitHubAlertType, children }
}

export const MdastGitHubAlertVisitor: MdastImportVisitor<Mdast.Blockquote> = {
  priority: 10,
  testNode: (node) => node.type === 'blockquote' && parseAlert(node) !== null,
  visitNode({ mdastNode, lexicalParent, actions }) {
    const alert = parseAlert(mdastNode)!
    const node = $createGitHubAlertNode(alert.type)
    ;(lexicalParent as ElementNode).append(node)
    actions.visitChildren({ ...mdastNode, children: alert.children }, node)
    if (node.isEmpty()) node.append($createParagraphNode())
  }
}

export const LexicalGitHubAlertVisitor: LexicalExportVisitor<GitHubAlertNode, Mdast.Blockquote> = {
  testLexicalNode: $isGitHubAlertNode,
  visitLexicalNode({ actions, lexicalNode }) {
    actions.addAndStepInto('blockquote', { data: { githubAlertType: lexicalNode.getAlertType() } })
  }
}

export const githubAlertsToMarkdown: Options = {
  handlers: {
    blockquote(node: Mdast.Blockquote, parent, state, info) {
      const body = defaultHandlers.blockquote(node, parent, state, info)
      const type = node.data?.githubAlertType
      return type ? `> [!${type}]${body ? `\n${body}` : ''}` : body
    }
  }
}
