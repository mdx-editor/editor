import { LexicalEditor } from 'lexical'
import { realmPlugin, system } from '../../gurx'

export const coreSystem = system((r) => {
  const rootEditor = r.node<LexicalEditor | null>(null)
  const contentEditableClassName = r.node<string>('')

  return {
    contentEditableClassName,
    rootEditor
  }
}, [])

export const [corePlugin, corePluginHooks] = realmPlugin({
  systemSpec: coreSystem,

  applyParamsToSystem(realm, params: { contentEditableClassName: string }) {
    realm.pubKey('contentEditableClassName', params.contentEditableClassName)
  }
})
