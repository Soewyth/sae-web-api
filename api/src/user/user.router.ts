import { Router } from 'express';
import { verifyJWT } from '../common/jwt.middleware';


// Import controller functions
import {
    getUsers,
    getUserById,
    updateUser,
    deleteUser
} from './user.controller';

// Create router
export const userRouter = Router();


// Define routes 
//  getUsers, getUserById, updateUser, deleteUser routes
userRouter.get('/', verifyJWT, getUsers)
userRouter.get('/:id', verifyJWT, getUserById)
userRouter.put('/:id', verifyJWT, updateUser)
userRouter.delete('/:id', verifyJWT, deleteUser)