import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      // Disable React dev tools in production
      ...(mode === 'production' && {
        jsxRuntime: 'automatic',
        jsxImportSource: 'react'
      })
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    },
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
      }
    },
    // Ensure production build
    target: 'es2020',
    cssCodeSplit: true,
    reportCompressedSize: false
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    hmr: false, // Disable HMR to prevent auto-refresh
    watch: {
      ignored: ['**/node_modules/**', '**/dist/**']
    },
    proxy: {
      '/api': {
        target: 'https://mythefreelance.netlify.app',
        changeOrigin: true,
        secure: true,
      }
    }
  },
  // Ensure proper build output for Netlify
  base: "/",
  publicDir: "public"
}));
