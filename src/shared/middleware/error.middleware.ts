// src/shared/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express'
import config from '../../config/env'
import { logger } from '../utils/logger/logger'

// Error types
export class AppError extends Error {
    statusCode: number
    isOperational: boolean

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
        super(message)
        this.statusCode = statusCode
        this.isOperational = isOperational

        Error.captureStackTrace(this, this.constructor)
    }
}

// Error response interface
interface ErrorResponse {
    success: false
    message: string
    error?: any
}

// Development error response
const sendErrorDev = (err: AppError, res: Response) => {
    const errorResponse: ErrorResponse = {
        success: false,
        message: err.message,
        error: {
            status: err.statusCode,
            stack: err.stack,
            isOperational: err.isOperational
        }
    }

    logger.error('Development Error:', err)
    res.status(err.statusCode).json(errorResponse)
}

// Production error response
const sendErrorProd = (err: AppError, res: Response) => {
    // Operational errors can be exposed to clients
    if (err.isOperational) {
        const errorResponse: ErrorResponse = {
            success: false,
            message: err.message
        }

        res.status(err.statusCode).json(errorResponse)
    } else {
        // Programming errors shouldn't be leaked
        logger.error('Unknown Error:', err)

        const errorResponse: ErrorResponse = {
            success: false,
            message: 'Something went wrong'
        }

        res.status(500).json(errorResponse)
    }
}

// Handle specific error types
const handleJWTError = () =>
    new AppError('Invalid token. Please log in again!', 401)

const handleJWTExpiredError = () =>
    new AppError('Your token has expired! Please log in again.', 401)

const handleValidationError = (err: any) =>
    new AppError(err.message, 400)

const handleDuplicateFieldsDB = (err: any) => {
    const field = err.meta?.target
    const message = `Duplicate value for field: ${field}`
    return new AppError(message, 400)
}

// Main error middleware
export const errorMiddleware = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Set default status and message
    err.statusCode = err.statusCode || 500
    err.isOperational = err.isOperational || false

    // Handle different error types
    if (config.NODE_ENV === 'development') {
        sendErrorDev(err, res)
    } else if (config.NODE_ENV === 'production') {
        let error = { ...err }
        error.message = err.message

        // Prisma unique constraint error
        if (err.code === 'P2002') error = handleDuplicateFieldsDB(err)

        // JWT errors
        if (err.name === 'JsonWebTokenError') error = handleJWTError()
        if (err.name === 'TokenExpiredError') error = handleJWTExpiredError()

        // Validation errors
        if (err.name === 'ValidationError') error = handleValidationError(err)

        sendErrorProd(error, res)
    }
}

// Async error catcher wrapper
export const catchAsync = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next)
    }
}

// 404 Error handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
    const err = new AppError(`Route ${req.originalUrl} not found`, 404)
    next(err)
}