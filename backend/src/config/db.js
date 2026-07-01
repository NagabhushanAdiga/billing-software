import Database from 'better-sqlite3'
import { createClient } from '@libsql/client'
import fs from 'fs'
import path from 'path'
import { env } from './env.js'

let sqliteDb
let tursoClient

function useTurso() {
  return Boolean(env.tursoUrl)
}

function rowFromLibsql(row, columns) {
  if (!row) return undefined
  const obj = {}
  columns.forEach((col, i) => {
    obj[col] = row[i]
  })
  return obj
}

function rowsFromLibsql(rows, columns) {
  return rows.map((row) => rowFromLibsql(row, columns))
}

function getSqlite() {
  if (!sqliteDb) {
    const dir = path.dirname(env.databasePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    sqliteDb = new Database(env.databasePath)
    sqliteDb.pragma('journal_mode = WAL')
    sqliteDb.pragma('foreign_keys = ON')
  }
  return sqliteDb
}

function getTurso() {
  if (!tursoClient) {
    tursoClient = createClient({
      url: env.tursoUrl,
      authToken: env.tursoAuthToken,
    })
  }
  return tursoClient
}

/** @deprecated use dbGet/dbAll/dbRun */
export function getDb() {
  if (useTurso()) {
    throw new Error('Turso mode: use async dbGet/dbAll/dbRun instead of getDb()')
  }
  return getSqlite()
}

export function closeDb() {
  if (sqliteDb) {
    sqliteDb.close()
    sqliteDb = null
  }
}

export async function dbGet(sql, params = []) {
  if (!useTurso()) {
    return getSqlite().prepare(sql).get(...params)
  }
  const result = await getTurso().execute({ sql, args: params })
  return rowFromLibsql(result.rows[0], result.columns)
}

export async function dbAll(sql, params = []) {
  if (!useTurso()) {
    return getSqlite().prepare(sql).all(...params)
  }
  const result = await getTurso().execute({ sql, args: params })
  return rowsFromLibsql(result.rows, result.columns)
}

export async function dbRun(sql, params = []) {
  if (!useTurso()) {
    return getSqlite().prepare(sql).run(...params)
  }
  const result = await getTurso().execute({ sql, args: params })
  return {
    changes: result.rowsAffected ?? 0,
    lastInsertRowid: result.lastInsertRowid,
  }
}

export async function dbExec(sql) {
  if (!useTurso()) {
    getSqlite().exec(sql)
    return
  }
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
  for (const statement of statements) {
    await getTurso().execute(statement)
  }
}
