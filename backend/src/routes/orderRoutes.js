import { Router } from 'express'
import { OrderController } from '../controllers/orderController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', OrderController.list)
router.post('/', OrderController.create)

export default router
