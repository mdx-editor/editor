import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core'
import { frontmatterToMarkdown, frontmatterFromMarkdown } from 'mdast-util-frontmatter'
import { frontmatter } from 'micromark-extension-frontmatter'
import { MdastFrontmatterVisitor } from './MdastFrontmatterVisitor'
import { LexicalFrontmatterVisitor } from './LexicalFrontmatterVisitor'
import { $getRoot } from 'lexical'
import { $isFrontmatterNode, $createFrontmatterNode, FrontmatterNode } from './FrontmatterNode'

/** @internal */
export const frontmatterSystem = system(
  (r, [{ rootEditor, createRootEditorSubscription }]) => {
    const insertFrontmatter = r.node<true>()
    const removeFrontmatter = r.node<true>()
    const frontmatterDialogOpen = r.node<boolean>(false)
    const hasFrontmatter = r.node<boolean>(false)

    r.sub(r.pipe(insertFrontmatter, r.o.withLatestFrom(rootEditor)), ([, theEditor]) => {
      theEditor?.update(() => {
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
      r.pub(frontmatterDialogOpen, true)
    })

    r.sub(r.pipe(removeFrontmatter, r.o.withLatestFrom(rootEditor)), ([, theEditor]) => {
      theEditor?.update(() => {
        const firstItem = $getRoot().getFirstChild()
        if ($isFrontmatterNode(firstItem)) {
          firstItem.remove()
        }
      })
      r.pub(frontmatterDialogOpen, false)
    })

    r.pub(createRootEditorSubscription, (rootEditor) => {
      return rootEditor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          r.pub(hasFrontmatter, $isFrontmatterNode($getRoot().getFirstChild()))
        })
      })
    })

    return {
      insertFrontmatter,
      removeFrontmatter,
      hasFrontmatter,
      frontmatterDialogOpen
    }
  },
  [coreSystem]
)

export const [
  /** @internal */
  frontmatterPlugin,
  /** @internal */
  frontmatterPluginHooks
] = realmPlugin({
  id: 'frontmatter',
  systemSpec: frontmatterSystem,

  init: (realm) => {
    realm.pubKey('addMdastExtension', frontmatterFromMarkdown('yaml'))
    realm.pubKey('addSyntaxExtension', frontmatter())
    realm.pubKey('addLexicalNode', FrontmatterNode)
    realm.pubKey('addImportVisitor', MdastFrontmatterVisitor)
    realm.pubKey('addExportVisitor', LexicalFrontmatterVisitor)
    realm.pubKey('addToMarkdownExtension', frontmatterToMarkdown('yaml'))
  }
})
