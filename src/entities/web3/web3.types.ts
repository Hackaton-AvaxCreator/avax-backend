// src/types/web3.types.ts

// Enums
export enum PaymentType {
    PURCHASE = 'purchase',
    DONATION = 'donation'
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export enum TransactionStatus {
    PENDING = 'pending',
    SUCCESS = 'success',
    FAILED = 'failed'
}

// Base types
export interface Web3Config {
    rpcUrl: string
    chainId: number
    contractAddress: string
    privateKey?: string
}

export interface WalletInfo {
    address: string
    balance: string
    formattedBalance: string
}

// Smart contract types
export interface PaymentEventArgs {
    from: string
    to: string
    amount: string
    contentId?: string
    timestamp: number
    transactionHash: string
}

export interface ContentPurchasedEventArgs {
    buyer: string
    creator: string
    contentId: string
    price: string
    timestamp: number
    transactionHash: string
}

// Payment related types
export interface CreatePaymentDto {
    toUserId: string
    amount: string
    type: PaymentType
    contentId?: string
    message?: string
}

export interface UpdatePaymentDto {
    transactionHash: string
    status: 'completed' | 'failed'
}

export interface PaymentResponse {
    id: string
    fromUserId: string
    toUserId: string
    amount: string
    contentId?: string
    type: PaymentType
    status: PaymentStatus
    transactionHash?: string
    platformFee: string
    createdAt: Date
    confirmedAt?: Date
}

export interface TransactionDetails {
    from: string
    to: string
    amount: string
    data: string
    gasEstimate?: string
}

export interface CreatePaymentResponse {
    payment: PaymentResponse
    transaction: TransactionDetails
}

// Balance relat