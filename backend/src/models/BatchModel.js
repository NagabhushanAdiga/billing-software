import { dbGet, dbAll, dbRun } from '../config/db.js'
import { createId } from '../utils/helpers.js'

export const BatchModel = {
  async findAll() {
    return dbAll('SELECT id, name FROM batches ORDER BY name')
  },

  async findById(id) {
    return dbGet('SELECT id, name FROM batches WHERE id = ?', [id])
  },

  async create(name) {
    const id = createId('bat')
    await dbRun('INSERT INTO batches (id, name) VALUES (?, ?)', [id, name])
    return { id, name }
  },

  async delete(id) {
    await dbRun('DELETE FROM batches WHERE id = ?', [id])
    await dbRun("UPDATE products SET batch = '' WHERE batch LIKE ?", [`%${id}%`])
  },

  async deleteAll() {
    await dbRun('DELETE FROM batches')
    await dbRun("UPDATE products SET batch = ''")
  },

  async nameExists(name) {
    const row = await dbGet('SELECT id FROM batches WHERE name = ? COLLATE NOCASE', [name])
    return Boolean(row)
  },
}
