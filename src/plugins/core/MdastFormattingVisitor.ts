import * as Mdast from 'mdast'
import { MdxJsxTextElement } from 'mdast-util-mdx'
import { IS_BOLD, IS_CODE, IS_ITALIC, IS_UNDERLINE } from '../../FormatConstants'
import { MdastImportVisitor } from '../../importMarkdownToLexical'
import { $createTextNode } from 'lexical'

interface OpeningHTMLUnderlineNode extends Mdast.Html {
  type: 'html'
  value: '<u>'
}

interface ClosingHTMLUnderlineNode extends Mdast.Html {
  type: 'html'
  value: '</u>'
}

interface JsxUnderlineNode extends MdxJsxTextElement {
  type: 'mdxJsxTextElement'
  name: 'u'
}

interface JsxCodeNode extends MdxJsxTextElement {
  type: 'mdxJsxTextElement'
  name: 'code'
}

interface OpeningHTMLCodeNode extends Mdast.Html {
  type: 'html'
  value: '<code>'
}

interface ClosingHTMLCodeNode extends Mdast.Html {
  type: 'html'
  value: '</code>'
}

function isOpeningUnderlineNode(node: Mdast.Nodes): node is OpeningHTMLUnderlineNode {
  return node.type === 'html' && node.value === '<u>'
}

function isClosingUnderlineNode(node: Mdast.Nodes): node is ClosingHTMLUnderlineNode {
  return node.type === 'html' && node.value === '</u>'
}

function isJsxUnderlineNode(node: Mdast.Nodes): node is JsxUnderlineNode {
  return node.type === 'mdxJsxTextElement' && node.name === 'u'
}

function isJsxCodeNode(node: Mdast.Nodes): node is JsxCodeNode {
  return node.type === 'mdxJsxTextElement' && node.name === 'code'
}

function isOpeningCodeNode(node: Mdast.Nodes): node is OpeningHTMLCodeNode {
  return node.type === 'html' && node.value === '<code>'
}

function isClosingCodeNode(node: Mdast.Nodes): node is ClosingHTMLCodeNode {
  return node.type === 'html' && node.value === '</code>'
}

const JsxCodeVisitor: MdastImportVisitor<JsxCodeNode> = {
  testNode: isJsxCodeNode,
  visitNode({ mdastNode, actions, lexicalParent }) {
    actions.addFormatting(IS_CODE)
    actions.visitChildren(mdastNode, lexicalParent)
  }
}

const OpeningCodeVisitor: MdastImportVisitor<OpeningHTMLCodeNode> = {
  testNode: isOpeningCodeNode,
  visitNode({ actions, mdastParent }) {
    actions.addFormatting(IS_CODE, mdastParent)
  }
}

const ClosingCodeVisitor: MdastImportVisitor<ClosingHTMLCodeNode> = {
  testNode: isClosingCodeNode,
  visitNode({ actions, mdastParent }) {
    actions.removeFormatting(IS_CODE, mdastParent)
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

const JsxUnderlineVisitor: MdastImportVisitor<JsxUnderlineNode> = {
  testNode: isJsxUnderlineNode,
  visitNode({ mdastNode, actions, lexicalParent }) {
    actions.addFormatting(IS_UNDERLINE)
    actions.visitChildren(mdastNode, lexicalParent)
  }
}

const OpeningUnderlineVisitor: MdastImportVisitor<OpeningHTMLUnderlineNode> = {
  testNode: isOpeningUnderlineNode,
  visitNode({ actions, mdastParent }) {
    actions.addFormatting(IS_UNDERLINE, mdastParent)
  }
}

const ClosingUnderlineVisitor: MdastImportVisitor<ClosingHTMLUnderlineNode> = {
  testNode: isClosingUnderlineNode,
  visitNode({ actions, mdastParent }) {
    actions.removeFormatting(IS_UNDERLINE, mdastParent)
  }
}

export const formattingVisitors = [
  // emphasis
  MdEmphasisVisitor,

  // strong
  MdStrongVisitor,

  // underline
  JsxUnderlineVisitor,
  OpeningUnderlineVisitor,
  ClosingUnderlineVisitor,

  // code
  JsxCodeVisitor,
  OpeningCodeVisitor,
  ClosingCodeVisitor,
  MdCodeVisitor
]
