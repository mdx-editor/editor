import React from 'react'
import {
  BoldItalicUnderlineToggles,
  ChangeCodeMirrorLanguage,
  ConditionalContents,
  DiffSourceToggleWrapper,
  MDXEditor,
  MdastImportVisitor,
  UndoRedo,
  addImportVisitor$,
  diffSourcePlugin,
  realmPlugin,
  toolbarPlugin
} from '../'
import markdown from './assets/buggy-markdown.md?raw'
import { ALL_PLUGINS } from './_boilerplate'
import * as Mdast from 'mdast'
import { $createParagraphNode } from 'lexical'

export function BuggyMarkdown() {
  return (
    <MDXEditor
      onError={(msg) => {
        console.warn(msg)
      }}
      markdown={markdown}
      onChange={(md) => {
        console.log('change', { md })
      }}
      plugins={ALL_PLUGINS}
    />
  )
}

export function MissingPlugins() {
  return (
    <MDXEditor
      onError={(msg) => {
        console.warn(msg)
      }}
      markdown={`# Hello`}
      onChange={(md) => {
        console.log('change', { md })
      }}
      plugins={[
        toolbarPlugin({
          toolbarContents: () => (
            <DiffSourceToggleWrapper>
              <ConditionalContents
                options={[
                  { when: (editor) => editor?.editorType === 'codeblock', contents: () => <ChangeCodeMirrorLanguage /> },
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

const CatchAllVisitor: MdastImportVisitor<Mdast.Nodes> = {
  testNode: () => true,
  visitNode: ({ mdastNode, actions }) => {
    console.warn('catch all', { mdastNode })
    actions.addAndStepInto($createParagraphNode())
  },
  priority: -500
}

const catchAllPlugin = realmPlugin({
  init(realm) {
    realm.pub(addImportVisitor$, CatchAllVisitor)
  }
})

export function CatchAllPlugin() {
  return (
    <MDXEditor
      onError={(msg) => {
        console.warn(msg)
      }}
      markdown={`# Hello`}
      onChange={(md) => {
        console.log('change', { md })
      }}
      plugins={[
        catchAllPlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <DiffSourceToggleWrapper>
              <ConditionalContents
                options={[
                  { when: (editor) => editor?.editorType === 'codeblock', contents: () => <ChangeCodeMirrorLanguage /> },
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
