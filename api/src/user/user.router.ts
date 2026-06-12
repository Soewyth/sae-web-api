import { Router } from 'express';
import { verifyJWT } from '../common/jwt.middleware.js';

// Import controller functions
import { getUsers, getEventsByUser, deleteUser } from './user.controller.js';

// Create router
export const userRouter = Router();

// Define routes
userRouter.get('/', verifyJWT, getUsers);
userRouter.get('/:id/events', verifyJWT, getEventsByUser);
userRouter.delete('/:id', verifyJWT, deleteUser);
