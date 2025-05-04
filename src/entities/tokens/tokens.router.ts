// src/entities/tokens/tokens.router.ts
import { Router } from 'express'
import { tokensController } from './tokens.controller'

const router = Router()

// Token balance routes
router.get('/balance', tokensController.getBalance)
router.get('/balance/:userId', tokensController.getBalanceByUser)

// Token operations
router.post('/transfer', tokensController.transfer)
router.post('/stake', tokensController.stake)
router.post('/unstake', tokensController.unstake)

// Staking information
router.get('/staking-info', tokensController.getStakingInfo)
router.get('/rewards', tokensController.getRewards)

// Token metrics
router.get('/supply', tokensController.getTotalSupply)
router.get('/distribution', tokensController.getDistribution)

export default router