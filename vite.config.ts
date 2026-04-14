import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue(),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        resolvers: [ElementPlusResolver()],
        dts: 'src/auto-imports.d.ts',
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: 'src/components.d.ts',
      }),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          mobile: resolve(__dirname, 'mobile/index.html'),
        },
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return
            }

            if (id.includes('echarts')) {
              return 'vendor-echarts'
            }

            if (id.includes('@wangeditor')) {
              if (id.includes('@wangeditor/editor-for-vue')) {
                return 'vendor-editor-vue'
              }

              if (id.includes('@wangeditor/editor')) {
                return 'vendor-editor-core'
              }

              return 'vendor-editor'
            }

            if (
              id.includes('/slate/') ||
              id.includes('/snabbdom/') ||
              id.includes('/dom7/') ||
              id.includes('/nanoid/') ||
              id.includes('/lodash.') ||
              id.includes('/@uppy/')
            ) {
              return 'vendor-editor-deps'
            }

            if (id.includes('markdown-it') || id.includes('highlight.js')) {
              return 'vendor-markdown'
            }

            if (id.includes('element-plus') || id.includes('@element-plus')) {
              return 'vendor-element'
            }

            if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) {
              return 'vendor-vue'
            }
          },
        },
      },
    },
    server: {
      host: env.VITE_DEV_HOST || '127.0.0.1',
      port: Number(env.VITE_DEV_PORT || 5173),
      proxy: {
        '/blog': {
          target: env.VITE_BLOG_PROXY_TARGET || 'http://127.0.0.1:6101',
          changeOrigin: true,
        },
        '/schedule': {
          target: env.VITE_SCHEDULE_PROXY_TARGET || 'http://127.0.0.1:6101',
          changeOrigin: true,
        },
        '/calendar': {
          target: env.VITE_CALENDAR_PROXY_TARGET || 'http://127.0.0.1:6101',
          changeOrigin: true,
        },
        '/timesheet': {
          target: env.VITE_TIMESHEET_PROXY_TARGET || 'http://127.0.0.1:6101',
          changeOrigin: true,
        },
      },
    },
  }
})
