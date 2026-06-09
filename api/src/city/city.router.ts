import {Router} from 'express';
import {getCities, getCityById, getEventByCity} from "./city.controller.js";

export const cityRouter = Router();

//routes
cityRouter.get('/', getCities)
cityRouter.get('/:cityId', getCityById)
cityRouter.get('/:cityId/events', getEventByCity)