import { AdmonitionKind } from 'lexical'
import React from 'react'
import { EditorInFocus } from '../../core'
import type { DirectiveNode } from '../../directives/DirectiveNode'
import { ConditionalContents, Separator } from '../primitives/toolbar'
import { BlockTypeSelect } from './BlockTypeSelect'
import { BoldItalicUnderlineToggles } from './BoldItalicUnderlineToggles'
import { ChangeAdmonitionType } from './ChangeAdmonitionType'
import { ChangeCodeMirrorLanguage } from './ChangeCodeMirrorLanguage'
import { CodeToggle } from './CodeToggle'
import { DiffSourceToggleWrapper } from './DiffSourceToggleWrapper'
import { InsertAdmonition } from './InsertAdmonition'
import { InsertCodeBlock } from './InsertCodeBlock'
import { InsertFrontmatter } from './InsertFrontmatter'
import { InsertImage } from './InsertImage'
import { InsertSandpack } from './InsertSandpack'
import { InsertTable } from './InsertTable'
import { InsertThematicBreak } from './InsertThematicBreak'
import { ListsToggle } from './ListsToggle'
import { ShowSandpackInfo } from './ShowSandpackInfo'
import { UndoRedo } from './UndoRedo'
import { CreateLink } from './CreateLink'

function whenInAdmonition(editorInFocus: EditorInFocus | null) {
  const node = editorInFocus?.rootNode
  if (!node || node.getType() !== 'directive') {
    return false
  }

  return ['note', 'tip', 'danger', 'info', 'caution'].includes((node as DirectiveNode).getMdastNode().name as AdmonitionKind)
}

export const KitchenSinkToolbar: React.FC = () => {
  return (
    <DiffSourceToggleWrapper>
      <ConditionalContents
        options={[
          { when: (editor) => editor?.editorType === 'codeblock', contents: () => <ChangeCodeMirrorLanguage /> },
          { when: (editor) => editor?.editorType === 'sandpack', contents: () => <ShowSandpackInfo /> },
          {
            fallback: () => (
              <>
                <UndoRedo />
                <Separator />
                <BoldItalicUnderlineToggles />
                <CodeToggle />
                <Separator />
                <ListsToggle />
                <Separator />

                <ConditionalContents
                  options={[{ when: whenInAdmonition, contents: () => <ChangeAdmonitionType /> }, { fallback: () => <BlockTypeSelect /> }]}
                />

                <Separator />

                <CreateLink />
                <InsertImage />

                <Separator />

                <InsertTable />
                <InsertThematicBreak />

                <Separator />
                <InsertCodeBlock />
                <InsertSandpack />

                <ConditionalContents
                  options={[
                    {
                      when: (editorInFocus) => !whenInAdmonition(editorInFocus),
                      contents: () => (
                        <>
                          <Separator />
                          <InsertAdmonition />
                        </>
                      )
                    }
                  ]}
                />

                <Separator />
                <InsertFrontmatter />
              </>
            )
          }
        ]}
      />
    </DiffSourceToggleWrapper>
  )
}
