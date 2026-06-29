import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getDb, closeDb } from '../config/db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const schemaPath = path.join(__dirname, 'schema.sql')

const schema = fs.readFileSync(schemaPath, 'utf8')

const db = getDb()
db.exec(schema)
closeDb()

console.log('Database initialized:', schemaPath)
