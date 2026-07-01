document.addEventListener('alpine:init', () => {
  Alpine.data('posApp', () => ({
    products: [],
    settings: {},
    cart: [],
    barcode: '',
    searchQuery: '',
    loading: false,
    message: '',
    messageType: 'info',

    init() {
      const root = this.$root
      const productsEl = root.querySelector('[data-products]')
      const settingsEl = root.querySelector('[data-settings]')
      if (productsEl) this.products = JSON.parse(productsEl.textContent || '[]')
      if (settingsEl) this.settings = JSON.parse(settingsEl.textContent || '{}')
      this.$nextTick(() => this.$refs.barcodeInput?.focus())
    },

    get currency() {
      return this.settings.currency || '₹'
    },
    get taxRate() {
      return Number(this.settings.taxRate ?? 5)
    },
    get discountType() {
      return this.settings.discountType || 'percent'
    },
    get maxDiscountPercent() {
      return Number(this.settings.maxDiscountPercent ?? 50)
    },

    filteredProducts() {
      const q = this.searchQuery.trim().toLowerCase()
      if (!q) return []
      return this.products
        .filter(
          (p) =>
            p.name?.toLowerCase().includes(q) ||
            String(p.barcode || '').includes(this.searchQuery.trim()) ||
            (p.category && p.category.toLowerCase().includes(q))
        )
        .slice(0, 10)
    },

    getProductStock(product) {
      const batches = product.batches
      if (Array.isArray(batches) && batches.length) {
        return batches.reduce((sum, b) => sum + Math.max(0, Number(b.stock) || 0), 0)
      }
      const n = Number(product.stock)
      return Number.isFinite(n) && n >= 0 ? n : 99
    },

    lineGross(item) {
      return Number(item.price) * Number(item.qty)
    },

    lineNet(item) {
      return Math.max(0, this.lineGross(item))
    },

    lineTax(item) {
      const rate = Number(item.gst ?? this.taxRate) || this.taxRate
      const inclusive = this.lineNet(item)
      if (rate <= 0 || inclusive <= 0) return 0
      return inclusive * (rate / (100 + rate))
    },

    totals() {
      let grossSubtotal = 0
      let tax = 0
      for (const item of this.cart) {
        grossSubtotal += this.lineGross(item)
        tax += this.lineTax(item)
      }
      const subtotal = grossSubtotal
      return {
        grossSubtotal,
        discountTotal: 0,
        subtotal,
        tax,
        total: subtotal,
        totalBeforeBillDiscount: subtotal,
        billDiscountAmount: 0,
      }
    },

    showMsg(text, type = 'info') {
      this.message = text
      this.messageType = type
      setTimeout(() => {
        this.message = ''
      }, 4000)
    },

    addProduct(product, qty = 1) {
      const stock = this.getProductStock(product)
      if (stock <= 0) {
        this.showMsg('Out of stock: ' + product.name, 'error')
        return
      }
      const existing = this.cart.find((i) => i.barcode === product.barcode)
      if (existing) {
        const next = Math.min(existing.qty + qty, stock)
        if (next === existing.qty) {
          this.showMsg('Max stock reached for ' + product.name, 'error')
          return
        }
        existing.qty = next
      } else {
        this.cart.push({
          ...product,
          qty: Math.min(qty, stock),
          discount: Number(product.discount) || 0,
        })
      }
      this.barcode = ''
      this.searchQuery = ''
      this.showMsg('Added ' + product.name, 'success')
    },

    onBarcodeSubmit() {
      const code = this.barcode.trim()
      if (!code) return
      const product = this.products.find((p) => p.barcode === code)
      if (!product) {
        this.showMsg('No product found for barcode: ' + code, 'error')
        this.barcode = ''
        return
      }
      this.addProduct(product, 1)
    },

    updateQty(index, delta) {
      const item = this.cart[index]
      if (!item) return
      const stock = this.getProductStock(item)
      const next = Math.max(0.001, Math.min(stock, item.qty + delta))
      if (next <= 0) {
        this.cart.splice(index, 1)
        return
      }
      item.qty = next
    },

    removeItem(index) {
      this.cart.splice(index, 1)
    },

    clearCart() {
      if (this.cart.length && confirm('Clear the current bill?')) {
        this.cart = []
      }
    },

    formatMoney(amount) {
      return this.currency + Number(amount || 0).toFixed(2)
    },

    async checkout() {
      if (!this.cart.length) return
      this.loading = true
      const t = this.totals()
      const payload = {
        items: this.cart.map((item) => ({
          name: item.name,
          barcode: item.barcode,
          mrp: item.mrp,
          hsn: item.hsn || '',
          gst: item.gst,
          price: item.price,
          qty: item.qty,
          discount: item.discount || 0,
          lineTotal: this.lineNet(item),
          lineTax: this.lineTax(item),
        })),
        grossSubtotal: t.grossSubtotal,
        discountTotal: t.discountTotal,
        subtotal: t.subtotal,
        tax: t.tax,
        totalBeforeBillDiscount: t.totalBeforeBillDiscount,
        billDiscount: 0,
        billDiscountType: 'amount',
        billDiscountAmount: 0,
        total: t.total,
        customerName: '',
        customerMobile: '',
      }

      try {
        const res = await fetch((window.__APP_BASE__ || '') + '/api/orders', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'Checkout failed')
        }
        const orderId = data.order?.id
        this.cart = []
        this.showMsg('Bill saved successfully!', 'success')
        if (orderId) {
          window.location.href = (window.__APP_BASE__ || '') + '/invoice/' + encodeURIComponent(orderId) + '?print=1'
        }
      } catch (err) {
        this.showMsg(err.message || 'Checkout failed', 'error')
      } finally {
        this.loading = false
      }
    },
  }))
})
