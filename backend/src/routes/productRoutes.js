import { Router } from 'express'
import { ProductController } from '../controllers/productController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', ProductController.list)
router.get('/barcode/:barcode', ProductController.getByBarcode)
router.post('/', ProductController.create)
router.put('/:id', ProductController.update)
router.delete('/:id', ProductController.remove)

export default router
