import {
  lineGross,
  lineDiscountAmount,
  lineNet,
  lineTax,
  lineTotalWithTax,
  formatQty,
  resolveItemGstRate,
} from './billing'
import { buildUpiPaymentUrl, generatePaymentQrDataUrl } from './paymentQr'

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function money(amount, currency = '₹') {
  return `${currency}${Number(amount || 0).toFixed(2)}`
}

function formatBillDate(iso) {
  const d = iso ? new Date(iso) : new Date()
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export async function buildInvoiceHtml(settings, order) {
  const {
    storeName = 'Store',
    storeAddress = '',
    storeGstin = '',
    storeWebsite = '',
    storeUpiId = '',
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
    createdBy,
  } = order

  const billedBy = createdBy?.name || createdBy?.username || ''
  const gross = grossSubtotal ?? items.reduce((s, r) => s + lineGross(r), 0)
  const disc = discountTotal ?? 0
  const taxable = subtotal ?? gross - disc
  const totalTax = tax ?? 0
  const grandTotal = total ?? 0
  const hasDiscount = disc > 0 || items.some((i) => (i.lineDiscount || i.discount) > 0)
  const hasHsn = items.some((i) => i.hsn)
  const hasTax = totalTax > 0
  const hasBillDiscount = billDiscountAmount > 0

  const paymentUrl = buildUpiPaymentUrl(settings, order)
  const qrDataUrl = await generatePaymentQrDataUrl(paymentUrl)

  const itemRows = items
    .map((row, index) => {
      const itemRow = {
        price: row.price,
        qty: row.qty,
        discount: row.discount || 0,
        mrp: row.mrp,
        gst: row.gst,
      }
      const lineDisc =
        row.lineDiscount != null
          ? row.lineDiscount
          : lineDiscountAmount(itemRow, discountType, maxDiscountPercent)
      const lineAmt =
        row.lineGrandTotal != null
          ? row.lineGrandTotal
          : lineTotalWithTax(itemRow, taxRate, discountType, maxDiscountPercent)
      const itemGst = resolveItemGstRate(itemRow, taxRate)
      const itemTax =
        row.lineTax != null ? row.lineTax : lineTax(itemRow, taxRate, discountType, maxDiscountPercent)
      const meta = [
        row.batch ? `Batch: ${esc(row.batch)}` : '',
        hasHsn && row.hsn ? `HSN ${esc(row.hsn)}` : '',
        hasTax && itemTax > 0 ? `GST ${itemGst}%` : '',
      ]
        .filter(Boolean)
        .join(' · ')

      return `
        <tr style="background:${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
            <div style="font-weight:600;color:#0f172a;font-size:12px;">${esc(row.name)}</div>
            ${meta ? `<div style="font-size:10px;color:#64748b;margin-top:3px;">${meta}</div>` : ''}
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:11px;white-space:nowrap;">${formatQty(row.qty)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:11px;white-space:nowrap;">${money(row.price, '')}</td>
          ${hasDiscount ? `<td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:11px;color:#059669;white-space:nowrap;">${lineDisc > 0 ? `-${money(lineDisc, '')}` : '—'}</td>` : ''}
          ${hasTax ? `<td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:11px;white-space:nowrap;">${money(itemTax, '')}</td>` : ''}
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;font-size:11px;white-space:nowrap;">${money(lineAmt, currency)}</td>
        </tr>`
    })
    .join('')

  return `
<div style="font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;font-size:12px;line-height:1.45;width:100%;max-width:760px;margin:0 auto;background:#fff;">
  <div style="height:6px;background:linear-gradient(90deg,#7c3aed,#db2777,#0ea5e9);"></div>

  <div style="padding:28px 32px 20px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="vertical-align:top;width:58%;">
          <div style="font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;">${esc(storeName)}</div>
          ${storeAddress ? `<div style="margin-top:8px;font-size:11px;color:#475569;white-space:pre-line;line-height:1.55;">${esc(storeAddress)}</div>` : ''}
          ${storeGstin ? `<div style="margin-top:10px;font-size:11px;"><span style="color:#64748b;">GSTIN:</span> <strong style="font-family:monospace;letter-spacing:0.04em;">${esc(storeGstin)}</strong></div>` : ''}
          ${storeWebsite ? `<div style="margin-top:4px;font-size:11px;color:#4f46e5;">${esc(storeWebsite)}</div>` : ''}
        </td>
        <td style="vertical-align:top;text-align:right;width:42%;">
          <div style="font-size:26px;font-weight:800;color:#7c3aed;letter-spacing:0.06em;">INVOICE</div>
          <div style="margin-top:12px;font-size:11px;color:#475569;">
            <div><span style="color:#94a3b8;">Bill No.</span> <strong style="color:#0f172a;font-family:monospace;">${esc(id)}</strong></div>
            <div style="margin-top:4px;"><span style="color:#94a3b8;">Date</span> ${esc(formatBillDate(date))}</div>
            ${billedBy ? `<div style="margin-top:4px;"><span style="color:#94a3b8;">Cashier</span> ${esc(billedBy)}</div>` : ''}
          </div>
        </td>
      </tr>
    </table>
  </div>

  ${customerName || customerMobile ? `
  <div style="margin:0 32px 20px;padding:14px 16px;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;">
    <div style="font-size:10px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Bill To</div>
    ${customerName ? `<div style="font-size:13px;font-weight:600;">${esc(customerName)}</div>` : ''}
    ${customerMobile ? `<div style="font-size:11px;color:#475569;margin-top:2px;">Mobile: ${esc(customerMobile)}</div>` : ''}
  </div>` : ''}

  <div style="padding:0 32px 24px;">
    <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#1e293b;color:#fff;">
          <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;background:#1e293b;color:#fff;">Item</th>
          <th style="padding:10px 8px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;width:48px;background:#1e293b;color:#fff;">Qty</th>
          <th style="padding:10px 8px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;width:64px;background:#1e293b;color:#fff;">Rate</th>
          ${hasDiscount ? '<th style="padding:10px 8px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;width:56px;background:#1e293b;color:#fff;">Disc</th>' : ''}
          ${hasTax ? '<th style="padding:10px 8px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;width:56px;background:#1e293b;color:#fff;">Tax</th>' : ''}
          <th style="padding:10px 12px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;width:72px;background:#1e293b;color:#fff;">Amount</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
  </div>

  <div style="padding:0 32px 28px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="vertical-align:top;width:50%;padding-right:20px;">
          ${qrDataUrl ? `
          <div style="border:1px solid #e2e8f0;border-radius:10px;padding:16px;text-align:center;background:#fafafa;max-width:220px;">
            <img src="${qrDataUrl}" alt="Scan to pay" width="140" height="140" style="display:block;margin:0 auto;" />
            <div style="margin-top:10px;font-size:11px;font-weight:700;color:#0f172a;">Scan to Pay</div>
            <div style="font-size:18px;font-weight:800;color:#7c3aed;margin-top:4px;">${money(grandTotal, currency)}</div>
            ${storeUpiId ? `<div style="font-size:10px;color:#64748b;margin-top:6px;font-family:monospace;">UPI: ${esc(storeUpiId)}</div>` : ''}
          </div>` : `
          <div style="border:1px dashed #cbd5e1;border-radius:10px;padding:16px;max-width:220px;color:#64748b;font-size:11px;">
            Add a UPI ID in Settings to show a payment QR code on bills.
          </div>`}
        </td>
        <td style="vertical-align:top;width:50%;">
          <table style="width:100%;max-width:280px;margin-left:auto;border-collapse:collapse;font-size:12px;">
            <tr><td style="padding:5px 0;color:#64748b;">Subtotal</td><td style="padding:5px 0;text-align:right;font-weight:600;">${money(gross, currency)}</td></tr>
            ${disc > 0 ? `<tr><td style="padding:5px 0;color:#059669;">Discount</td><td style="padding:5px 0;text-align:right;font-weight:600;color:#059669;">−${money(disc, currency)}</td></tr>` : ''}
            ${disc > 0 ? `<tr><td style="padding:5px 0;color:#64748b;">Taxable amount</td><td style="padding:5px 0;text-align:right;font-weight:600;">${money(taxable, currency)}</td></tr>` : ''}
            ${hasTax ? `<tr><td style="padding:5px 0;color:#64748b;">GST / Tax</td><td style="padding:5px 0;text-align:right;font-weight:600;">${money(totalTax, currency)}</td></tr>` : ''}
            ${hasBillDiscount ? `<tr><td style="padding:5px 0;color:#059669;">Bill discount</td><td style="padding:5px 0;text-align:right;font-weight:600;color:#059669;">−${money(billDiscountAmount, currency)}</td></tr>` : ''}
            <tr>
              <td style="padding:12px 0 0;border-top:2px solid #1e293b;font-size:14px;font-weight:800;">Total</td>
              <td style="padding:12px 0 0;border-top:2px solid #1e293b;text-align:right;font-size:18px;font-weight:800;color:#7c3aed;">${money(grandTotal, currency)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>

  <div style="border-top:1px solid #e2e8f0;padding:16px 32px 24px;text-align:center;color:#64748b;font-size:11px;">
    <div style="font-weight:600;color:#334155;">Thank you for shopping with us!</div>
    <div style="margin-top:4px;">This is a computer-generated invoice.</div>
  </div>
  <div style="height:4px;background:linear-gradient(90deg,#7c3aed,#db2777,#0ea5e9);"></div>
</div>`
}
