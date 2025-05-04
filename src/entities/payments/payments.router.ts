// src/entities/payments/payments.router.ts
import { Router } from 'express'
import { paymentsController } from './payments.controller'

const router = Router()

// Payment routes
router.get('/', paymentsController.getAll)
router.get('/:id', paymentsController.getById)
router.get('/user/:userId', paymentsController.getByUser)
router.get('/content/:contentId', paymentsController.getByContent)

// Create payment
router.post('/', paymentsController.create)

// Payment status
router.get('/:id/status', paymentsController.getStatus)

// Earnings and fees
router.get('/earnings', paymentsController.getUserEarnings)
router.get('/platform-fees', paymentsController.getPlatformFees)

export default router