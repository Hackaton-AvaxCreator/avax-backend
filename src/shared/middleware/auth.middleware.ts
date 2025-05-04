// src/shared/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../../lib/prisma'
import config from '../../config/env'
import { AppError } from './error.middleware'

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string
                email: string
                isCreator: boolean
            }
        }
    }
}

// JWT payload interface
interface JWTPayload {
    id: string
    email: string
    isCreator: boolean
    iat: number
    exp: number
}

// Main auth middleware
export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let token: string | undefined

        // Check for token in Authorization header
        if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1]
        }

        if (!token) {
            throw new AppError('You are not logged in. Please log in to get access', 401)
        }

        // Verify token
        const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload

        // Check if user still exists
        const currentUser = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                isCreator: true
            }
        })

        if (!currentUser) {
            throw new AppError('The user belonging to this token no longer exists', 401)
        }

        // Attach user to request
        req.user = currentUser
        next()
    } catch (error) {
        next(error)
    }
}

// Role-based auth middleware
export const requireCreator = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.isCreator) {
        return next(new AppError('This action requires creator privileges', 403))
    }
    next()
}

// Optional auth middleware (user can be authenticated or not)
export const optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let token: string | undefined

        if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1]
        }

        if (token) {
            const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload

            const currentUser = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: {
                    id: true,
                    email: true,
                    isCreator: true
                }
            })

            if (currentUser) {
                req.user = currentUser
            }
        }

        next()
    } catch (error) {
        // Continue without user if token is invalid
        next()
    }
}

// Rate limiting middleware
export const rateLimiter = (
    windowMs: number = 15 * 60 * 1000, // 15 minutes
    maxRequests: number = 100
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Implementation would use Redis or memory store for proper rate limiting
        // This is a simplified version
        next()
    }
}