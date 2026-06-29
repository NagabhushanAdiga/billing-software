import bcrypt from 'bcryptjs'
import { getDb } from '../config/db.js'
import { createId, toPublicUser } from '../utils/helpers.js'

export const UserModel = {
  findAll() {
    return getDb().prepare('SELECT * FROM users ORDER BY name').all()
  },

  findTeamMembers() {
    return getDb()
      .prepare("SELECT * FROM users WHERE role IN ('cashier', 'manager', 'admin') ORDER BY name")
      .all()
      .map(toPublicUser)
  },

  findById(id) {
    return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id)
  },

  findByUsername(username) {
    return getDb()
      .prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE')
      .get(String(username).trim())
  },

  verifyPassword(user, password) {
    return bcrypt.compareSync(password, user.password_hash)
  },

  create({ name, username, password, role }) {
    const id = createId('usr')
    getDb()
      .prepare(
        'INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)'
      )
      .run(id, username, bcrypt.hashSync(password, 10), name, role)
    return this.findById(id)
  },

  updatePassword(id, password) {
    getDb()
      .prepare('UPDATE users SET password_hash = ? WHERE id = ?')
      .run(bcrypt.hashSync(password, 10), id)
  },

  delete(id) {
    return getDb().prepare('DELETE FROM users WHERE id = ?').run(id)
  },
}
