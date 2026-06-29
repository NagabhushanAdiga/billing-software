import { Router } from 'express'
import { AuditController, StoreController } from '../controllers/auditController.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', requireAdmin, AuditController.list)
router.post('/', AuditController.create)
router.delete('/', requireAdmin, AuditController.clear)

export default router

const storeRouter = Router()
storeRouter.use(authenticate)
storeRouter.get('/bootstrap', StoreController.bootstrap)
storeRouter.post('/erase', requireAdmin, StoreController.eraseAll)
storeRouter.post('/purge', requireAdmin, StoreController.purge)

export { storeRouter }
