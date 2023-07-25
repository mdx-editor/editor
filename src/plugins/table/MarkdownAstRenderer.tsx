import React from 'react'
import { toHast } from 'mdast-util-to-hast'
import { raw } from 'hast-util-raw'
import { sanitize } from 'hast-util-sanitize'
import { toHtml } from 'hast-util-to-html'
import { PhrasingContent, Root } from 'mdast'

export const MarkdownAstRenderer = (props: { mdastChildren: PhrasingContent[] }) => {
  const root = { type: 'root', children: props.mdastChildren } as Root
  const hast = raw(toHast(root, { allowDangerousHtml: true })!)
  const safeHast = sanitize(hast)
  const html = toHtml(safeHast)
  return <span dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }} />
}
