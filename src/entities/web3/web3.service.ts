// src/services/web3/web3.service.ts
import { JsonRpcProvider, Wallet, Contract, parseEther, formatEther, EventLog } from 'ethers'
import config from '../../config/env'
import { logger } from '../../shared/utils/logger/logger'

interface Web3Config {
    rpcUrl: string
    chainId: number
    contractAddress: string
}

// Contract interfaces
interface PaymentEvent {
    from: string
    to: string
    amount: bigint
    contentId?: string
    timestamp: bigint
}

interface ContentPurchasedEvent {
    buyer: string
    creator: string
    contentId: string
    price: bigint
    timestamp: bigint
}

// Contract ABI - Simple version
const PAYMENT_CONTRACT_ABI = [
    'event Payment(address indexed from, address indexed to, uint256 amount, string contentId, uint256 timestamp)',
    'event ContentPurchased(address indexed buyer, address indexed creator, string contentId, uint256 price, uint256 timestamp)',
    'function purchaseContent(string contentId, address creator) external payable',
    'function donate(address to, string message) external payable',
    'function verifyPayment(string paymentId) external view returns (bool)',
    'function getContentOwnership(string contentId) external view returns (address)',
]

class Web3Service {
    public provider: JsonRpcProvider
    private signer: Wallet | null = null
    private contract: Contract
    private config: Web3Config

    constructor() {
        this.config = {
            rpcUrl: config.AVALANCHE_RPC_URL,
            chainId: 43114, // Avalanche mainnet
            contractAddress: config.CONTRACT_ADDRESS || ''
        }

        this.provider = new JsonRpcProvider(this.config.rpcUrl)
        this.contract = new Contract(
            this.config.contractAddress,
            PAYMENT_CONTRACT_ABI,
            this.provider
        )
    }

    // Initialize with private key if needed for server-side operations
    async initializeSigner(privateKey?: string) {
        if (privateKey) {
            this.signer = new Wallet(privateKey, this.provider)
            // En ethers v6, connect devuelve mismo tipo
            this.contract = this.contract.connect(this.signer) as Contract
        }
    }

    // Check if contract is deployed
    async isContractDeployed(): Promise<boolean> {
        try {
            const code = await this.provider.getCode(this.config.contractAddress)
            return code !== '0x'
        } catch (error) {
            logger.error('Error checking contract deployment:', error)
            return false
        }
    }

    // Listen to payment events
    async listenToPaymentEvents(callback: (event: PaymentEvent) => void) {
        this.contract.on('Payment', (from, to, amount, contentId, timestamp) => {
            const paymentEvent: PaymentEvent = {
                from,
                to,
                amount,
                contentId,
                timestamp
            }
            callback(paymentEvent)
        })
    }

    // Listen to content purchased events
    async listenToContentPurchasedEvents(callback: (event: ContentPurchasedEvent) => void) {
        this.contract.on('ContentPurchased', (buyer, creator, contentId, price, timestamp) => {
            const contentEvent: ContentPurchasedEvent = {
                buyer,
                creator,
                contentId,
                price,
                timestamp
            }
            callback(contentEvent)
        })
    }

    // Get payment history
    async getPaymentHistory(userAddress: string, fromBlock: number = 0): Promise<any[]> {
        const filter = this.contract.filters.Payment(userAddress, null)
        const events = await this.contract.queryFilter(filter, fromBlock, 'latest')

        return events.map(event => {
            const log = event as EventLog
            const args = log.args
            return {
                from: args.from,
                to: args.to,
                amount: args.amount,
                contentId: args.contentId,
                timestamp: Number(args.timestamp)
            }
        })
    }

    // Verify payment on-chain
    async verifyPayment(paymentId: string): Promise<boolean> {
        try {
            return await this.contract.verifyPayment(paymentId)
        } catch (error) {
            logger.error('Error verifying payment:', error)
            return false
        }
    }

    // Get content ownership
    async getContentOwnership(contentId: string): Promise<string | null> {
        try {
            return await this.contract.getContentOwnership(contentId)
        } catch (error) {
            logger.error('Error getting content ownership:', error)
            return null
        }
    }

    // Get user's AVAX balance
    async getBalance(address: string): Promise<string> {
        const balance = await this.provider.getBalance(address)
        return formatEther(balance)
    }

    // Estimate gas for transaction
    async estimateGas(
        method: string,
        params: any[]
    ): Promise<bigint> {
        const estimatedGas = await this.contract[method].estimateGas(...params)
        return estimatedGas
    }

    // Get transaction status
    async getTransactionStatus(txHash: string): Promise<string> {
        const receipt = await this.provider.getTransactionReceipt(txHash)
        if (!receipt) return 'pending'
        return receipt.status === 1 ? 'success' : 'failed'
    }

    // Format amount to Wei
    formatToWei(amount: string): bigint {
        return parseEther(amount)
    }

    // Format amount from Wei
    formatFromWei(amount: bigint): string {
        return formatEther(amount)
    }
}

export const web3Service = new Web3Service()