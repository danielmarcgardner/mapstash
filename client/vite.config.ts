/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv with no prefix also returns process.env. Only production image builds get the token
  // (a Render secret file); dev, tests and CI skip source maps.
  const env = loadEnv(mode, '.', '')
  const sentryAuthToken = env.SENTRY_AUTH_TOKEN
  return {
    plugins: [
      react(),
      tailwindcss(),
      // Uploads source maps so production stack traces in Sentry show source files. Keep it last.
      sentryVitePlugin({
        org: 'daniel-gardner',
        project: 'mapstash-frontend',
        authToken: sentryAuthToken,
        release: { name: env.RENDER_GIT_COMMIT },
        // package.json builds into ../public; maps are uploaded to Sentry, then deleted so they're never served.
        sourcemaps: { filesToDeleteAfterUpload: ['../public/**/*.map'] },
        disable: !sentryAuthToken,
      }),
    ],
    build: { sourcemap: sentryAuthToken ? 'hidden' : false },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://backend:3000',
          changeOrigin: true,
        }
      }
    }
  }
})
