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

interface ContentRegisteredEvent {
    contentId: string
    creator: string
    price: bigint
    timestamp: bigint
}

interface DonationEvent {
    from: string
    to: string
    amount: bigint
    message: string
    timestamp: bigint
}

// Full contract ABI
const AVALCREATOR_CONTRACT_ABI = [
    // Read functions
    'function platformFeePercentage() view returns (uint256)',
    'function platformWallet() view returns (address)',
    'function payments(string) view returns (address from, address to, uint256 amount, string contentId, uint256 timestamp, bool verified)',
    'function contentOwnership(string) view returns (address owner, uint256 price, bool isForSale, uint256 lastSaleTimestamp)',
    'function contentCreators(string) view returns (address)',
    'function userBalances(address) view returns (uint256)',

    // Main functions
    'function registerContent(string contentId, uint256 price)',
    'function purchaseContent(string contentId, address creator) payable',
    'function donate(address to, string message) payable',
    'function verifyPayment(string paymentId) view returns (bool)',
    'function getContentOwnership(string contentId) view returns (address)',
    'function getContentCreator(string contentId) view returns (address)',
    'function getPayment(string paymentId) view returns (address, address, uint256, string, uint256, bool)',
    'function transferContentOwnership(string contentId, address newOwner)',
    'function getContractBalance() view returns (uint256)',

    // Owner functions
    'function updatePlatformFee(uint256 newFeePercentage)',
    'function updatePlatformWallet(address newPlatformWallet)',
    'function emergencyWithdraw()',

    // Test functions
    'function setContentPrice(string contentId, uint256 newPrice)',
    'function setContentSaleStatus(string contentId, bool forSale)',
    'function getContentDetails(string contentId) view returns (address, uint256, bool, uint256, address)',

    // Events
    'event Payment(address indexed from, address indexed to, uint256 amount, string contentId, uint256 timestamp)',
    'event ContentPurchased(address indexed buyer, address indexed creator, string contentId, uint256 price, uint256 timestamp)',
    'event Donation(address indexed from, address indexed to, uint256 amount, string message, uint256 timestamp)',
    'event ContentRegistered(string contentId, address indexed creator, uint256 price, uint256 timestamp)',
    'event OwnershipTransferred(string contentId, address indexed from, address indexed to, uint256 timestamp)'
]

class Web3Service {
    public provider: JsonRpcProvider
    private signer: Wallet | null = null
    public contract: Contract
    private config: Web3Config

    constructor() {
        this.config = {
            rpcUrl: config.AVALANCHE_RPC_URL,
            chainId: config.NODE_ENV === 'production' ? 43114 : 43113, // Mainnet o Fuji
            contractAddress: '0x0AfcC4e0338920fC4398cbAC201093C85F6e94D5'
        }

        this.provider = new JsonRpcProvider(this.config.rpcUrl)
        this.contract = new Contract(
            this.config.contractAddress,
            AVALCREATOR_CONTRACT_ABI,
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
            console.log('Checking contract deployment...')
            console.log('Contract address:', this.config.contractAddress)
            console.log('Provider:', this.provider)
            
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

    // Listen to content registered events
    async listenToContentRegisteredEvents(callback: (event: ContentRegisteredEvent) => void) {
        this.contract.on('ContentRegistered', (contentId, creator, price, timestamp) => {
            const registeredEvent: ContentRegisteredEvent = {
                contentId,
                creator,
                price,
                timestamp
            }
            callback(registeredEvent)
        })
    }

    // Listen to donation events
    async listenToDonationEvents(callback: (event: DonationEvent) => void) {
        this.contract.on('Donation', (from, to, amount, message, timestamp) => {
            const donationEvent: DonationEvent = {
                from,
                to,
                amount,
                message,
                timestamp
            }
            callback(donationEvent)
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

    // Register content (new)
    async registerContent(contentId: string, price: string, signerKey?: string): Promise<any> {
        try {
            const contractWithSigner: any = signerKey
                ? this.contract.connect(new Wallet(signerKey, this.provider))
                : this.contract

            const priceInWei = parseEther(price)
            const tx = await contractWithSigner.registerContent(contentId, priceInWei)
            const receipt = await tx.wait()

            return {
                transactionHash: receipt.hash,
                contentId,
                price: price
            }
        } catch (error) {
            logger.error('Error registering content:', error)
            throw error
        }
    }

    // Purchase content (new)
    async purchaseContent(contentId: string, creatorAddress: string, price: string, signerKey?: string): Promise<any> {
        try {
            const contractWithSigner: any = signerKey
                ? this.contract.connect(new Wallet(signerKey, this.provider))
                : this.contract

            const priceInWei = parseEther(price)
            const tx = await contractWithSigner.purchaseContent(contentId, creatorAddress, {
                value: priceInWei
            })
            const receipt = await tx.wait()

            return {
                transactionHash: receipt.hash,
                contentId,
                creatorAddress,
                price: price
            }
        } catch (error) {
            logger.error('Error purchasing content:', error)
            throw error
        }
    }

    // Donate (new)
    async donate(toAddress: string, amount: string, message: string, signerKey?: string): Promise<any> {
        try {
            const contractWithSigner: any = signerKey
                ? this.contract.connect(new Wallet(signerKey, this.provider))
                : this.contract

            const amountInWei = parseEther(amount)
            const tx = await contractWithSigner.donate(toAddress, message, {
                value: amountInWei
            })
            const receipt = await tx.wait()

            return {
                transactionHash: receipt.hash,
                toAddress,
                amount: amount,
                message
            }
        } catch (error) {
            logger.error('Error sending donation:', error)
            throw error
        }
    }

    // Get content details (new)
    async getContentDetails(contentId: string): Promise<any> {
        try {
            const result = await this.contract.getContentDetails(contentId)
            return {
                owner: result[0],
                price: formatEther(result[1]),
                isForSale: result[2],
                lastSaleTimestamp: Number(result[3]),
                creator: result[4]
            }
        } catch (error) {
            logger.error('Error getting content details:', error)
            return null
        }
    }

    // Transfer content ownership (new)
    async transferContentOwnership(contentId: string, newOwner: string, signerKey?: string): Promise<any> {
        try {
            const contractWithSigner: any = signerKey
                ? this.contract.connect(new Wallet(signerKey, this.provider))
                : this.contract

            const tx = await contractWithSigner.transferContentOwnership(contentId, newOwner)
            const receipt = await tx.wait()

            return {
                transactionHash: receipt.hash,
                contentId,
                newOwner
            }
        } catch (error) {
            logger.error('Error transferring content ownership:', error)
            throw error
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

    // Start listening to all contract events
    listenToContractEvents() {
        this.listenToPaymentEvents((event) => {
            logger.info('Payment Event:', event)
        })

        this.listenToContentPurchasedEvents((event) => {
            logger.info('Content Purchased Event:', event)
        })

        this.listenToContentRegisteredEvents((event) => {
            logger.info('Content Registered Event:', event)
        })

        this.listenToDonationEvents((event) => {
            logger.info('Donation Event:', event)
        })
    }

    // Alias para compatibilidad
    listenToAllEvents() {
        this.listenToContractEvents()
    }
}

export const web3Service = new Web3Service()