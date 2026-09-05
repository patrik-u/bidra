import { defineConfig } from 'vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'

const config = defineConfig({
  server: { proxy: { '/api': 'http://127.0.0.1:8787' } },
  resolve: { tsconfigPaths: true },
  plugins: [tanstackStart({ prerender: { enabled: true, crawlLinks: false } }), viteReact()],
})

export default config
