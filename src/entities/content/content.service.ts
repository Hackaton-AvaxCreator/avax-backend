// src/entities/content/content.service.ts
import { prisma } from '../../lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import {
    CreateContentDto,
    UpdateContentDto,
    ContentResponse,
    ContentWithStatsResponse,
    ContentQueryFilter,
    PurchaseContentDto,
    PurchaseResponse
} from './content.types'

export const contentService = {
    // Create content
    async createContent(creatorId: string, data: CreateContentDto): Promise<ContentResponse> {
        const content = await prisma.content.create({
            data: {
                creatorId,
                title: data.title,
                price: new Decimal(data.price),
                status: 'ACTIVE'
            },
            include: {
                creator: {
                    select: { id: true, email: true }
                }
            }
        })

        return this.mapToContentResponse(content)
    },

    // Get content by ID
    async getContentById(id: string): Promise<ContentResponse | null> {
        const content = await prisma.content.findUnique({
            where: { id },
            include: {
                creator: {
                    select: { id: true, email: true }
                }
            }
        })

        if (!content) return null

        return this.mapToContentResponse(content)
    },

    // Get all content with filters
    async getAllContent(filter: ContentQueryFilter = {}): Promise<ContentResponse[]> {
        const { creatorId, status, minPrice, maxPrice, type, limit = 10, offset = 0, search } = filter

        const where: any = {}

        if (creatorId) {
            where.creatorId = creatorId
        }

        if (status) {
            where.status = status
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {}
            if (minPrice !== undefined) where.price.gte = new Decimal(minPrice)
            if (maxPrice !== undefined) where.price.lte = new Decimal(maxPrice)
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ]
        }

        const content = await prisma.content.findMany({
            where,
            include: {
                creator: {
                    select: { id: true, email: true }
                }
            },
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' }
        })

        return content.map(this.mapToContentResponse)
    },

    // Get content by creator
    async getContentByCreator(creatorId: string): Promise<ContentResponse[]> {
        return this.getAllContent({ creatorId })
    },

    // Update content
    async updateContent(id: string, data: UpdateContentDto): Promise<ContentResponse> {
        const content = await prisma.content.update({
            where: { id },
            data,
            include: {
                creator: {
                    select: { id: true, email: true }
                }
            }
        })

        return this.mapToContentResponse(content)
    },

    // Delete content
    async deleteContent(id: string): Promise<void> {
        await prisma.content.delete({
            where: { id }
        })
    },

    // Update content status
    async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<ContentResponse> {
        const content = await prisma.content.update({
            where: { id },
            data: { status },
            include: {
                creator: {
                    select: { id: true, email: true }
                }
            }
        })

        return this.mapToContentResponse(content)
    },

    // Purchase content
    async purchaseContent(userId: string, contentId: string): Promise<PurchaseResponse> {
        // Get content to verify price
        const content = await prisma.content.findUnique({
            where: { id: contentId }
        })

        if (!content) {
            throw new Error('Content not found')
        }

        if (content.status !== 'ACTIVE') {
            throw new Error('Content is not available for purchase')
        }

        const amount = new Decimal(content.price)

        // Process payment (simplified for MVP)
        const payment = await prisma.payment.create({
            data: {
                fromUserId: userId,
                toUserId: content.creatorId,
                contentId,
                amount: amount,
                platformFee: amount.mul(0.01),
                type: 'PURCHASE',
                status: 'COMPLETED',
            }
        })

        // In a real system, you'd grant access to the content here
        return {
            contentId,
            userId,
            amount: Number(amount),
            status: 'COMPLETED',
            accessUrl: `/content/${contentId}/access`, // Mock access URL
            timestamp: payment.createdAt
        }
    },

    // Get content with stats
    async getContentWithStats(id: string): Promise<ContentWithStatsResponse | null> {
        const content = await this.getContentById(id)

        if (!content) return null

        // Get purchase stats
        const payments = await prisma.payment.findMany({
            where: { contentId: id }
        })

        const purchases = payments.length
        const totalEarnings = payments.reduce((sum, payment) => sum + Number(payment.amount), 0)

        return {
            ...content,
            purchases,
            totalEarnings
        }
    },

    // Ownership transfer (simplified for MVP)
    async transferOwnership(contentId: string, newOwnerId: string): Promise<ContentResponse> {
        const content = await prisma.content.update({
            where: { id: contentId },
            data: { creatorId: newOwnerId },
            include: {
                creator: {
                    select: { id: true, email: true }
                }
            }
        })

        return this.mapToContentResponse(content)
    },

    // Check ownership (simplified for MVP)
    async checkOwnership(userId: string, contentId: string): Promise<boolean> {
        const content = await prisma.content.findUnique({
            where: { id: contentId }
        })

        if (!content) return false

        return content.creatorId === userId
    },
    

    // Helper: Map Content model to ContentResponse
    mapToContentResponse(content: any): ContentResponse {
        return {
            id: content.id,
            creatorId: content.creatorId,
            title: content.title,
            price: Number(content.price),
            status: content.status,
            createdAt: content.createdAt,
            creator: content.creator ? {
                id: content.creator.id,
                email: content.creator.email
            } : undefined
        }
    }
}