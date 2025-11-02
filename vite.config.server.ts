import { defineConfig } from "vite";
import path from "path";

// Server build configuration
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "node-build.ts"),
      name: "server",
      fileName: "node-build",
      formats: ["es"],
    },
    outDir: "dist/server",
    target: "node22",
    ssr: true,
    rollupOptions: {
      external: [
        // Node.js built-ins
        "fs",
        "path",
        "url",
        "http",
        "https",
        "os",
        "crypto",
        "stream",
        "util",
        "events",
        "buffer",
        "querystring",
        "child_process",
        // External dependencies that should not be bundled
        "express",
        "cors",
      ],
      output: {
        format: "es",
        entryFileNames: "[name].mjs",
      },
    },
    minify: false, // Keep readable for debugging
    sourcemap: true,
  },
  resolve: {
    alias: [
      { find: "@/components/ui", replacement: path.resolve(__dirname, ".") },
      { find: "@/components", replacement: path.resolve(__dirname, ".") },
      { find: "@/lib", replacement: path.resolve(__dirname, ".") },
      { find: "@/hooks", replacement: path.resolve(__dirname, ".") },
      { find: "@shared", replacement: path.resolve(__dirname, ".") },
      { find: "@", replacement: path.resolve(__dirname, ".") },
    ],
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
