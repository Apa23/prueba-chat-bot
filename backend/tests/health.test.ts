import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/interfaces/http/createApp.js';

/**
 * Prueba de humo de Fase 1. Valida el COMPORTAMIENTO público del health check
 * a través de HTTP (no detalles internos del router). Establece el andamiaje
 * de pruebas (Vitest + supertest) desde el inicio.
 */
describe('GET /health', () => {
  it('should return 200 with status ok', async () => {
    // Arrange
    const app = createApp();

    // Act
    const response = await request(app).get('/health');

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'certbot-backend',
    });
  });

  it('should include an ISO timestamp', async () => {
    // Arrange
    const app = createApp();

    // Act
    const response = await request(app).get('/health');

    // Assert
    expect(response.body.timestamp).toBeTypeOf('string');
    expect(new Date(response.body.timestamp).toString()).not.toBe('Invalid Date');
  });
});
