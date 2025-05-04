// src/entities/users/users.controller.ts
import { Request, Response } from 'express'
import { usersService } from './users.service'
import { AppError } from '../../shared/middleware/error.middleware'
import { UpdateProfileDto, UserQueryFilter } from './users.types'

export const usersController = {
    // Get user profile
    async getProfile(req: Request, res: Response) {
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('User not authenticated', 401)
        }

        const user = await usersService.getUserWithStats(userId)

        if (!user) {
            throw new AppError('User not found', 404)
        }

        res.status(200).json({
            success: true,
            data: user
        })
    },

    // Update user profile
    async updateProfile(req: Request, res: Response) {
        const userId = req.user?.id
        const updateData: UpdateProfileDto = req.body

        if (!userId) {
            throw new AppError('User not authenticated', 401)
        }

        // Basic validation
        if (updateData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateData.email)) {
            throw new AppError('Invalid email format', 400)
        }

        try {
            const updatedUser = await usersService.updateProfile(userId, updateData)

            res.status(200).json({
                success: true,
                data: updatedUser,
                message: 'Profile updated successfully'
            })
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new AppError('Email or wallet address already exists', 400)
            }
            throw error
        }
    },

    // Become creator
    async becomeCreator(req: Request, res: Response) {
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('User not authenticated', 401)
        }

        try {
            const creator = await usersService.becomeCreator(userId)

            res.status(200).json({
                success: true,
                data: creator,
                message: 'Successfully became a creator'
            })
        } catch (error: any) {
            throw new AppError(error.message, 400)
        }
    },

    // Check creator status
    async checkCreatorStatus(req: Request, res: Response) {
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('User not authenticated', 401)
        }

        try {
            const status = await usersService.checkCreatorStatus(userId)

            res.status(200).json({
                success: true,
                data: status
            })
        } catch (error: any) {
            throw new AppError(error.message, 400)
        }
    },

    // Get all users (admin)
    async getAllUsers(req: Request, res: Response) {
        const filter: UserQueryFilter = {
            isCreator: req.query.isCreator === 'true' ? true : req.query.isCreator === 'false' ? false : undefined,
            search: req.query.search as string,
            limit: parseInt(req.query.limit as string) || 10,
            offset: parseInt(req.query.offset as string) || 0
        }

        const users = await usersService.getAllUsers(filter)

        res.status(200).json({
            success: true,
            data: users
        })
    },

    // Get user by ID
    async getUserById(req: Request, res: Response) {
        const { id } = req.params

        const user = await usersService.getUserById(id)

        if (!user) {
            throw new AppError('User not found', 404)
        }

        res.status(200).json({
            success: true,
            data: user
        })
    }
}