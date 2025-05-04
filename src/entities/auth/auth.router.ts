// src/auth/auth.router.ts
import { Router } from 'express'
import { authController } from './auth.controller'
import { authMiddleware } from '../../shared/middleware/auth.middleware'
import { catchAsync } from '../../shared/middleware/error.middleware'

const router = Router()

// Public routes
router.post('/register', catchAsync(authController.register))
router.post('/login', catchAsync(authController.login))
router.get('/wallet-message', catchAsync(authController.generateWalletMessage))

// Protected routes
router.post('/connect-wallet', authMiddleware, catchAsync(authController.connectWallet))
router.get('/me', authMiddleware, catchAsync(authController.getCurrentUser))
router.post('/update-password', authMiddleware, catchAsync(authController.updatePassword))
router.post('/logout', authMiddleware, catchAsync(authController.logout))

export default router