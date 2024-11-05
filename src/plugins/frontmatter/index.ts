import { realmPlugin } from '../../RealmWithPlugins'
import {
  addExportVisitor$,
  addImportVisitor$,
  addLexicalNode$,
  addMdastExtension$,
  addSyntaxExtension$,
  addToMarkdownExtension$,
  createRootEditorSubscription$,
  rootEditor$
} from '../core'
import { Action, Cell, withLatestFrom } from '@mdxeditor/gurx'
import { $getRoot } from 'lexical'
import { frontmatterFromMarkdown, frontmatterToMarkdown } from 'mdast-util-frontmatter'
import { frontmatter } from 'micromark-extension-frontmatter'
import { $createFrontmatterNode, $isFrontmatterNode, FrontmatterNode } from './FrontmatterNode'
import { LexicalFrontmatterVisitor } from './LexicalFrontmatterVisitor'
import { MdastFrontmatterVisitor } from './MdastFrontmatterVisitor'
export * from './FrontmatterNode'

/**
 * Whether the frontmatter dialog is open.
 * @group Frontmatter
 */
export const frontmatterDialogOpen$ = Cell(false)

/**
 * Inserts a frontmatter node at the beginning of the markdown document.
 * @group Frontmatter
 */
export const insertFrontmatter$ = Action((r) => {
  r.sub(r.pipe(insertFrontmatter$, withLatestFrom(rootEditor$)), ([, rootEditor]) => {
    rootEditor?.update(() => {
      const firstItem = $getRoot().getFirstChild()
      if (!$isFrontmatterNode(firstItem)) {
        const fmNode = $createFrontmatterNode('"": ""')
        if (firstItem) {
          firstItem.insertBefore(fmNode)
        } else {
          $getRoot().append(fmNode)
        }
      }
    })
    r.pub(frontmatterDialogOpen$, true)
  })
})

/**
 * Removes the frontmatter node from the markdown document.
 * @group Frontmatter
 */
export const removeFrontmatter$ = Action((r) => {
  r.sub(r.pipe(removeFrontmatter$, withLatestFrom(rootEditor$)), ([, rootEditor]) => {
    rootEditor?.update(() => {
      const firstItem = $getRoot().getFirstChild()
      if ($isFrontmatterNode(firstItem)) {
        firstItem.remove()
      }
    })
    r.pub(frontmatterDialogOpen$, false)
  })
})

/**
 * Whether the markdown document has a frontmatter node.
 * @group Frontmatter
 */
export const hasFrontmatter$ = Cell(false, (r) => {
  r.pub(createRootEditorSubscription$, (rootEditor) => {
    return rootEditor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        r.pub(hasFrontmatter$, $isFrontmatterNode($getRoot().getFirstChild()))
      })
    })
  })
})

/**
 * A plugin that adds support for frontmatter.
 * @group Frontmatter
 */
export const frontmatterPlugin = realmPlugin({
  init: (realm) => {
    realm.pubIn({
      [addMdastExtension$]: frontmatterFromMarkdown('yaml'),
      [addSyntaxExtension$]: frontmatter(),
      [addLexicalNode$]: FrontmatterNode,
      [addImportVisitor$]: MdastFrontmatterVisitor,
      [addExportVisitor$]: LexicalFrontmatterVisitor,
      [addToMarkdownExtension$]: frontmatterToMarkdown('yaml')
    })
  }
})
