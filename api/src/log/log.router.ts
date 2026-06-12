import { Router } from 'express';
import { verifyJWT } from '../common/jwt.middleware.js';
import {getLogs} from './log.controller.js';

export const logRouter = Router();

//routes
logRouter.get('/', verifyJWT, getLogs)