/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CODE, ElementTransformer, Transformer, TRANSFORMERS } from '@lexical/markdown'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import React from 'react'
import { $createCodeBlockNode } from '../nodes'

// insert CM code block type rather than the default one
// TODO: this modifies the original array
function patchMarkdownTransformers(transformers: Transformer[]) {
  const codeTransformer = transformers.find((t) => t === CODE) as ElementTransformer

  codeTransformer.replace = (parentNode, _children, match) => {
    const codeBlockNode = $createCodeBlockNode({ code: '', language: match ? match[1] : '', meta: '' })
    parentNode.replace(codeBlockNode)
    setTimeout(() => codeBlockNode.select(), 80)
  }

  return transformers
}
export const PatchedMarkdownShortcutPlugin: React.FC = () => {
  return <MarkdownShortcutPlugin transformers={patchMarkdownTransformers(TRANSFORMERS)} />
}
