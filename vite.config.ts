/// <reference types="vitest" />
import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
  },
  plugins: [react()],
  build: {
    sourcemap: true,
    lib: {
      // 複数のエントリーポイントのディクショナリや配列にもできます
      entry: resolve(__dirname, "src/index.ts"),
      name: "emiel",
      // 適切な拡張子が追加されます
      fileName: "emiel",
    },
    rollupOptions: {
      // ライブラリにバンドルされるべきではない依存関係を
      // 外部化するようにします
      external: ["react"],
      output: {
        // 外部化された依存関係のために UMD のビルドで使用する
        // グローバル変数を提供します
        globals: {
          vue: "Vue",
        },
      },
    },
  },
});
