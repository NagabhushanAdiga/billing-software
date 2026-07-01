import bcrypt from 'bcryptjs'
import { dbGet, dbAll, dbRun } from '../config/db.js'
import { createId, toPublicUser } from '../utils/helpers.js'

export const UserModel = {
  async findAll() {
    return dbAll('SELECT * FROM users ORDER BY name')
  },

  async findTeamMembers() {
    const rows = await dbAll(
      "SELECT * FROM users WHERE role IN ('cashier', 'manager', 'admin') ORDER BY name"
    )
    return rows.map(toPublicUser)
  },

  async findById(id) {
    return dbGet('SELECT * FROM users WHERE id = ?', [id])
  },

  async findByUsername(username) {
    return dbGet('SELECT * FROM users WHERE username = ? COLLATE NOCASE', [
      String(username).trim(),
    ])
  },

  verifyPassword(user, password) {
    return bcrypt.compareSync(password, user.password_hash)
  },

  async create({ name, username, password, role }) {
    const id = createId('usr')
    await dbRun(
      'INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)',
      [id, username, bcrypt.hashSync(password, 10), name, role]
    )
    return await this.findById(id)
  },

  async updatePassword(id, password) {
    await dbRun('UPDATE users SET password_hash = ? WHERE id = ?', [
      bcrypt.hashSync(password, 10),
      id,
    ])
  },

  async delete(id) {
    return dbRun('DELETE FROM users WHERE id = ?', [id])
  },
}
