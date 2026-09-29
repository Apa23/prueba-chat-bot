import express, { type Express, type Request, type Response, type Router } from 'express';

export interface RoutersApp {
  readonly sesiones?: Router;
  readonly descargas?: Router;
}

export function createApp(routers: RoutersApp = {}): Express {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'certbot-backend',
      timestamp: new Date().toISOString(),
    });
  });

  if (routers.sesiones) {
    app.use('/sesiones', routers.sesiones);
  }
  if (routers.descargas) {
    app.use('/descargas', routers.descargas);
  }

  return app;
}
