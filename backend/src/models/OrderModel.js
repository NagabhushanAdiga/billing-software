import { getDb } from '../config/db.js'
import { createId, parseJson } from '../utils/helpers.js'

function mapOrder(row) {
  return {
    id: row.id,
    date: row.date,
    createdBy: parseJson(row.created_by_json),
    customerName: row.customer_name || '',
    customerMobile: row.customer_mobile || '',
    items: parseJson(row.items_json, []),
    grossSubtotal: row.gross_subtotal,
    discountTotal: row.discount_total,
    subtotal: row.subtotal,
    tax: row.tax,
    totalBeforeBillDiscount: row.total_before_bill_discount,
    billDiscount: row.bill_discount,
    billDiscountType: row.bill_discount_type,
    billDiscountAmount: row.bill_discount_amount,
    total: row.total,
  }
}

export const OrderModel = {
  findAll() {
    const rows = getDb()
      .prepare('SELECT * FROM orders ORDER BY date DESC')
      .all()
    return rows.map(mapOrder)
  },

  findById(id) {
    const row = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(id)
    return row ? mapOrder(row) : null
  },

  create(order, actor) {
    const id = order.id || createId('ord')
    const date = order.date || new Date().toISOString()
    const createdBy = order.createdBy || actor || null

    getDb()
      .prepare(
        `INSERT INTO orders (
          id, date, created_by_id, created_by_json, customer_name, customer_mobile,
          items_json, gross_subtotal, discount_total, subtotal, tax,
          total_before_bill_discount, bill_discount, bill_discount_type,
          bill_discount_amount, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        date,
        createdBy?.id || null,
        createdBy ? JSON.stringify(createdBy) : null,
        order.customerName || '',
        order.customerMobile || '',
        JSON.stringify(order.items || []),
        Number(order.grossSubtotal) || 0,
        Number(order.discountTotal) || 0,
        Number(order.subtotal) || 0,
        Number(order.tax) || 0,
        Number(order.totalBeforeBillDiscount) || 0,
        Number(order.billDiscount) || 0,
        order.billDiscountType || 'amount',
        Number(order.billDiscountAmount) || 0,
        Number(order.total) || 0
      )

    return this.findById(id)
  },

  deleteAll() {
    getDb().prepare('DELETE FROM orders').run()
  },
}
