import { useState, useCallback, useEffect } from 'react'
import { HiOutlineShoppingCart } from 'react-icons/hi'
import BarcodeInput from '../components/billing/BarcodeInput'
import CartSummary from '../components/billing/CartSummary'
import Card from '../components/common/Card'
import AddProductModal from '../components/billing/AddProductModal'
import Button from '../components/common/Button'
import { useStore } from '../context/StoreContext'
import { generateInvoicePdfForPrint } from '../utils/generateInvoicePdf'
import InvoiceCustomerModal from '../components/billing/InvoiceCustomerModal'

function addProductToCart(prev, product) {
  const existing = prev.find((i) => i.barcode === product.barcode)
  if (existing) {
    return prev.map((i) =>
      i.barcode === product.barcode ? { ...i, qty: i.qty + 1 } : i
    )
  }
  return [...prev, { ...product, qty: 1, cartId: Date.now() }]
}

export default function PosPage() {
  const { products, getProductByBarcode, addProduct, addOrder, settings } = useStore()
  const [cart, setCart] = useState([])
  const [notFoundBarcode, setNotFoundBarcode] = useState(null)
  const [nameSearchResults, setNameSearchResults] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBillDialog, setShowBillDialog] = useState(false)
  const { taxRate = 5, currency = '₹' } = settings

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0)
  const tax = subtotal * (taxRate / 100)
  const total = subtotal + tax

  const handleScan = useCallback(
    (value) => {
      const trimmed = String(value).trim()
      if (!trimmed) return

      setNotFoundBarcode(null)
      setNameSearchResults([])

      const byBarcode = getProductByBarcode(trimmed)
      if (byBarcode) {
        setCart((prev) => addProductToCart(prev, byBarcode))
        return
      }

      const byName = products.filter((p) =>
        p.name.toLowerCase().includes(trimmed.toLowerCase())
      )
      if (byName.length === 0) {
        setNotFoundBarcode(trimmed)
      } else if (byName.length === 1) {
        setCart((prev) => addProductToCart(prev, byName[0]))
      } else {
        setNameSearchResults(byName)
      }
    },
    [getProductByBarcode, products]
  )

  const handleSelectFromSearch = useCallback((product) => {
    setCart((prev) => addProductToCart(prev, product))
    setNameSearchResults([])
  }, [])

  useEffect(() => {
    if (nameSearchResults.length === 0) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') setNameSearchResults([])
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [nameSearchResults.length])

  const handleAddProductManually = useCallback(
    (data) => {
      const id = addProduct(data)
      const newProduct = { id, ...data }
      setCart((prev) => [...prev, { ...newProduct, qty: 1, cartId: Date.now() }])
      setShowAddModal(false)
      setNotFoundBarcode(null)
    },
    [addProduct]
  )

  const openAddModal = () => {
    setShowAddModal(true)
  }
  const closeAddModal = () => {
    setShowAddModal(false)
    setNotFoundBarcode(null)
  }

  const handleQtyChange = useCallback((item, delta) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.barcode === item.barcode ? { ...i, qty: i.qty + delta } : i
        )
        .filter((i) => i.qty > 0)
    )
  }, [])

  const handleRemove = useCallback((item) => {
    setCart((prev) => prev.filter((i) => i.barcode !== item.barcode || (i.cartId && i.cartId !== item.cartId)))
  }, [])

  const handleGenerateBillClick = useCallback(() => {
    if (cart.length === 0) return
    setShowBillDialog(true)
  }, [cart.length])

  const handlePrintBillConfirm = useCallback(
    ({ customerName, customerMobile }) => {
      const orderPayload = {
        items: cart.map(({ name, barcode, price, qty }) => ({ name, barcode, price, qty })),
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
    },
    [cart, subtotal, tax, total, addOrder, settings]
  )

  return (
    <div className="h-full flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center gap-2 min-w-0">
        <HiOutlineShoppingCart className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600 shrink-0" />
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">POS / Billing</h1>
          <p className="text-gray-500 text-sm mt-0.5">Scan barcode or search by product name, then press Enter</p>
        </div>
      </div>
      <Card className="p-4">
        <BarcodeInput onScan={handleScan} placeholder="Scan barcode or search by product name..." />
        {nameSearchResults.length > 0 && (
          <div className="mt-3 rounded-lg border border-gray-300 bg-white max-h-48 overflow-auto">
            <p className="text-gray-600 text-xs px-3 py-2 border-b border-gray-100">Select a product to add (Enter to select, Escape to close):</p>
            <ul className="py-1">
              {nameSearchResults.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectFromSearch(p)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelectFromSearch(p)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset"
                  >
                    <span className="text-gray-900 font-medium truncate">{p.name}</span>
                    <span className="text-emerald-600 text-sm shrink-0 ml-2">{currency}{Number(p.price).toFixed(2)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {notFoundBarcode && (
          <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 flex flex-wrap items-center gap-2">
            <span className="text-amber-800 text-sm">No product found for &quot;{notFoundBarcode}&quot;</span>
            <Button variant="secondary" className="!py-1.5 !px-3 text-sm" onClick={openAddModal}>
              Add product manually
            </Button>
            <button type="button" onClick={() => setNotFoundBarcode(null)} className="text-gray-500 hover:text-gray-700 text-sm">
              Dismiss
            </button>
          </div>
        )}
      </Card>
      <AddProductModal
        open={showAddModal}
        initialBarcode={notFoundBarcode || ''}
        onAdd={handleAddProductManually}
        onCancel={closeAddModal}
      />
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-h-0">
        <div className="lg:col-span-2 flex flex-col">
          <Card className="p-4 flex-1 flex flex-col min-h-[280px]">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Bill items</h2>
            <CartSummary
              items={cart}
              onQtyChange={handleQtyChange}
              onRemove={handleRemove}
              onGenerateInvoice={handleGenerateBillClick}
              taxRate={taxRate}
              currency={currency}
            />
          </Card>
        </div>
        <InvoiceCustomerModal
          open={showBillDialog}
          totalFormatted={total ? `${currency}${total.toFixed(2)}` : ''}
          onConfirm={handlePrintBillConfirm}
          onCancel={() => setShowBillDialog(false)}
        />
        <Card className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick actions</h2>
          <p className="text-gray-500 text-sm mb-3">Scan barcode or type product name to search.</p>
          <Button variant="secondary" className="w-full" onClick={() => { setNotFoundBarcode(''); setShowAddModal(true); }}>
            Add product manually
          </Button>
        </Card>
      </div>
    </div>
  )
}
