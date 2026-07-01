import { dbGet, dbRun } from '../config/db.js'

const DEFAULTS = {
  storeName: 'SuperMart Billing',
  storeAddress: '',
  storeGstin: '',
  storeWebsite: '',
  storeUpiId: '',
  taxRate: 5,
  currency: '₹',
  discountEnabled: true,
  discountType: 'percent',
  maxDiscountPercent: 50,
  billDiscountEnabled: false,
}

function mapSettings(row) {
  if (!row) return { ...DEFAULTS }
  return {
    storeName: row.store_name,
    storeAddress: row.store_address,
    storeGstin: row.store_gstin,
    storeWebsite: row.store_website,
    storeUpiId: row.store_upi_id,
    taxRate: row.tax_rate,
    currency: row.currency,
    discountEnabled: Boolean(row.discount_enabled),
    discountType: row.discount_type,
    maxDiscountPercent: row.max_discount_percent,
    billDiscountEnabled: Boolean(row.bill_discount_enabled),
  }
}

export const SettingsModel = {
  async get() {
    let row = await dbGet('SELECT * FROM settings WHERE id = 1')
    if (!row) {
      await dbRun('INSERT INTO settings (id) VALUES (1)')
      row = await dbGet('SELECT * FROM settings WHERE id = 1')
    }
    return mapSettings(row)
  },

  async update(updates) {
    const current = await this.get()
    const next = { ...current, ...updates }
    await dbRun(
      `UPDATE settings SET
          store_name = ?, store_address = ?, store_gstin = ?, store_website = ?,
          store_upi_id = ?, tax_rate = ?, currency = ?, discount_enabled = ?,
          discount_type = ?, max_discount_percent = ?, bill_discount_enabled = ?
        WHERE id = 1`,
      [
        next.storeName,
        next.storeAddress,
        next.storeGstin,
        next.storeWebsite,
        next.storeUpiId,
        Number(next.taxRate),
        next.currency,
        next.discountEnabled ? 1 : 0,
        next.discountType,
        Number(next.maxDiscountPercent),
        next.billDiscountEnabled ? 1 : 0,
      ]
    )
    return this.get()
  },

  async reset() {
    await dbRun('DELETE FROM settings')
    await dbRun('INSERT INTO settings (id) VALUES (1)')
    return this.get()
  },
}
