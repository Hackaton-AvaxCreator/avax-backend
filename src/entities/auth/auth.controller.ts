// src/entities/auth/auth.controller.ts
import { Request, Response } from 'express'
import { authService } from './auth.service'
import { responseHelper } from '../../shared/utils/response'
import { AppError } from '../../shared/middleware/error.middleware'
import {
  RegisterDto,
  LoginDto,
  ConnectWalletDto,
  UpdatePasswordDto
} from './auth.types'

// Validation functions (simple validation - consider using Zod or Joi for production)
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePassword = (password: string): boolean => {
  return password.length >= 8
}

export const authController = {
  // Register new user
  async register(req: Request, res: Response) {
    const { email, password, walletAddress }: RegisterDto = req.body

    // Validate input
    if (!email || !password) {
      throw new AppError('Email and password are required', 400)
    }

    if (!validateEmail(email)) {
      throw new AppError('Invalid email format', 400)
    }

    if (!validatePassword(password)) {
      throw new AppError('Password must be at least 8 characters', 400)
    }

    const result = await authService.register({
      email,
      password,
      walletAddress
    })

    return responseHelper.created(res, result, 'User registered successfully')
  },

  // Login user
  async login(req: Request, res: Response) {
    const { email, password }: LoginDto = req.body

    // Validate input
    if (!email || !password) {
      throw new AppError('Email and password are required', 400)
    }

    const result = await authService.login({ email, password })

    return responseHelper.success(res, result, 'Login successful')
  },

  // Connect wallet
  async connectWallet(req: Request, res: Response) {
    const userId = req.user?.id

    if (!userId) {
      throw new AppError('Authentication required', 401)
    }

    const { walletAddress, signature, message }: ConnectWalletDto = req.body

    // Validate input
    if (!walletAddress || !signature || !message) {
      throw new AppError('Wallet address, signature, and message are required', 400)
    }

    const result = await authService.connectWallet(userId, {
      walletAddress,
      signature,
      message
    })

    return responseHelper.success(res, result, 'Wallet connected successfully')
  },

  // Get current user
  async getCurrentUser(req: Request, res: Response) {
    const userId = req.user?.id

    if (!userId) {
      throw new AppError('Authentication required', 401)
    }

    const user = await authService.getCurrentUser(userId)

    return responseHelper.success(res, user)
  },

  // Update password
  async updatePassword(req: Request, res: Response) {
    const userId = req.user?.id

    if (!userId) {
      throw new AppError('Authentication required', 401)
    }

    const { currentPassword, newPassword }: UpdatePasswordDto = req.body

    // Validate input
    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400)
    }

    if (!validatePassword(newPassword)) {
      throw new AppError('New password must be at least 8 characters', 400)
    }

    await authService.updatePassword(userId, {
      currentPassword,
      newPassword
    })

    return responseHelper.success(res, null, 'Password updated successfully')
  },

  // Logout user (simple implementation)
  async logout(req: Request, res: Response) {
    // In a more complete implementation, you might want to:
    // 1. Invalidate the token (requires token blacklist)
    // 2. Clear any refresh tokens
    // 3. Log the logout action

    return responseHelper.success(res, null, 'Logged out successfully')
  },

  // Generate wallet message (helper endpoint)
  generateWalletMessage(req: Request, res: Response) {
    const message = authService.generateWalletMessage()
    return responseHelper.success(res, { message })
  }
}