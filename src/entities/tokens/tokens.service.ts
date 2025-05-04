// src/entities/tokens/tokens.service.ts
import { prisma } from '../../lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import {
    TransferDto,
    TokenBalanceResponse,
    TransferResponse,
    StakeDto,
    StakeResponse,
    StakingInfoResponse,
    RewardsResponse,
    TokenSupplyResponse,
    TokenDistributionResponse
} from './tokens.types'

export const tokensService = {
    // Get user token balance
    async getBalance(userId: string): Promise<TokenBalanceResponse> {
        const token = await prisma.token.findUnique({
            where: { userId }
        })

        if (!token) {
            // Create initial token account if doesn't exist
            const newToken = await prisma.token.create({
                data: {
                    userId,
                    balance: 0
                }
            })

            return {
                userId,
                balance: 0,
                staked: 0,
                available: 0,
                updatedAt: newToken.updatedAt
            }
        }

        const balance = Number(token.balance)
        // TODO: Calculate staked amount - for MVP, assume no staking
        const staked = 0
        const available = balance - staked

        return {
            userId,
            balance,
            staked,
            available,
            updatedAt: token.updatedAt
        }
    },

    // Transfer tokens
    async transfer(fromUserId: string, data: TransferDto): Promise<TransferResponse> {
        const { toUserId, amount } = data

        return prisma.$transaction(async (tx) => {
            // Check sender balance
            const fromToken = await tx.token.findUnique({ where: { userId: fromUserId } })

            if (!fromToken || Number(fromToken.balance) < amount) {
                throw new Error('Insufficient balance')
            }

            // Ensure recipient has token account
            let toToken = await tx.token.findUnique({ where: { userId: toUserId } })
            if (!toToken) {
                toToken = await tx.token.create({
                    data: {
                        userId: toUserId,
                        balance: 0
                    }
                })
            }

            // Perform transfer
            await tx.token.update({
                where: { userId: fromUserId },
                data: { balance: { decrement: amount } }
            })

            await tx.token.update({
                where: { userId: toUserId },
                data: { balance: { increment: amount } }
            })

            return {
                fromUserId,
                toUserId,
                amount,
                status: 'COMPLETED',
                timestamp: new Date()
            }
        })
    },

    // Stake tokens (simplified for MVP)
    async stake(userId: string, data: StakeDto): Promise<StakeResponse> {
        const { amount, lockPeriod = 30 } = data

        // Check user balance
        const token = await prisma.token.findUnique({ where: { userId } })

        if (!token || Number(token.balance) < amount) {
            throw new Error('Insufficient balance')
        }

        // For MVP, we'll track staking in a simple way without a separate table
        // In production, you'd want a proper staking table
        const startDate = new Date()
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + lockPeriod)

        // Calculate APY based on lock period (simplified)
        const apy = lockPeriod <= 30 ? 5 : lockPeriod <= 90 ? 10 : 15

        // For MVP, we'll just return a mock stake response
        // In production, you'd create an actual stake record
        return {
            id: `stake_${Date.now()}`,
            userId,
            amount,
            lockPeriod,
            startDate,
            endDate,
            apy,
            status: 'ACTIVE'
        }
    },

    // Get staking info
    async getStakingInfo(userId: string): Promise<StakingInfoResponse> {
        const token = await prisma.token.findUnique({ where: { userId } })
        const balance = token ? Number(token.balance) : 0

        // Mock data for MVP
        return {
            totalStaked: 0,
            userStaked: 0,
            availableToStake: balance,
            activeStakes: [],
            totalRewards: 0,
            claimableRewards: 0
        }
    },

    // Get rewards info
    async getRewards(userId: string): Promise<RewardsResponse> {
        // Mock data for MVP
        return {
            totalRewards: 0,
            claimableRewards: 0,
            pendingRewards: 0
        }
    },

    // Get total supply
    async getTotalSupply(): Promise<TokenSupplyResponse> {
        const totalTokens = await prisma.token.aggregate({
            _sum: { balance: true }
        })

        const circulatingSupply = Number(totalTokens._sum.balance || 0)
        const totalSupply = 100_000_000 // 100M total as per spec

        return {
            totalSupply,
            circulatingSupply,
            lockedSupply: totalSupply - circulatingSupply,
            burnedAmount: 0 // No burning in MVP
        }
    },

    // Get token distribution
    async getTokenDistribution(): Promise<TokenDistributionResponse> {
        const totalSupply = 100_000_000

        // Distribution percentages from spec
        const distribution = {
            investors: totalSupply * 0.25,
            founders: totalSupply * 0.15,
            ecosystem: totalSupply * 0.25,
            treasury: totalSupply * 0.20,
            liquidity: totalSupply * 0.10,
            advisors: totalSupply * 0.05
        }

        const percentages = {
            investors: 25,
            founders: 15,
            ecosystem: 25,
            treasury: 20,
            liquidity: 10,
            advisors: 5
        }

        return {
            ...distribution,
            percentages
        }
    }
}