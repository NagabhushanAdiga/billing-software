import { jsPDF } from 'jspdf'
import { lineGross, lineDiscountAmount, lineNet, lineTax, lineTotalWithTax, formatQty } from './billing'

/**
 * Build invoice PDF and return the jsPDF document (for blob output or save)
 */
function buildInvoicePdf(settings, order) {
  const doc = new jsPDF()
  const {
    storeName = 'Store',
    storeAddress = '',
    storeGstin = '',
    storeWebsite = '',
    currency = '₹',
    discountType = 'percent',
    taxRate = 0,
    maxDiscountPercent = 100,
  } = settings
  const {
    id,
    date,
    items = [],
    grossSubtotal,
    discountTotal = 0,
    billDiscountAmount = 0,
    subtotal,
    tax,
    total,
    customerName = '',
    customerMobile = '',
  } = order

  const hasItemDiscount = discountTotal > 0 || items.some((row) => (row.discount || 0) > 0 || (row.lineDiscount || 0) > 0)
  const hasBillDiscount = Number(billDiscountAmount) > 0
  const hasDiscount = hasItemDiscount
  const hasHsn = items.some((row) => row.hsn)
  const hasTax = Number(taxRate) > 0 || Number(tax) > 0

  let y = 22

  doc.setFillColor(139, 92, 246)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont(undefined, 'bold')
  doc.text(storeName, 20, 16)
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  doc.text('TAX INVOICE / BILL', 20, 24)
  doc.setTextColor(0, 0, 0)
  y = 34

  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')
  if (storeAddress) {
    const addressLines = doc.splitTextToSize(storeAddress, 170)
    addressLines.forEach((line) => {
      doc.text(line, 20, y)
      y += 4
    })
    y += 1
  }
  if (storeGstin) {
    doc.setFont(undefined, 'bold')
    doc.text(`GSTIN: ${storeGstin}`, 20, y)
    doc.setFont(undefined, 'normal')
    y += 5
  }
  if (storeWebsite) {
    doc.setTextColor(79, 70, 229)
    doc.text(storeWebsite, 20, y)
    doc.setTextColor(0, 0, 0)
    y += 5
  }
  if (storeAddress || storeGstin || storeWebsite) {
    y += 2
  } else {
    y = 36
  }

  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  doc.text(`Bill No: ${id}`, 20, y)
  doc.setFont(undefined, 'normal')
  const dateStr = date ? new Date(date).toLocaleString() : new Date().toLocaleString()
  doc.text(`Date: ${dateStr}`, 120, y)
  y += 12

  if (customerName || customerMobile) {
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.3)
    doc.rect(20, y - 2, 170, customerMobile ? 22 : 16)
    doc.setFont(undefined, 'bold')
    doc.setFontSize(10)
    doc.text('Bill To:', 25, y + 4)
    doc.setFont(undefined, 'normal')
    if (customerName) doc.text(customerName, 25, y + 11)
    if (customerMobile) doc.text(`Mobile: ${customerMobile}`, 25, y + 18)
    y += customerMobile ? 26 : 20
  }

  y += 4
  doc.setFillColor(245, 243, 255)
  doc.rect(20, y - 5, 170, 10, 'F')
  doc.setFont(undefined, 'bold')
  doc.setFontSize(8)
  doc.text('Item', 22, y + 2)
  doc.text('Qty', 72, y + 2)
  doc.text('Rate', 84, y + 2)
  if (hasDiscount) doc.text('Disc', 102, y + 2)
  doc.text('Net', hasDiscount ? 118 : 108, y + 2)
  if (hasTax) doc.text('Tax', hasDiscount ? 136 : 126, y + 2)
  doc.text('Total', hasDiscount ? (hasTax ? 154 : 142) : hasTax ? 148 : 138, y + 2)
  y += 10

  doc.setDrawColor(203, 213, 225)
  doc.line(20, y, 190, y)
  y += 6

  doc.setFont(undefined, 'normal')
  doc.setFontSize(8)
  items.forEach((row) => {
    const itemRow = { price: row.price, qty: row.qty, discount: row.discount || 0 }
    const net = row.lineTotal != null ? row.lineTotal : lineNet(itemRow, discountType, maxDiscountPercent)
    const discAmt = row.lineDiscount != null ? row.lineDiscount : lineDiscountAmount(itemRow, discountType, maxDiscountPercent)
    const rowTax = row.lineTax != null ? row.lineTax : lineTax(itemRow, taxRate, discountType, maxDiscountPercent)
    const amount = row.lineGrandTotal != null ? row.lineGrandTotal : lineTotalWithTax(itemRow, taxRate, discountType, maxDiscountPercent)

    doc.text(String(row.name).substring(0, 22), 22, y)
    if (hasHsn) {
      doc.setFontSize(7)
      doc.setTextColor(100, 116, 139)
      doc.text(row.hsn ? `HSN ${row.hsn}` : '—', 22, y + 3.5)
      doc.setFontSize(8)
      doc.setTextColor(0, 0, 0)
    }
    doc.text(formatQty(row.qty), 72, y)
    doc.text(`${currency}${Number(row.price).toFixed(2)}`, 84, y)
    if (hasDiscount) {
      doc.text(discAmt > 0 ? `-${currency}${discAmt.toFixed(2)}` : '—', 102, y)
    }
    doc.text(`${currency}${net.toFixed(2)}`, hasDiscount ? 118 : 108, y)
    if (hasTax) {
      doc.text(`${currency}${rowTax.toFixed(2)}`, hasDiscount ? 136 : 126, y)
    }
    doc.text(`${currency}${amount.toFixed(2)}`, hasDiscount ? (hasTax ? 154 : 142) : hasTax ? 148 : 138, y)
    y += hasHsn ? 9 : 6
  })

  y += 4
  doc.line(20, y, 190, y)
  y += 8

  const gross = grossSubtotal != null ? grossSubtotal : items.reduce((s, r) => s + lineGross(r), 0)
  const disc = discountTotal != null ? discountTotal : gross - (subtotal || gross)
  const netSubtotal = subtotal != null ? subtotal : gross - disc

  doc.setFontSize(10)
  doc.text('Subtotal:', 120, y)
  doc.text(`${currency}${Number(gross).toFixed(2)}`, 155, y)
  y += 6

  if (hasDiscount && disc > 0) {
    doc.setTextColor(16, 120, 80)
    doc.text('Discount:', 120, y)
    doc.text(`-${currency}${Number(disc).toFixed(2)}`, 155, y)
    doc.setTextColor(0, 0, 0)
    y += 6
    doc.text('Taxable:', 120, y)
    doc.text(`${currency}${Number(netSubtotal).toFixed(2)}`, 155, y)
    y += 6
  }

  doc.text(`Tax (${taxRate}%):`, 120, y)
  doc.text(`${currency}${Number(tax).toFixed(2)}`, 155, y)
  y += 6

  if (hasBillDiscount) {
    doc.setTextColor(16, 120, 80)
    doc.text('Bill discount:', 120, y)
    doc.text(`-${currency}${Number(billDiscountAmount).toFixed(2)}`, 155, y)
    doc.setTextColor(0, 0, 0)
    y += 6
  }

  y += 1
  doc.setFont(undefined, 'bold')
  doc.setFontSize(11)
  doc.text('Total:', 120, y)
  doc.text(`${currency}${Number(total).toFixed(2)}`, 155, y)
  y += 14

  doc.setFont(undefined, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text('Thank you for your business!', 105, y, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  return doc
}

/**
 * Generate and download invoice PDF
 */
export function generateInvoicePdf(settings, order) {
  const doc = buildInvoicePdf(settings, order)
  doc.save(`invoice-${order.id}.pdf`)
}

/**
 * Generate invoice PDF as blob and open in new tab for printing
 */
export function generateInvoicePdfForPrint(settings, order) {
  const doc = buildInvoicePdf(settings, order)
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  const printWindow = window.open(url, '_blank')
  if (printWindow) {
    setTimeout(() => {
      try {
        printWindow.print()
      } catch (e) {
        // User can press Ctrl+P / Cmd+P in the new tab
      }
      URL.revokeObjectURL(url)
    }, 600)
  }
  return blob
}
