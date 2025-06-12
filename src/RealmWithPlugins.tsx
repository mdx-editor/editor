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
  postInit?: (realm: Realm) => void
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
   * Called after the MDXEditor component is mounted and all plugins are initialized.
   */
  postInit?: (realm: Realm, params?: Params) => void
  /**
   * Called on each re-render. Use this to update the realm with updated property values.
   */
  update?: (realm: Realm, params?: Params) => void
}): (params?: Params) => RealmPlugin {
  return function (params?: Params) {
    return {
      init: (realm: Realm) => plugin.init?.(realm, params),
      postInit: (realm: Realm) => plugin.postInit?.(realm, params),
      update: (realm: Realm) => plugin.update?.(realm, params)
    }
  }
}

/**
 * Provides a Realm instance and connects plugins to use it as well as run init, post init and
 * update hooks of plugins
 * @param children - The children to render within the realm context.
 * @param plugins - The plugins to use.
 * @param realm - An optional Realm instance to use. If not provided, a new Realm instance will be created.
 * @returns A React component that provides the realm context.
 * @group Core
 */
export function RealmWithPlugins({ children, plugins, realm }: { children: React.ReactNode; plugins: RealmPlugin[]; realm?: Realm }) {
  const theRealm = React.useMemo(() => {
    return tap(realm ?? new Realm(), (r) => {
      for (const plugin of plugins) {
        plugin.init?.(r)
      }
      for (const plugin of plugins) {
        plugin.postInit?.(r)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    for (const plugin of plugins) {
      plugin.update?.(theRealm)
    }
  })

  return <RealmContext.Provider value={theRealm}>{children}</RealmContext.Provider>
}
