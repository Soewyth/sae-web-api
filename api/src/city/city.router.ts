import { Router } from 'express';
import { getCities } from './city.controller.js';

export const cityRouter = Router();

//routes
cityRouter.get('/', getCities);
