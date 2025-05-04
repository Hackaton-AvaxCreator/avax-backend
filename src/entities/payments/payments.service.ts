// src/entities/payments/payments.service.ts
import { prisma } from '../../lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import {
    CreatePaymentDto,
    PaymentResponse,
    PaymentDetailsResponse,
    UserEarningsResponse,
    PlatformFeesResponse,
    PaymentQueryFilter
} from './payments.types'

export const paymentsService = {
    // Create payment
    async createPayment(data: CreatePaymentDto): Promise<PaymentResponse> {
        const { fromUserId, toUserId, contentId, amount } = data

        // Calculate platform fee (1%)
        const platformFee = amount * 0.01
        const creatorAmount = amount - platformFee

        return prisma.$transaction(async (tx) => {
            // Create payment record
            const payment = await tx.payment.create({
                data: {
                    fromUserId,
                    toUserId,
                    contentId,
                    amount: new Decimal(amount),
                    platformFee: new Decimal(platformFee)
                }
            })

            // Update token balances
            await tx.token.update({
                where: { userId: fromUserId },
                data: { balance: { decrement: amount } }
            })

            await tx.token.update({
                where: { userId: toUserId },
                data: { balance: { increment: creatorAmount } }
            })

            return this.mapToPaymentResponse(payment)
        })
    },

    // Get payment by ID
    async getPaymentById(id: string): Promise<PaymentDetailsResponse | null> {
        const payment = await prisma.payment.findUnique({
            where: { id },
            include: {
                fromUser: {
                    select: { id: true, email: true }
                },
                toUser: {
                    select: { id: true, email: true }
                },
                content: {
                    select: { id: true, title: true }
                }
            }
        })

        if (!payment) return null

        return {
            ...this.mapToPaymentResponse(payment),
            fromUser: payment.fromUser,
            toUser: payment.toUser,
            content: payment.content
        }
    },

    // Get payments by filters
    async getPayments(filter: PaymentQueryFilter = {}): Promise<PaymentDetailsResponse[]> {
        const { userId, contentId, fromDate, toDate, limit = 10, offset = 0 } = filter

        const where: any = {}

        if (userId) {
            where.OR = [
                { fromUserId: userId },
                { toUserId: userId }
            ]
        }

        if (contentId) {
            where.contentId = contentId
        }

        if (fromDate || toDate) {
            where.createdAt = {}
            if (fromDate) where.createdAt.gte = fromDate
            if (toDate) where.createdAt.lte = toDate
        }

        const payments = await prisma.payment.findMany({
            where,
            include: {
                fromUser: {
                    select: { id: true, email: true }
                },
                toUser: {
                    select: { id: true, email: true }
                },
                content: {
                    select: { id: true, title: true }
                }
            },
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' }
        })

        return payments.map(payment => ({
            ...this.mapToPaymentResponse(payment),
            fromUser: payment.fromUser,
            toUser: payment.toUser,
            content: payment.content
        }))
    },

    // Get payments by user ID
    async getPaymentsByUser(userId: string): Promise<PaymentDetailsResponse[]> {
        return this.getPayments({ userId })
    },

    // Get payments by content ID
    async getPaymentsByContent(contentId: string): Promise<PaymentDetailsResponse[]> {
        return this.getPayments({ contentId })
    },

    // Get user earnings
    async getUserEarnings(userId: string): Promise<UserEarningsResponse> {
        const payments = await prisma.payment.aggregate({
            where: { toUserId: userId },
            _sum: {
                amount: true,
                platformFee: true
            }
        })

        const lastPayment = await prisma.payment.findFirst({
            where: { toUserId: userId },
            orderBy: { createdAt: 'desc' }
        })

        return {
            totalEarnings: Number(payments._sum.amount || 0),
            platformFees: Number(payments._sum.platformFee || 0),
            pendingEarnings: 0, // Simplified - could implement pending logic
            lastPayment: lastPayment ? this.mapToPaymentResponse(lastPayment) : undefined
        }
    },

    // Get platform fees
    async getPlatformFees(): Promise<PlatformFeesResponse> {
        const today = new Date()
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const startOfYear = new Date(today.getFullYear(), 0, 1)

        const totalFees = await prisma.payment.aggregate({
            _sum: { platformFee: true }
        })

        const feesThisMonth = await prisma.payment.aggregate({
            where: { createdAt: { gte: startOfMonth } },
            _sum: { platformFee: true }
        })

        const feesThisYear = await prisma.payment.aggregate({
            where: { createdAt: { gte: startOfYear } },
            _sum: { platformFee: true }
        })

        // Get top earners
        const topEarnersRaw = await prisma.payment.groupBy({
            by: ['toUserId'],
            _sum: { platformFee: true },
            orderBy: { _sum: { platformFee: 'desc' } },
            take: 5
        })

        const topEarners = await Promise.all(
            topEarnersRaw.map(async (earning) => {
                const user = await prisma.user.findUnique({
                    where: { id: earning.toUserId },
                    select: { id: true, email: true }
                })
                return {
                    userId: earning.toUserId,
                    email: user?.email || 'Unknown',
                    totalFees: Number(earning._sum.platformFee || 0)
                }
            })
        )

        return {
            totalFees: Number(totalFees._sum.platformFee || 0),
            feesThisMonth: Number(feesThisMonth._sum.platformFee || 0),
            feesThisYear: Number(feesThisYear._sum.platformFee || 0),
            topEarners
        }
    },

    // Map Payment model to PaymentResponse
    mapToPaymentResponse(payment: any): PaymentResponse {
        return {
            id: payment.id,
            fromUserId: payment.fromUserId,
            toUserId: payment.toUserId,
            contentId: payment.contentId,
            amount: Number(payment.amount),
            platformFee: Number(payment.platformFee),
            createdAt: payment.createdAt
        }
    }
}