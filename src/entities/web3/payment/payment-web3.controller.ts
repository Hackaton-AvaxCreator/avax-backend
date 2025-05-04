// src/controllers/payment-web3.controller.ts
import { Request, Response } from 'express'
import { AppError } from '../../../shared/middleware/error.middleware'
import { responseHelper } from '../../../shared/utils/response'
import { paymentWeb3Service } from './payment-web3.service'
import { web3Service } from '../web3.service'


interface CreatePaymentDto {
    toUserId: string
    amount: string
    type: 'purchase' | 'donation'
    contentId?: string
}

interface UpdatePaymentDto {
    transactionHash: string
    status: 'completed' | 'failed'
}

export const paymentWeb3Controller = {
    // Create payment intent
    async createPayment(req: Request, res: Response) {
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('Authentication required', 401)
        }

        const { toUserId, amount, type, contentId }: CreatePaymentDto = req.body


        // Validate input
        if (!toUserId || !amount || !type) {
            throw new AppError('Missing required fields', 400)
        }

        if (type === 'purchase' && !contentId) {
            throw new AppError('Content ID required for purchase', 400)
        }


        // Create payment record
        const payment = await paymentWeb3Service.createPayment(
            userId,
            toUserId,
            amount,
            type,
            contentId
        )


        // Get user's wallet details
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { walletAddress: true }
        })

        const recipient = await prisma.user.findUnique({
            where: { id: toUserId },
            select: { walletAddress: true }
        })

        return responseHelper.created(res, {
            payment,
            transaction: {
                from: user?.walletAddress,
                to: recipient?.walletAddress,
                amount: web3Service.formatToWei(amount).toString(),
                data: JSON.stringify({
                    paymentId: payment.id,
                    type
                })
            }
        })
    },

    // Update payment with transaction hash
    async updatePayment(req: Request, res: Response) {
        const { paymentId } = req.params
        const { transactionHash, status }: UpdatePaymentDto = req.body


        // Update payment with transaction details
        const payment = await prisma.payment.update({
            where: { id: paymentId },
            data: {
                transactionHash,
                status: status.toUpperCase(),
                confirmedAt: status === 'completed' ? new Date() : null
            }
        })


        // If completed, process the payment
        if (status === 'completed') {
            await paymentWeb3Service.checkTransactionStatus(transactionHash)
        }

        return responseHelper.success(res, payment)
    },

    // Get payment status
    async getPaymentStatus(req: Request, res: Response) {
        const { paymentId } = req.params


        // Check payment in database
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId }
        })

        if (!payment) {
            throw new AppError('Payment not found', 404)
        }


        // Verify on blockchain if still pending
        let blockchainStatus = null
        if (payment.status === 'PENDING' && payment.transactionHash) {
            blockchainStatus = await web3Service.getTransactionStatus(payment.transactionHash)
        }

        return responseHelper.success(res, {
            payment,
            blockchainStatus
        })
    },

    // Get user's AVAX balance
    async getWalletBalance(req: Request, res: Response) {
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('Authentication required', 401)
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { walletAddress: true }
        })

        if (!user?.walletAddress) {
            throw new AppError('Wallet not connected', 400)
        }

        const balance = await web3Service.getBalance(user.walletAddress)

        return responseHelper.success(res, {
            walletAddress: user.walletAddress,
            balance,
            formattedBalance: `${balance} AVAX`
        })
    },

    // Estimate gas for purchase
    async estimateGas(req: Request, res: Response) {
        const { contentId, amount } = req.body


        // Get content details
        const content = await prisma.content.findUnique({
            where: { id: contentId },
            include: { creator: true }
        })

        if (!content || !content.creator.walletAddress) {
            throw new AppError('Content or creator wallet not found', 404)
        }

        const gasEstimate = await paymentWeb3Service.estimatePurchaseGas(
            contentId,
            content.creator.walletAddress,
            amount || content.price.toString()
        )

        return responseHelper.success(res, {
            gasEstimate,
            estimatedCostInWei: gasEstimate
        })
    },

    // Get payment history
    async getPaymentHistory(req: Request, res: Response) {
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('Authentication required', 401)
        }

        const payments = await paymentWeb3Service.getPaymentHistory(userId)

        return responseHelper.success(res, payments)
    }
}