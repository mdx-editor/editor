# Contributing to MDXEditor

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server with component examples:

```bash
npm run dev
```

This starts Ladle on <http://localhost:61000> where you can browse and test the examples.

## Development Commands

**Build and development:**

- `npm run build` - Build the library with Vite
- `npm run dev` - Start Ladle dev server (component explorer)
- `npm start` - Alias for `npm run dev`

**Code quality:**

- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Lint source files with ESLint

**Testing:**

- `npm test` - Run Vitest in watch mode
- `npm run test:once` - Run Vitest once (CI mode)

Tests are located in `src/test/**/*.test.{ts,tsx}`

## Project Architecture

MDXEditor is built on:

- **React 18/19** with TypeScript
- **Lexical** - Facebook's extensible text editor framework
- **Gurx** - Reactive state management library
- **MDAST** - Markdown abstract syntax tree

### Plugin System

The editor uses a plugin architecture with Gurx for state management. Each feature is implemented as a plugin that can:

- Register custom Lexical nodes
- Add markdown import/export visitors
- Provide toolbar UI components
- Manage feature-specific state

**Plugin structure:**

```typescript
export const myPlugin = realmPlugin({
  init: (realm, params) => {
    /* register nodes, visitors, cells */
  },
  postInit: (realm, params) => {
    /* access other plugins' state */
  },
  update: (realm, params) => {
    /* handle prop updates */
  }
})
```

### Key Directories

- `src/plugins/` - Plugin implementations (headings, lists, table, image, codeblock, etc.)
- `src/plugins/core/` - Core plugin with fundamental functionality
- `src/plugins/toolbar/` - Toolbar UI components
- `src/examples/` - Ladle stories (component examples)
- `src/jsx-editors/` - Editors for JSX components
- `src/directive-editors/` - Editors for directives (admonitions, etc.)
- `src/styles/` - CSS modules and theming
- `src/utils/` - Utility functions
- `src/test/` - Test files

### Markdown Conversion

The editor maintains bidirectional conversion between markdown and Lexical's internal state:

**Import (Markdown → Lexical):**

- Parses markdown to MDAST using micromark
- Converts MDAST nodes to Lexical nodes using the `MdastImportVisitor` interface

**Export (Lexical → Markdown):**

- Converts Lexical nodes to MDAST using `LexicalExportVisitor` interface
- Serializes MDAST to markdown

Each plugin registers both import and export visitors for its node types.

## Coding Conventions

- Use path alias `@/` for imports from `src/` directory
- CSS Modules with camelCase class names
- Gurx exports suffixed with `$` (e.g., `markdown$`, `applyBlockType$`)
- Lexical functions prefixed with `$` for editor read/update cycles (e.g., `$isCodeBlockNode`)
- TypeScript strict mode enabled

## Adding a New Feature

1. Create a new plugin in `src/plugins/your-feature/`
2. Implement custom Lexical nodes if needed
3. Add MDAST import/export visitors for markdown conversion
4. Add toolbar components if needed
5. Create examples in `src/examples/`
6. Write tests in `src/test/`
7. Export the plugin from `src/index.ts`

## Pull Requests

- Ensure `npm run typecheck` and `npm run lint` pass
- Add tests for new features
- Update examples in `src/examples/` to demonstrate the feature
- Keep commits focused and well-described
