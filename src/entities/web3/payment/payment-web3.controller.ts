// src/controllers/payment-web3.controller.ts
import { Decimal } from '@prisma/client/runtime/library'
import { Request, Response } from 'express'
import { AppError } from '../../../shared/middleware/error.middleware'
import { logger } from '../../../shared/utils/logger/logger'
import { responseHelper } from '../../../shared/utils/response'
import { web3Service } from '../web3.service'
import { paymentWeb3Service } from './payment-web3.service'


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

interface CreateContentDto {
    title: string
    price: string
}

export const paymentWeb3Controller = {
    // Create payment intent
    async createPayment(req: Request, res: Response) {
        const userId = req.user?.id
        if (!userId) throw new AppError('Authentication required', 401)

        const { toUserId, amount, type, contentId }: CreatePaymentDto = req.body

        if (!toUserId || !amount || !type) {
            throw new AppError('Missing required fields', 400)
        }

        if (type === 'purchase' && !contentId) {
            throw new AppError('Content ID required for purchase', 400)
        }

        const payment = await paymentWeb3Service.createPayment(
            userId,
            toUserId,
            amount,
            type,
            contentId
        )

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

        const payment = await prisma.payment.update({
            where: { id: paymentId },
            data: {
                transactionHash,
                status: status.toUpperCase(),
                confirmedAt: status === 'completed' ? new Date() : null
            }
        })

        if (status === 'completed') {
            await paymentWeb3Service.checkTransactionStatus(transactionHash)
        }

        return responseHelper.success(res, payment)
    },

    // Get payment status
    async getPaymentStatus(req: Request, res: Response) {
        const { paymentId } = req.params

        const payment = await prisma.payment.findUnique({
            where: { id: paymentId }
        })

        if (!payment) {
            throw new AppError('Payment not found', 404)
        }

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
        if (!userId) throw new AppError('Authentication required', 401)

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
        if (!userId) throw new AppError('Authentication required', 401)

        const payments = await paymentWeb3Service.getPaymentHistory(userId)

        return responseHelper.success(res, payments)
    },

    // Registrar contenido en el contrato
    async registerContent(req: Request, res: Response) {
        const userId = req.user?.id
        if (!userId) throw new AppError('Authentication required', 401)

        const { title, price }: CreateContentDto = req.body
        if (!title || !price) throw new AppError('Title and price required', 400)

        try {
            const content = await prisma.content.create({
                data: {
                    creatorId: userId,
                    title,
                    price: new Decimal(price),
                    status: 'ACTIVE'
                }
            })

            const user = await prisma.user.findUnique({ where: { id: userId } })
            if (user?.walletAddress) {
                try {
                    const contractResult = await web3Service.registerContent(
                        content.id,
                        price,
                    )
                    content.contractId = contractResult.transactionHash
                } catch (error) {
                    logger.warn('Failed to register on contract, but content created:', error)
                }
            }

            return responseHelper.created(res, content)
        } catch (error) {
            throw new AppError('Error creating content', 500)
        }
    },

    // Comprar contenido
    async purchaseContent(req: Request, res: Response) {
        const { contentId } = req.params
        const userId = req.user?.id
        if (!userId) throw new AppError('Authentication required', 401)

        const content = await prisma.content.findUnique({
            where: { id: contentId },
            include: { creator: true }
        })

        if (!content) throw new AppError('Content not found', 404)

        try {
            const payment = await paymentWeb3Service.createPayment(
                userId,
                content.creatorId,
                content.price.toString(),
                'purchase',
                contentId
            )

            const user = await prisma.user.findUnique({ where: { id: userId } })

            return responseHelper.success(res, {
                payment,
                contract: {
                    address: web3Service.contract.target,
                    method: 'purchaseContent',
                    params: [content.id, content.creator.walletAddress],
                    value: web3Service.formatToWei(content.price.toString()).toString()
                }
            })
        } catch (error) {
            throw new AppError('Error creating purchase', 500)
        }
    },

    // Verificar pago en contrato
    async verifyContractPayment(req: Request, res: Response) {
        const { paymentId } = req.params

        const isVerified = await web3Service.verifyPayment(paymentId)

        if (isVerified) {
            await prisma.payment.update({
                where: { id: paymentId },
                data: { status: 'COMPLETED' }
            })
        }

        return responseHelper.success(res, { verified: isVerified })
    },

    // Obtener detalles del contenido en contrato
    async getContractContentDetails(req: Request, res: Response) {
        const { contentId } = req.params

        const details = await web3Service.getContentDetails(contentId)
        return responseHelper.success(res, details)
    }
}