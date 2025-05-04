// src/auth/auth.types.ts
import { User } from '@prisma/client'

// Request DTOs
export interface RegisterDto {
    email: string
    password: string
    walletAddress?: string
}

export interface LoginDto {
    email: string
    password: string
}

export interface ConnectWalletDto {
    walletAddress: string
    signature: string
    message: string
}

export interface UpdatePasswordDto {
    currentPassword: string
    newPassword: string
}

// Response DTOs
export interface AuthResponse {
    user: {
        id: string
        email: string
        walletAddress?: string
        isCreator: boolean
    }
    token: string
}

export interface UserResponse {
    id: string
    email: string
    walletAddress?: string
    isCreator: boolean
    createdAt: Date
}

// JWT payload
export interface JWTPayload {
    id: string
    email: string
    isCreator: boolean
    iat: number
    exp: number
}

// Wallet signature message
export interface WalletSignatureData {
    message: string
    timestamp: number
    action: 'CONNECT_WALLET' | 'LOGIN'
}