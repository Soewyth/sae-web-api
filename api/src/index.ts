import 'dotenv/config'
import express from 'express'
import { prisma } from './client.js'
import type { Request, Response, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'
import { authRouter } from './auth/auth.router.js'
import { userRouter } from './user/user.router.js'
import { cityRouter } from './city/city.router.js'
import { eventRouter } from './event/event.router.js'
import { reviewRouter } from './review/review.router.js'
import { logRouter } from './log/log.router.js'
import { recommendationRouter } from './recommendation/recommendation.router.js'

export const app = express();

app.use(express.json());

// Documentation Swagger (OpenAPI) disponible sur /api-docs
const swaggerDocument = YAML.load('./swagger.yaml')
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

const port = process.env.API_PORT || 3070

export const server = app.listen(port, () => {
  console.log(`API running on port ${port}`);
})

app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    // Test simple de connexion PostgreSQL via Prisma
    await prisma.$queryRaw`SELECT 1`

    res.status(200).json({
      status: 'ok',
      api: 'up',
      database: 'up'
    })
  } catch (error) {
    console.error('Healthcheck failed:', error)

    res.status(503).json({
      status: 'error',
      api: 'up',
      database: 'down'
    })
  }
})

app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Requête reçue : ${req.method} ${req.url}`);
  next(); // Passe à la prochaine fonction middleware ou route
});

app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/city', cityRouter);
app.use('/event', eventRouter);
app.use('/review', reviewRouter);
app.use('/logs', logRouter);
app.use('/recommendations', recommendationRouter);

export function stopServer() {
  if (server) server.close();
}