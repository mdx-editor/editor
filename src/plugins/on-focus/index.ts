import { Realm } from '@mdxeditor/gurx'
import { realmPlugin } from '@/RealmWithPlugins'
import { inFocus$ } from '@/plugins/core'

export const onFocusPlugin = realmPlugin<{
  action: (realm: Realm) => void
  once?: boolean
}>({
  init: (realm, params) => {
    const unsubscribe = realm.sub(inFocus$, (isFocused) => {
      if (!isFocused) return
      params?.action(realm)
      if (params?.once) {
        unsubscribe()
      }
    })
  }
})
