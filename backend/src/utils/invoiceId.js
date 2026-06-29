import { getDb } from '../config/db.js'

export function randomInvoiceId() {
  const n = Math.floor(Math.random() * 100000)
  return `INV${String(n).padStart(5, '0')}`
}

function invoiceIdTaken(id) {
  const row = getDb().prepare('SELECT id FROM orders WHERE id = ?').get(id)
  return Boolean(row)
}

export function generateUniqueInvoiceId() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const id = randomInvoiceId()
    if (!invoiceIdTaken(id)) return id
  }
  const fallback = `INV${String(Date.now() % 100000).padStart(5, '0')}`
  return invoiceIdTaken(fallback)
    ? `INV${String((Date.now() + 1) % 100000).padStart(5, '0')}`
    : fallback
}
