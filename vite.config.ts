import { defineConfig } from "vite";
export default defineConfig({
  root: "site",
  build: {
    outDir: "../site-dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: "site/index.html",
        changelog: "site/changelog/index.html",
      },
    },
  },
  server: { fs: { allow: [process.cwd()] } },
});
