import React from 'react'
import { MDXEditorCore } from '../MDXEditorCore'
import { toolbarPlugin } from '../plugins/toolbar/realmPlugin'
import { listsPlugin } from '../plugins/lists/realmPlugin'

export const Basics = () => {
  return <MDXEditorCore markdown="Hello, world!" plugins={[toolbarPlugin(), listsPlugin()]} />
}
