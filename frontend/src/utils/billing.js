/**
 * Line gross before discount (price × qty).
 */
export function lineGross(item) {
  return Number(item.price) * Number(item.qty)
}

/**
 * Discount amount for one cart line based on settings discount type.
 * @param {object} item - cart line with price, qty, discount
 * @param {'percent'|'amount'} discountType
 */
export function lineDiscountAmount(item, discountType = 'percent') {
  const gross = lineGross(item)
  const discount = Math.max(0, Number(item.discount) || 0)
  if (discount <= 0 || gross <= 0) return 0

  if (discountType === 'amount') {
    return Math.min(discount, gross)
  }
  const pct = Math.min(discount, 100)
  return gross * (pct / 100)
}

export function lineNet(item, discountType = 'percent') {
  return Math.max(0, lineGross(item) - lineDiscountAmount(item, discountType))
}

export function calcCartTotals(items, { taxRate = 0, discountType = 'percent' } = {}) {
  const grossSubtotal = items.reduce((sum, i) => sum + lineGross(i), 0)
  const discountTotal = items.reduce((sum, i) => sum + lineDiscountAmount(i, discountType), 0)
  const subtotal = grossSubtotal - discountTotal
  const tax = subtotal * (Number(taxRate) / 100)
  const total = subtotal + tax
  return { grossSubtotal, discountTotal, subtotal, tax, total }
}

/**
 * Clamp discount input to valid range for the given type and line.
 */
export function clampDiscount(value, discountType, item, maxDiscountPercent = 100) {
  const num = Math.max(0, Number(value) || 0)
  if (discountType === 'amount') {
    return Math.min(num, lineGross(item))
  }
  return Math.min(num, maxDiscountPercent)
}
