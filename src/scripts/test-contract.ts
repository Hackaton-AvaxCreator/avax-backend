// src/scripts/test-contract.ts
import { exit } from 'process'
import { web3Service } from '../entities/web3/web3.service'
import { logger } from '../shared/utils/logger/logger'

async function testContractIntegration() {
    try {
        // Test 1: Verificar conexión al contrato
        logger.info('Test 1: Checking contract connection...')
        const isDeployed = await web3Service.isContractDeployed()
        logger.info(`Contract deployed: ${isDeployed}`)

        // Test 2: Leer valores del contrato
        logger.info('Test 2: Reading contract values...')
        const platformFee = await web3Service.contract.platformFeePercentage()
        const platformWallet = await web3Service.contract.platformWallet()
        logger.info(`Platform fee: ${platformFee}%`)
        logger.info(`Platform wallet: ${platformWallet}`)

        // Test 3: Registrar contenido (necesitarás una wallet con fondos)
        const testContentId = `TEST_CONTENT_${Date.now()}`
        const testPrice = '0.1' // 0.1 AVAX

        logger.info('Test 3: Registering content...')
        // Necesitarás descomentar esto y proporcionar una private key
        /*
        const registerResult = await web3Service.registerContent(
            testContentId,
            testPrice,
            'YOUR_PRIVATE_KEY_HERE'
        )
        logger.info('Content registered:', registerResult)
        */

        // Test 4: Consultar detalles del contenido
        logger.info('Test 4: Getting content details...')
        const contentDetails = await web3Service.getContentDetails(testContentId)
        logger.info('Content details:', contentDetails)

        // Test 5: Escuchar eventos
        logger.info('Test 5: Starting event listener...')
        web3Service.listenToContractEvents()

        logger.info('All tests completed!')
        exit(0)
    } catch (error) {
        logger.error('Test failed:', error)
    }
}

// Ejecutar test
testContractIntegration()