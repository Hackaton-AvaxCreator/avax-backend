// src/entities/users/users.types.ts

// Request DTOs
export interface UpdateProfileDto {
    email?: string
    walletAddress?: string
}

// Response DTOs
export interface UserResponse {
    id: string
    email: string
    walletAddress: string | null
    isCreator: boolean
    createdAt: Date
}

export interface CreatorProfileResponse {
    id: string
    email: string
    walletAddress: string | null
    isCreator: boolean
    createdAt: Date
    contentCount?: number
    totalEarnings?: number
}

export interface CreatorStatusResponse {
    isCreator: boolean
    canApply: boolean
    requirements?: {
        emailVerified: boolean
        walletConnected: boolean
        profileComplete: boolean
    }
}

// Enhanced user response with relations
export interface UserWithStatsResponse extends UserResponse {
    tokenBalance?: number
    contentCount?: number
    totalEarnings?: number
}

// Query filters
export interface UserQueryFilter {
    isCreator?: boolean
    search?: string
    limit?: number
    offset?: number
}