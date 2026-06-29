import { Router } from 'express'
import { SettingsController } from '../controllers/settingsController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', SettingsController.get)
router.put('/', SettingsController.update)

export default router
