import * as Mdast from 'mdast'
import { MdxJsxTextElement } from 'mdast-util-mdx'
import { FORMAT, IS_BOLD, IS_CODE, IS_ITALIC, IS_STRIKETHROUGH, IS_SUBSCRIPT, IS_SUPERSCRIPT, IS_UNDERLINE } from '../../FormatConstants'
import { MdastImportVisitor } from '../../importMarkdownToLexical'
import { $createTextNode } from 'lexical'

function buildFormattingVisitors(tag: string, format: FORMAT): MdastImportVisitor<Mdast.RootContent>[] {
  return [
    {
      testNode: (node) => node.type === 'mdxJsxTextElement' && node.name === tag,
      visitNode({ actions, mdastNode, lexicalParent }) {
        actions.addFormatting(format)
        actions.visitChildren(mdastNode as MdxJsxTextElement, lexicalParent)
      }
    },
    {
      testNode: (node: Mdast.Nodes) => node.type === 'html' && node.value === `<${tag}>`,
      visitNode({ actions, mdastParent }) {
        actions.addFormatting(format, mdastParent)
      }
    },
    {
      testNode: (node: Mdast.Nodes) => node.type === 'html' && node.value === `</${tag}>`,
      visitNode({ actions, mdastParent }) {
        actions.removeFormatting(format, mdastParent)
      }
    }
  ]
}

const StrikeThroughVisitor: MdastImportVisitor<Mdast.Delete> = {
  testNode: 'delete',
  visitNode({ mdastNode, actions, lexicalParent }) {
    actions.addFormatting(IS_STRIKETHROUGH)
    actions.visitChildren(mdastNode, lexicalParent)
  }
}

const MdCodeVisitor: MdastImportVisitor<Mdast.InlineCode> = {
  testNode: 'inlineCode',
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto($createTextNode(mdastNode.value).setFormat(actions.getParentFormatting() | IS_CODE))
  }
}

const MdEmphasisVisitor: MdastImportVisitor<Mdast.Emphasis> = {
  testNode: 'emphasis',
  visitNode({ mdastNode, actions, lexicalParent }) {
    actions.addFormatting(IS_ITALIC)
    actions.visitChildren(mdastNode, lexicalParent)
  }
}

const MdStrongVisitor: MdastImportVisitor<Mdast.Strong> = {
  testNode: 'strong',
  visitNode({ mdastNode, actions, lexicalParent }) {
    actions.addFormatting(IS_BOLD)
    actions.visitChildren(mdastNode, lexicalParent)
  }
}

export const formattingVisitors = [
  // emphasis
  MdEmphasisVisitor,

  // strong
  MdStrongVisitor,

  // underline
  ...buildFormattingVisitors('u', IS_UNDERLINE),

  // code
  ...buildFormattingVisitors('code', IS_CODE),
  MdCodeVisitor,

  // strikethrough
  StrikeThroughVisitor,

  // superscript
  ...buildFormattingVisitors('sup', IS_SUPERSCRIPT),
  // subscript
  ...buildFormattingVisitors('sub', IS_SUBSCRIPT)
]
