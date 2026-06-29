import { Router } from 'express'
import { AuthController } from '../controllers/authController.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.post('/login', AuthController.login)
router.get('/me', authenticate, AuthController.me)
router.post('/logout', authenticate, AuthController.logout)
router.post('/change-password', authenticate, requireAdmin, AuthController.changePassword)
router.post('/verify-password', authenticate, AuthController.verifyPassword)

export default router
