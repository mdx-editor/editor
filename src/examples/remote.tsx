import React, { FC, PropsWithChildren, createContext, useCallback, useEffect, useMemo } from 'react'
import { MDXEditor, MDXEditorMethods, Realm, addComposerChild$, realmPlugin } from '../'

interface RemoteMDXEditorRealmContextValue {
  editorMap: Map<string, Realm>
  registerEditor: (id: string, realm: Realm) => void
}

const RemoteMDXEditorRealmContextValueStub: RemoteMDXEditorRealmContextValue = {
  editorMap: new Map<string, Realm>(),
  registerEditor: (_id: string, _realm: Realm) => void 0
}

const RemoteMDXEditorRealmContext = createContext(RemoteMDXEditorRealmContextValueStub)

const RemoteMDXEditorRealmProvider: FC<PropsWithChildren> = ({ children }) => {
  const [editorMap, setEditorMap] = React.useState<Map<string, Realm>>(new Map())

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

const remoteRealmPlugin = realmPlugin<{ editorId: string }>({
  init: (realm, params) => {
    if (params?.editorId) {
      realm.pub(addComposerChild$, () => <RemotePluginRegister realm={realm} editorId={params.editorId} />)
    }
  }
})

function useRemoteMDXEditorRealm(editorId: string) {
  return React.useContext(RemoteMDXEditorRealmContext).editorMap.get(editorId)
}

const ExampleRemoteRealmAccessor = () => {
  const remoteRealm = useRemoteMDXEditorRealm('example-editor-id')
  console.log('Remote realm for example editor:', remoteRealm)
  return null
}

export function Example() {
  const ref = React.useRef<MDXEditorMethods>(null)
  return (
    <RemoteMDXEditorRealmProvider>
      <ExampleRemoteRealmAccessor />
      <MDXEditor
        plugins={[remoteRealmPlugin({ editorId: 'example-editor-id' })]}
        autoFocus={true}
        ref={ref}
        markdown={'Hello world'}
        onChange={console.log}
      />
    </RemoteMDXEditorRealmProvider>
  )
}
