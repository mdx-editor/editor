/// <reference types="vitest" />
import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import react from "@vitejs/plugin-react";

const ext = {
  cjs: "cjs",
  es: "mjs",
} as const;

const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));
const externalPackages = [
  ...Object.keys(packageJson.dependencies || {}),
  ...Object.keys(packageJson.peerDependencies || {}),
  "@lexical/react/LexicalHorizontalRuleNode",
];

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "classic",
    }),
  ],
  build: {
    minify: "terser",
    lib: {
      entry: ["src/index.ts"],
      formats: ["es", "cjs"],
      fileName: (format) => `index.${ext[format as "cjs" | "es"]}`,
    },
    rollupOptions: {
      external: externalPackages,
    },
  },
  test: {
    include: ["test/**/*.test.{ts,tsx}"],
    environment: "jsdom",
  },
});
