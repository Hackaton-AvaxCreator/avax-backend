// src/test-local.ts
import { prisma } from './lib/prisma'
import { ethers } from 'ethers'

// Mock Web3 for local testing without blockchain
class MockWeb3Service {
    async isContractDeployed(): Promise<boolean> {
        return false
    }

    async getBlockNumber(): Promise<number> {
        return 12345
    }

    async getBalance(address: string): Promise<string> {
        return '1.5'
    }

    async getTransactionStatus(hash: string): Promise<string> {
        return 'success'
    }

    formatToWei(amount: string) {
        return ethers.parseEther(amount)
    }

    formatFromWei(amount: any) {
        return ethers.formatEther(amount)
    }
}

async function runLocalTests() {
    console.log('🚀 Starting local tests...\n')

    try {
        // Test 1: Database Connection
        console.log('Test 1: Database Connection')
        await prisma.$connect()
        console.log('✅ Database connected successfully\n')

        // Test 2: Create Test User
        console.log('Test 2: Create Test User')
        const testUser = await prisma.user.create({
            data: {
                email: 'test@example.com',
                password: '$2b$12$hashedpassword',
                walletAddress: '0x1234567890123456789012345678901234567890',
                tokenAccount: {
                    create: {
                        balance: 1000
                    }
                }
            }
        })
        console.log(`✅ User created: ${testUser.id}\n`)

        // Test 3: Create Test Content
        console.log('Test 3: Create Test Content')
        const testContent = await prisma.content.create({
            data: {
                creatorId: testUser.id,
                title: 'Test Content',
                price: 10.99,
                status: 'ACTIVE'
            }
        })
        console.log(`✅ Content created: ${testContent.id}\n`)

        // Test 4: Test Web3 Service (Mock)
        console.log('Test 4: Test Web3 Service')
        const mockWeb3 = new MockWeb3Service()
        const isDeployed = await mockWeb3.isContractDeployed()
        const blockNumber = await mockWeb3.getBlockNumber()
        console.log(`✅ Contract deployed: ${isDeployed}`)
        console.log(`✅ Block number: ${blockNumber}\n`)

        // Test 6: Query Test
        console.log('Test 6: Query Test')
        const userWithContent = await prisma.user.findUnique({
            where: { id: testUser.id },
            include: {
                createdContent: true,
                tokenAccount: true
            }
        })
        console.log(`✅ User content: ${userWithContent?.createdContent.length} items`)
        console.log(`✅ Token balance: ${userWithContent?.tokenAccount?.balance}\n`)

        console.log('🎉 All tests passed successfully!')

    } catch (error) {
        console.error('❌ Error in tests:', error)
    } finally {
        await prisma.$disconnect()
    }
}

runLocalTests()