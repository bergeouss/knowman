import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import webExtension from '@samrum/vite-plugin-web-extension'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: {
        manifest_version: 3,
        name: 'KnowMan',
        version: '0.1.0',
        description: 'AI-powered knowledge management tool',
        permissions: ['activeTab', 'storage', 'scripting'],
        action: {
          default_popup: 'index.html',
          default_title: 'KnowMan'
        },
        background: {
          service_worker: 'src/background.ts',
          type: 'module'
        },
        content_scripts: [
          {
            matches: ['<all_urls>'],
            js: ['src/content.ts']
          }
        ],
        host_permissions: ['<all_urls>']
      }
    })
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'src/background.ts'),
        content: resolve(__dirname, 'src/content.ts')
      }
    }
  }
})
