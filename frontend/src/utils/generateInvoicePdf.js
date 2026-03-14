import { jsPDF } from 'jspdf'

/**
 * Build invoice PDF and return the jsPDF document (for blob output or save)
 */
function buildInvoicePdf(settings, order) {
  const doc = new jsPDF()
  const { storeName = 'Store', currency = '₹' } = settings
  const { id, date, items = [], subtotal, tax, total, customerName = '', customerMobile = '' } = order

  let y = 22

  // Header block
  doc.setFillColor(16, 185, 129) // emerald-500
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont(undefined, 'bold')
  doc.text(storeName, 20, 16)
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  doc.text('TAX INVOICE / BILL', 20, 24)
  doc.setTextColor(0, 0, 0)
  y = 36

  // Invoice # and date
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  doc.text(`Bill No: ${id}`, 20, y)
  doc.setFont(undefined, 'normal')
  const dateStr = date ? new Date(date).toLocaleString() : new Date().toLocaleString()
  doc.text(`Date: ${dateStr}`, 120, y)
  y += 12

  // Customer details
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
    y += (customerMobile ? 26 : 20)
  }

  y += 4
  // Table header
  doc.setFillColor(241, 245, 249)
  doc.rect(20, y - 5, 170, 10, 'F')
  doc.setFont(undefined, 'bold')
  doc.setFontSize(10)
  doc.text('Item', 22, y + 2)
  doc.text('Qty', 95, y + 2)
  doc.text('Rate', 120, y + 2)
  doc.text('Amount', 155, y + 2)
  y += 10

  doc.setDrawColor(203, 213, 225)
  doc.line(20, y, 190, y)
  y += 6

  // Table rows
  doc.setFont(undefined, 'normal')
  items.forEach((row) => {
    const amount = row.price * row.qty
    doc.text(String(row.name).substring(0, 32), 22, y)
    doc.text(String(row.qty), 95, y)
    doc.text(`${currency}${Number(row.price).toFixed(2)}`, 120, y)
    doc.text(`${currency}${amount.toFixed(2)}`, 155, y)
    y += 6
  })

  y += 4
  doc.line(20, y, 190, y)
  y += 8

  // Totals
  doc.text('Subtotal:', 120, y)
  doc.text(`${currency}${Number(subtotal).toFixed(2)}`, 155, y)
  y += 6
  doc.text('Tax:', 120, y)
  doc.text(`${currency}${Number(tax).toFixed(2)}`, 155, y)
  y += 7
  doc.setFont(undefined, 'bold')
  doc.setFontSize(11)
  doc.text('Total:', 120, y)
  doc.text(`${currency}${Number(total).toFixed(2)}`, 155, y)
  y += 14

  // Footer
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
