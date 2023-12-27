import React from 'react'
import { MdastLinkVisitor } from './MdastLinkVisitor'
import { LexicalLinkVisitor } from './LexicalLinkVisitor'
import { AutoLinkNode, LinkNode } from '@lexical/link'
import { LinkPlugin as LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin.js'
import { LexicalAutoLinkPlugin } from './AutoLinkPlugin'
import { Cell } from '@mdxeditor/gurx'
import { realmPlugin } from '../../RealmWithPlugins'
import { addImportVisitor$, addLexicalNode$, addExportVisitor$, addComposerChild$, addActivePlugin$ } from '../core'

/**
 * Holds whether the auto-linking of URLs and email addresses is disabled.
 * @group Links
 */
export const disableAutoLink$ = Cell(false)

/**
 * A plugin that adds support for links in the editor.
 * @group Links
 */
export const linkPlugin = realmPlugin<{
  /**
   * An optional function to validate the URL of a link.
   * By default, no validation is performed.
   */
  validateUrl?: React.ComponentProps<typeof LexicalLinkPlugin>['validateUrl']
  /**
   * Whether to disable the auto-linking of URLs and email addresses.
   * @default false
   */
  disableAutoLink?: boolean
}>({
  init(realm, params) {
    const disableAutoLink = Boolean(params?.disableAutoLink)
    const linkPluginProps = params?.validateUrl ? { validateUrl: params.validateUrl } : {}
    realm.pubIn({
      [addActivePlugin$]: 'link',
      [addImportVisitor$]: MdastLinkVisitor,
      [addLexicalNode$]: [LinkNode, AutoLinkNode],
      [addExportVisitor$]: LexicalLinkVisitor,
      [disableAutoLink$]: disableAutoLink,
      [addComposerChild$]: () => (
        <>
          <LexicalLinkPlugin {...linkPluginProps} />
          {disableAutoLink ? null : <LexicalAutoLinkPlugin />}
        </>
      )
    })
  }
})
