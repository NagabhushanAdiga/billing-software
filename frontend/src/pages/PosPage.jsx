import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import BarcodeInput from '../components/billing/BarcodeInput'
import { useHardwareScanner } from '../hooks/useHardwareScanner'
import { useMobileScannerBridge } from '../hooks/useMobileScannerBridge'
import CartSummary from '../components/billing/CartSummary'
import PosSummaryPanel from '../components/billing/PosSummaryPanel'
import Card from '../components/common/Card'
import ProductImage from '../components/common/ProductImage'
import Button from '../components/common/Button'
import { useStore } from '../context/StoreContext'
import { useToast } from '../context/ToastContext'
import { generateInvoicePdfForPrint } from '../utils/generateInvoicePdf'
import InvoiceCustomerModal from '../components/billing/InvoiceCustomerModal'
import { calcCartTotals, lineDiscountAmount, lineNet, lineTax, lineTotalWithTax, getProductStock, clampQtyToStock, remainingStock } from '../utils/billing'
import { useAsyncAction, delay } from '../hooks/useAsyncAction'

function isTypingTarget(el) {
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

function addProductToCart(prev, product, addAmount = 1) {
  const amount = Math.max(1, Math.floor(Number(addAmount)) || 1)
  const maxStock = getProductStock(product)
  if (maxStock <= 0) return { cart: prev, capped: true, maxStock }

  const existing = prev.find((i) => i.barcode === product.barcode)
  if (existing) {
    const desired = existing.qty + amount
    const nextQty = clampQtyToStock(desired, product)
    if (nextQty === existing.qty) {
      return { cart: prev, capped: true, maxStock }
    }
    return {
      cart: prev.map((i) =>
        i.barcode === product.barcode ? { ...i, qty: nextQty } : i
      ),
      capped: nextQty < desired,
      maxStock,
    }
  }

  const initialQty = clampQtyToStock(amount, product)
  if (initialQty <= 0) return { cart: prev, capped: true, maxStock }

  return {
    cart: [
      ...prev,
      {
        ...product,
        qty: initialQty,
        cartId: Date.now(),
        discount: Number(product.discount) || 0,
      },
    ],
    capped: initialQty < amount,
    maxStock,
  }
}

function filterProducts(products, query) {
  const trimmed = query.trim()
  const q = trimmed.toLowerCase()
  if (!q) return []

  return products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.barcode.includes(trimmed) ||
        (p.category && p.category.toLowerCase().includes(q))
    )
    .slice(0, 12)
}

