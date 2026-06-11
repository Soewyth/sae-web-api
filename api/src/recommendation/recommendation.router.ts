import { Router } from 'express';
import { getTopCities } from "./recommendation.controller.js";

export const recommendationRouter = Router();

//routes
recommendationRouter.get('/', getTopCities)