import { ProductModel } from '../models/ProductModel.js'
import { AuditModel } from '../models/AuditModel.js'
import { ok, fail } from '../utils/response.js'

function generateBarcode() {
  return `890${Date.now().toString().slice(-10)}`
}

export const ProductController = {
  list(req, res) {
    return ok(res, { products: ProductModel.findAll() })
  },

  getByBarcode(req, res) {
    const product = ProductModel.findByBarcode(req.params.barcode)
    if (!product) return fail(res, 'Product not found', 404)
    return ok(res, { product })
  },

  create(req, res) {
    const body = req.body || {}
    let barcode = String(body.barcode || '').trim()
    if (!barcode) {
      barcode = generateBarcode()
      while (ProductModel.barcodeTaken(barcode)) {
        barcode = generateBarcode()
      }
    } else if (ProductModel.barcodeTaken(barcode)) {
      return fail(res, 'Barcode already in use')
    }

    if (!body.name) return fail(res, 'Product name is required')

    const product = ProductModel.create({ ...body, barcode })
    AuditModel.create({
      action: 'product_created',
      category: 'product',
      details: `${product.name} (${product.barcode})`,
      actor: req.user,
    })
    return ok(res, { product, id: product.id }, 201)
  },

  update(req, res) {
    const { id } = req.params
    const updates = req.body || {}

    if (updates.barcode !== undefined) {
      const code = String(updates.barcode).trim()
      if (!code || ProductModel.barcodeTaken(code, id)) {
        return fail(res, 'Invalid or duplicate barcode')
      }
      updates.barcode = code
    }

    const existing = ProductModel.findById(id)
    if (!existing) return fail(res, 'Product not found', 404)

    ProductModel.update(id, updates)
    AuditModel.create({
      action: 'product_updated',
      category: 'product',
      details: existing.name,
      actor: req.user,
    })
    return ok(res, { product: ProductModel.findById(id) })
  },

  remove(req, res) {
    const { id } = req.params
    const existing = ProductModel.findById(id)
    if (!existing) return fail(res, 'Product not found', 404)

    ProductModel.delete(id)
    AuditModel.create({
      action: 'product_deleted',
      category: 'product',
      details: existing.name,
      actor: req.user,
    })
    return ok(res, { message: 'Product deleted' })
  },
}
