import { useEffect, useMemo, useRef, useState } from 'react'
import JsBarcode from 'jsbarcode'
import { HiOutlineDownload, HiOutlinePrinter, HiOutlineSparkles } from 'react-icons/hi'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import PageHeader from '../components/common/PageHeader'
import { useStore } from '../context/StoreContext'
import { useToast } from '../context/ToastContext'

function sanitizeBarcode(value) {
  return String(value || '').replace(/[^0-9A-Za-z\-_.]/g, '')
}

function formatPrice(currency, price) {
  const num = Number(price)
  if (price === '' || isNaN(num)) return ''
  return `${currency}${num.toFixed(2)}`
}

function renderBarcodeOnSvg(svgEl, barcodeValue, compact = false) {
  JsBarcode(svgEl, barcodeValue, {
    format: 'CODE128',
    lineColor: compact ? '#111827' : '#1e1b4b',
    width: compact ? 1.6 : 2,
    height: compact ? 52 : 70,
    displayValue: true,
    margin: compact ? 2 : 8,
    fontSize: compact ? 10 : 14,
  })
}

function downloadBarcodeImage(svgEl, { barcodeValue, labelText, priceText }) {
  const svgData = new XMLSerializer().serializeToString(svgEl)
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)
  const img = new Image()

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const padding = 24
      const labelHeight = labelText ? 28 : 0
      const priceHeight = priceText ? 22 : 0
      const metaHeight = labelHeight + priceHeight
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(img.width + padding * 2, 280)
      canvas.height = img.height + padding * 2 + metaHeight
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      let y = padding
      if (labelText) {
        ctx.fillStyle = '#334155'
        ctx.font = 'bold 14px Inter, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(labelText, canvas.width / 2, y + 16)
        y += labelHeight
      }
      if (priceText) {
        ctx.fillStyle = '#7c3aed'
        ctx.font = 'bold 13px Inter, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(priceText, canvas.width / 2, y + 14)
        y += priceHeight
      }
      const x = (canvas.width - img.width) / 2
      ctx.drawImage(img, x, y)
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url)
        if (!blob) {
          reject(new Error('Failed to create image'))
          return
        }
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `barcode-${barcodeValue}.png`
        a.click()
        URL.revokeObjectURL(a.href)
        resolve()
      }, 'image/png')
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to render barcode'))
    }
    img.src = url
  })
}

function downloadBarcodeSvg(svgEl, barcodeValue) {
  const svgData = new XMLSerializer().serializeToString(svgEl)
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `barcode-${barcodeValue}.svg`
  a.click()
  URL.revokeObjectURL(a.href)
}

function LabelMeta({ label, priceText }) {
  return (
    <>
      {label && <p className="text-xs font-semibold text-slate-700 text-center">{label}</p>}
      {priceText && <p className="text-xs font-bold text-violet-600 text-center mt-0.5">{priceText}</p>}
    </>
  )
}

