import { Router } from 'express';
import { verifyJWT } from '../common/jwt.middleware.js';
import {
  getEvents,
  getEventTypes,
  postEvent,
  putEvent,
  deleteEvent,
} from './event.controller.js';

export const eventRouter = Router();

//routes
eventRouter.get('/', getEvents);
eventRouter.get('/type', getEventTypes);
eventRouter.post('/', verifyJWT, postEvent);
eventRouter.put('/:id', verifyJWT, putEvent);
eventRouter.delete('/:id', verifyJWT, deleteEvent);
