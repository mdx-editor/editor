import { getRealmFactory, realmFactoryToComponent } from '../gurx'
import React from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { EditorSystem } from './Editor'
import { ViewModeSystem } from './ViewMode'
import { SandpackSystem } from './Sandpack'
import { LinkDialogSystem } from './LinkDialog'
import { JsxSystem } from './Jsx'
import { OnChangeSystem } from './OnChange'
import { NodeDecoratorsSystem } from './NodeDecorators'
import { ToolbarSystem } from './Toolbar'

export const {
  Component: EditorSystemComponent,
  usePublisher,
  useEmitterValues,
} = realmFactoryToComponent(
  getRealmFactory(
    EditorSystem,
    ViewModeSystem,
    SandpackSystem,
    LinkDialogSystem,
    JsxSystem,
    OnChangeSystem,
    NodeDecoratorsSystem,
    ToolbarSystem
  ),
  {
    required: {
      markdownSource: 'markdownSource',
      headMarkdown: 'headMarkdown',
      jsxComponentDescriptors: 'jsxComponentDescriptors',
      sandpackConfig: 'sandpackConfig',
      nodeDecorators: 'nodeDecorators',
      toolbarComponents: 'toolbarComponents',
      markdownParseOptions: 'markdownParseOptions',
      lexicalConvertOptions: 'lexicalConvertOptions',
      lexicalNodes: 'lexicalNodes',
    },
    optional: {
      editorRootElementRef: 'editorRootElementRef',
      viewMode: 'viewMode',
      linkAutocompleteSuggestions: 'linkAutocompleteSuggestions',
    },
    events: {
      onChange: 'onChange',
    },
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
