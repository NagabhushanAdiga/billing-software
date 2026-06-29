import { getDb } from '../config/db.js'
import { createId } from '../utils/helpers.js'

export const BatchModel = {
  findAll() {
    return getDb().prepare('SELECT id, name FROM batches ORDER BY name').all()
  },

  findById(id) {
    return getDb().prepare('SELECT id, name FROM batches WHERE id = ?').get(id)
  },

  create(name) {
    const id = createId('bat')
    getDb().prepare('INSERT INTO batches (id, name) VALUES (?, ?)').run(id, name)
    return { id, name }
  },

  delete(id) {
    getDb().prepare('DELETE FROM batches WHERE id = ?').run(id)
    getDb()
      .prepare("UPDATE products SET batch = '' WHERE batch LIKE ?")
      .run(`%${id}%`)
  },

  deleteAll() {
    getDb().prepare('DELETE FROM batches').run()
    getDb().prepare("UPDATE products SET batch = ''").run()
  },

  nameExists(name) {
    const row = getDb()
      .prepare('SELECT id FROM batches WHERE name = ? COLLATE NOCASE')
      .get(name)
    return Boolean(row)
  },
}
