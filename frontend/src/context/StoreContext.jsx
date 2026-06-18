import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { INITIAL_PRODUCTS, INITIAL_GROUPS, DEFAULT_SETTINGS, SAMPLE_ORDERS } from '../data/staticData'
import { productImageSrc } from '../utils/productImage'

const STORAGE_KEYS = {
  products: 'billing_products',
  groups: 'billing_groups',
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

function normalizeProducts(products, groups) {
  const categoryToGroup = Object.fromEntries(
    INITIAL_GROUPS.map((g) => [g.name, g.id])
  )
  groups.forEach((g) => {
    categoryToGroup[g.name] = g.id
  })

  return products.map((p) => {
    const groupId =
      p.groupId ||
      (p.category ? categoryToGroup[p.category] : '') ||
      ''
    const group = groupId ? groups.find((g) => g.id === groupId) : null
    return {
      ...p,
      groupId: groupId || '',
      category: p.category || group?.name || '',
      discount: Number(p.discount) || 0,
      image: p.image || productImageSrc({ ...p, id: p.id }),
    }
  })
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [groups, setGroups] = useState(() => loadJson(STORAGE_KEYS.groups, INITIAL_GROUPS))
  const [products, setProducts] = useState(() => {
    const loaded = loadJson(STORAGE_KEYS.products, INITIAL_PRODUCTS)
    const grp = loadJson(STORAGE_KEYS.groups, INITIAL_GROUPS)
    return normalizeProducts(loaded, grp)
  })
  const [orders, setOrders] = useState(() => loadJson(STORAGE_KEYS.orders, SAMPLE_ORDERS))
  const [settings, setSettingsState] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...loadJson(STORAGE_KEYS.settings, {}),
  }))
  const [isStoreReady, setIsStoreReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsStoreReady(true), 350)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    saveJson(STORAGE_KEYS.groups, groups)
  }, [groups])

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

  const getGroupById = useCallback(
    (groupId) => groups.find((g) => g.id === groupId),
    [groups]
  )

  const addGroup = useCallback((name) => {
    const trimmed = String(name).trim()
    if (!trimmed) return null
    const exists = groups.some((g) => g.name.toLowerCase() === trimmed.toLowerCase())
    if (exists) return null
    const id = `grp-${Date.now()}`
    setGroups((prev) => [...prev, { id, name: trimmed }])
    return id
  }, [groups])

  const deleteGroup = useCallback((id) => {
    setGroups((prev) => {
      const next = prev.filter((g) => g.id !== id)
      const fallback = next[0]
      if (fallback) {
        setProducts((prods) =>
          prods.map((p) =>
            p.groupId === id ? { ...p, groupId: '', category: '' } : p
          )
        )
      }
      return next
    })
  }, [])

  const getProductByBarcode = useCallback(
    (barcode) => products.find((p) => p.barcode === String(barcode).trim()),
    [products]
  )

  const addProduct = useCallback((product) => {
    const id = String(Date.now())
    const group = product.groupId ? groups.find((g) => g.id === product.groupId) : null
    setProducts((prev) => [
      ...prev,
      {
        ...product,
        id,
        groupId: product.groupId || '',
        category: group?.name || '',
        image: product.image || productImageSrc({ ...product, id }),
      },
    ])
    return id
  }, [groups])

  const updateProduct = useCallback((id, updates) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const nextGroupId = updates.groupId !== undefined ? updates.groupId : p.groupId
        const group = nextGroupId ? groups.find((g) => g.id === nextGroupId) : null
        return {
          ...p,
          ...updates,
          groupId: nextGroupId || '',
          category: group?.name || '',
        }
      })
    )
  }, [groups])

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
    groups,
    orders,
    settings,
    setSettings,
    isStoreReady,
    getGroupById,
    addGroup,
    deleteGroup,
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
