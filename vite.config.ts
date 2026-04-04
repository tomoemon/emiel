import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
  },
  plugins: [],
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(import.meta.dirname, "src/index.ts"),
      name: "emiel",
      fileName: "index",
      formats: ["es"],
    },
    rolldownOptions: {
      external: ["@base2/pretty-print-object"],
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: ({ name: fileName }) => {
          return `${fileName.replace(/\?raw$/, "")}.js`;
        },
      },
      plugins: [],
    },
  },
});
