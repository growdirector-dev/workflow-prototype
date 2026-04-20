import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const githubPagesBase = "/workflow-prototype/";

const githubPagesSpaFallback = () => ({
  name: "github-pages-spa-fallback",
  apply: "build",
  async closeBundle() {
    const outDir = path.resolve(__dirname, "dist");

    await fs.copyFile(path.join(outDir, "index.html"), path.join(outDir, "404.html"));
  },
});

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? githubPagesBase : "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), githubPagesSpaFallback(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
