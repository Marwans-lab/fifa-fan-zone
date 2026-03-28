/**
 * Copies @imgly/background-removal-data assets needed for background removal
 * into public/bg-removal/ so they are served from our own domain at runtime.
 *
 * Only the "small" model is copied (medium is excluded to save ~84 MB).
 * All WASM variants are copied so the library can pick the best one per device.
 *
 * Run automatically via the "prebuild" npm script before every vite build.
 */

import { copyFileSync, existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC  = join(__dirname, '../node_modules/@imgly/background-removal-data/dist')
const DEST = join(__dirname, '../public/bg-removal')

const resources = JSON.parse(readFileSync(join(SRC, 'resources.json'), 'utf8'))

// Include all WASM variants (cross-browser/device compat) and only the small model.
// Excluding medium saves ~84 MB. The library is configured to use 'small' in Picture.tsx.
const INCLUDE = (key) => key.startsWith('/onnxruntime-web/') || key === '/models/small'

mkdirSync(DEST, { recursive: true })

const filtered = {}
let copiedFiles = 0

for (const [key, obj] of Object.entries(resources)) {
  if (!INCLUDE(key)) continue
  filtered[key] = obj
  for (const chunk of obj.chunks) {
    const srcFile  = join(SRC, chunk.hash)
    const destFile = join(DEST, chunk.hash)
    if (!existsSync(destFile)) {
      copyFileSync(srcFile, destFile)
      copiedFiles++
    }
  }
}

// Write filtered resources.json — only small model + WASM entries
writeFileSync(join(DEST, 'resources.json'), JSON.stringify(filtered, null, 2))

const totalMB = Object.values(filtered).reduce((s, o) => s + o.size, 0) / 1024 / 1024
console.log(`✓ bg-removal assets ready — ${copiedFiles} files copied, ${totalMB.toFixed(0)} MB total`)
