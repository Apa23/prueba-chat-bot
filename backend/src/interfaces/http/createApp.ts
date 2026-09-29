import express, { type Express, type Request, type Response } from 'express';

/**
 * Construye la aplicación HTTP (BFF). Punto de entrada de la capa de interfaces.
 *
 * En esta Fase 1 solo expone un health check. Las rutas del chat, identidad y
 * descarga de PDF se añadirán en fases posteriores, montándose sobre esta misma app.
 */
export function createApp(): Express {
  const app = express();

  app.use(express.json());

  // Health check: permite verificar que el servicio está vivo (útil para Docker y CI).
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'certbot-backend',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
