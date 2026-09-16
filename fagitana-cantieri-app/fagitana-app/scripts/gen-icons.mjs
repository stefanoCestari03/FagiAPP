import sharp from 'sharp'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const root = path.dirname(fileURLToPath(import.meta.url))
const svg = readFileSync(path.join(root, '../public/icon.svg'))

const targets = [
  ['public/icon-192.png', 192],
  ['public/icon-512.png', 512],
  ['public/apple-touch-icon.png', 180],
]

for (const [out, size] of targets) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(path.join(root, '..', out))
  console.log('generato', out, size)
}
