import { AuditModel } from '../models/AuditModel.js'
import { ProductModel } from '../models/ProductModel.js'
import { OrderModel } from '../models/OrderModel.js'
import { SettingsModel } from '../models/SettingsModel.js'
import { GroupModel } from '../models/GroupModel.js'
import { BatchModel } from '../models/BatchModel.js'
import { getDb } from '../config/db.js'
import { ok } from '../utils/response.js'

export const AuditController = {
  list(req, res) {
    const category = req.query.category || ''
    const entries = AuditModel.findAll({ category: category || undefined })
    return ok(res, { entries })
  },

  create(req, res) {
    const { action, category, details } = req.body || {}
    if (!action) return res.status(400).json({ ok: false, error: 'Action is required' })
    const entry = AuditModel.create({
      action,
      category: category || 'system',
      details: details || '',
      actor: req.user,
    })
    return ok(res, { entry }, 201)
  },

  clear(req, res) {
    AuditModel.clear()
    return ok(res, { message: 'Audit log cleared' })
  },
}

export const StoreController = {
  bootstrap(req, res) {
    return ok(res, {
      products: ProductModel.findAll(),
      groups: GroupModel.findAll(),
      batches: BatchModel.findAll(),
      orders: OrderModel.findAll(),
      settings: SettingsModel.get(),
    })
  },

  eraseAll(req, res) {
    const db = getDb()
    db.transaction(() => {
      ProductModel.deleteAll()
      OrderModel.deleteAll()
      GroupModel.deleteAll()
      BatchModel.deleteAll()
      SettingsModel.reset()
    })()

    AuditModel.create({
      action: 'data_erased',
      category: 'settings',
      details: 'All products, orders, categories, batches, and settings reset',
      actor: req.user,
    })
    return ok(res, { message: 'All data erased' })
  },

  purge(req, res) {
    const {
      products = false,
      categories = false,
      batches = false,
      orders = false,
      settings = false,
      auditLog = false,
    } = req.body || {}

    const db = getDb()
    db.transaction(() => {
      if (products) ProductModel.deleteAll()
      if (orders) OrderModel.deleteAll()
      if (categories) GroupModel.deleteAll()
      if (batches) BatchModel.deleteAll()
      if (settings) SettingsModel.reset()
    })()

    if (auditLog) AuditModel.clear()

    const removed = [
      products && 'products',
      categories && 'categories',
      batches && 'batches',
      orders && 'orders',
      settings && 'settings',
      auditLog && 'audit log',
    ].filter(Boolean)

    if (removed.length > 0) {
      AuditModel.create({
        action: removed.length >= 4 ? 'data_erased' : 'data_purged',
        category: 'settings',
        details: `Removed: ${removed.join(', ')}`,
        actor: req.user,
      })
    }

    return ok(res, { message: 'Selected data removed' })
  },
}
