import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { Router } from 'express';
import { createApp } from '../../src/interfaces/http/createApp.js';
import { crearMiddlewareAcceso } from '../../src/interfaces/http/middleware-acceso.js';

const CLAVE = 'clave-secreta-panel';

function appProtegida() {
  const router = Router();
  router.get('/', (_req, res) => res.json({ ok: true }));
  return createApp({ sesiones: router, middlewareAcceso: crearMiddlewareAcceso(CLAVE) });
}

describe('Middleware de acceso al prototipo', () => {
  it('should reject requests to protected routes without the access key', async () => {
    // Act
    const res = await request(appProtegida()).post('/sesiones');

    // Assert
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('acceso_no_autorizado');
  });

  it('should reject requests with a wrong access key', async () => {
    // Act
    const res = await request(appProtegida()).get('/sesiones').set('X-Access-Key', 'incorrecta');

    // Assert
    expect(res.status).toBe(401);
  });

  it('should allow requests with the correct access key', async () => {
    // Act
    const res = await request(appProtegida()).get('/sesiones').set('X-Access-Key', CLAVE);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('should keep the health check public (no key required)', async () => {
    // Act
    const res = await request(appProtegida()).get('/health');

    // Assert
    expect(res.status).toBe(200);
  });
});
