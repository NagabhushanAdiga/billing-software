import { dbGet, dbAll, dbRun } from '../config/db.js'
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
  async findAll() {
    const groups = await dbAll('SELECT * FROM groups ORDER BY name')
    const subs = await dbAll('SELECT * FROM subcategories ORDER BY name')
    const subsByGroup = groupBy(subs, (s) => s.group_id)
    return groups.map((g) => mapGroup(g, subsByGroup[g.id] || []))
  },

  async findById(id) {
    const group = await dbGet('SELECT * FROM groups WHERE id = ?', [id])
    if (!group) return null
    const subcategories = await dbAll(
      'SELECT * FROM subcategories WHERE group_id = ? ORDER BY name',
      [id]
    )
    return mapGroup(group, subcategories)
  },

  async create(name) {
    const id = createId('grp')
    await dbRun('INSERT INTO groups (id, name) VALUES (?, ?)', [id, name])
    return { id, name, subcategories: [] }
  },

  async update(id, name) {
    const result = await dbRun('UPDATE groups SET name = ? WHERE id = ?', [name, id])
    return result.changes > 0
  },

  async delete(id) {
    await dbRun('DELETE FROM groups WHERE id = ?', [id])
    await dbRun(
      "UPDATE products SET group_id = NULL, subcategory_id = NULL, category = '' WHERE group_id = ?",
      [id]
    )
  },

  async addSubcategory(groupId, name) {
    const id = createId('sub')
    await dbRun('INSERT INTO subcategories (id, group_id, name) VALUES (?, ?, ?)', [
      id,
      groupId,
      name,
    ])
    return { id, name }
  },

  async updateSubcategory(groupId, subcategoryId, name) {
    const result = await dbRun(
      'UPDATE subcategories SET name = ? WHERE id = ? AND group_id = ?',
      [name, subcategoryId, groupId]
    )
    return result.changes > 0
  },

  async deleteSubcategory(groupId, subcategoryId) {
    await dbRun('DELETE FROM subcategories WHERE id = ? AND group_id = ?', [
      subcategoryId,
      groupId,
    ])
    await dbRun('UPDATE products SET subcategory_id = NULL WHERE subcategory_id = ?', [
      subcategoryId,
    ])
  },

  async nameExists(name, excludeId = null) {
    const row = excludeId
      ? await dbGet('SELECT id FROM groups WHERE name = ? COLLATE NOCASE AND id != ?', [
          name,
          excludeId,
        ])
      : await dbGet('SELECT id FROM groups WHERE name = ? COLLATE NOCASE', [name])
    return Boolean(row)
  },

  async deleteAll() {
    await dbRun('DELETE FROM subcategories')
    await dbRun('DELETE FROM groups')
    await dbRun("UPDATE products SET group_id = NULL, subcategory_id = NULL, category = ''")
  },

  async subcategoryNameExists(groupId, name, excludeId = null) {
    const row = excludeId
      ? await dbGet(
          'SELECT id FROM subcategories WHERE group_id = ? AND name = ? COLLATE NOCASE AND id != ?',
          [groupId, name, excludeId]
        )
      : await dbGet(
          'SELECT id FROM subcategories WHERE group_id = ? AND name = ? COLLATE NOCASE',
          [groupId, name]
        )
    return Boolean(row)
  },
}
