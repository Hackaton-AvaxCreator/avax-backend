// src/entities/content/content.router.ts
import { Router } from 'express'
import { contentController } from './content.controller'
import { requireCreator } from '../../shared/middleware/auth.middleware'

const router = Router()

// Public routes
router.get('/', contentController.getAll)
router.get('/:id', contentController.getById)
router.get('/creator/:creatorId', contentController.getByCreator)

// Creator routes
router.post('/', requireCreator, contentController.create)
router.put('/:id', requireCreator, contentController.update)
router.delete('/:id', requireCreator, contentController.delete)
router.patch('/:id/status', requireCreator, contentController.updateStatus)

// Purchase routes
router.post('/:id/purchase', contentController.purchase)

//ownership routes
router.patch('/:id/ownership', contentController.ownership)

export default router