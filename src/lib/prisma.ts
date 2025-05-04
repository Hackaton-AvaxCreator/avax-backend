// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import config from '../config/env'

// Extend the global type to include prisma
declare global {
    var prisma: PrismaClient | undefined
}

// Logger levels for Prisma
const loggerLevels: any[] =
    config.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['info', 'warn', 'error']

// Create a singleton instance
const prismaInstance = () => {
    return new PrismaClient({
        log: loggerLevels,
        datasources: {
            db: {
                url: config.DATABASE_URL,
            },
        },
    })
}

// Prevent multiple instances of Prisma Client in development
const prisma = global.prisma || prismaInstance()

if (config.NODE_ENV !== 'production') {
    global.prisma = prisma
}

export { prisma }

// Soft restart utility for development
export const resetDatabase = async () => {
    if (config.NODE_ENV !== 'production') {
        const tablenames = await prisma.$queryRaw<
            Array<{ tablename: string }>
        >`SELECT tablename FROM pg_tables WHERE schemaname='public'`

        const tables = tablenames
            .map(({ tablename }) => tablename)
            .filter((name) => name !== '_prisma_migrations')
            .map((name) => `"public"."${name}"`)
            .join(', ')

        try {
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`)
        } catch (error) {
            console.log({ error })
        }
    }
}