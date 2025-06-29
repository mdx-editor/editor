import { Realm } from '@mdxeditor/gurx'
import React, { FC, PropsWithChildren, createContext, useCallback, useEffect, useMemo } from 'react'
import { realmPlugin } from '../../RealmWithPlugins'
import { addComposerChild$ } from '../core'

interface RemoteMDXEditorRealmContextValue {
  editorMap: Map<string, Realm>
  registerEditor: (id: string, realm: Realm) => void
}

const RemoteMDXEditorRealmContextValueStub: RemoteMDXEditorRealmContextValue = {
  editorMap: new Map<string, Realm>(),
  registerEditor: (_id: string, _realm: Realm) => void 0
}

const RemoteMDXEditorRealmContext = createContext(RemoteMDXEditorRealmContextValueStub)

/**
 * A context provider that allows you to register and access realms of remote MDX editors.
 * @group Utils
 */
export const RemoteMDXEditorRealmProvider: FC<PropsWithChildren> = ({ children }) => {
  const [editorMap, setEditorMap] = React.useState<Map<string, Realm>>(new Map())

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setEditorMap(new Map())
    }
  }, [])

  const registerEditor = useCallback((id: string, realm: Realm) => {
    setEditorMap((prev) => {
      return new Map(prev).set(id, realm)
    })
  }, [])

  const contextValue = useMemo(
    () => ({
      editorMap,
      registerEditor
    }),
    [editorMap, registerEditor]
  )

  return <RemoteMDXEditorRealmContext.Provider value={contextValue}>{children}</RemoteMDXEditorRealmContext.Provider>
}

const RemotePluginRegister: FC<{ realm: Realm; editorId: string }> = ({ realm, editorId }) => {
  const { registerEditor } = React.useContext(RemoteMDXEditorRealmContext)
  useEffect(() => {
    registerEditor(editorId, realm)
  }, [realm, editorId, registerEditor])
  return null
}

/**
 * A plugin that allows you to access the editor's realm outside of the editor's component tree.
 * Requires wrapping your application in the `RemoteMDXEditorRealmProvider` component.
 * @see {@link useRemoteMDXEditorRealm}.
 * @group Utils
 */
export const remoteRealmPlugin = realmPlugin<{
  /**
   * The id to access the realm with. See {@link useRemoteMDXEditorRealm}.
   */
  editorId: string
}>({
  init: (realm, params) => {
    if (params?.editorId) {
      realm.pub(addComposerChild$, () => <RemotePluginRegister realm={realm} editorId={params.editorId} />)
    }
  }
})

/**
 * A hook to access the realm of a remote MDX editor by its ID. You need to wrap your tree in the `RemoteMDXEditorRealmProvider` and add the {@link remoteRealmPlugin} to the editor's instance.
 * @param editorId - The id passed to the {@link remoteRealmPlugin} of the MDX editor instance.
 * @group Utils
 */
export function useRemoteMDXEditorRealm(editorId: string) {
  return React.useContext(RemoteMDXEditorRealmContext).editorMap.get(editorId)
}
