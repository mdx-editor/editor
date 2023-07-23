import * as Mdast from 'mdast'
import { $isSandpackNode, SandpackNode } from '../nodes'
import { LexicalExportVisitor } from './exportMarkdownFromLexical'

export const SandpackNodeVisitor: LexicalExportVisitor<SandpackNode, Mdast.Code> = {
  testLexicalNode: $isSandpackNode,
  visitLexicalNode: ({ lexicalNode, actions }) => {
    actions.addAndStepInto('code', {
      value: lexicalNode.getCode(),
      lang: lexicalNode.getLanguage(),
      meta: lexicalNode.getMeta()
    })
  }
}
