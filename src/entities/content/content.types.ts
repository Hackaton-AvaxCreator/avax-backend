// src/entities/content/content.types.ts

// Request DTOs
export interface CreateContentDto {
    title: string
    description?: string
    price: number
    type?: 'VIDEO' | 'AUDIO' | 'IMAGE' | 'TEXT' | 'COURSE'
    fileUrl?: string
}

export interface UpdateContentDto {
    title?: string
    description?: string
    price?: number
    status?: 'ACTIVE' | 'INACTIVE'
}

export interface PurchaseContentDto {
    contentId: string
    paymentMethod?: string
}

// Response DTOs
export interface ContentResponse {
    id: string
    creatorId: string
    title: string
    description?: string
    price: number
    status: 'ACTIVE' | 'INACTIVE'
    type?: string
    fileUrl?: string
    createdAt: Date
    creator?: {
        id: string
        email: string
    }
}

export interface ContentWithStatsResponse extends ContentResponse {
    purchases: number
    totalEarnings: number
    ratings?: number
    reviews?: number
}

export interface PurchaseResponse {
    contentId: string
    userId: string
    amount: number
    status: 'COMPLETED' | 'PENDING' | 'FAILED'
    accessUrl?: string
    timestamp: Date
}

// Query filters
export interface ContentQueryFilter {
    creatorId?: string
    status?: 'ACTIVE' | 'INACTIVE'
    minPrice?: number
    maxPrice?: number
    type?: string
    limit?: number
    offset?: number
    search?: string
}