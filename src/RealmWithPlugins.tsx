import React from 'react'
import { Realm, RealmContext } from '@mdxeditor/gurx'
import { tap } from './utils/fp'

/**
 * A plugin for the editor.
 * @group Core
 */
export interface RealmPlugin {
  init?: (realm: Realm) => void
  update?: (realm: Realm) => void
}

/**
 * A function that creates an editor plugin.
 * @typeParam Params - The parameters for the plugin.
 * @group Core
 */
export function realmPlugin<Params>(plugin: {
  /**
   * Called when the MDXEditor component is mounted and the plugin is initialized.
   */
  init?: (realm: Realm, params?: Params) => void
  /**
   * Called on each re-render. Use this to update the realm with updated property values.
   */
  update?: (realm: Realm, params?: Params) => void
}): (params?: Params) => RealmPlugin {
  return function (params?: Params) {
    return {
      init: (realm: Realm) => plugin.init?.(realm, params),
      update: (realm: Realm) => plugin.update?.(realm, params)
    }
  }
}

/** @internal */
export function RealmWithPlugins({ children, plugins }: { children: React.ReactNode; plugins: RealmPlugin[] }) {
  const theRealm = React.useMemo(() => {
    return tap(new Realm(), (r) => {
      for (const plugin of plugins) {
        plugin.init?.(r)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  for (const plugin of plugins) {
    plugin.update?.(theRealm)
  }

  return <RealmContext.Provider value={theRealm}>{children}</RealmContext.Provider>
}
