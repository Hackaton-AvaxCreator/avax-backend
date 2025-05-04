// src/controllers/web3.controller.ts
import { Request, Response } from 'express'
import { AppError } from '../../shared/middleware/error.middleware'
import { responseHelper } from '../../shared/utils/response'
import { paymentWeb3Service } from './payment/payment-web3.service'
import { web3Service } from './web3.service'


export const web3Controller = {
    // Health check
    async healthCheck(req: Request, res: Response) {
        const isDeployed = await web3Service.isContractDeployed()
        const blockNumber = await web3Service.provider.getBlockNumber()

        return responseHelper.success(res, {
            status: isDeployed ? 'connected' : 'disconnected',
            blockNumber,
        })
    },

    // Get network info
    async getNetworkInfo(req: Request, res: Response) {
        const network = await web3Service.provider.getNetwork()

        return responseHelper.success(res, {
            name: network.name,
            chainId: network.chainId,
        })
    },

    // Get token balance
    async getTokenBalance(req: Request, res: Response) {
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('Authentication required', 401)
        }

        const token = await prisma.token.findUnique({
            where: { userId }
        })

        if (!token) {
            throw new AppError('Token account not found', 404)
        }

        return responseHelper.success(res, {
            tokenBalance: token.balance.toString(),
            stakedAmount: token.stakedAmount.toString(),
            lockedUntil: token.lockedUntil
        })
    },

    // Get transaction status
    async getTransactionStatus(req: Request, res: Response) {
        const { hash } = req.params

        const status = await web3Service.getTransactionStatus(hash)


        // Get additional transaction details
        const tx = await web3Service.provider.getTransaction(hash)
        const receipt = tx ? await web3Service.provider.getTransactionReceipt(hash) : null

        return responseHelper.success(res, {
            status,
            transaction: tx ? {
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: web3Service.formatFromWei(tx.value),
                blockNumber: tx.blockNumber,
                confirmations: tx.confirmations
            } : null,
            receipt: receipt ? {
                status: receipt.status,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            } : null
        })
    },

    // Get content ownership
    async getContentOwnership(req: Request, res: Response) {
        const { contentId } = req.params

        const owner = await web3Service.getContentOwnership(contentId)

        if (!owner) {
            throw new AppError('Content ownership not found', 404)
        }


        // Get user details
        const user = await prisma.user.findUnique({
            where: { walletAddress: owner },
            select: {
                id: true,
                email: true,
                walletAddress: true
            }
        })

        return responseHelper.success(res, {
            contentId,
            ownerAddress: owner,
            ownerDetails: user
        })
    },

    // Get user's owned content
    async getUserOwnedContent(req: Request, res: Response) {
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('Authentication required', 401)
        }

        const ownedContent = await prisma.contentOwnership.findMany({
            where: { userId },
            include: {
                content: {
                    include: {
                        creator: true
                    }
                }
            }
        })

        return responseHelper.success(res, ownedContent)
    },

    // Verify payment
    async verifyPayment(req: Request, res: Response) {
        const { paymentId } = req.params

        const isVerified = await paymentWeb3Service.verifyPayment(paymentId)


        // Get payment details
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId }
        })

        return responseHelper.success(res, {
            paymentId,
            isVerified,
            status: payment?.status,
            transactionHash: payment?.transactionHash
        })
    },

    // Verify content ownership
    async verifyContentOwnership(req: Request, res: Response) {
        const { contentId } = req.params
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('Authentication required', 401)
        }


        // Check database ownership
        const ownership = await prisma.contentOwnership.findFirst({
            where: {
                contentId,
                userId
            }
        })

        if (!ownership) {
            return responseHelper.success(res, {
                contentId,
                isOwner: false,
                ownership: null
            })
        }


        // Verify on blockchain
        const blockchainOwner = await web3Service.getContentOwnership(contentId)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { walletAddress: true }
        })

        const isVerified = blockchainOwner?.toLowerCase() === user?.walletAddress?.toLowerCase()

        return responseHelper.success(res, {
            contentId,
            isOwner: isVerified,
            ownership: ownership
        })
    }
}