export default function PosPage() {
  const { products, getProductByBarcode, getBatchById, addOrder, settings } = useStore()
  const { showToast } = useToast()
  const { loading: billLoading, run: runBill } = useAsyncAction()
  const [cart, setCart] = useState([])
  const [notFoundBarcode, setNotFoundBarcode] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [showBillDialog, setShowBillDialog] = useState(false)
  const barcodeInputRef = useRef(null)
  const suggestionRefs = useRef([])
  const {
    taxRate = 5,
    currency = '₹',
    discountEnabled = true,
    discountType = 'percent',
    maxDiscountPercent = 50,
  } = settings
  const scannerActive = !showBillDialog

  const { grossSubtotal, discountTotal, subtotal, tax, total } = calcCartTotals(cart, {
    taxRate,
    discountType,
    maxDiscountPercent,
  })
  const totalQty = cart.reduce((sum, i) => sum + i.qty, 0)

  const suggestions = useMemo(
    () => filterProducts(products, searchQuery),
    [products, searchQuery]
  )

  const showSuggestions = searchQuery.trim().length > 0 && suggestions.length > 0

  const isProductSelectable = useCallback(
    (product) => {
      const inBill = cart.find((i) => i.barcode === product.barcode)?.qty || 0
      return remainingStock(product, inBill) > 0
    },
    [cart]
  )

  const selectableSuggestionIndices = useMemo(
    () => suggestions.map((p, i) => (isProductSelectable(p) ? i : -1)).filter((i) => i >= 0),
    [suggestions, isProductSelectable]
  )

  useEffect(() => {
    if (!showSuggestions) {
      setHighlightedIndex(-1)
      return
    }
    setHighlightedIndex((prev) => {
      if (prev >= 0 && prev < suggestions.length && isProductSelectable(suggestions[prev])) {
        return prev
      }
      return selectableSuggestionIndices[0] ?? 0
    })
  }, [searchQuery, suggestions, showSuggestions, selectableSuggestionIndices, isProductSelectable])

  useEffect(() => {
    if (!showSuggestions || highlightedIndex < 0) return
    suggestionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex, showSuggestions])

  const cartQtyFor = useCallback(
    (barcode) => cart.find((i) => i.barcode === barcode)?.qty || 0,
    [cart]
  )

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    barcodeInputRef.current?.clear()
  }, [])

  const addToCart = useCallback(
    (product) => {
      setCart((prev) => {
        const { cart, capped, maxStock } = addProductToCart(prev, product, 1)
        if (getProductStock(product) <= 0) {
          showToast(`${product.name} is out of stock`, 'error')
          return prev
        }
        if (capped) {
          showToast(`Only ${maxStock} in stock for ${product.name}`, 'info')
        }
        return cart
      })
    },
    [showToast]
  )

  const getMaxQtyForItem = useCallback(
    (item) => {
      const product = getProductByBarcode(item.barcode)
      return product ? getProductStock(product) : null
    },
    [getProductByBarcode]
  )

  const handleQueryChange = useCallback((value) => {
    setSearchQuery(value)
    if (value.trim()) setNotFoundBarcode(null)
  }, [])

  const handleScan = useCallback(
    (value) => {
      const trimmed = String(value).trim()
      if (!trimmed) return

      setNotFoundBarcode(null)

      const byBarcode = getProductByBarcode(trimmed)
      if (byBarcode) {
        addToCart(byBarcode)
        clearSearch()
        return
      }

      const matches = filterProducts(products, trimmed)
      if (matches.length === 0) {
        setNotFoundBarcode(trimmed)
        showToast('Product not found — add it from Products page or try another scan', 'error')
        clearSearch()
      } else if (matches.length === 1) {
        addToCart(matches[0])
        clearSearch()
      }
      // Multiple matches: keep query so suggestions stay visible for click
    },
    [getProductByBarcode, products, addToCart, showToast, clearSearch]
  )

  useHardwareScanner(handleScan, { active: scannerActive })

  const { status: mobileScannerStatus } = useMobileScannerBridge(handleScan, {
    active: scannerActive,
  })

  const handleSelectFromSearch = useCallback(
    (product) => {
      addToCart(product)
      setNotFoundBarcode(null)
      clearSearch()
    },
    [addToCart, clearSearch]
  )

  const handleNavigateSuggestions = useCallback(
    (direction) => {
      if (!showSuggestions || selectableSuggestionIndices.length === 0) return false

      const currentPos = selectableSuggestionIndices.indexOf(highlightedIndex)
      let nextPos
      if (currentPos === -1) {
        nextPos = direction === 'down' ? 0 : selectableSuggestionIndices.length - 1
      } else if (direction === 'down') {
        nextPos = (currentPos + 1) % selectableSuggestionIndices.length
      } else {
        nextPos = (currentPos - 1 + selectableSuggestionIndices.length) % selectableSuggestionIndices.length
      }

      setHighlightedIndex(selectableSuggestionIndices[nextPos])
      return true
    },
    [showSuggestions, selectableSuggestionIndices, highlightedIndex]
  )

  const handleSelectHighlightedSuggestion = useCallback(() => {
    if (!showSuggestions || highlightedIndex < 0) return false
    const product = suggestions[highlightedIndex]
    if (!product || !isProductSelectable(product)) return false
    handleSelectFromSearch(product)
    return true
  }, [showSuggestions, highlightedIndex, suggestions, isProductSelectable, handleSelectFromSearch])

  useEffect(() => {
    if (!showSuggestions) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') clearSearch()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [showSuggestions, clearSearch])

  const updateCartQty = useCallback(
    (item, nextQty, product) => {
      const parsed = Math.max(0, Math.floor(Number(nextQty)) || 0)
      const maxStock = product ? getProductStock(product) : parsed
      const clamped = product ? clampQtyToStock(parsed, product) : parsed

      if (product && parsed > maxStock && parsed > 0) {
        showToast(`Only ${maxStock} in stock for ${item.name}`, 'info')
      }

      setCart((prev) =>
        prev
          .map((i) => (i.barcode === item.barcode ? { ...i, qty: clamped } : i))
          .filter((i) => i.qty > 0)
      )
    },
    [showToast]
  )

  const handleQtyChange = useCallback(
    (item, delta) => {
      const product = getProductByBarcode(item.barcode)
      const nextQty = item.qty + delta
      if (delta > 0 && product && nextQty > getProductStock(product)) {
        showToast(`Only ${getProductStock(product)} in stock for ${item.name}`, 'info')
      }
      updateCartQty(item, nextQty, product)
    },
    [getProductByBarcode, updateCartQty, showToast]
  )

  const handleQtySet = useCallback(
    (item, qty) => {
      const product = getProductByBarcode(item.barcode)
      updateCartQty(item, qty, product)
    },
    [getProductByBarcode, updateCartQty]
  )

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
      runBill(async () => {
        await delay(400)
        const orderPayload = {
          items: cart.map((item) => ({
            name: item.name,
            barcode: item.barcode,
            price: item.price,
            qty: item.qty,
            discount: item.discount || 0,
            lineDiscount: lineDiscountAmount(item, discountType, maxDiscountPercent),
            lineTotal: lineNet(item, discountType, maxDiscountPercent),
            lineTax: lineTax(item, taxRate, discountType, maxDiscountPercent),
            lineGrandTotal: lineTotalWithTax(item, taxRate, discountType, maxDiscountPercent),
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
      })
    },
    [cart, grossSubtotal, discountTotal, subtotal, tax, total, discountType, maxDiscountPercent, taxRate, addOrder, settings, showToast, runBill]
  )

  useEffect(() => {
    const onKeyDown = (e) => {
      if (isTypingTarget(document.activeElement)) return

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        barcodeInputRef.current?.focus()
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

  return (
    <div className="h-full flex flex-col gap-5 sm:gap-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2 flex flex-col gap-4 sm:gap-5">
          <Card className="p-5 sm:p-6 border-2 border-violet-200 shadow-lg shadow-violet-100/60 !overflow-visible">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
                  mobileScannerStatus.connected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}
                title={mobileScannerStatus.url || 'Scanner bridge'}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    mobileScannerStatus.connected ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                />
                {mobileScannerStatus.connected ? 'Mobile scanner bridge' : 'Bridge offline'}
              </span>
              {mobileScannerStatus.connected && mobileScannerStatus.scannerCount > 0 ? (
                <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
                  {mobileScannerStatus.scannerCount} phone{mobileScannerStatus.scannerCount !== 1 ? 's' : ''} connected
                </span>
              ) : null}
            </div>
            <div className="relative z-30">
                <BarcodeInput
                  ref={barcodeInputRef}
                  active={scannerActive}
                  onScan={handleScan}
                  onQueryChange={handleQueryChange}
                  onNavigateSuggestions={handleNavigateSuggestions}
                  onSelectSuggestion={handleSelectHighlightedSuggestion}
                  placeholder="Scan barcode or type product name... (Ctrl/Cmd+K to focus)"
                  inputProps={{
                    role: 'combobox',
                    'aria-autocomplete': 'list',
                    'aria-expanded': showSuggestions,
                    'aria-controls': showSuggestions ? 'pos-suggestions-list' : undefined,
                    'aria-activedescendant':
                      showSuggestions && highlightedIndex >= 0
                        ? `pos-suggestion-${highlightedIndex}`
                        : undefined,
                  }}
                />

                {showSuggestions && (
                  <div
                    data-pos-suggestions
                    className="absolute left-0 right-0 top-[calc(100%-0.25rem)] z-50 rounded-md border-2 border-violet-400 bg-white shadow-2xl shadow-violet-300/40 ring-4 ring-violet-100/80 max-h-72 overflow-auto"
                  >
                    <div className="sticky top-0 z-10 px-4 py-3 border-b-2 border-violet-200 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
                      <p className="text-sm font-bold">
                        {suggestions.length} product{suggestions.length !== 1 ? 's' : ''} found
                      </p>
                      <p className="text-violet-100 text-xs mt-0.5">↑↓ to move · Enter to add · Esc to close</p>
                    </div>
                    <ul id="pos-suggestions-list" role="listbox" className="divide-y divide-violet-100">
                      {suggestions.map((p, idx) => {
                        const inBill = cartQtyFor(p.barcode)
                        const available = remainingStock(p, inBill)
                        const batchName = p.batchId ? getBatchById(p.batchId)?.name : null
                        const outOfStock = available <= 0
                        const isHighlighted = idx === highlightedIndex
                        return (
                          <li key={p.id} role="presentation">
                            <button
                              ref={(el) => {
                                suggestionRefs.current[idx] = el
                              }}
                              id={`pos-suggestion-${idx}`}
                              type="button"
                              role="option"
                              aria-selected={isHighlighted}
                              disabled={outOfStock}
                              onMouseDown={(e) => e.preventDefault()}
                              onMouseEnter={() => !outOfStock && setHighlightedIndex(idx)}
                              onClick={() => !outOfStock && handleSelectFromSearch(p)}
                              className={`w-full px-4 py-3.5 text-left flex items-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                isHighlighted
                                  ? 'bg-violet-200 ring-2 ring-inset ring-violet-500'
                                  : idx % 2 === 0
                                    ? 'bg-white'
                                    : 'bg-violet-50/60'
                              } hover:bg-violet-100 focus-visible:bg-violet-100 focus-visible:outline-none`}
                            >
                              <ProductImage product={p} size="sm" />
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-900 font-bold truncate text-sm">{p.name}</p>
                                <p className="text-slate-500 text-xs mt-0.5 font-mono truncate">
                                  {p.barcode}
                                  {batchName && (
                                    <span className="ml-2 text-teal-700 font-sans font-semibold">· {batchName}</span>
                                  )}
                                </p>
                              </div>
                              <div className="text-right shrink-0 pl-2">
                                <p className="text-fuchsia-700 text-base font-extrabold">
                                  {currency}{Number(p.price).toFixed(2)}
                                </p>
                                <p className={`text-xs font-bold mt-0.5 ${outOfStock ? 'text-red-600' : 'text-emerald-700'}`}>
                                  {outOfStock ? 'Out of stock' : `Stock: ${available}`}
                                </p>
                                {inBill > 0 && (
                                  <p className="text-xs text-violet-700 font-bold mt-0.5 bg-violet-100 px-1.5 py-0.5 rounded">
                                    In bill: {inBill}
                                  </p>
                                )}
                              </div>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}

                {searchQuery.trim() && suggestions.length === 0 && !notFoundBarcode && (
                  <div className="absolute left-0 right-0 top-[calc(100%-0.25rem)] z-50 rounded-md border-2 border-amber-300 bg-amber-50 px-4 py-3 shadow-lg text-sm text-amber-900 font-medium">
                    No products match &quot;{searchQuery.trim()}&quot;
                  </div>
                )}
              </div>

            {notFoundBarcode && (
              <div className="mt-4 p-4 rounded-md bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center gap-3">
                <p className="text-amber-900 text-sm flex-1">
                  <span className="font-semibold">Not in inventory:</span>{' '}
                  <span className="font-mono">{notFoundBarcode}</span>
                  <span className="block text-amber-700/80 text-xs mt-1">Add this product from the Products page first.</span>
                </p>
                <Button variant="outline" className="!py-2 !px-3 text-sm shrink-0" onClick={() => setNotFoundBarcode(null)}>
                  Dismiss
                </Button>
              </div>
            )}
          </Card>

          <Card className="p-5 sm:p-6 flex-1 flex flex-col min-h-[320px]">
            <h2 className="text-base font-bold bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent mb-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 animate-pulse" />
              Current bill
            </h2>
            <p className="text-slate-400 text-xs mb-4">
              Use +/− or type quantity (cannot exceed stock){discountEnabled ? ' · discount applies from product settings' : ''}
            </p>
            <CartSummary
              items={cart}
              onQtyChange={handleQtyChange}
              onQtySet={handleQtySet}
              onRemove={handleRemove}
              getMaxQty={getMaxQtyForItem}
              currency={currency}
              taxRate={taxRate}
              discountEnabled={discountEnabled}
              discountType={discountType}
              maxDiscountPercent={maxDiscountPercent}
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
            billLoading={billLoading}
          />
        </div>
      </div>

      <InvoiceCustomerModal
        open={showBillDialog}
        totalFormatted={total ? `${currency}${total.toFixed(2)}` : ''}
        confirmLoading={billLoading}
        onConfirm={handlePrintBillConfirm}
        onCancel={() => setShowBillDialog(false)}
      />
    </div>
  )
}
