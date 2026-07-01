import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dbExec, closeDb } from '../config/db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const schemaPath = path.join(__dirname, 'schema.sql')

export async function runInit() {
  const schema = fs.readFileSync(schemaPath, 'utf8')
  await dbExec(schema)
  closeDb()
  console.log('Database initialized:', schemaPath)
}

runInit().catch((err) => {
  console.error(err)
  process.exit(1)
})
