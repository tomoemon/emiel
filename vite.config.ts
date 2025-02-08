/// <reference types="vitest" />
import { resolve } from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
  },
  plugins: [],
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "emiel",
      fileName: "index",
      formats: ["es"],
    },
    rollupOptions: {
      external: ["@base2/pretty-print-object"],
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: ({ name: fileName }) => {
          return `${fileName}.js`;
        },
      },
      plugins: [],
    },
  },
});
