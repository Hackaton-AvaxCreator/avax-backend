// src/routes/web3.router.ts
import { Router } from 'express'
import { authMiddleware } from '../../shared/middleware/auth.middleware'
import { catchAsync } from '../../shared/middleware/error.middleware'
import { paymentWeb3Controller } from './payment/payment-web3.controller'
import { web3Controller } from './web3.controller'


const router = Router()

// Public routes
router.get('/health', catchAsync(web3Controller.healthCheck))
router.get('/network-info', catchAsync(web3Controller.getNetworkInfo))

// Protected routes - Payment related
router.use(authMiddleware)

// Payment endpoints
router.post('/payments', catchAsync(paymentWeb3Controller.createPayment))
router.patch('/payments/:paymentId', catchAsync(paymentWeb3Controller.updatePayment))
router.get('/payments/:paymentId/status', catchAsync(paymentWeb3Controller.getPaymentStatus))
router.get('/payments/history', catchAsync(paymentWeb3Controller.getPaymentHistory))

// Balance endpoints
router.get('/balance', catchAsync(paymentWeb3Controller.getWalletBalance))
router.get('/tokens/balance', catchAsync(web3Controller.getTokenBalance))

// Transaction utilities
router.post('/estimate-gas', catchAsync(paymentWeb3Controller.estimateGas))
router.get('/transactions/:hash/status', catchAsync(web3Controller.getTransactionStatus))

// Content ownership
router.get('/content/:contentId/owner', catchAsync(web3Controller.getContentOwnership))
router.get('/user/owned-content', catchAsync(web3Controller.getUserOwnedContent))

// Verification endpoints
router.post('/verify-payment/:paymentId', catchAsync(web3Controller.verifyPayment))
router.post('/verify-ownership/:contentId', catchAsync(web3Controller.verifyContentOwnership))

export default router