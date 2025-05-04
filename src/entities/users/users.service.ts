// src/entities/users/users.service.ts
import { prisma } from '../../lib/prisma'
import {
    UpdateProfileDto,
    UserResponse,
    CreatorProfileResponse,
    CreatorStatusResponse,
    UserQueryFilter,
    UserWithStatsResponse
} from './users.types'

export const usersService = {
    // Get user by ID
    async getUserById(id: string): Promise<UserResponse | null> {
        const user = await prisma.user.findUnique({
            where: { id }
        })

        if (!user) return null

        return this.mapToUserResponse(user)
    },

    // Get all users (admin)
    async getAllUsers(filter: UserQueryFilter = {}): Promise<UserResponse[]> {
        const { isCreator, search, limit = 10, offset = 0 } = filter

        const where: any = {}

        if (isCreator !== undefined) {
            where.isCreator = isCreator
        }

        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { walletAddress: { contains: search, mode: 'insensitive' } }
            ]
        }

        const users = await prisma.user.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' }
        })

        return users.map(this.mapToUserResponse)
    },

    // Update user profile
    async updateProfile(id: string, data: UpdateProfileDto): Promise<UserResponse> {
        const user = await prisma.user.update({
            where: { id },
            data
        })

        return this.mapToUserResponse(user)
    },

    // Become creator
    async becomeCreator(id: string): Promise<CreatorProfileResponse> {
        // Check if user already a creator
        const user = await prisma.user.findUnique({
            where: { id }
        })

        if (!user) {
            throw new Error('User not found')
        }

        if (user.isCreator) {
            throw new Error('User is already a creator')
        }

        // Update user to creator
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { isCreator: true }
        })

        // Get additional creator stats
        const contentCount = await prisma.content.count({
            where: { creatorId: id }
        })

        const paymentStats = await prisma.payment.aggregate({
            where: { toUserId: id },
            _sum: { amount: true }
        })

        return {
            ...this.mapToUserResponse(updatedUser),
            contentCount,
            totalEarnings: paymentStats._sum.amount || 0
        }
    },

    // Check creator status and requirements
    async checkCreatorStatus(id: string): Promise<CreatorStatusResponse> {
        const user = await prisma.user.findUnique({
            where: { id }
        })

        if (!user) {
            throw new Error('User not found')
        }

        // Check requirements
        const requirements = {
            emailVerified: true, // Simplified - could add email verification later
            walletConnected: !!user.walletAddress,
            profileComplete: true // Could add more profile checks
        }

        const canApply = Object.values(requirements).every(req => req)

        return {
            isCreator: user.isCreator,
            canApply,
            requirements
        }
    },

    // Get user with stats (for profile page)
    async getUserWithStats(id: string): Promise<UserWithStatsResponse | null> {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                tokenAccount: true,
                createdContent: true
            }
        })

        if (!user) return null

        // Calculate earnings
        const paymentStats = await prisma.payment.aggregate({
            where: { toUserId: id },
            _sum: { amount: true }
        })

        return {
            ...this.mapToUserResponse(user),
            tokenBalance: user.tokenAccount?.balance || 0,
            contentCount: user.createdContent.length,
            totalEarnings: paymentStats._sum.amount || 0
        }
    },

    // Helper: Map User model to UserResponse
    mapToUserResponse(user: any): UserResponse {
        return {
            id: user.id,
            email: user.email,
            walletAddress: user.walletAddress,
            isCreator: user.isCreator,
            createdAt: user.createdAt
        }
    }
}