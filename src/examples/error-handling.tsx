import React from 'react'
import {
  BoldItalicUnderlineToggles,
  ChangeCodeMirrorLanguage,
  ConditionalContents,
  DiffSourceToggleWrapper,
  MDXEditor,
  ShowSandpackInfo,
  UndoRedo,
  diffSourcePlugin,
  toolbarPlugin
} from '../'
import markdown from './assets/buggy-markdown.md?raw'
import { ALL_PLUGINS } from './_boilerplate'

export function BuggyMarkdown() {
  return (
    <MDXEditor
      onError={(msg) => console.warn(msg)}
      markdown={markdown}
      onChange={(md) => console.log('change', { md })}
      plugins={ALL_PLUGINS}
    />
  )
}

export function MissingPlugins() {
  return (
    <MDXEditor
      onError={(msg) => console.warn(msg)}
      markdown={`# Hello`}
      onChange={(md) => console.log('change', { md })}
      plugins={[
        toolbarPlugin({
          toolbarContents: () => (
            <DiffSourceToggleWrapper>
              <ConditionalContents
                options={[
                  { when: (editor) => editor?.editorType === 'codeblock', contents: () => <ChangeCodeMirrorLanguage /> },
                  { when: (editor) => editor?.editorType === 'sandpack', contents: () => <ShowSandpackInfo /> },
                  {
                    fallback: () => (
                      <>
                        <UndoRedo />
                        <BoldItalicUnderlineToggles />
                      </>
                    )
                  }
                ]}
              />
            </DiffSourceToggleWrapper>
          )
        }),
        diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: 'boo' })
      ]}
    />
  )
}
