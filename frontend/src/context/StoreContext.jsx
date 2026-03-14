import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { INITIAL_PRODUCTS, DEFAULT_SETTINGS, SAMPLE_ORDERS } from '../data/staticData'

const STORAGE_KEYS = {
  products: 'billing_products',
  orders: 'billing_orders',
  settings: 'billing_settings',
}

function loadJson(key, fallback) {
  try {
    const s = localStorage.getItem(key)
    return s ? JSON.parse(s) : fallback
  } catch {
    return fallback
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [products, setProducts] = useState(() => loadJson(STORAGE_KEYS.products, INITIAL_PRODUCTS))
  const [orders, setOrders] = useState(() => loadJson(STORAGE_KEYS.orders, SAMPLE_ORDERS))
  const [settings, setSettingsState] = useState(() => loadJson(STORAGE_KEYS.settings, DEFAULT_SETTINGS))

  useEffect(() => {
    saveJson(STORAGE_KEYS.products, products)
  }, [products])

  useEffect(() => {
    saveJson(STORAGE_KEYS.orders, orders)
  }, [orders])

  useEffect(() => {
    saveJson(STORAGE_KEYS.settings, settings)
  }, [settings])

  const setSettings = useCallback((next) => {
    setSettingsState((prev) => (typeof next === 'function' ? next(prev) : { ...prev, ...next }))
  }, [])

  const getProductByBarcode = useCallback(
    (barcode) => products.find((p) => p.barcode === String(barcode).trim()),
    [products]
  )

  const addProduct = useCallback((product) => {
    const id = String(Date.now())
    setProducts((prev) => [...prev, { ...product, id }])
    return id
  }, [])

  const updateProduct = useCallback((id, updates) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
  }, [])

  const deleteProduct = useCallback((id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const addOrder = useCallback((order) => {
    const id = `ord-${Date.now()}`
    const newOrder = { ...order, id, date: new Date().toISOString() }
    setOrders((prev) => [newOrder, ...prev])
    return id
  }, [])

  const value = {
    products,
    orders,
    settings,
    setSettings,
    getProductByBarcode,
    addProduct,
    updateProduct,
    deleteProduct,
    addOrder,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
