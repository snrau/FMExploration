import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(),
  tailwindcss(),
  nodePolyfills({
    process: true,
    buffer: true,
  }),
  ],
  define: {
    global: 'window', // Defines global for browser context
  },
  resolve: {
    alias: {
      // Optional: additional polyfills for node built-in modules
      events: 'rollup-plugin-node-polyfills/polyfills/events',
      stream: 'rollup-plugin-node-polyfills/polyfills/stream',
    },
  },
})
