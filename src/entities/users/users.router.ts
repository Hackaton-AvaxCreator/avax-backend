// // src/users/users.router.ts
// import { Router } from 'express'
// import { usersController } from './users.controller'
// import { catchAsync } from '../../shared/middleware/error.middleware'
// import { requireCreator } from '../../shared/middleware/auth.middleware'

// const router = Router()

// // User profile routes
// router.get('/profile', catchAsync(usersController.getProfile))
// router.put('/profile', catchAsync(usersController.updateProfile))

// // Creator routes
// router.post('/become-creator', catchAsync(usersController.becomeCreator))
// router.get('/creator-status', catchAsync(usersController.checkCreatorStatus))

// // Admin routes (if needed)
// router.get('/', catchAsync(usersController.getAllUsers))
// router.get('/:id', catchAsync(usersController.getUserById))

// export default router