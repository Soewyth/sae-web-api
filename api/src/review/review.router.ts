import { Router } from 'express';
import { verifyJWT } from '../common/jwt.middleware.js';
import { getReviews } from './review.controller.js';

export const reviewRouter = Router();

//routes
reviewRouter.get('/', verifyJWT, getReviews);
