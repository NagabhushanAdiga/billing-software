import { useState, useCallback, useEffect, useRef } from 'react'
import BarcodeInput from '../components/billing/BarcodeInput'
import { useHardwareScanner } from '../hooks/useHardwareScanner'
import CartSummary from '../components/billing/CartSummary'
import PosSummaryPanel from '../components/billing/PosSummaryPanel'
import Card from '../components/common/Card'
import ProductImage from '../components/common/ProductImage'
import AddProductModal from '../components/billing/AddProductModal'
import Button from '../components/common/Button'
import { useStore } from '../context/StoreContext'
import { useToast } from '../context/ToastContext'
import { generateInvoicePdfForPrint } from '../utils/generateInvoicePdf'
import InvoiceCustomerModal from '../components/billing/InvoiceCustomerModal'
import { calcCartTotals, lineDiscountAmount, lineNet } from '../utils/billing'

function isTypingTarget(el) {
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

function addProductToCart(prev, product) {
  const existing = prev.find((i) => i.barcode === product.barcode)
  if (existing) {
    return prev.map((i) =>
      i.barcode === product.barcode ? { ...i, qty: i.qty + 1 } : i
    )
  }
  return [...prev, { ...product, qty: 1, cartId: Date.now(), discount: Number(product.discount) || 0 }]
}

export default function PosPage() {
  const { products, getProductByBarcode, addProduct, addOrder, settings } = useStore()
  const { showToast } = useToast()
  const [cart, setCart] = useState([])
  const [notFoundBarcode, setNotFoundBarcode] = useState(null)
  const [nameSearchResults, setNameSearchResults] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBillDialog, setShowBillDialog] = useState(false)
  const barcodeInputRef = useRef(null)
  const {
    taxRate = 5,
    currency = '₹',
    discountEnabled = true,
    discountType = 'percent',
  } = settings
  const scannerActive = !showAddModal && !showBillDialog

  const { grossSubtotal, discountTotal, subtotal, tax, total } = calcCartTotals(cart, {
    taxRate,
    discountType,
  })
  const totalQty = cart.reduce((sum, i) => sum + i.qty, 0)

  const addToCart = useCallback((product) => {
    setCart((prev) => addProductToCart(prev, product))
  }, [])

  const handleScan = useCallback(
    (value) => {
      const trimmed = String(value).trim()
      if (!trimmed) return

      setNotFoundBarcode(null)
      setNameSearchResults([])

      const byBarcode = getProductByBarcode(trimmed)
      if (byBarcode) {
        addToCart(byBarcode)
        return
      }

      const byName = products.filter((p) =>
        p.name.toLowerCase().includes(trimmed.toLowerCase())
      )
      if (byName.length === 0) {
        setNotFoundBarcode(trimmed)
        showToast('Product not found — add it or try another scan', 'error')
      } else if (byName.length === 1) {
        addToCart(byName[0])
      } else {
        setNameSearchResults(byName)
      }
    },
    [getProductByBarcode, products, addToCart, showToast]
  )

  useHardwareScanner(handleScan, { active: scannerActive })

  const handleSelectFromSearch = useCallback((product) => {
    addToCart(product)
    setNameSearchResults([])
  }, [addToCart])

  useEffect(() => {
    if (nameSearchResults.length === 0) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') setNameSearchResults([])
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [nameSearchResults.length])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (isTypingTarget(document.activeElement)) return

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        barcodeInputRef.current?.focus()
        return
      }
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        openAddModal()
        return
      }
      if (e.key === 'F2') {
        e.preventDefault()
        if (cart.length > 0) setShowBillDialog(true)
        return
      }
      if (e.key === 'Delete') {
        e.preventDefault()
        if (cart.length > 0) handleClearCart()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [cart.length, handleClearCart])

  const handleAddProductManually = useCallback(
    (data) => {
      const id = addProduct(data)
      const newProduct = { id, ...data }
      setCart((prev) => [...prev, { ...newProduct, qty: 1, cartId: Date.now(), discount: Number(newProduct.discount) || 0 }])
      setShowAddModal(false)
      setNotFoundBarcode(null)
    },
    [addProduct]
  )

  const openAddModal = () => setShowAddModal(true)
  const closeAddModal = () => {
    setShowAddModal(false)
    setNotFoundBarcode(null)
  }

  const handleQtyChange = useCallback((item, delta) => {
    setCart((prev) =>
      prev
        .map((i) => (i.barcode === item.barcode ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    )
  }, [])

  const handleRemove = useCallback((item) => {
    setCart((prev) => prev.filter((i) => i.cartId !== item.cartId || i.barcode !== item.barcode))
    showToast(`Removed ${item.name}`, 'info')
  }, [showToast])

  const handleClearCart = useCallback(() => {
    setCart([])
    barcodeInputRef.current?.focus()
    showToast('Bill cleared', 'info')
  }, [showToast])

  const handleGenerateBillClick = useCallback(() => {
    if (cart.length === 0) return
    setShowBillDialog(true)
  }, [cart.length])

  const handlePrintBillConfirm = useCallback(
    ({ customerName, customerMobile }) => {
      const orderPayload = {
        items: cart.map((item) => ({
          name: item.name,
          barcode: item.barcode,
          price: item.price,
          qty: item.qty,
          discount: item.discount || 0,
          lineDiscount: lineDiscountAmount(item, discountType),
          lineTotal: lineNet(item, discountType),
        })),
        grossSubtotal,
        discountTotal,
        subtotal,
        tax,
        total,
        customerName: (customerName || '').trim(),
        customerMobile: (customerMobile || '').trim(),
      }
      const orderId = addOrder(orderPayload)
      const savedOrder = {
        id: orderId,
        date: new Date().toISOString(),
        ...orderPayload,
      }
      generateInvoicePdfForPrint(settings, savedOrder)
      setCart([])
      setShowBillDialog(false)
      barcodeInputRef.current?.focus()
      showToast('Bill generated — ready for next customer')
    },
    [cart, grossSubtotal, discountTotal, subtotal, tax, total, discountType, addOrder, settings, showToast]
  )

  return (
    <div className="h-full flex flex-col gap-5 sm:gap-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2 flex flex-col gap-4 sm:gap-5">
          <Card className="p-5 sm:p-6 border-2 border-violet-200 shadow-lg shadow-violet-100/60">
            <BarcodeInput
              ref={barcodeInputRef}
              active={scannerActive}
              onScan={handleScan}
              placeholder="Scan barcode or type product name... (Ctrl/Cmd+K to focus)"
            />

            {nameSearchResults.length > 0 && (
              <div className="mt-4 rounded-xl border-2 border-violet-200 bg-gradient-to-b from-violet-50/80 to-fuchsia-50/40 max-h-52 overflow-auto">
                <p className="text-violet-800 text-xs font-bold px-4 py-2.5 border-b border-violet-200/60">
                  {nameSearchResults.length} matches — click to add
                </p>
                <ul className="py-1 divide-y divide-violet-100/80">
                  {nameSearchResults.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectFromSearch(p)}
                        className="w-full px-4 py-3 text-left hover:bg-white flex items-center gap-3 transition-colors"
                      >
                        <ProductImage product={p} size="sm" />
                        <span className="text-slate-900 font-medium truncate text-sm flex-1">{p.name}</span>
                        <span className="text-fuchsia-600 text-sm font-bold shrink-0">{currency}{Number(p.price).toFixed(2)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {notFoundBarcode && (
              <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center gap-3">
                <p className="text-amber-900 text-sm flex-1">
                  <span className="font-semibold">Not in inventory:</span>{' '}
                  <span className="font-mono">{notFoundBarcode}</span>
                </p>
                <div className="flex gap-2 shrink-0">
                  <Button variant="primary" className="!py-2 !px-3 text-sm" onClick={openAddModal}>
                    Add product
                  </Button>
                  <Button variant="outline" className="!py-2 !px-3 text-sm" onClick={() => setNotFoundBarcode(null)}>
                    Dismiss
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5 sm:p-6 flex-1 flex flex-col min-h-[320px]">
            <h2 className="text-base font-bold bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent mb-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 animate-pulse" />
              Current bill
            </h2>
            <p className="text-slate-400 text-xs mb-4">
              Tap +/− to adjust quantities{discountEnabled ? ' · discount applies from product settings' : ''}
            </p>
            <CartSummary
              items={cart}
              onQtyChange={handleQtyChange}
              onRemove={handleRemove}
              currency={currency}
              discountEnabled={discountEnabled}
              discountType={discountType}
              editableDiscount={false}
            />
          </Card>
        </div>

        <div className="xl:col-span-1">
          <PosSummaryPanel
            itemCount={cart.length}
            totalQty={totalQty}
            grossSubtotal={grossSubtotal}
            discountTotal={discountTotal}
            subtotal={subtotal}
            tax={tax}
            total={total}
            taxRate={taxRate}
            currency={currency}
            discountEnabled={discountEnabled}
            onGenerateBill={handleGenerateBillClick}
            onClearCart={handleClearCart}
            onAddProduct={() => { setNotFoundBarcode(''); openAddModal() }}
          />
        </div>
      </div>

      <AddProductModal
        open={showAddModal}
        initialBarcode={notFoundBarcode || ''}
        onAdd={handleAddProductManually}
        onCancel={closeAddModal}
      />
      <InvoiceCustomerModal
        open={showBillDialog}
        totalFormatted={total ? `${currency}${total.toFixed(2)}` : ''}
        onConfirm={handlePrintBillConfirm}
        onCancel={() => setShowBillDialog(false)}
      />
    </div>
  )
}
