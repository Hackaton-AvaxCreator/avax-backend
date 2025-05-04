// // src/tokens/tokens.router.ts
// import { Router } from 'express'
// import { tokensController } from './tokens.controller'
// import { catchAsync } from '../../shared/middleware/error.middleware'

// const router = Router()

// // Token balance routes
// router.get('/balance', catchAsync(tokensController.getBalance))
// router.get('/balance/:userId', catchAsync(tokensController.getBalanceByUser))

// // Token operations
// router.post('/transfer', catchAsync(tokensController.transfer))
// router.post('/stake', catchAsync(tokensController.stake))
// router.post('/unstake', catchAsync(tokensController.unstake))

// // Staking information
// router.get('/staking-info', catchAsync(tokensController.getStakingInfo))
// router.get('/rewards', catchAsync(tokensController.getRewards))

// // Token metrics
// router.get('/supply', catchAsync(tokensController.getTotalSupply))
// router.get('/distribution', catchAsync(tokensController.getDistribution))

// export default router