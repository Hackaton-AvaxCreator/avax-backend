// src/entities/payments/payments.controller.ts
import { Request, Response } from 'express'
import { paymentsService } from './payments.service'
import { AppError } from '../../shared/middleware/error.middleware'
import { CreatePaymentDto, PaymentQueryFilter } from './payments.types'
import { prisma } from '../../lib/prisma'

export const paymentsController = {
    // Get all payments
    async getAll(req: Request, res: Response) {
        const filter: PaymentQueryFilter = {
            userId: req.query.userId as string,
            contentId: req.query.contentId as string,
            fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
            toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
            limit: parseInt(req.query.limit as string) || 10,
            offset: parseInt(req.query.offset as string) || 0
        }

        const payments = await paymentsService.getPayments(filter)

        res.status(200).json({
            success: true,
            data: payments
        })
    },

    // Get payment by ID
    async getById(req: Request, res: Response) {
        const { id } = req.params

        const payment = await paymentsService.getPaymentById(id)

        if (!payment) {
            throw new AppError('Payment not found', 404)
        }

        res.status(200).json({
            success: true,
            data: payment
        })
    },

    // Get payments by user
    async getByUser(req: Request, res: Response) {
        const { userId } = req.params

        const payments = await paymentsService.getPaymentsByUser(userId)

        res.status(200).json({
            success: true,
            data: payments
        })
    },

    // Get payments by content
    async getByContent(req: Request, res: Response) {
        const { contentId } = req.params

        const payments = await paymentsService.getPaymentsByContent(contentId)

        res.status(200).json({
            success: true,
            data: payments
        })
    },

    // Create payment
    async create(req: Request, res: Response) {
        const userId = req.user?.id
        const { toUserId, contentId, amount }: CreatePaymentDto = req.body

        if (!userId) {
            throw new AppError('User not authenticated', 401)
        }

        // Validate input
        if (!toUserId || !contentId || !amount) {
            throw new AppError('Missing required fields: toUserId, contentId, amount', 400)
        }

        if (amount <= 0) {
            throw new AppError('Amount must be greater than 0', 400)
        }

        // Verify user has sufficient token balance
        const userToken = await prisma.token.findUnique({
            where: { userId }
        })

        if (!userToken || Number(userToken.balance) < amount) {
            throw new AppError('Insufficient token balance', 400)
        }

        try {
            const payment = await paymentsService.createPayment({
                fromUserId: userId,
                toUserId,
                contentId,
                amount,
                type: 'PURCHASE'
            })

            res.status(201).json({
                success: true,
                data: payment,
                message: 'Payment processed successfully'
            })
        } catch (error: any) {
            throw new AppError('Payment processing failed', 500)
        }
    },

    // Get payment status (simplified)
    async getStatus(req: Request, res: Response) {
        const { id } = req.params

        const payment = await paymentsService.getPaymentById(id)

        if (!payment) {
            throw new AppError('Payment not found', 404)
        }

        res.status(200).json({
            success: true,
            data: {
                id: payment.id,
                status: 'COMPLETED', // Simplified - always completed for now
                amount: payment.amount,
                createdAt: payment.createdAt
            }
        })
    },

    // Get user earnings
    async getUserEarnings(req: Request, res: Response) {
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('User not authenticated', 401)
        }

        const earnings = await paymentsService.getUserEarnings(userId)

        res.status(200).json({
            success: true,
            data: earnings
        })
    },

    // Get platform fees
    async getPlatformFees(req: Request, res: Response) {
        const fees = await paymentsService.getPlatformFees()

        res.status(200).json({
            success: true,
            data: fees
        })
    }
}