import { getDb } from '../config/db.js'
import { createId } from '../utils/helpers.js'

function mapGroup(row, subcategories) {
  return {
    id: row.id,
    name: row.name,
    subcategories: subcategories.map((s) => ({ id: s.id, name: s.name })),
  }
}

function groupBy(array, keyFn) {
  const map = {}
  for (const item of array) {
    const key = keyFn(item)
    if (!map[key]) map[key] = []
    map[key].push(item)
  }
  return map
}

export const GroupModel = {
  findAll() {
    const db = getDb()
    const groups = db.prepare('SELECT * FROM groups ORDER BY name').all()
    const subs = db.prepare('SELECT * FROM subcategories ORDER BY name').all()
    const subsByGroup = groupBy(subs, (s) => s.group_id)
    return groups.map((g) => mapGroup(g, subsByGroup[g.id] || []))
  },

  findById(id) {
    const db = getDb()
    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(id)
    if (!group) return null
    const subcategories = db
      .prepare('SELECT * FROM subcategories WHERE group_id = ? ORDER BY name')
      .all(id)
    return mapGroup(group, subcategories)
  },

  create(name) {
    const id = createId('grp')
    getDb().prepare('INSERT INTO groups (id, name) VALUES (?, ?)').run(id, name)
    return { id, name, subcategories: [] }
  },

  update(id, name) {
    const result = getDb().prepare('UPDATE groups SET name = ? WHERE id = ?').run(name, id)
    return result.changes > 0
  },

  delete(id) {
    getDb().prepare('DELETE FROM groups WHERE id = ?').run(id)
    getDb()
      .prepare("UPDATE products SET group_id = NULL, subcategory_id = NULL, category = '' WHERE group_id = ?")
      .run(id)
  },

  addSubcategory(groupId, name) {
    const id = createId('sub')
    getDb()
      .prepare('INSERT INTO subcategories (id, group_id, name) VALUES (?, ?, ?)')
      .run(id, groupId, name)
    return { id, name }
  },

  updateSubcategory(groupId, subcategoryId, name) {
    const result = getDb()
      .prepare('UPDATE subcategories SET name = ? WHERE id = ? AND group_id = ?')
      .run(name, subcategoryId, groupId)
    return result.changes > 0
  },

  deleteSubcategory(groupId, subcategoryId) {
    getDb()
      .prepare('DELETE FROM subcategories WHERE id = ? AND group_id = ?')
      .run(subcategoryId, groupId)
    getDb()
      .prepare("UPDATE products SET subcategory_id = '' WHERE subcategory_id = ?")
      .run(subcategoryId)
  },

  nameExists(name, excludeId = null) {
    const row = excludeId
      ? getDb()
          .prepare('SELECT id FROM groups WHERE name = ? COLLATE NOCASE AND id != ?')
          .get(name, excludeId)
      : getDb()
          .prepare('SELECT id FROM groups WHERE name = ? COLLATE NOCASE')
          .get(name)
    return Boolean(row)
  },

  deleteAll() {
    getDb().prepare('DELETE FROM subcategories').run()
    getDb().prepare('DELETE FROM groups').run()
    getDb()
      .prepare("UPDATE products SET group_id = NULL, subcategory_id = NULL, category = ''")
      .run()
  },

  subcategoryNameExists(groupId, name, excludeId = null) {
    const row = excludeId
      ? getDb()
          .prepare(
            'SELECT id FROM subcategories WHERE group_id = ? AND name = ? COLLATE NOCASE AND id != ?'
          )
          .get(groupId, name, excludeId)
      : getDb()
          .prepare(
            'SELECT id FROM subcategories WHERE group_id = ? AND name = ? COLLATE NOCASE'
          )
          .get(groupId, name)
    return Boolean(row)
  },
}
