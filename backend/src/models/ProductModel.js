import { getDb } from '../config/db.js'
import { createId, parseJson } from '../utils/helpers.js'
import { GroupModel } from './GroupModel.js'

function mapProduct(row, groups) {
  const group = row.group_id ? groups.find((g) => g.id === row.group_id) : null
  const sub = group?.subcategories?.find((s) => s.id === row.subcategory_id)
  return {
    id: row.id,
    barcode: row.barcode,
    name: row.name,
    hsn: row.hsn || '',
    gst: row.gst ?? 0,
    groupId: row.group_id || '',
    subcategoryId: row.subcategory_id || '',
    category: row.category || group?.name || '',
    subcategory: sub?.name || '',
    discount: row.discount ?? 0,
    price: row.price ?? 0,
    stock: row.stock ?? 0,
    mrp: row.mrp,
    costPrice: row.cost_price,
    batch: row.batch || '',
    image: row.image || '',
    batches: parseJson(row.batches_json, []),
  }
}

export const ProductModel = {
  findAll() {
    const groups = GroupModel.findAll()
    const rows = getDb().prepare('SELECT * FROM products ORDER BY name').all()
    return rows.map((r) => mapProduct(r, groups))
  },

  findById(id) {
    const row = getDb().prepare('SELECT * FROM products WHERE id = ?').get(id)
    if (!row) return null
    return mapProduct(row, GroupModel.findAll())
  },

  findByBarcode(barcode) {
    const row = getDb()
      .prepare('SELECT * FROM products WHERE barcode = ?')
      .get(String(barcode).trim())
    if (!row) return null
    return mapProduct(row, GroupModel.findAll())
  },

  barcodeTaken(barcode, excludeId = null) {
    const row = excludeId
      ? getDb()
          .prepare('SELECT id FROM products WHERE barcode = ? AND id != ?')
          .get(barcode, excludeId)
      : getDb().prepare('SELECT id FROM products WHERE barcode = ?').get(barcode)
    return Boolean(row)
  },

  create(product) {
    const id = product.id || createId(String(Date.now()))
    const groups = GroupModel.findAll()
    const group = groups.find((g) => g.id === product.groupId)
    const batches = product.batches || []
    const totalStock = batches.length
      ? batches.reduce((s, b) => s + (Number(b.stock) || 0), 0)
      : Number(product.stock) || 0

    getDb()
      .prepare(
        `INSERT INTO products (
          id, barcode, name, hsn, gst, group_id, subcategory_id, category,
          discount, price, stock, mrp, cost_price, batch, image, batches_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        product.barcode,
        product.name,
        product.hsn || '',
        Number(product.gst) || 0,
        product.groupId || null,
        product.subcategoryId || null,
        product.category || group?.name || '',
        Number(product.discount) || 0,
        Number(product.price) || 0,
        totalStock,
        product.mrp ?? null,
        product.costPrice ?? null,
        product.batch || '',
        product.image || '',
        JSON.stringify(batches)
      )
    return this.findById(id)
  },

  update(id, updates) {
    const existing = getDb().prepare('SELECT * FROM products WHERE id = ?').get(id)
    if (!existing) return false

    const groups = GroupModel.findAll()
    const groupId = updates.groupId !== undefined ? updates.groupId : existing.group_id
    const group = groups.find((g) => g.id === groupId)
    const batches =
      updates.batches !== undefined
        ? updates.batches
        : parseJson(existing.batches_json, [])
    const totalStock = batches.length
      ? batches.reduce((s, b) => s + (Number(b.stock) || 0), 0)
      : updates.stock !== undefined
        ? Number(updates.stock)
        : existing.stock

    getDb()
      .prepare(
        `UPDATE products SET
          barcode = ?, name = ?, hsn = ?, gst = ?, group_id = ?, subcategory_id = ?,
          category = ?, discount = ?, price = ?, stock = ?, mrp = ?, cost_price = ?,
          batch = ?, image = ?, batches_json = ?, updated_at = datetime('now')
        WHERE id = ?`
      )
      .run(
        updates.barcode !== undefined ? updates.barcode : existing.barcode,
        updates.name !== undefined ? updates.name : existing.name,
        updates.hsn !== undefined ? updates.hsn : existing.hsn,
        updates.gst !== undefined ? Number(updates.gst) : existing.gst,
        groupId || null,
        updates.subcategoryId !== undefined ? updates.subcategoryId : existing.subcategory_id,
        updates.category !== undefined ? updates.category : group?.name || existing.category,
        updates.discount !== undefined ? Number(updates.discount) : existing.discount,
        updates.price !== undefined ? Number(updates.price) : existing.price,
        totalStock,
        updates.mrp !== undefined ? updates.mrp : existing.mrp,
        updates.costPrice !== undefined ? updates.costPrice : existing.cost_price,
        updates.batch !== undefined ? updates.batch : existing.batch,
        updates.image !== undefined ? updates.image : existing.image,
        JSON.stringify(batches),
        id
      )
    return true
  },

  delete(id) {
    return getDb().prepare('DELETE FROM products WHERE id = ?').run(id).changes > 0
  },

  deleteAll() {
    getDb().prepare('DELETE FROM products').run()
  },

  deductStockForOrder(items) {
    const db = getDb()
    for (const line of items) {
      const product = db.prepare('SELECT * FROM products WHERE barcode = ?').get(line.barcode)
      if (!product) continue

      const batches = parseJson(product.batches_json, [])
      const qty = Number(line.qty) || 0

      if (batches.length > 0) {
        let nextBatches = [...batches]
        if (line.productBatchId) {
          nextBatches = nextBatches.map((b) =>
            b.id === line.productBatchId
              ? { ...b, stock: Math.max(0, Number(b.stock) - qty) }
              : b
          )
        } else {
          const target = nextBatches.find((b) => Number(b.stock) > 0) || nextBatches[0]
          if (target) {
            nextBatches = nextBatches.map((b) =>
              b.id === target.id
                ? { ...b, stock: Math.max(0, Number(b.stock) - qty) }
                : b
            )
          }
        }
        const totalStock = nextBatches.reduce((s, b) => s + (Number(b.stock) || 0), 0)
        db.prepare(
          'UPDATE products SET batches_json = ?, stock = ?, updated_at = datetime(\'now\') WHERE id = ?'
        ).run(JSON.stringify(nextBatches), totalStock, product.id)
      } else {
        const stock = Number(product.stock)
        if (Number.isFinite(stock)) {
          db.prepare(
            'UPDATE products SET stock = ?, updated_at = datetime(\'now\') WHERE id = ?'
          ).run(Math.max(0, stock - qty), product.id)
        }
      }
    }
  },
}
