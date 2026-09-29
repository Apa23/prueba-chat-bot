import express, { type Express, type Request, type Response, type Router } from 'express';

export interface RoutersApp {
  readonly sesiones?: Router;
  readonly descargas?: Router;
  readonly middlewareAcceso?: (req: Request, res: Response, next: () => void) => void;
}

export function createApp(routers: RoutersApp = {}): Express {
  const app = express();

  app.use(express.json());

  app.use((req: Request, res: Response, next) => {
    res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN ?? '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Access-Key');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'certbot-backend',
      timestamp: new Date().toISOString(),
    });
  });

  const proteger = routers.middlewareAcceso;

  if (routers.sesiones) {
    app.use('/sesiones', ...(proteger ? [proteger] : []), routers.sesiones);
  }
  if (routers.descargas) {
    app.use('/descargas', ...(proteger ? [proteger] : []), routers.descargas);
  }

  return app;
}
