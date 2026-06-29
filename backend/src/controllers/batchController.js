import { BatchModel } from '../models/BatchModel.js'
import { AuditModel } from '../models/AuditModel.js'
import { ok, fail } from '../utils/response.js'

export const BatchController = {
  list(req, res) {
    return ok(res, { batches: BatchModel.findAll() })
  },

  create(req, res) {
    const name = String(req.body?.name || '').trim()
    if (!name) return fail(res, 'Name is required')
    if (BatchModel.nameExists(name)) return fail(res, 'Batch already exists')

    const batch = BatchModel.create(name)
    AuditModel.create({
      action: 'batch_created',
      category: 'category',
      details: name,
      actor: req.user,
    })
    return ok(res, { batch }, 201)
  },

  remove(req, res) {
    const { id } = req.params
    const batch = BatchModel.findById(id)
    if (!batch) return fail(res, 'Batch not found', 404)

    BatchModel.delete(id)
    AuditModel.create({
      action: 'batch_deleted',
      category: 'category',
      details: batch.name,
      actor: req.user,
    })
    return ok(res, { message: 'Batch deleted' })
  },
}
