import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { defineConfig, type Plugin } from 'vite'

/**
 * Build Version Stamp
 * -------------------
 * Each production build gets a unique version id. On Cloudflare Pages the
 * commit SHA is provided via CF_PAGES_COMMIT_SHA; locally we fall back to the
 * git HEAD SHA, then to a timestamp. The id is:
 *   1. baked into the JS bundle as __APP_VERSION__
 *   2. emitted as /version.json (fetched by the client to detect new deploys)
 */
function resolveBuildVersion(): string {
  const sha =
    process.env.CF_PAGES_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    (() => {
      try {
        return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
          .toString()
          .trim()
      } catch {
        return ''
      }
    })()
  const stamp = Date.now().toString(36)
  return sha ? `${sha.slice(0, 7)}-${stamp}` : stamp
}

const BUILD_VERSION = resolveBuildVersion()
const BUILD_TIME = new Date().toISOString()

function versionJsonPlugin(): Plugin {
  return {
    name: 'arune-version-json',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify(
          { version: BUILD_VERSION, builtAt: BUILD_TIME },
          null,
          2
        ),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), versionJsonPlugin()],
  define: {
    __APP_VERSION__: JSON.stringify(BUILD_VERSION),
    __APP_BUILD_TIME__: JSON.stringify(BUILD_TIME),
  },
})
