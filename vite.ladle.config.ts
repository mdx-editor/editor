import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    react({}),
    svgr({
      svgrOptions: {
        svgo: true,
        replaceAttrValues: { 'black': 'currentColor' }
      }
    }),
    tsconfigPaths()
  ],
  server: {
    proxy: {
      '/uploads': 'http://localhost:65432'
    },
  },
  css: {
    modules: {
      scopeBehaviour: 'local',
      localsConvention: 'camelCaseOnly'
    }
  }
})
