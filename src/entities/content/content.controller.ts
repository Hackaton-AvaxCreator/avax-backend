// src/entities/content/content.controller.ts
import { Request, Response } from 'express'
import { contentService } from './content.service'
import { AppError } from '../../shared/middleware/error.middleware'
import { CreateContentDto, UpdateContentDto, ContentQueryFilter } from './content.types'
import { usersService } from '../users/users.service'

export const contentController = {
    // Get all content
    async getAll(req: Request, res: Response) {
        const filter: ContentQueryFilter = {
            creatorId: req.query.creatorId as string,
            status: req.query.status as 'ACTIVE' | 'INACTIVE',
            minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
            maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
            search: req.query.search as string,
            limit: parseInt(req.query.limit as string) || 10,
            offset: parseInt(req.query.offset as string) || 0
        }

        const content = await contentService.getAllContent(filter)

        res.status(200).json({
            success: true,
            data: content
        })
    },

    // Get content by ID
    async getById(req: Request, res: Response) {
        const { id } = req.params

        const content = await contentService.getContentWithStats(id)

        if (!content) {
            throw new AppError('Content not found', 404)
        }

        res.status(200).json({
            success: true,
            data: content
        })
    },

    // Get content by creator
    async getByCreator(req: Request, res: Response) {
        const { creatorId } = req.params

        const content = await contentService.getContentByCreator(creatorId)

        res.status(200).json({
            success: true,
            data: content
        })
    },

    // Create content
    async create(req: Request, res: Response) {
        const userId = req.user?.id
        const data: CreateContentDto = req.body

        if (!userId) {
            throw new AppError('User not authenticated', 401)
        }

        // Validate input
        if (!data.title || data.price === undefined) {
            throw new AppError('Title and price are required', 400)
        }

        if (data.price < 0) {
            throw new AppError('Price cannot be negative', 400)
        }

        const content = await contentService.createContent(userId, data)

        res.status(201).json({
            success: true,
            data: content,
            message: 'Content created successfully'
        })
    },

    // Update content
    async update(req: Request, res: Response) {
        const { id } = req.params
        const userId = req.user?.id
        const data: UpdateContentDto = req.body

        if (!userId) {
            throw new AppError('User not authenticated', 401)
        }

        // Check if content exists and user owns it
        const existingContent = await contentService.getContentById(id)

        if (!existingContent) {
            throw new AppError('Content not found', 404)
        }

        if (existingContent.creatorId !== userId) {
            throw new AppError('You can only update your own content', 403)
        }

        const updatedContent = await contentService.updateContent(id, data)

        res.status(200).json({
            success: true,
            data: updatedContent,
            message: 'Content updated successfully'
        })
    },

    // Delete content
    async delete(req: Request, res: Response) {
        const { id } = req.params
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('User not authenticated', 401)
        }

        // Check if content exists and user owns it
        const content = await contentService.getContentById(id)

        if (!content) {
            throw new AppError('Content not found', 404)
        }

        if (content.creatorId !== userId) {
            throw new AppError('You can only delete your own content', 403)
        }

        await contentService.deleteContent(id)

        res.status(200).json({
            success: true,
            message: 'Content deleted successfully'
        })
    },

    // Update content status
    async updateStatus(req: Request, res: Response) {
        const { id } = req.params
        const { status } = req.body
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('User not authenticated', 401)
        }

        if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
            throw new AppError('Invalid status. Must be ACTIVE or INACTIVE', 400)
        }

        // Check if content exists and user owns it
        const content = await contentService.getContentById(id)

        if (!content) {
            throw new AppError('Content not found', 404)
        }

        if (content.creatorId !== userId) {
            throw new AppError('You can only update your own content', 403)
        }

        const updatedContent = await contentService.updateStatus(id, status)

        res.status(200).json({
            success: true,
            data: updatedContent,
            message: `Content status updated to ${status}`
        })
    },

    // Purchase content
    async purchase(req: Request, res: Response) {
        const { id } = req.params
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('User not authenticated', 401)
        }

        try {
            const purchase = await contentService.purchaseContent(userId, id)

            res.status(200).json({
                success: true,
                data: purchase,
                message: 'Content purchased successfully'
            })
        } catch (error: any) {
            throw new AppError(error.message, 400)
        }
    },

    // Switch to ownership
    async ownership(req: Request, res: Response) {
        const { newOwnerId } = req.body
        const { id } = req.params
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('User not authenticated', 401)
        }
        // Check if content exists and user owns it
        const content = await contentService.getContentById(id)
        if (!content) {
            throw new AppError('Content not found', 404)
        }
        if (content.creatorId !== userId) {
            throw new AppError('You can only update your own content', 403)
        }
        // Check if new owner exists
        const newOwner = await usersService.getUserById(newOwnerId)
        if (!newOwner) {
            throw new AppError('New owner not found', 404)
        }
        // Check if new owner is already the owner
        const isAlreadyOwner = await contentService.checkOwnership(newOwnerId, id)
        if (isAlreadyOwner) {
            throw new AppError('New owner already owns this content', 400)
        }
        // Transfer ownership
        const updatedContent = await contentService.transferOwnership(id, newOwnerId)
        if (!updatedContent) {
            throw new AppError('Failed to transfer ownership', 500)
        }
        res.status(200).json({
            success: true,
            data: updatedContent,
            message: 'Ownership transferred successfully'
        })
    }
}