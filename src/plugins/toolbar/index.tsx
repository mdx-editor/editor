import React from 'react'
import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core'
import { Root } from './primitives/toolbar'

/** @internal */
export const toolbarSystem = system(
  (r) => {
    const toolbarContents = r.node<() => React.ReactNode>(() => null)
    return {
      toolbarContents
    }
  },
  [coreSystem]
)

const DEFAULT_TOOLBAR_CONTENTS = () => {
  return 'This is an empty toolbar. Pass `{toolbarContents: () => { return <>toolbar components</> }}` to the toolbarPlugin to customize it.'
}

export const [
  /** @internal */
  toolbarPlugin,
  /** @internal */
  toolbarPluginHooks
] = realmPlugin({
  id: 'toolbar',
  systemSpec: toolbarSystem,

  init: (realm, params: { toolbarContents: () => React.ReactNode }) => {
    realm.pubKey('toolbarContents', params?.toolbarContents ?? DEFAULT_TOOLBAR_CONTENTS)
    realm.pubKey('addTopAreaChild', ToolbarWrapper)
  }
})

const ToolbarWrapper = () => {
  const [toolbarContents] = toolbarPluginHooks.useEmitterValues('toolbarContents')
  return <Root>{toolbarContents()}</Root>
}
