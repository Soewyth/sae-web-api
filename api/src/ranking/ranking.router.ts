import { Router } from 'express';
import {
  getCityRanking,
  getEventRanking,
  getRegionRanking,
} from './ranking.controller.js';

export const rankingRouter = Router();

//routes
rankingRouter.get('/cities', getCityRanking);
rankingRouter.get('/events', getEventRanking);
rankingRouter.get('/regions', getRegionRanking);
