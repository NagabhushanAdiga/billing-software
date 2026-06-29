import { Router } from 'express'
import { BatchController } from '../controllers/batchController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', BatchController.list)
router.post('/', BatchController.create)
router.delete('/:id', BatchController.remove)

export default router
