import React from 'react'
import { MDXEditorCore } from '../MDXEditorCore'
import { toolbarPlugin } from '../plugins/toolbar/realmPlugin'
import { listsPlugin } from '../plugins/lists/realmPlugin'
import { quotePlugin } from '../plugins/quote/realmPlugin'
import { headingsPlugin } from '../plugins/headings/realmPlugin'
import { linkPlugin } from '../plugins/link/realmPlugin'
import { linkDialogPlugin } from '../plugins/link-dialog/realmPlugin'
import { imagePlugin } from '../plugins/image/realmPlugin'

export const Basics = () => {
  return (
    <MDXEditorCore
      markdown="Hello, world!"
      plugins={[toolbarPlugin(), listsPlugin(), quotePlugin(), headingsPlugin(), linkPlugin(), linkDialogPlugin(), imagePlugin()]}
    />
  )
}
