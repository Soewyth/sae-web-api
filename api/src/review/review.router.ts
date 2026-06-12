import { Router } from 'express';
import { verifyJWT } from '../common/jwt.middleware.js';
import { getReviews, putReview, deleteReview } from './review.controller.js';

export const reviewRouter = Router();

//routes
reviewRouter.get('/', verifyJWT, getReviews);
reviewRouter.put('/:id', verifyJWT, putReview);
reviewRouter.delete('/:id', verifyJWT, deleteReview);
