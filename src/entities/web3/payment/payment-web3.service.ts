// src/services/payment/payment-web3.service.ts
import { prisma } from '../../../lib/prisma'
import { logger } from '../../../shared/utils/logger/logger'
import { AppError } from '../../../shared/middleware/error.middleware'
import { web3Service } from '../web3.service'

interface PaymentTransaction {
    id: string
    fromUserId: string
    toUserId: string
    amount: string
    contentId?: string
    type: 'purchase' | 'donation'
    status: 'pending' | 'confirmed' | 'failed'
    transactionHash?: string
}

interface PaymentResult {
    paymentId: string
    transactionHash: string
    status: string
}

class PaymentWeb3Service {
    // Start listening to blockchain events
    async initializeEventListeners() {
        await web3Service.listenToPaymentEvents(async (event) => {
            await this.processPaymentEvent(event)
        })

        await web3Service.listenToContentPurchasedEvents(async (event) => {
            await this.processContentPurchaseEvent(event)
        })
    }

    // Process payment event from blockchain
    private async processPaymentEvent(event: any) {
        try {

            // Find the payment in our database
            const payment = await prisma.payment.findFirst({
                where: {
                    fromUser: {
                        walletAddress: event.from
                    },
                    toUser: {
                        walletAddress: event.to
                    },
                    status: 'PENDING'
                }
            })

            if (payment) {

                // Update payment status
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: 'COMPLETED',
                        transactionHash: event.transactionHash
                    }
                })


                // Update user balances
                await this.updateUserBalances(payment.toUserId, event.amount)

                logger.info(`Payment processed: ${payment.id}`)
            }
        } catch (error) {
            logger.error('Error processing payment event:', error)
        }
    }

    // Process content purchase event
    private async processContentPurchaseEvent(event: any) {
        try {

            // Update content ownership
            const buyer = await prisma.user.findUnique({
                where: { walletAddress: event.buyer }
            })

            const content = await prisma.content.findUnique({
                where: { id: event.contentId }
            })

            if (buyer && content) {

                // Create ownership record
                await prisma.contentOwnership.create({
                    data: {
                        userId: buyer.id,
                        contentId: content.id,
                        purchasePrice: web3Service.formatFromWei(event.price),
                        transactionHash: event.transactionHash
                    }
                })

                logger.info(`Content ownership transferred: ${event.contentId}`)
            }
        } catch (error) {
            logger.error('Error processing content purchase event:', error)
        }
    }

    // Create a pending payment record
    async createPayment(
        fromUserId: string,
        toUserId: string,
        amount: string,
        type: 'purchase' | 'donation',
        contentId?: string
    ): Promise<PaymentTransaction> {

        // Get user wallet addresses
        const [fromUser, toUser] = await Promise.all([
            prisma.user.findUnique({ where: { id: fromUserId } }),
            prisma.user.findUnique({ where: { id: toUserId } })
        ])

        if (!fromUser?.walletAddress || !toUser?.walletAddress) {
            throw new AppError('Wallet address required', 400)
        }


        // Calculate platform fee
        const platformFee = (Number(amount) * 0.01).toString() // 1% fee


        // Create payment record
        const payment = await prisma.payment.create({
            data: {
                fromUserId,
                toUserId,
                contentId,
                amount,
                platformFee,
                status: 'PENDING',
                type
            }
        })

        return {
            id: payment.id,
            fromUserId,
            toUserId,
            amount,
            contentId,
            type,
            status: 'pending'
        }
    }

    // Verify payment on blockchain
    async verifyPayment(paymentId: string): Promise<boolean> {
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId }
        })

        if (!payment) {
            throw new AppError('Payment not found', 404)
        }


        // Check payment on blockchain
        const isVerified = await web3Service.verifyPayment(paymentId)

        if (isVerified && payment.status !== 'COMPLETED') {

            // Update payment status
            await prisma.payment.update({
                where: { id: paymentId },
                data: { status: 'COMPLETED' }
            })
        }

        return isVerified
    }

    // Check transaction status
    async checkTransactionStatus(transactionHash: string): Promise<string> {
        const status = await web3Service.getTransactionStatus(transactionHash)

        if (status === 'success') {

            // Update payment status if confirmed
            await prisma.payment.updateMany({
                where: { transactionHash },
                data: { status: 'COMPLETED' }
            })
        }

        return status
    }

    // Update user balances after payment
    private async updateUserBalances(userId: string, amount: string) {

        // Convert from Wei to standard unit
        const standardAmount = web3Service.formatFromWei(BigInt(amount))


        // Update token balance
        const token = await prisma.token.findUnique({
            where: { userId }
        })

        if (token) {
            await prisma.token.update({
                where: { userId },
                data: {
                    balance: token.balance.add(standardAmount)
                }
            })
        }
    }

    // Estimate gas for purchase
    async estimatePurchaseGas(
        contentId: string,
        creatorAddress: string,
        amount: string
    ): Promise<string> {
        const weiAmount = web3Service.formatToWei(amount)
        const gasEstimate = await web3Service.estimateGas('purchaseContent', [
            contentId,
            creatorAddress,
            { value: weiAmount }
        ])

        return gasEstimate.toString()
    }

    // Get payment history with blockchain verification
    async getPaymentHistory(userId: string, verified: boolean = true): Promise<any[]> {

        // Get payments from database
        const payments = await prisma.payment.findMany({
            where: {
                OR: [
                    { fromUserId: userId },
                    { toUserId: userId }
                ]
            },
            include: {
                fromUser: true,
                toUser: true,
                content: true
            }
        })

        if (!verified) return payments


        // Verify each payment with blockchain if needed
        const verifiedPayments = await Promise.all(
            payments.map(async (payment) => {
                if (payment.status === 'PENDING' && payment.transactionHash) {
                    const txStatus = await this.checkTransactionStatus(payment.transactionHash)
                    payment.status = txStatus === 'success' ? 'COMPLETED' : payment.status
                }
                return payment
            })
        )

        return verifiedPayments
    }
}

export const paymentWeb3Service = new PaymentWeb3Service()