import { defineConfig } from 'vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'

const config = defineConfig({
  server: { proxy: { '/api': 'http://127.0.0.1:8080', '^/images/generated-': 'http://127.0.0.1:8080' } },
  resolve: { tsconfigPaths: true },
  plugins: [tanstackStart({ prerender: { enabled: true, crawlLinks: false } }), viteReact()],
})

export default config
