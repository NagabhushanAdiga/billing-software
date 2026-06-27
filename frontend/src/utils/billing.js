/**
 * Line gross before discount (price × qty).
 */
export function lineGross(item) {
  return Number(item.price) * Number(item.qty)
}

/**
 * Available stock for a product (defaults for legacy records without stock).
 */
export function getProductStock(product) {
  const n = Number(product?.stock)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 99
}

/**
 * Clamp cart quantity to available stock.
 */
export function clampQtyToStock(qty, product) {
  const max = getProductStock(product)
  const q = Math.max(0, Math.floor(Number(qty)) || 0)
  return Math.min(q, max)
}

/**
 * Stock left after items already in the bill.
 */
export function remainingStock(product, inCartQty = 0) {
  return Math.max(0, getProductStock(product) - inCartQty)
}

/**
 * Parse optional add-quantity from POS field (empty → 1).
 */
export function parseAddQty(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return 1
  const n = parseInt(trimmed, 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}

/**
 * Discount amount for one cart line based on settings discount type.
 * @param {object} item - cart line with price, qty, discount
 * @param {'percent'|'amount'} discountType
 * @param {number} maxDiscountPercent - cap for percent discounts
 */
export function lineDiscountAmount(item, discountType = 'percent', maxDiscountPercent = 100) {
  const gross = lineGross(item)
  const discount = Math.max(0, Number(item.discount) || 0)
  if (discount <= 0 || gross <= 0) return 0

  if (discountType === 'amount') {
    const unitDiscount = Math.min(discount, Number(item.price) || 0)
    return Math.min(unitDiscount * Number(item.qty || 1), gross)
  }

  const cap = Math.min(Math.max(0, Number(maxDiscountPercent) || 100), 100)
  const pct = Math.min(discount, cap)
  return gross * (pct / 100)
}

export function lineNet(item, discountType = 'percent', maxDiscountPercent = 100) {
  return Math.max(0, lineGross(item) - lineDiscountAmount(item, discountType, maxDiscountPercent))
}

/**
 * Tax for a single line (applied on discounted line net).
 */
export function lineTax(item, taxRate = 0, discountType = 'percent', maxDiscountPercent = 100) {
  const net = lineNet(item, discountType, maxDiscountPercent)
  return net * (Number(taxRate) / 100)
}

/**
 * Line total including tax.
 */
export function lineTotalWithTax(item, taxRate = 0, discountType = 'percent', maxDiscountPercent = 100) {
  return lineNet(item, discountType, maxDiscountPercent) + lineTax(item, taxRate, discountType, maxDiscountPercent)
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
 * Clamp discount input to valid range for the given type and line.
 */
export function clampDiscount(value, discountType, item, maxDiscountPercent = 100) {
  const num = Math.max(0, Number(value) || 0)
  if (discountType === 'amount') {
    return Math.min(num, Number(item.price) || 0)
  }
  return Math.min(num, maxDiscountPercent)
}

/**
 * Format product discount for display in settings / lists.
 */
export function formatProductDiscount(discount, discountType, currency = '₹') {
  const val = Number(discount) || 0
  if (val <= 0) return 'No discount'
  return discountType === 'percent' ? `${val}%` : `${currency}${val.toFixed(2)} / unit`
}
