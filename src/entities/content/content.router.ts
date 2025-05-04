// // src/content/content.router.ts
// import { Router } from 'express'
// // import { contentController } from './content.controller'
// import { catchAsync } from '../../shared/middleware/error.middleware'
// import { requireCreator } from '../../shared/middleware/auth.middleware'

// const router = Router()

// // // Public routes
// // router.get('/', catchAsync(contentController.getAll))
// // router.get('/:id', catchAsync(contentController.getById))
// // router.get('/creator/:creatorId', catchAsync(contentController.getByCreator))

// // // Creator routes
// // router.post('/', requireCreator, catchAsync(contentController.create))
// // router.put('/:id', requireCreator, catchAsync(contentController.update))
// // router.delete('/:id', requireCreator, catchAsync(contentController.delete))
// // router.patch('/:id/status', requireCreator, catchAsync(contentController.updateStatus))

// // // Purchase routes
// // router.post('/:id/purchase', catchAsync(contentController.purchase))

// export default router