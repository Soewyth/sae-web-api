import {Router} from 'express';
import {getTopCities, getCityScores} from "./recommendation.controller.js";

export const recommendationRouter = Router();

//routes
recommendationRouter.get('/', getTopCities)
recommendationRouter.get('/:cityId', getCityScores)