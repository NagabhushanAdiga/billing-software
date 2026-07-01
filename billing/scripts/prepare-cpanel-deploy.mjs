#!/usr/bin/env node
/**
 * Create billing-cpanel-upload.zip — no Composer needed.
 * Run: npm run prepare-cpanel
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'billing-cpanel-upload')
const zip = path.join(root, 'billing-cpanel-upload.zip')

const skip = new Set([
  'billing-cpanel-upload',
  'billing-cpanel-upload.zip',
  'node_modules',
  '.git',
  '.env',
  'vendor',
])

console.log('Building cPanel upload package (no Composer required)...')

if (existsSync(out)) rmSync(out, { recursive: true, force: true })
if (existsSync(zip)) rmSync(zip, { force: true })

mkdirSync(out, { recursive: true })
for (const name of readdirSync(root)) {
  if (skip.has(name)) continue
  cpSync(path.join(root, name), path.join(out, name), { recursive: true })
}

const envExample = path.join(root, '.env.cpanel.example')
if (existsSync(envExample)) {
  cpSync(envExample, path.join(out, '.env.example'))
}
const readme = path.join(root, 'UPLOAD_TO_CPANEL.txt')
if (existsSync(readme)) {
  cpSync(readme, path.join(out, 'READ_ME_FIRST.txt'))
}

try {
  execSync(`zip -rq "${zip}" billing-cpanel-upload`, { cwd: root, stdio: 'inherit' })
} catch {
  console.log('zip not found — upload the billing-cpanel-upload folder manually')
}

console.log('')
console.log('Done!')
console.log('  Folder:', out)
if (existsSync(zip)) console.log('  Zip:   ', zip)
console.log('')
console.log('Upload to cPanel → public_html/billing-mithras/')
console.log('Then follow READ_ME_FIRST.txt')
