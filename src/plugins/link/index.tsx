import React from 'react'
import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core'
import { MdastLinkVisitor } from './MdastLinkVisitor'
import { LexicalLinkVisitor } from './LexicalLinkVisitor'
import { AutoLinkNode, LinkNode } from '@lexical/link'
import { LinkPlugin as LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { LexicalAutoLinkPlugin } from './AutoLinkPlugin'

const linkSystem = system(
  (r) => {
    const disableAutoLink = r.node<boolean>(false)

    return { disableAutoLink }
  },
  [coreSystem]
)

/**
 * The parameters used to configure the link plugin
 */
interface LinkPluginParams {
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
}

/**
 * @internal
 */
export const [linkPlugin] = realmPlugin({
  id: 'link',
  systemSpec: linkSystem,

  init: (realm, params?: LinkPluginParams) => {
    const disableAutoLink = Boolean(params?.disableAutoLink)
    realm.pubKey('addImportVisitor', MdastLinkVisitor)
    realm.pubKey('addLexicalNode', LinkNode)
    realm.pubKey('addLexicalNode', AutoLinkNode)
    realm.pubKey('addExportVisitor', LexicalLinkVisitor)
    realm.pubKey('disableAutoLink', disableAutoLink)
    const linkPluginProps = params?.validateUrl ? { validateUrl: params.validateUrl } : {}
    realm.pubKey('addComposerChild', () => (
      <>
        <LexicalLinkPlugin {...linkPluginProps} />
        {disableAutoLink ? null : <LexicalAutoLinkPlugin />}
      </>
    ))
  }
})
