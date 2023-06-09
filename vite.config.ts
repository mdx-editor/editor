/// <reference types="vitest" />
import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import svgr from 'vite-plugin-svgr'

const ext = {
  cjs: 'cjs',
  es: 'js',
} as const

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8')) as {
  dependencies: Record<string, string>
  peerDependencies: Record<string, string>
}

const IN_LADLE = process.env['LADLE']

const externalPackages = [
  ...Object.keys(packageJson.dependencies),
  ...Object.keys(packageJson.peerDependencies),
  /@lexical\/react\/.*/,
  // '@lexical/react/LexicalHorizontalRuleNode',
  // '@lexical/react/LexicalHorizontalRulePlugin',
  // '@lexical/react/LexicalComposerContext',
]

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(IN_LADLE ? {} : { jsxRuntime: 'classic' } as const),
    dts({
      rollupTypes: true,
      compilerOptions: {
        skipLibCheck: true,
      },
    }),
    svgr({
      exportAsDefault: true,
      svgrOptions: {
        svgo: true,
        replaceAttrValues: { 'black': 'currentColor' }
      }
    }),
  ],
  build: {
    minify: 'terser',
    cssMinify: false,
    lib: {
      entry: ['src/index.ts'],
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${ext[format as 'cjs' | 'es']}`,
    },
    rollupOptions: {
      external: externalPackages,
    },
  },
  test: {
    include: ['src/test/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
  },
  css: {
    modules: {
      scopeBehaviour: 'local',
      localsConvention: 'camelCaseOnly'
    }
  }
})
