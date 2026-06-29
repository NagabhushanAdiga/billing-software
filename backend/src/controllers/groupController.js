import { GroupModel } from '../models/GroupModel.js'
import { AuditModel } from '../models/AuditModel.js'
import { ok, fail } from '../utils/response.js'

export const GroupController = {
  list(req, res) {
    return ok(res, { groups: GroupModel.findAll() })
  },

  create(req, res) {
    const name = String(req.body?.name || '').trim()
    if (!name) return fail(res, 'Name is required')
    if (GroupModel.nameExists(name)) return fail(res, 'Category already exists')

    const group = GroupModel.create(name)
    AuditModel.create({
      action: 'category_created',
      category: 'category',
      details: name,
      actor: req.user,
    })
    return ok(res, { group }, 201)
  },

  update(req, res) {
    const { id } = req.params
    const name = String(req.body?.name || '').trim()
    if (!name) return fail(res, 'Name is required')
    if (GroupModel.nameExists(name, id)) return fail(res, 'Category already exists')

    const updated = GroupModel.update(id, name)
    if (!updated) return fail(res, 'Category not found', 404)

    AuditModel.create({
      action: 'category_updated',
      category: 'category',
      details: name,
      actor: req.user,
    })
    return ok(res, { group: GroupModel.findById(id) })
  },

  remove(req, res) {
    const { id } = req.params
    const group = GroupModel.findById(id)
    if (!group) return fail(res, 'Category not found', 404)

    GroupModel.delete(id)
    AuditModel.create({
      action: 'category_deleted',
      category: 'category',
      details: group.name,
      actor: req.user,
    })
    return ok(res, { message: 'Category deleted' })
  },

  addSubcategory(req, res) {
    const { id: groupId } = req.params
    const name = String(req.body?.name || '').trim()
    if (!name) return fail(res, 'Name is required')

    const group = GroupModel.findById(groupId)
    if (!group) return fail(res, 'Category not found', 404)
    if (GroupModel.subcategoryNameExists(groupId, name)) {
      return fail(res, 'Subcategory already exists')
    }

    const subcategory = GroupModel.addSubcategory(groupId, name)
    AuditModel.create({
      action: 'subcategory_created',
      category: 'category',
      details: `${group.name} → ${name}`,
      actor: req.user,
    })
    return ok(res, { subcategory, group: GroupModel.findById(groupId) }, 201)
  },

  updateSubcategory(req, res) {
    const { groupId, subcategoryId } = req.params
    const name = String(req.body?.name || '').trim()
    if (!name) return fail(res, 'Name is required')

    const group = GroupModel.findById(groupId)
    if (!group) return fail(res, 'Category not found', 404)
    if (GroupModel.subcategoryNameExists(groupId, name, subcategoryId)) {
      return fail(res, 'Subcategory already exists')
    }

    const updated = GroupModel.updateSubcategory(groupId, subcategoryId, name)
    if (!updated) return fail(res, 'Subcategory not found', 404)

    AuditModel.create({
      action: 'subcategory_updated',
      category: 'category',
      details: `${group.name} → ${name}`,
      actor: req.user,
    })
    return ok(res, { group: GroupModel.findById(groupId) })
  },

  removeSubcategory(req, res) {
    const { groupId, subcategoryId } = req.params
    const group = GroupModel.findById(groupId)
    if (!group) return fail(res, 'Category not found', 404)

    const sub = group.subcategories.find((s) => s.id === subcategoryId)
    GroupModel.deleteSubcategory(groupId, subcategoryId)
    AuditModel.create({
      action: 'subcategory_deleted',
      category: 'category',
      details: `${group.name} → ${sub?.name || subcategoryId}`,
      actor: req.user,
    })
    return ok(res, { group: GroupModel.findById(groupId) })
  },
}
