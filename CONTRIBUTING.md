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
- `npm run test:compat` - Run the focused jsdom and three-browser Lexical compatibility gate
- `npm run test:lexical-versions` - Assert that the complete installed Lexical graph is on the supported lockstep version
- `npm run test:package` - Pack the built library and verify React 18 and React 19 consumers
- `npm run test:cross-version` - Replay the compatibility fixture through the packed package and the published legacy package

Tests are located in `src/test/**/*.test.{ts,tsx}`

### Browser compatibility tests

Install the Playwright-matched browsers once after installing dependencies:

```bash
npm exec playwright install chromium firefox webkit
```

The browser tooling requires Node.js 18 or newer. This does not change the library's published Node.js engine support.

Run the complete Lexical compatibility contract with `npm run test:compat`. The focused commands below localize a failure without replaying every passing phase:

```bash
npm run test:compat:unit
npm run test:browser
npm run test:browser -- --project=chromium
npm run test:browser -- --project=firefox
npm run test:browser -- --project=webkit
npm run test:browser -- --project=chromium --grep CX-3
```

Playwright owns the Ladle service and port `61000` for browser runs, including shutdown after success or failure. Do not start a separate Ladle process on that port while running the suite. Failure traces, screenshots, and videos are written under `test-results/`; the HTML report is written to `playwright-report/`. CI uploads both directories when the browser job fails.

The paste scenario dispatches a real DOM `ClipboardEvent` with `text/plain` data as a deterministic browser-handling proxy. It does not certify OS clipboard permissions or integration. Mobile browsers and exhaustive IME behavior are outside this compatibility gate.

### Packed-package compatibility tests

Build the package and install the Playwright-matched Chromium browser before running the package gates:

```bash
npm run build
npm exec playwright install chromium
npm run test:package
npm run test:cross-version
```

Both commands pack `dist`, create disposable consumers, and use an isolated temporary npm cache. `test:package` typechecks, Vite-bundles, serves, and renders the artifact with the pinned React 18 and React 19 toolchains. `test:cross-version` captures the packed package's public-ref Markdown, installs published `@mdxeditor/editor@4.0.4` with its complete Lexical graph pinned to 0.35.0, and directly replays the captured document.

Use these failure-local commands while iterating:

```bash
npm run test:package -- --react=18
npm run test:package -- --react=19
npm run test:cross-version
```

The gates require npm registry access for their disposable installations. They own their Chromium pages, preview servers, allocated loopback ports, tarballs, caches, and temporary applications, and clean them up on success or failure.

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

## Table region paste contract

Paste a standalone HTML table or TSV containing an unquoted tab into an existing cell. The cell is the top-left anchor; the destination grows right and down, and empty cells overwrite existing contents. The resulting table is limited to 10,000 cells; an oversized destination is ignored without saving pending edits. HTML formatting and block content become readable plain text. Merged cells retain text at the top-left and use empty covered cells. Ordinary prose and CSV continue through normal paste.

While editing a cell, typing uses its local Undo/Redo history. Leaving a cell commits its contents as one parent-table history step. A region paste first commits pending anchor text and then creates one separate parent step. It resets older local history boundaries so Undo from another cell cannot jump ahead of the paste. Parent Undo/Redo restores committed cell edits as well as entire pastes, including cells whose editor identity did not change. This keeps committed content recoverable; it does not preserve every in-cell typing group across a commit boundary.

The focused parser and integration tests are `tableClipboard.test.ts`, `table-paste.test.tsx`, and `table-paste-limits.test.ts`. `tests/browser/table-region-paste.spec.ts` additionally checks actual browser focus and keyboard Undo/Redo with a synthetic DOM clipboard event. This event does not certify OS clipboard permissions, Excel, or Google Sheets integration.
