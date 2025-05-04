// src/config/env.ts
import dotenv from 'dotenv'

dotenv.config()

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL!,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  
  // Web3
  AVALANCHE_RPC_URL: process.env.AVALANCHE_RPC_URL!,
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
  
  // Platform settings
  PLATFORM_FEE_PERCENTAGE: 0.01, // 1%
} as const

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'AVALANCHE_RPC_URL']

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Environment variable ${varName} is required`)
  }
})

export default config