// src/entities/users/users.router.ts
import { Router } from 'express'
import { usersController } from './users.controller'

const router = Router()

// User profile routes
router.get('/profile', usersController.getProfile)
router.put('/profile', usersController.updateProfile)

// Creator routes
router.post('/become-creator', usersController.becomeCreator)
router.get('/creator-status', usersController.checkCreatorStatus)

// Admin routes
router.get('/', usersController.getAllUsers)
router.get('/:id', usersController.getUserById)

export default router