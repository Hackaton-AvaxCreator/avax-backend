// src/entities/payments/payments.types.ts

// Request DTOs
export interface CreatePaymentDto {
    fromUserId: string
    toUserId: string
    contentId: string
    amount: number
    paymentMethod?: string
    type: 'PURCHASE' | 'SUBSCRIPTION'
    status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
    
  }
  
  // Response DTOs
  export interface PaymentResponse {
    id: string
    fromUserId: string
    toUserId: string
    contentId: string
    amount: number
    platformFee: number
    createdAt: Date
    status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  }
  
  export interface PaymentDetailsResponse extends PaymentResponse {
    fromUser: {
      id: string
      email: string
    }
    toUser: {
      id: string
      email: string
    }
    content: {
      id: string
      title: string
    }
  }
  
  export interface UserEarningsResponse {
    totalEarnings: number
    platformFees: number
    pendingEarnings: number
    lastPayment?: PaymentResponse
  }
  
  export interface PlatformFeesResponse {
    totalFees: number
    feesThisMonth: number
    feesThisYear: number
    topEarners: {
      userId: string
      email: string
      totalFees: number
    }[]
  }
  
  // Query filters
  export interface PaymentQueryFilter {
    userId?: string
    contentId?: string
    fromDate?: Date
    toDate?: Date
    status?: string
    limit?: number
    offset?: number
  }