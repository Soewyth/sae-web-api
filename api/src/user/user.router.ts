import { Router } from 'express';
import { verifyJWT } from '../common/jwt.middleware.js';

// Import controller functions
import {
  getUsers,
  getUserById,
  getEventsByUser,
  updateUser,
  deleteUser,
} from './user.controller.js';

// Create router
export const userRouter = Router();

// Define routes
//  getUsers, getUserById, updateUser, deleteUser routes
userRouter.get('/', verifyJWT, getUsers);
userRouter.get('/:id', verifyJWT, getUserById);
userRouter.get('/:id/events', verifyJWT, getEventsByUser);
userRouter.put('/:id', verifyJWT, updateUser);
userRouter.delete('/:id', verifyJWT, deleteUser);
