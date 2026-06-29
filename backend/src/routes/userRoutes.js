import { Router } from 'express'
import { UserController } from '../controllers/userController.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.use(authenticate, requireAdmin)

router.get('/', UserController.list)
router.post('/', UserController.create)
router.delete('/:id', UserController.remove)
router.patch('/:id/password', UserController.resetPassword)

export default router
