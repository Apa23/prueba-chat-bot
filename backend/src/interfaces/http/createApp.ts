import express, { type Express, type Request, type Response, type Router } from 'express';

export function createApp(sesionesRouter?: Router): Express {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'certbot-backend',
      timestamp: new Date().toISOString(),
    });
  });

  if (sesionesRouter) {
    app.use('/sesiones', sesionesRouter);
  }

  return app;
}
