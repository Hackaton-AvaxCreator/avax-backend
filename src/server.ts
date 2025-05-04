// src/server.ts
import app from './app'
import { prisma } from './lib/prisma'
import config from './config/env'
import { logger } from './shared/utils/logger/logger'

const port = config.PORT || 3000

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error)
  process.exit(1)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect()
    logger.info('Database connected successfully')

    // Start the server
    const server = app.listen(port, () => {
      logger.info(`Server is running on port ${port}`)
      logger.info(`Environment: ${config.NODE_ENV}`)
    })

    // Graceful shutdown
    const gracefulShutdown = async () => {
      logger.info('SIGTERM received. Starting graceful shutdown...')
      
      server.close(async () => {
        logger.info('HTTP server closed')
        
        try {
          await prisma.$disconnect()
          logger.info('Database connections closed')
          process.exit(0)
        } catch (error) {
          logger.error('Error during database disconnect:', error)
          process.exit(1)
        }
      })

      // Force close after 10s
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down')
        process.exit(1)
      }, 10000)
    }

    // Handle shutdown signals
    process.on('SIGTERM', gracefulShutdown)
    process.on('SIGINT', gracefulShutdown)

  } catch (error) {
    logger.error('Error starting server:', error)
    process.exit(1)
  }
}

startServer()