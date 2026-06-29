import { Router } from 'express'
import { GroupController } from '../controllers/groupController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', GroupController.list)
router.post('/', GroupController.create)
router.put('/:id', GroupController.update)
router.delete('/:id', GroupController.remove)
router.post('/:id/subcategories', GroupController.addSubcategory)
router.put('/:groupId/subcategories/:subcategoryId', GroupController.updateSubcategory)
router.delete('/:groupId/subcategories/:subcategoryId', GroupController.removeSubcategory)

export default router
