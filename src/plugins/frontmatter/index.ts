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
  (r, [{ rootEditor }]) => {
    const insertFrontmatter = r.node<true>()

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
    })
    return {
      insertFrontmatter
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
