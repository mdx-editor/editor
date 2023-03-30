import { getRealmFactory, realmFactoryToComponent } from '../gurx'
import React, { PropsWithChildren } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { EditorSystem } from './Editor'
import { ViewModeSystem } from './ViewMode'
import { SandpackSystem } from './Sandpack'
import { LinkDialogSystem } from './LinkDialog'

export const {
  Component: EditorSystemComponent,
  usePublisher,
  useEmitterValues,
} = realmFactoryToComponent(
  getRealmFactory(EditorSystem, ViewModeSystem, SandpackSystem, LinkDialogSystem),
  {
    required: {
      markdownSource: 'markdownSource',
      availableJsxImports: 'availableJsxImports',
      sandpackConfig: 'sandpackConfig',
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
