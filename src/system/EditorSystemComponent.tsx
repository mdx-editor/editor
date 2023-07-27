import { getRealmFactory, realmFactoryToComponent } from '../gurx'
import React from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { EditorSystem } from './Editor'
import { ViewModeSystem } from './ViewMode'
import { LinkDialogSystem } from './LinkDialog'
import { ToolbarSystem } from './Toolbar'
import 'mdast-util-directive'

export const {
  Component: EditorSystemComponent,
  usePublisher,
  useEmitterValues
} = realmFactoryToComponent(
  getRealmFactory(EditorSystem, ViewModeSystem, LinkDialogSystem, ToolbarSystem),
  {
    required: {
      markdownSource: 'markdownSource',
      headMarkdown: 'headMarkdown'
    },
    optional: {
      toolbarComponents: 'toolbarComponents',
      markdownParseOptions: 'markdownParseOptions',
      lexicalConvertOptions: 'lexicalConvertOptions',
      lexicalNodes: 'lexicalNodes',
      imageUploadHandler: 'imageUploadHandler',
      editorRootElementRef: 'editorRootElementRef',
      viewMode: 'viewMode',
      linkAutocompleteSuggestions: 'linkAutocompleteSuggestions',
      imageAutocompleteSuggestions: 'imageAutocompleteSuggestions',
      customLeafDirectiveEditors: 'customLeafDirectiveEditors'
    }
  },
  ({ children }: React.PropsWithChildren) => {
    return (
      <div>
        <CaptureLexicalEditor />
        {children}
      </div>
    )
  }
)

const CaptureLexicalEditor: React.FC = () => {
  const setEditor = usePublisher('editor')
  const [lexicalEditor] = useLexicalComposerContext()
  React.useEffect(() => setEditor(lexicalEditor), [lexicalEditor, setEditor])
  return null
}
