import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core'
import { Toolbar } from './Toolbar'

export const toolbarSystem = system((_) => ({}), [coreSystem])

export const [toolbarPlugin, toolbarPluginHooks] = realmPlugin({
  systemSpec: toolbarSystem,

  init: (realm) => {
    realm.pubKey('addTopAreaChild', Toolbar)
  }
})
