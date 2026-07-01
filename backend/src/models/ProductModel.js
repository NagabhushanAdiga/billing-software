import { dbGet, dbAll, dbRun } from '../config/db.js'
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

function resolveGroupId(value, existingGroupId, groups) {
  if (value === undefined) {
    const current = existingGroupId || null
    return current && groups.some((g) => g.id === current) ? current : null
  }
  if (!value) return null
  return groups.some((g) => g.id === value) ? value : null
}

function resolveSubcategoryId(value, existingSubcategoryId, groupId, groups) {
  if (!groupId) return null
  const group = groups.find((g) => g.id === groupId)
  if (!group) return null
  if (value === undefined) {
    const current = existingSubcategoryId || null
    return current && group.subcategories?.some((s) => s.id === current) ? current : null
  }
  if (!value) return null
  return group.subcategories?.some((s) => s.id === value) ? value : null
}

export const ProductModel = {
  async findAll() {
    const groups = await GroupModel.findAll()
    const rows = await dbAll('SELECT * FROM products ORDER BY name')
    return rows.map((r) => mapProduct(r, groups))
  },

  async findById(id) {
    const row = await dbGet('SELECT * FROM products WHERE id = ?', [id])
    if (!row) return null
    return mapProduct(row, await GroupModel.findAll())
  },

  async findByBarcode(barcode) {
    const row = await dbGet('SELECT * FROM products WHERE barcode = ?', [
      String(barcode).trim(),
    ])
    if (!row) return null
    return mapProduct(row, await GroupModel.findAll())
  },

  async barcodeTaken(barcode, excludeId = null) {
    const row = excludeId
      ? await dbGet('SELECT id FROM products WHERE barcode = ? AND id != ?', [barcode, excludeId])
      : await dbGet('SELECT id FROM products WHERE barcode = ?', [barcode])
    return Boolean(row)
  },

  async create(product) {
    const id = product.id || createId(String(Date.now()))
    const groups = await GroupModel.findAll()
    const groupId = resolveGroupId(product.groupId, null, groups)
    const group = groupId ? groups.find((g) => g.id === groupId) : null
    const subcategoryId = resolveSubcategoryId(product.subcategoryId, null, groupId, groups)
    const batches = product.batches || []
    const totalStock = batches.length
      ? batches.reduce((s, b) => s + (Number(b.stock) || 0), 0)
      : Number(product.stock) || 0

    await dbRun(
      `INSERT INTO products (
          id, barcode, name, hsn, gst, group_id, subcategory_id, category,
          discount, price, stock, mrp, cost_price, batch, image, batches_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        product.barcode,
        product.name,
        product.hsn || '',
        Number(product.gst) || 0,
        groupId,
        subcategoryId,
        product.category || group?.name || '',
        Number(product.discount) || 0,
        Number(product.price) || 0,
        totalStock,
        product.mrp ?? null,
        product.costPrice ?? null,
        product.batch || '',
        product.image || '',
        JSON.stringify(batches),
      ]
    )
    return this.findById(id)
  },

  async update(id, updates) {
    const existing = await dbGet('SELECT * FROM products WHERE id = ?', [id])
    if (!existing) return false

    const groups = await GroupModel.findAll()
    const groupId = resolveGroupId(updates.groupId, existing.group_id, groups)
    const group = groupId ? groups.find((g) => g.id === groupId) : null
    const subcategoryId = resolveSubcategoryId(
      updates.subcategoryId,
      existing.subcategory_id,
      groupId,
      groups
    )
    const batches =
      updates.batches !== undefined
        ? updates.batches
        : parseJson(existing.batches_json, [])
    const totalStock = batches.length
      ? batches.reduce((s, b) => s + (Number(b.stock) || 0), 0)
      : updates.stock !== undefined
        ? Number(updates.stock)
        : existing.stock

    await dbRun(
      `UPDATE products SET
          barcode = ?, name = ?, hsn = ?, gst = ?, group_id = ?, subcategory_id = ?,
          category = ?, discount = ?, price = ?, stock = ?, mrp = ?, cost_price = ?,
          batch = ?, image = ?, batches_json = ?, updated_at = datetime('now')
        WHERE id = ?`,
      [
        updates.barcode !== undefined ? updates.barcode : existing.barcode,
        updates.name !== undefined ? updates.name : existing.name,
        updates.hsn !== undefined ? updates.hsn : existing.hsn,
        updates.gst !== undefined ? Number(updates.gst) : existing.gst,
        groupId,
        subcategoryId,
        updates.category !== undefined ? updates.category : group?.name || existing.category,
        updates.discount !== undefined ? Number(updates.discount) : existing.discount,
        updates.price !== undefined ? Number(updates.price) : existing.price,
        totalStock,
        updates.mrp !== undefined ? updates.mrp : existing.mrp,
        updates.costPrice !== undefined ? updates.costPrice : existing.cost_price,
        updates.batch !== undefined ? updates.batch : existing.batch,
        updates.image !== undefined ? updates.image : existing.image,
        JSON.stringify(batches),
        id,
      ]
    )
    return true
  },

  async delete(id) {
    const result = await dbRun('DELETE FROM products WHERE id = ?', [id])
    return result.changes > 0
  },

  async deleteAll() {
    await dbRun('DELETE FROM products')
  },

  async deductStockForOrder(items) {
    for (const line of items) {
      const product = await dbGet('SELECT * FROM products WHERE barcode = ?', [line.barcode])
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
        await dbRun(
          "UPDATE products SET batches_json = ?, stock = ?, updated_at = datetime('now') WHERE id = ?",
          [JSON.stringify(nextBatches), totalStock, product.id]
        )
      } else {
        const stock = Number(product.stock)
        if (Number.isFinite(stock)) {
          await dbRun(
            "UPDATE products SET stock = ?, updated_at = datetime('now') WHERE id = ?",
            [Math.max(0, stock - qty), product.id]
          )
        }
      }
    }
  },
}
