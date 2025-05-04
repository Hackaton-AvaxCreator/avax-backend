// src/entities/auth/auth.service.ts
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { ethers } from 'ethers'
import { prisma } from '../../lib/prisma'
import config from '../../config/env'
import { AppError } from '../../shared/middleware/error.middleware'
import {
    RegisterDto,
    LoginDto,
    ConnectWalletDto,
    AuthResponse,
    UserResponse,
    JWTPayload,
    WalletSignatureData,
    UpdatePasswordDto
} from './auth.types'

export const authService = {
    // Generate JWT token
    generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
        // @ts-ignore
        return jwt.sign(payload, config.JWT_SECRET, {
            expiresIn: config.JWT_EXPIRES_IN,
        })
    },

    // Register new user
    async register(data: RegisterDto): Promise<AuthResponse> {
        const { email, password, walletAddress } = data

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { walletAddress: walletAddress ? walletAddress : undefined }
                ]
            }
        })

        if (existingUser) {
            throw new AppError('User with this email or wallet already exists', 400)
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user with token account
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                walletAddress,
                tokenAccount: {
                    create: {
                        balance: 0
                    }
                }
            }
        })

        // Generate token
        const token = this.generateToken({
            id: user.id,
            email: user.email,
            isCreator: user.isCreator
        })

        return {
            user: {
                id: user.id,
                email: user.email,
                walletAddress: user.walletAddress ? user.walletAddress : undefined,
                isCreator: user.isCreator
            },
            token
        }
    },

    // Login user
    async login(data: LoginDto): Promise<AuthResponse> {
        const { email, password } = data

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user || !user.password) {
            throw new AppError('Invalid email or password', 401)
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            throw new AppError('Invalid email or password', 401)
        }

        // Generate token
        const token = this.generateToken({
            id: user.id,
            email: user.email,
            isCreator: user.isCreator
        })

        return {
            user: {
                id: user.id,
                email: user.email,
                walletAddress: user.walletAddress ? user.walletAddress : undefined,
                isCreator: user.isCreator
            },
            token
        }
    },

    // Connect wallet to existing account
    async connectWallet(userId: string, data: ConnectWalletDto): Promise<UserResponse> {
        const { walletAddress, signature, message } = data

        // Verify signature
        try {
            const messageObject: WalletSignatureData = JSON.parse(message)

            // Basic validation
            if (messageObject.action !== 'CONNECT_WALLET') {
                throw new AppError('Invalid signature action', 400)
            }

            // Verify the signature
            const recoveredAddress = ethers.verifyMessage(message, signature)

            if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
                throw new AppError('Invalid signature', 400)
            }

            // Check if wallet is already connected to another account
            const existingWallet = await prisma.user.findUnique({
                where: { walletAddress }
            })

            if (existingWallet && existingWallet.id !== userId) {
                throw new AppError('Wallet already connected to another account', 400)
            }

            // Update user with wallet address
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { walletAddress }
            })

            return {
                id: updatedUser.id,
                email: updatedUser.email,
                walletAddress: updatedUser.walletAddress ? updatedUser.walletAddress : undefined,
                isCreator: updatedUser.isCreator,
                createdAt: updatedUser.createdAt
            }
        } catch (error) {
            throw new AppError('Failed to verify wallet signature', 400)
        }
    },

    // Get current user
    async getCurrentUser(userId: string): Promise<UserResponse> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                tokenAccount: true
            }
        })

        if (!user) {
            throw new AppError('User not found', 404)
        }

        return {
            id: user.id,
            email: user.email,
            walletAddress: user.walletAddress ? user.walletAddress : undefined,
            isCreator: user.isCreator,
            createdAt: user.createdAt
        }
    },

    // Update password
    async updatePassword(userId: string, data: UpdatePasswordDto): Promise<void> {
        const { currentPassword, newPassword } = data

        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!user || !user.password) {
            throw new AppError('User not found', 404)
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password)

        if (!isPasswordValid) {
            throw new AppError('Current password is incorrect', 400)
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12)

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        })
    },

    // Generate message for wallet signature
    generateWalletMessage(action: 'CONNECT_WALLET' | 'LOGIN' = 'CONNECT_WALLET'): string {
        const messageData: WalletSignatureData = {
            message: `AvalCreator ${action}`,
            timestamp: Date.now(),
            action
        }
        return JSON.stringify(messageData)
    }
}