import { getRealmFactory, realmFactoryToComponent } from '../gurx'
import React, { PropsWithChildren } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { EditorSystem } from './Editor'
import { ViewModeSystem } from './ViewMode'
import { SandpackSystem } from './Sandpack'
import { LinkDialogSystem } from './LinkDialog'
import { JsxSystem } from './Jsx'
import { OnChangeSystem } from './OnChange'
import { NodeDecoratorsSystem } from './NodeDecorators'

export const {
  Component: EditorSystemComponent,
  usePublisher,
  useEmitterValues,
} = realmFactoryToComponent(
  getRealmFactory(EditorSystem, ViewModeSystem, SandpackSystem, LinkDialogSystem, JsxSystem, OnChangeSystem, NodeDecoratorsSystem),
  {
    required: {
      markdownSource: 'markdownSource',
      jsxComponentDescriptors: 'jsxComponentDescriptors',
      sandpackConfig: 'sandpackConfig',
      nodeDecorators: 'nodeDecorators',
    },
    events: {
      onChange: 'onChange',
    },
  },
  ({ children }: PropsWithChildren) => {
    return (
      <div>
        <CaptureLexicalEditor />
        {children}
      </div>
    )
  }
)

const CaptureLexicalEditor = () => {
  const setEditor = usePublisher('editor')
  const [lexicalEditor] = useLexicalComposerContext()
  React.useEffect(() => setEditor(lexicalEditor), [lexicalEditor, setEditor])
  return null
}

export * from './Editor'
export * from './Jsx'
export * from './LinkDialog'
export * from './Sandpack'
export * from './ViewMode'
