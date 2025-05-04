// src/shared/utils/response.ts
import { Response } from 'express'

interface ApiResponse<T> {
    success: boolean
    data?: T
    message?: string
    error?: any
}

export const responseHelper = {
    success<T>(res: Response, data: T, message?: string, statusCode: number = 200) {
        const response: ApiResponse<T> = {
            success: true,
            data,
            message
        }
        return res.status(statusCode).json(response)
    },

    error(res: Response, message: string, statusCode: number = 500, error?: any) {
        const response: ApiResponse<null> = {
            success: false,
            message,
            error: process.env.NODE_ENV === 'development' ? error : undefined
        }
        return res.status(statusCode).json(response)
    },

    created<T>(res: Response, data: T, message = 'Resource created successfully') {
        return this.success(res, data, message, 201)
    },

    unauthorized(res: Response, message = 'Unauthorized access') {
        return this.error(res, message, 401)
    },

    forbidden(res: Response, message = 'Forbidden access') {
        return this.error(res, message, 403)
    },

    notFound(res: Response, message = 'Resource not found') {
        return this.error(res, message, 404)
    },

    badRequest(res: Response, message = 'Bad request', error?: any) {
        return this.error(res, message, 400, error)
    },

    serverError(res: Response, message = 'Internal server error', error?: any) {
        return this.error(res, message, 500, error)
    }
}