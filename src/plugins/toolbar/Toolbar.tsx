import React from 'react'
import { ConditionalContents, Root, Separator } from './primitives/toolbar'
import { BoldItalicUnderlineToggles } from './BoldItalicUnderlineToggles'
import { CodeToggle } from './CodeToggle'
import { ListsToggle } from './ListsToggle'
import { BlockTypeSelect } from './BlockTypeSelect'
import { Createlink } from './CreateLink'
import { InsertImage } from './InsertImage'
import { InsertTable } from './InsertTable'
import { InsertThematicBreak } from './InsertThematicBreak'
import { InsertFrontmatter } from './InsertFrontmatter'
import { InsertCodeBlock } from './InsertCodeBlock'
import { InsertSandpack } from './InsertSandpack'
import { InsertAdmonition } from './InsertAdmonition'
import { UndoRedo } from './UndoRedo'
import { DiffSourceToggleWrapper } from './DiffSourceToggleWrapper'
import { EditorInFocus } from '../core'
import { DirectiveNode } from '../directives/DirectiveNode'
import { ADMONITION_TYPES } from '../../directive-editors/AdmonitionDirectiveDescriptor'
import { AdmonitionKind } from 'lexical'
import { ChangeAdmonitionType } from './ChangeAdmonitionType'
import { ChangeCodeMirrorLanguage } from './ChangeCodeMirrorLanguage'

function whenInAdmonition(editorInFocus: EditorInFocus | null) {
  const node = editorInFocus?.rootNode
  if (!node || node.getType() !== 'directive') {
    return false
  }

  return ADMONITION_TYPES.includes((node as DirectiveNode).getMdastNode().name as AdmonitionKind)
}

function whenInCodeBlock(editorInFocus: EditorInFocus | null) {
  return editorInFocus?.editorType === 'codeblock'
}

export const Toolbar: React.FC = () => {
  return (
    <Root>
      <DiffSourceToggleWrapper>
        <ConditionalContents
          options={[
            { when: (editor) => editor?.editorType === 'codeblock', contents: () => <ChangeCodeMirrorLanguage /> },
            { when: (editor) => editor?.editorType === 'sandpack', contents: () => 'Sandpack' },
            {
              when: () => true,
              contents: () => (
                <>
                  <UndoRedo />
                  <Separator />
                  <BoldItalicUnderlineToggles />
                  <CodeToggle />
                  <Separator />
                  <ListsToggle />
                  <Separator />

                  <ConditionalContents
                    options={[
                      { when: whenInAdmonition, contents: () => <ChangeAdmonitionType /> },
                      { when: () => true, contents: () => <BlockTypeSelect /> }
                    ]}
                  />

                  <Separator />
                  <Createlink />
                  <Separator />
                  <InsertImage />
                  <InsertTable />
                  <InsertThematicBreak />
                  <InsertFrontmatter />
                  <InsertCodeBlock />
                  <InsertSandpack />
                  <ConditionalContents
                    options={[{ when: (editorInFocus) => !whenInAdmonition(editorInFocus), contents: () => <InsertAdmonition /> }]}
                  />
                </>
              )
            }
          ]}
        />
      </DiffSourceToggleWrapper>
    </Root>
  )
}
