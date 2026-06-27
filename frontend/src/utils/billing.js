export const QTY_DECIMALS = 3

export function roundQty(q) {
  const n = Number(q)
  if (!Number.isFinite(n)) return 0
  const factor = 10 ** QTY_DECIMALS
  return Math.round(n * factor) / factor
}

export function parseStock(value) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? roundQty(n) : 0
}

/** Parse quantity from POS input (empty → fallback, min 0.001). */
export function parseQty(value, fallback = 1) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) {
    const fb = roundQty(fallback)
    return fb > 0 ? fb : 1
  }
  const n = parseFloat(trimmed)
  if (!Number.isFinite(n) || n <= 0) {
    const fb = roundQty(fallback)
    return fb > 0 ? fb : 1
  }
  return roundQty(n)
}

/** Display quantity without trailing zeros (e.g. 1.2, not 1.200). */
export function formatQty(qty) {
  const n = roundQty(qty)
  if (Number.isInteger(n)) return String(n)
  return n.toFixed(QTY_DECIMALS).replace(/\.?0+$/, '')
}

/**
 * Line gross before discount (selling price × qty).
 */
export function lineGross(item) {
  return Number(item.price) * Number(item.qty)
}

/**
 * MRP per unit — base for discount calculation (falls back to selling price).
 */
export function discountBasePrice(item) {
  const mrp = Number(item.mrp)
  if (Number.isFinite(mrp) && mrp > 0) return mrp
  return Number(item.price) || 0
}

function lineMrpGross(item) {
  return discountBasePrice(item) * Number(item.qty || 1)
}

/**
 * Available stock for a product (sums all batches).
 */
export function getProductStock(product) {
  if (Array.isArray(product?.batches) && product.batches.length > 0) {
    return product.batches.reduce((sum, b) => sum + parseStock(b.stock), 0)
  }
  const n = Number(product?.stock)
  return Number.isFinite(n) && n >= 0 ? roundQty(n) : 99
}

export function getCartLineStock(product, productBatchId) {
  if (productBatchId && Array.isArray(product?.batches)) {
    const batch = product.batches.find((b) => b.id === productBatchId)
    if (batch) return parseStock(batch.stock)
  }
  return getProductStock(product)
}

/**
 * Clamp cart quantity to available stock.
 */
export function clampQtyToStock(qty, product, productBatchId) {
  const max = getCartLineStock(product, productBatchId)
  const q = roundQty(Math.max(0, Number(qty) || 0))
  return Math.min(q, max)
}

/**
 * Stock left after items already in the bill.
 */
export function remainingStock(product, inCartQty = 0, productBatchId) {
  return Math.max(0, getCartLineStock(product, productBatchId) - inCartQty)
}

/**
 * Parse optional add-quantity from POS field (empty → 1).
 */
export function parseAddQty(value) {
  return parseQty(value, 1)
}

/** GST % for a cart line — uses product GST when set, otherwise store default. */
export function resolveItemGstRate(item, defaultTaxRate = 0) {
  const g = item?.gst
  if (g === '' || g == null) return Number(defaultTaxRate) || 0
  const n = Number(g)
  return Number.isFinite(n) && n >= 0 ? n : Number(defaultTaxRate) || 0
}

export function normalizeGst(value) {
  if (value === '' || value == null || value === undefined) return undefined
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0 || n > 100) return undefined
  return n
}

/**
 * Discount amount for one cart line based on settings discount type.
 * Percent and fixed discounts are calculated on MRP (per unit × qty).
 * @param {object} item - cart line with price, mrp, qty, discount
 * @param {'percent'|'amount'} discountType
 * @param {number} maxDiscountPercent - cap for percent discounts
 */