export default function BarcodePage() {
  const { products, settings } = useStore()
  const { showToast } = useToast()
  const currency = settings?.currency || '₹'

  const [mode, setMode] = useState('product')
  const [productId, setProductId] = useState('')
  const [barcode, setBarcode] = useState('')
  const [label, setLabel] = useState('')
  const [price, setPrice] = useState('')
  const [showPriceOnLabel, setShowPriceOnLabel] = useState(false)
  const [copies, setCopies] = useState('1')
  const svgRef = useRef(null)

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  )

  useEffect(() => {
    if (mode !== 'product' || !selectedProduct) return
    setBarcode(selectedProduct.barcode || '')
    setLabel(selectedProduct.name || '')
    setPrice(selectedProduct.price != null ? String(selectedProduct.price) : '')
  }, [mode, selectedProduct])

  const barcodeValue = sanitizeBarcode(barcode)
  const barcodeLabel = label.trim()
  const priceText = showPriceOnLabel ? formatPrice(currency, price) : ''

  useEffect(() => {
    if (!svgRef.current || !barcodeValue) return
    try {
      renderBarcodeOnSvg(svgRef.current, barcodeValue)
    } catch {
      // validation handled on submit
    }
  }, [barcodeValue])

  const switchToManual = () => {
    setMode('manual')
    setProductId('')
  }

  const switchToProduct = () => {
    setMode('product')
    setBarcode('')
    setLabel('')
    setPrice('')
    if (products[0]) setProductId(products[0].id)
  }

  const handlePrint = () => {
    const copyCount = Math.max(1, Number(copies) || 1)
    if (!barcodeValue) {
      showToast('Enter or select a valid barcode', 'error')
      return
    }

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) {
      showToast('Popup blocked. Please allow popups to print.', 'error')
      return
    }

    const labelsHtml = Array.from({ length: copyCount })
      .map(
        () => `
        <div class="label">
          ${barcodeLabel ? `<div class="name">${barcodeLabel}</div>` : ''}
          ${priceText ? `<div class="price">${priceText}</div>` : ''}
          <svg class="barcode"></svg>
        </div>
      `
      )
      .join('')

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode</title>
          <style>
            body { font-family: Inter, sans-serif; padding: 18px; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
            .label { border: 1px dashed #c4b5fd; border-radius: 10px; padding: 8px; text-align: center; }
            .name { font-size: 12px; color: #334155; margin-bottom: 4px; font-weight: 600; }
            .price { font-size: 11px; color: #7c3aed; margin-bottom: 6px; font-weight: 700; }
            .barcode { width: 100%; height: 84px; }
          </style>
        </head>
        <body>
          <div class="grid">${labelsHtml}</div>
        </body>
      </html>
    `)
    printWindow.document.close()

    printWindow.document.querySelectorAll('svg.barcode').forEach((svg) => {
      try {
        renderBarcodeOnSvg(svg, barcodeValue, true)
      } catch {
        // ignore malformed label generation
      }
    })

    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const handleDownloadPng = async () => {
    if (!barcodeValue) {
      showToast('Enter or select a valid barcode', 'error')
      return
    }
    if (!svgRef.current) {
      showToast('Barcode preview not ready', 'error')
      return
    }
    try {
      await downloadBarcodeImage(svgRef.current, {
        barcodeValue,
        labelText: barcodeLabel,
        priceText,
      })
      showToast('Barcode downloaded as PNG')
    } catch {
      showToast('Could not download barcode', 'error')
    }
  }

  const handleDownloadSvg = () => {
    if (!barcodeValue) {
      showToast('Enter or select a valid barcode', 'error')
      return
    }
    if (!svgRef.current) {
      showToast('Barcode preview not ready', 'error')
      return
    }
    downloadBarcodeSvg(svgRef.current, barcodeValue)
    showToast('Barcode downloaded as SVG')
  }

  const handleReset = () => {
    setMode('product')
    setProductId('')
    setBarcode('')
    setLabel('')
    setPrice('')
    setShowPriceOnLabel(false)
    setCopies('1')
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        icon={HiOutlinePrinter}
        iconClassName="from-violet-500 to-fuchsia-600 shadow-fuchsia-600/25"
        title="Barcode Studio"
        description="Select a product or enter details manually, then print or download labels."
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-5 sm:p-6 xl:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={switchToProduct}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                mode === 'product'
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
              }`}
            >
              From product
            </button>
            <button
              type="button"
              onClick={switchToManual}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                mode === 'manual'
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
              }`}
            >
              Manual entry
            </button>
          </div>

          {mode === 'product' ? (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Product</label>
              <p className="text-xs text-slate-400 mb-1.5">Pick from inventory — barcode, name, and price fill automatically</p>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="field-select"
              >
                <option value="">Select a product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.barcode}) — {currency}{Number(p.price).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <Input
                label="Barcode value"
                hint="Allowed: letters, numbers, dash, underscore, dot"
                value={barcode}
                onChange={(e) => setBarcode(sanitizeBarcode(e.target.value))}
                placeholder="e.g. 8901234567890"
              />
              <Input
                label="Product name"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Rice 1kg"
              />
              <Input
                label={`Price (${currency})`}
                hint="Optional — shown on label when enabled below"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </>
          )}

          {mode === 'product' && selectedProduct && (
            <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3 text-sm text-slate-600 space-y-1">
              <p><span className="font-semibold text-slate-800">Barcode:</span> <span className="font-mono">{barcodeValue || '—'}</span></p>
              <p><span className="font-semibold text-slate-800">Name:</span> {barcodeLabel || '—'}</p>
              <p><span className="font-semibold text-slate-800">Price:</span> {price !== '' ? formatPrice(currency, price) : '—'}</p>
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showPriceOnLabel}
              onChange={(e) => setShowPriceOnLabel(e.target.checked)}
              className="w-4 h-4 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
            />
            <span className="text-sm font-semibold text-slate-700">Show price on label (optional)</span>
          </label>

          {showPriceOnLabel && mode === 'product' && (
            <Input
              label={`Price override (${currency})`}
              hint="Leave as-is to use the product price, or edit before printing"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
          )}

          <Input
            label="Copies"
            type="number"
            min="1"
            max="200"
            value={copies}
            onChange={(e) => setCopies(e.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handlePrint}>
              <HiOutlinePrinter className="w-4 h-4" />
              Print barcodes
            </Button>
            <Button type="button" variant="secondary" onClick={handleDownloadPng}>
              <HiOutlineDownload className="w-4 h-4" />
              Download PNG
            </Button>
            <Button type="button" variant="outline" onClick={handleDownloadSvg}>
              <HiOutlineDownload className="w-4 h-4" />
              Download SVG
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <HiOutlineSparkles className="w-4 h-4 text-fuchsia-500" />
            Preview
          </h2>
          <div className="rounded-xl border-2 border-violet-200 bg-white p-4">
            {(barcodeLabel || priceText) && (
              <div className="mb-2">
                <LabelMeta label={barcodeLabel} priceText={priceText} />
              </div>
            )}
            {barcodeValue ? (
              <svg ref={svgRef} className="w-full" />
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">
                {mode === 'product' ? 'Select a product to preview' : 'Enter a barcode value to preview'}
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
