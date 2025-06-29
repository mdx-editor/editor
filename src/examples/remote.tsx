import React from 'react'
import { MDXEditor, MDXEditorMethods, RemoteMDXEditorRealmProvider, remoteRealmPlugin, useRemoteMDXEditorRealm } from '../'

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