export function lineDiscountAmount(item, discountType = 'percent', maxDiscountPercent = 100) {
  const sellingGross = lineGross(item)
  const discount = Math.max(0, Number(item.discount) || 0)
  if (discount <= 0 || sellingGross <= 0) return 0

  const qty = Number(item.qty || 1)
  const mrpUnit = discountBasePrice(item)

  if (discountType === 'amount') {
    const unitDiscount = Math.min(discount, mrpUnit)
    return Math.min(unitDiscount * qty, sellingGross)
  }

  const cap = Math.min(Math.max(0, Number(maxDiscountPercent) || 100), 100)
  const pct = Math.min(discount, cap)
  const discountAmt = lineMrpGross(item) * (pct / 100)
  return Math.min(discountAmt, sellingGross)
}

export function lineNet(item, discountType = 'percent', maxDiscountPercent = 100) {
  return Math.max(0, lineGross(item) - lineDiscountAmount(item, discountType, maxDiscountPercent))
}

/**
 * Tax for a single line (applied on discounted line net).
 */
export function lineTax(item, defaultTaxRate = 0, discountType = 'percent', maxDiscountPercent = 100) {
  const rate = resolveItemGstRate(item, defaultTaxRate)
  const net = lineNet(item, discountType, maxDiscountPercent)
  return net * (rate / 100)
}

/**
 * Line total including tax.
 */
export function lineTotalWithTax(item, defaultTaxRate = 0, discountType = 'percent', maxDiscountPercent = 100) {
  return lineNet(item, discountType, maxDiscountPercent) + lineTax(item, defaultTaxRate, discountType, maxDiscountPercent)
}

export function calcCartTotals(
  items,
  { taxRate = 0, discountType = 'percent', maxDiscountPercent = 100 } = {}
) {
  const grossSubtotal = items.reduce((sum, i) => sum + lineGross(i), 0)
  const discountTotal = items.reduce(
    (sum, i) => sum + lineDiscountAmount(i, discountType, maxDiscountPercent),
    0
  )
  const subtotal = grossSubtotal - discountTotal
  const tax = items.reduce(
    (sum, i) => sum + lineTax(i, taxRate, discountType, maxDiscountPercent),
    0
  )
  const total = subtotal + tax
  return { grossSubtotal, discountTotal, subtotal, tax, total }
}

/**
 * Optional discount on the final bill total (after item discounts and tax).
 */
export function calcBillDiscountAmount(totalBeforeDiscount, billDiscount, billDiscountType = 'amount') {
  const base = Math.max(0, Number(totalBeforeDiscount) || 0)
  const raw = Math.max(0, Number(billDiscount) || 0)
  if (raw <= 0 || base <= 0) return 0

  if (billDiscountType === 'percent') {
    const pct = Math.min(raw, 100)
    return Math.min(base * (pct / 100), base)
  }

  return Math.min(raw, base)
}

export function applyBillDiscount(
  cartTotals,
  { billDiscount = 0, billDiscountType = 'amount' } = {}
) {
  const totalBeforeBillDiscount = cartTotals.total
  const billDiscountAmount = calcBillDiscountAmount(
    totalBeforeBillDiscount,
    billDiscount,
    billDiscountType
  )

  return {
    ...cartTotals,
    billDiscount: Math.max(0, Number(billDiscount) || 0),
    billDiscountType,
    billDiscountAmount,
    totalBeforeBillDiscount,
    total: Math.max(0, totalBeforeBillDiscount - billDiscountAmount),
  }
}

/**
 * Clamp discount input to valid range for the given type and line.
 */
export function clampDiscount(value, discountType, item, maxDiscountPercent = 100) {
  const num = Math.max(0, Number(value) || 0)
  if (discountType === 'amount') {
    return Math.min(num, discountBasePrice(item))
  }
  return Math.min(num, maxDiscountPercent)
}

/**
 * Format product discount for display in settings / lists.
 */
export function formatProductDiscount(discount, discountType, currency = '₹') {
  const val = Number(discount) || 0
  if (val <= 0) return 'No discount'
  return discountType === 'percent' ? `${val}% of MRP` : `${currency}${val.toFixed(2)} off MRP / unit`
}
