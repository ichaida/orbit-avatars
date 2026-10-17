import { defineConfig } from "vite";
export default defineConfig({
  root: "site",
  build: { outDir: "../site-dist", emptyOutDir: true },
  server: { fs: { allow: [process.cwd()] } },
});
