// src/entities/tokens/tokens.controller.ts
import { Request, Response } from 'express'
import { tokensService } from './tokens.service'
import { AppError } from '../../shared/middleware/error.middleware'
import { TransferDto, StakeDto, UnstakeDto } from './tokens.types'

export const tokensController = {
    // Get current user's balance
    async getBalance(req: Request, res: Response) {
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('User not authenticated', 401)
        }

        const balance = await tokensService.getBalance(userId)

        res.status(200).json({
            success: true,
            data: balance
        })
    },

    // Get balance by user ID
    async getBalanceByUser(req: Request, res: Response) {
        const { userId } = req.params

        const balance = await tokensService.getBalance(userId)

        res.status(200).json({
            success: true,
            data: balance
        })
    },

    // Transfer tokens
    async transfer(req: Request, res: Response) {
        const userId = req.user?.id
        const { toUserId, amount, description }: TransferDto = req.body

        if (!userId) {
            throw new AppError('User not authenticated', 401)
        }

        // Validate input
        if (!toUserId || !amount) {
            throw new AppError('toUserId and amount are required', 400)
        }

        if (amount <= 0) {
            throw new AppError('Amount must be greater than 0', 400)
        }

        if (userId === toUserId) {
            throw new AppError('Cannot transfer to yourself', 400)
        }

        try {
            const transfer = await tokensService.transfer(userId, {
                toUserId,
                amount,
                description
            })

            res.status(200).json({
                success: true,
                data: transfer,
                message: 'Transfer successful'
            })
        } catch (error: any) {
            throw new AppError(error.message, 400)
        }
    },

    // Stake tokens
    async stake(req: Request, res: Response) {
        const userId = req.user?.id
        const { amount, lockPeriod }: StakeDto = req.body

        if (!userId) {
            throw new AppError('User not authenticated', 401)
        }

        // Validate input
        if (!amount) {
            throw new AppError('Amount is required', 400)
        }

        if (amount <= 0) {
            throw new AppError('Amount must be greater than 0', 400)
        }

        if (amount < 1000) {
            throw new AppError('Minimum staking amount is 1000 tokens', 400)
        }

        try {
            const stake = await tokensService.stake(userId, {
                amount,
                lockPeriod
            })

            res.status(200).json({
                success: true,
                data: stake,
                message: 'Tokens staked successfully'
            })
        } catch (error: any) {
            throw new AppError(error.message, 400)
        }
    },

    // Unstake tokens
    async unstake(req: Request, res: Response) {
        const userId = req.user?.id
        const { stakeId, amount }: UnstakeDto = req.body

        if (!userId) {
            throw new AppError('User not authenticated', 401)
        }

        // For MVP, simplified unstaking
        res.status(200).json({
            success: true,
            message: 'Unstaking not implemented in MVP'
        })
    },

    // Get staking info
    async getStakingInfo(req: Request, res: Response) {
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('User not authenticated', 401)
        }

        const stakingInfo = await tokensService.getStakingInfo(userId)

        res.status(200).json({
            success: true,
            data: stakingInfo
        })
    },

    // Get rewards
    async getRewards(req: Request, res: Response) {
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('User not authenticated', 401)
        }

        const rewards = await tokensService.getRewards(userId)

        res.status(200).json({
            success: true,
            data: rewards
        })
    },

    // Get total supply
    async getTotalSupply(req: Request, res: Response) {
        const supply = await tokensService.getTotalSupply()

        res.status(200).json({
            success: true,
            data: supply
        })
    },

    // Get token distribution
    async getDistribution(req: Request, res: Response) {
        const distribution = await tokensService.getTokenDistribution()

        res.status(200).json({
            success: true,
            data: distribution
        })
    }
}