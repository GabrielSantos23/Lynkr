import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { copyFileSync, mkdirSync, existsSync } from "fs";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "copy-manifest",
      writeBundle() {
        // Copy manifest.json
        copyFileSync("manifest.json", "dist/manifest.json");

        // Create icons directory if it doesn't exist
        if (!existsSync("dist/icons")) {
          mkdirSync("dist/icons", { recursive: true });
        }

        // Copy icon if it exists
        if (existsSync("icons/LogoIcon.svg")) {
          copyFileSync("icons/LogoIcon.svg", "dist/icons/LogoIcon.svg");
        }
      },
    },
  ],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html"),
        background: resolve(__dirname, "src/background.ts"),
        content: resolve(__dirname, "src/content.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
