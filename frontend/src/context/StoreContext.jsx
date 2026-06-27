import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { INITIAL_PRODUCTS, INITIAL_GROUPS, INITIAL_BATCHES, DEFAULT_SETTINGS, SAMPLE_ORDERS } from '../data/staticData'
import { productImageSrc } from '../utils/productImage'
import { isBarcodeTaken, generateUniqueBarcode } from '../utils/barcode'
import { applyBatchesToProduct, getProductBatches } from '../utils/productBatches'
import { normalizeGroups, resolveProductCategoryFields } from '../utils/categories'
import { normalizeGst } from '../utils/billing'
import { logAudit } from '../utils/auditLog'

const STORAGE_KEYS = {
  products: 'billing_products',
  groups: 'billing_groups',
  batches: 'billing_batches',
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

function normalizeHsn(value) {
  return String(value || '').trim().replace(/\s/g, '')
}

function applyCategoryToProduct(product, groups) {
  return { ...product, ...resolveProductCategoryFields(product, groups) }
}

function normalizeProducts(products, groups, batches = []) {
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
    const legacyBatch = p.batchId
      ? batches.find((b) => b.id === p.batchId)?.name
      : ''
    const batchLabel = String(p.batch || legacyBatch || '').trim()
    const { batchId: _removed, ...rest } = p
    const normalizedBatches = getProductBatches(
      { ...rest, batch: batchLabel, batches: p.batches },
      batches
    )
    const withBatches = applyBatchesToProduct(
      { ...rest, batch: batchLabel },
      normalizedBatches
    )
    return applyCategoryToProduct(
      {
        ...withBatches,
        discount: Number(p.discount) || 0,
        hsn: normalizeHsn(p.hsn),
        gst: normalizeGst(p.gst),
        image: p.image || productImageSrc({ ...p, id: p.id }),
      },
      groups
    )
  })
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [groups, setGroups] = useState(() =>
    normalizeGroups(loadJson(STORAGE_KEYS.groups, INITIAL_GROUPS))
  )
  const [batches, setBatches] = useState(() => loadJson(STORAGE_KEYS.batches, INITIAL_BATCHES))
  const [products, setProducts] = useState(() => {
    const loaded = loadJson(STORAGE_KEYS.products, INITIAL_PRODUCTS)
    const grp = normalizeGroups(loadJson(STORAGE_KEYS.groups, INITIAL_GROUPS))
    const bat = loadJson(STORAGE_KEYS.batches, INITIAL_BATCHES)
    return normalizeProducts(loaded, grp, bat)
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
    saveJson(STORAGE_KEYS.batches, batches)
  }, [batches])

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

  const getBatchById = useCallback(
    (batchId) => batches.find((b) => b.id === batchId),
    [batches]
  )

  const addBatch = useCallback((name) => {
    const trimmed = String(name).trim()
    if (!trimmed) return null
    const exists = batches.some((b) => b.name.toLowerCase() === trimmed.toLowerCase())
    if (exists) return null
    const id = `bat-${Date.now()}`
    setBatches((prev) => [...prev, { id, name: trimmed }])
    logAudit('batch_created', { category: 'category', details: trimmed })
    return id
  }, [batches])

  const deleteBatch = useCallback((id) => {
    const batch = batches.find((b) => b.id === id)
    setBatches((prev) => prev.filter((b) => b.id !== id))
    setProducts((prods) =>
      prods.map((p) => (p.batchId === id ? { ...p, batch: '', batchId: '' } : p))
    )
    logAudit('batch_deleted', { category: 'category', details: batch?.name || id })
  }, [batches])

  const addGroup = useCallback((name) => {
    const trimmed = String(name).trim()
    if (!trimmed) return null
    const exists = groups.some((g) => g.name.toLowerCase() === trimmed.toLowerCase())
    if (exists) return null
    const id = `grp-${Date.now()}`
    setGroups((prev) => [...prev, { id, name: trimmed, subcategories: [] }])
    logAudit('category_created', { category: 'category', details: trimmed })
    return id
  }, [groups])

  const updateGroup = useCallback((id, name) => {
    const trimmed = String(name).trim()
    if (!trimmed) return false
    const exists = groups.some(
      (g) => g.id !== id && g.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (exists) return false

    const nextGroups = groups.map((g) =>
      g.id === id ? { ...g, name: trimmed } : g
    )
    setGroups(nextGroups)
    setProducts((prods) =>
      prods.map((p) =>
        p.groupId === id ? applyCategoryToProduct(p, nextGroups) : p
      )
    )
    logAudit('category_updated', { category: 'category', details: trimmed })
    return true
  }, [groups])

  const addSubcategory = useCallback((groupId, name) => {
    const trimmed = String(name).trim()
    if (!trimmed) return null
    const group = groups.find((g) => g.id === groupId)
    if (!group) return null
    const subs = group.subcategories || []
    if (subs.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) return null
    const id = `sub-${Date.now()}`
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, subcategories: [...(g.subcategories || []), { id, name: trimmed }] }
          : g
      )
    )
    logAudit('subcategory_created', {
      category: 'category',
      details: `${group.name} → ${trimmed}`,
    })
    return id
  }, [groups])

  const updateSubcategory = useCallback((groupId, subcategoryId, name) => {
    const trimmed = String(name).trim()
    if (!trimmed) return false
    const group = groups.find((g) => g.id === groupId)
    if (!group) return false
    const subs = group.subcategories || []
    if (
      subs.some(
        (s) => s.id !== subcategoryId && s.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      return false
    }

    const nextGroups = groups.map((g) =>
      g.id === groupId
        ? {
            ...g,
            subcategories: (g.subcategories || []).map((s) =>
              s.id === subcategoryId ? { ...s, name: trimmed } : s
            ),
          }
        : g
    )
    setGroups(nextGroups)
    setProducts((prods) =>
      prods.map((p) =>
        p.groupId === groupId && p.subcategoryId === subcategoryId
          ? applyCategoryToProduct(p, nextGroups)
          : p
      )
    )
    const sub = subs.find((s) => s.id === subcategoryId)
    logAudit('subcategory_updated', {
      category: 'category',
      details: `${group.name} → ${sub?.name || subcategoryId} renamed to ${trimmed}`,
    })
    return true
  }, [groups])

  const deleteSubcategory = useCallback((groupId, subcategoryId) => {
    const group = groups.find((g) => g.id === groupId)
    const sub = group?.subcategories?.find((s) => s.id === subcategoryId)
    const nextGroups = groups.map((g) =>
      g.id === groupId
        ? { ...g, subcategories: (g.subcategories || []).filter((s) => s.id !== subcategoryId) }
        : g
    )
    setGroups(nextGroups)
    setProducts((prods) =>
      prods.map((p) =>
        p.groupId === groupId && p.subcategoryId === subcategoryId
          ? applyCategoryToProduct({ ...p, subcategoryId: '' }, nextGroups)
          : p
      )
    )
    logAudit('subcategory_deleted', {
      category: 'category',
      details: `${group?.name || groupId} → ${sub?.name || subcategoryId}`,
    })
  }, [groups])

  const deleteGroup = useCallback((id) => {
    const group = groups.find((g) => g.id === id)
    setGroups((prev) => prev.filter((g) => g.id !== id))
    setProducts((prods) =>
      prods.map((p) =>
        p.groupId === id
          ? applyCategoryToProduct({ ...p, groupId: '', subcategoryId: '' }, groups.filter((g) => g.id !== id))
          : p
      )
    )
    logAudit('category_deleted', { category: 'category', details: group?.name || id })
  }, [groups])

  const getProductByBarcode = useCallback(
    (barcode) => products.find((p) => p.barcode === String(barcode).trim()),
    [products]
  )

  const addProduct = useCallback((product) => {
    let code = String(product.barcode || '').trim()
    if (!code) {
      code = generateUniqueBarcode(products)
    } else if (isBarcodeTaken(products, code)) {
      return null
    }
    const id = String(Date.now())
    const normalized = applyBatchesToProduct(
      applyCategoryToProduct(
        {
          ...product,
          barcode: code,
          id,
          groupId: product.groupId || '',
          subcategoryId: product.subcategoryId || '',
          discount: Number(product.discount) || 0,
          hsn: normalizeHsn(product.hsn),
          gst: normalizeGst(product.gst),
          image: product.image || productImageSrc({ ...product, id }),
        },
        groups
      ),
      product.batches || []
    )
    setProducts((prev) => [...prev, normalized])
    logAudit('product_created', {
      category: 'product',
      details: `${normalized.name} (${code})`,
    })
    return id
  }, [groups, products])

  const updateProduct = useCallback((id, updates) => {
    if (updates.barcode !== undefined) {
      const code = String(updates.barcode).trim()
      if (!code || isBarcodeTaken(products, code, id)) return false
    }
    const existing = products.find((p) => p.id === id)
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const nextGroupId = updates.groupId !== undefined ? updates.groupId : p.groupId
        const nextSubcategoryId =
          updates.subcategoryId !== undefined ? updates.subcategoryId : p.subcategoryId
        const nextDiscount =
          updates.discount !== undefined ? Math.max(0, Number(updates.discount) || 0) : p.discount
        const nextHsn = updates.hsn !== undefined ? normalizeHsn(updates.hsn) : normalizeHsn(p.hsn)
        const nextGst = updates.gst !== undefined ? normalizeGst(updates.gst) : normalizeGst(p.gst)
        let merged = applyCategoryToProduct(
          {
            ...p,
            ...updates,
            barcode: updates.barcode !== undefined ? String(updates.barcode).trim() : p.barcode,
            groupId: nextGroupId || '',
            subcategoryId: nextSubcategoryId || '',
            discount: nextDiscount,
            hsn: nextHsn,
            gst: nextGst,
          },
          groups
        )
        if (updates.batches) {
          merged = applyBatchesToProduct(merged, updates.batches)
        }
        return merged
      })
    )
    logAudit('product_updated', {
      category: 'product',
      details: existing?.name || id,
    })
    return true
  }, [groups, products])

  const deleteProduct = useCallback((id) => {
    const product = products.find((p) => p.id === id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
    logAudit('product_deleted', {
      category: 'product',
      details: product?.name || id,
    })
  }, [products])

  const eraseAllData = useCallback(() => {
    setProducts([])
    setGroups(normalizeGroups(INITIAL_GROUPS))
    setBatches([])
    setOrders([])
    setSettingsState({ ...DEFAULT_SETTINGS })
    logAudit('data_erased', {
      category: 'settings',
      details: 'All products, orders, categories, and settings reset',
    })
  }, [])

  const addOrder = useCallback((order) => {
    const id = `ord-${Date.now()}`
    const newOrder = { ...order, id, date: new Date().toISOString() }
    setOrders((prev) => [newOrder, ...prev])
    setProducts((prev) =>
      prev.map((p) => {
        const lines = (order.items || []).filter((i) => i.barcode === p.barcode)
        if (lines.length === 0) return p

        if (Array.isArray(p.batches) && p.batches.length > 0) {
          let nextBatches = [...p.batches]
          for (const line of lines) {
            const qty = Number(line.qty) || 0
            if (line.productBatchId) {
              nextBatches = nextBatches.map((b) =>
                b.id === line.productBatchId
                  ? { ...b, stock: Math.max(0, Number(b.stock) - qty) }
                  : b
              )
            } else {
              const target = nextBatches.find((b) => Number(b.stock) > 0) || nextBatches[0]
              if (target) {
                nextBatches = nextBatches.map((b) =>
                  b.id === target.id
                    ? { ...b, stock: Math.max(0, Number(b.stock) - qty) }
                    : b
                )
              }
            }
          }
          return applyBatchesToProduct(p, nextBatches)
        }

        const sold = lines.reduce((sum, line) => sum + (Number(line.qty) || 0), 0)
        const stock = Number(p.stock)
        if (!Number.isFinite(stock)) return p
        return { ...p, stock: Math.max(0, stock - sold) }
      })
    )
    logAudit('bill_created', {
      category: 'billing',
      details: `Bill ${id} · ${order.items?.length || 0} items · total ${Number(order.total || 0).toFixed(2)}`,
    })
    return id
  }, [])

  const value = {
    products,
    groups,
    batches,
    orders,
    settings,
    setSettings,
    isStoreReady,
    getGroupById,
    getBatchById,
    addGroup,
    updateGroup,
    deleteGroup,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    addBatch,
    deleteBatch,
    getProductByBarcode,
    addProduct,
    updateProduct,
    deleteProduct,
    addOrder,
    eraseAllData,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
