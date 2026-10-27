import type * as Mdast from 'mdast'
import type { MdxjsEsm } from 'mdast-util-mdx'
import type { ImportStatement } from '../../importMarkdownToLexical'

// Private, serializable provenance. Keep ImportStatement's public shape unchanged.
export interface ComponentImport extends ImportStatement {
  importedName: string
  localName: string
  kind: 'named' | 'default' | 'namespace'
  inherited?: boolean
}

type ImportData = Mdast.Data &
  NonNullable<MdxjsEsm['data']> & {
    mdxEditorImport?: ImportStatement
    mdxEditorImports?: ComponentImport[]
  }

export function getComponentImport(node: Mdast.Nodes): ImportStatement | undefined {
  return (node.data as ImportData | undefined)?.mdxEditorImport
}

export function getImportSpecifier(statement: ImportStatement | undefined): ComponentImport | undefined {
  return statement && 'localName' in statement ? (statement as ComponentImport) : undefined
}

export function withComponentImport<T extends Mdast.Nodes>(node: T, statement: ImportStatement): T {
  return { ...node, data: { ...node.data, mdxEditorImport: statement } }
}

export function getImportSpecifiers(node: MdxjsEsm): ComponentImport[] {
  // Reconstructed nested imports have provenance rather than parser metadata.
  const reconstructed = (node.data as ImportData | undefined)?.mdxEditorImports
  if (reconstructed) return reconstructed
  return (node.data?.estree?.body ?? []).flatMap((declaration) => {
    if (declaration.type !== 'ImportDeclaration') return []
    return declaration.specifiers.map((specifier): ComponentImport => {
      const kind =
        specifier.type === 'ImportDefaultSpecifier' ? 'default' : specifier.type === 'ImportNamespaceSpecifier' ? 'namespace' : 'named'
      return {
        source: String(declaration.source.value),
        defaultExport: kind === 'default',
        kind,
        importedName:
          specifier.type === 'ImportSpecifier'
            ? specifier.imported.type === 'Identifier'
              ? specifier.imported.name
              : String(specifier.imported.value)
            : kind === 'default'
              ? 'default'
              : '*',
        localName: specifier.local.name
      }
    })
  })
}

function quote(value: string): string {
  return `'${JSON.stringify(value).slice(1, -1).replace(/'/g, "\\'")}'`
}

export function createImportDeclaration(specifiers: ComponentImport[]): MdxjsEsm {
  const first = specifiers[0]
  const binding =
    first.kind === 'default'
      ? first.localName
      : first.kind === 'namespace'
        ? `* as ${first.localName}`
        : `{ ${specifiers
            .map(({ importedName, localName }) => {
              if (importedName === localName) return localName
              const name = /^[$_\p{ID_Start}][$\u200C\u200D\p{ID_Continue}]*$/u.test(importedName) ? importedName : quote(importedName)
              return `${name} as ${localName}`
            })
            .join(', ')} }`
  const data: ImportData = { mdxEditorImports: specifiers }
  return {
    type: 'mdxjsEsm',
    value: `import ${binding} from ${quote(first.source)}`,
    data
  }
}
