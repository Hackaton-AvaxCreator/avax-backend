// src/entities/tokens/tokens.types.ts

// Request DTOs
export interface TransferDto {
    toUserId: string
    amount: number
    description?: string
}

export interface StakeDto {
    amount: number
    lockPeriod?: number // days
}

export interface UnstakeDto {
    stakeId?: string
    amount?: number
}

// Response DTOs
export interface TokenBalanceResponse {
    userId: string
    balance: number
    staked: number
    available: number
    updatedAt: Date
}

export interface TransferResponse {
    fromUserId: string
    toUserId: string
    amount: number
    status: 'PENDING' | 'COMPLETED' | 'FAILED'
    transactionId?: string
    timestamp: Date
}

export interface StakeResponse {
    id: string
    userId: string
    amount: number
    lockPeriod: number
    startDate: Date
    endDate: Date
    apy: number
    status: 'ACTIVE' | 'COMPLETED'
}

export interface StakingInfoResponse {
    totalStaked: number
    userStaked: number
    availableToStake: number
    activeStakes: StakeResponse[]
    totalRewards: number
    claimableRewards: number
}

export interface RewardsResponse {
    totalRewards: number
    claimableRewards: number
    pendingRewards: number
    lastClaimed?: Date
    nextClaimDate?: Date
}

export interface TokenSupplyResponse {
    totalSupply: number
    circulatingSupply: number
    lockedSupply: number
    burnedAmount: number
}

export interface TokenDistributionResponse {
    investors: number
    founders: number
    ecosystem: number
    treasury: number
    liquidity: number
    advisors: number
    percentages: {
        [key: string]: number
    }
}