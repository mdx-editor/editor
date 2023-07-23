import { $createTextNode } from 'lexical'
import * as Mdast from 'mdast'
import { IS_CODE } from '../FormatConstants'
import { MdastImportVisitor } from './importMarkdownToLexical'

export const MdastInlineCodeVisitor: MdastImportVisitor<Mdast.InlineCode> = {
  testNode: 'inlineCode',
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto($createTextNode(mdastNode.value).setFormat(IS_CODE))
  }
}
