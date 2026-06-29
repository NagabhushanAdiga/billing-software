import { getDb } from '../config/db.js'
import { createId, parseJson } from '../utils/helpers.js'

const MAX_ENTRIES = 1000

function mapEntry(row) {
  return {
    id: row.id,
    at: row.at,
    action: row.action,
    category: row.category,
    details: row.details,
    actor: parseJson(row.actor_json),
  }
}

export const AuditModel = {
  findAll({ category, limit = MAX_ENTRIES } = {}) {
    let sql = 'SELECT * FROM audit_log'
    const params = []
    if (category) {
      sql += ' WHERE category = ?'
      params.push(category)
    }
    sql += ' ORDER BY at DESC LIMIT ?'
    params.push(limit)
    return getDb()
      .prepare(sql)
      .all(...params)
      .map(mapEntry)
  },

  create({ action, category = 'system', details = '', actor = null }) {
    const id = createId('aud')
    const at = new Date().toISOString()
    getDb()
      .prepare(
        'INSERT INTO audit_log (id, at, action, category, details, actor_json) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(
        id,
        at,
        action,
        category,
        String(details || ''),
        actor ? JSON.stringify(actor) : null
      )
    return { id, at, action, category, details, actor }
  },

  clear() {
    getDb().prepare('DELETE FROM audit_log').run()
  },
}
