const { defineConfig } = require('vite')
const vue = require('@vitejs/plugin-vue')
const path = require('path')

// Windows-specific Vite config using CommonJS to avoid ESM module resolution issues
// Note: @tailwindcss/vite is ESM-only, so we'll rely on PostCSS config for Tailwind
module.exports = defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: './', // Important for Electron
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  css: {
    postcss: {
      plugins: [require('@tailwindcss/postcss'), require('autoprefixer')],
    },
  },
})
