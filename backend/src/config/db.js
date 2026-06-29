import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { env } from './env.js'

let db

export function getDb() {
  if (!db) {
    const dir = path.dirname(env.databasePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    db = new Database(env.databasePath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

export function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}
