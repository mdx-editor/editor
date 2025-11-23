# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MDXEditor is an open-source React component for rich-text markdown editing built on top of Lexical. It provides WYSIWYG markdown editing with support for MDX, tables, images, code blocks, JSX components, and more.

**Key technologies:**
- React 18/19 with TypeScript
- Lexical (Facebook's text editor framework)
- Gurx (reactive state management library)
- Vite (build tool)
- Vitest (testing)
- Ladle (component development)
- MDAST (markdown abstract syntax tree)

## Development Commands

**Build and development:**
```bash
npm run build          # Build the library with Vite
npm run dev            # Start Ladle dev server (component explorer)
npm start              # Alias for npm run dev
```

**Code quality:**
```bash
npm run typecheck      # Run TypeScript type checking (no emit)
npm run lint           # Lint source files with ESLint
```

**Testing:**
```bash
npm test               # Run Vitest in watch mode
npm run test:once      # Run Vitest once (CI mode)
```

**Tests are located in:** `src/test/**/*.test.{ts,tsx}`

**Other utilities:**
```bash
npm run build:docs:api           # Generate API docs with typedoc
npm run image-upload-backend     # Start example file upload server on port 65432
npm run export-icons             # Export icons from Figma
```

## Architecture

### Plugin System

The editor is built around a **plugin architecture** using Gurx (reactive state management):

- **RealmPlugin**: Core plugin interface with `init`, `postInit`, and `update` lifecycle methods
- **realmPlugin()**: Factory function to create plugins that accept parameters
- Plugins are initialized in `RealmWithPlugins` component which creates a Gurx Realm

**Plugin structure:**
```typescript
export const myPlugin = realmPlugin({
  init: (realm, params) => { /* register nodes, visitors, cells */ },
  postInit: (realm, params) => { /* access other plugins' state */ },
  update: (realm, params) => { /* handle prop updates */ }
})
```

### State Management with Gurx

Gurx primitives are exported with `$` suffix:
- **Cells** (state): `markdown$`, `rootEditor$`, `activeEditor$`, `readOnly$`, etc.
- **Signals** (actions): `insertMarkdown$`, `setMarkdown$`, `applyBlockType$`, etc.

Use React hooks to interact with Gurx:
```typescript
const [markdown, rootEditor] = useCellValues(markdown$, rootEditor$)
const applyBlockType = usePublisher(applyBlockType$)
```

### Lexical Integration

- **Root editor** (`rootEditor$`): Main Lexical editor instance
- **Active editor** (`activeEditor$`): Can be root or nested editor (e.g., code blocks)
- **Custom Lexical nodes**: Each feature typically registers custom LexicalNode subclasses
- **Dollar-prefixed functions** (e.g., `$isCodeBlockNode`): Follow Lexical conventions, used within editor read/update cycles

### Markdown <-> Lexical Conversion

The editor maintains bidirectional conversion between markdown and Lexical's internal state:

**Import (Markdown → Lexical):**
- `importMarkdownToLexical.ts`: Parses markdown to MDAST, then converts to Lexical nodes
- **MdastImportVisitor**: Interface for converting MDAST nodes to Lexical nodes
- Uses micromark + mdast-util libraries for parsing

**Export (Lexical → Markdown):**
- `exportMarkdownFromLexical.ts`: Converts Lexical nodes to MDAST, then serializes to markdown
- **LexicalExportVisitor**: Interface for converting Lexical nodes to MDAST
- Uses mdast-util-to-markdown for serialization

Each plugin typically registers both import and export visitors for its node types.

### Key Source Directories

- **src/plugins/**: Plugin implementations (core, toolbar, headings, lists, table, image, codeblock, jsx, directives, etc.)
- **src/plugins/core/**: Core plugin with fundamental functionality, state management, and base visitors
- **src/plugins/toolbar/**: Toolbar UI components and primitives
- **src/examples/**: Ladle stories (component examples/demos)
- **src/jsx-editors/**: Editors for JSX components
- **src/directive-editors/**: Editors for directives (e.g., admonitions)
- **src/styles/**: CSS modules and theming
- **src/utils/**: Utility functions
- **src/test/**: Test files

### Build Configuration

- **Vite**: Library mode with preserveModules for tree-shaking
- **CSS Modules**: Scoped with camelCaseOnly convention
- **TypeScript**: Strict mode, path alias `@/*` → `src/*`
- **SVG**: Loaded as React components via vite-plugin-svgr (replaces black with currentColor)
- **External packages**: All dependencies and peerDependencies are externalized in the build

## Conventions

- Path alias: Use `@/` for imports from `src/` directory
- CSS Modules: Use camelCase for class names
- Gurx exports: Suffix with `$` (e.g., `markdown$`, `applyBlockType$`)
- Lexical functions: Prefix with `$` for functions used in editor read/update cycles (e.g., `$isCodeBlockNode`)
- Plugin nodes: Custom Lexical nodes typically stored in plugin directories
- Visitors: Separate files for MDAST and Lexical visitors per feature
