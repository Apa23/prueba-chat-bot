import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/interfaces/http/createApp.js';
import { crearSesionesRouter } from '../../src/interfaces/http/sesiones-router.js';
import { Orquestador } from '../../src/application/orquestador/orquestador.js';
import { LlmMock } from '../../src/infrastructure/llm/llm-mock.js';
import { InMemorySessionStore } from '../../src/infrastructure/persistencia/session-store-memoria.js';
import type { AfiliadoRepositoryPort } from '../../src/application/puertos/afiliado-repository.js';
import type { Afiliado } from '../../src/domain/afiliado.js';

const AF_001: Afiliado = {
  id: 'AF-001',
  tipoDocumento: 'CC',
  numeroDocumento: 'PRUEBA-0001',
  nombre: 'Mariana Ficticia Ejemplo',
  correoSimulado: 'mariana@correo-prueba.test',
  productos: {
    pensionObligatoria: { fechaAfiliacion: '15/03/2012', estado: 'Activo', fondo: 'Fondo moderado' },
  },
};

const afiliadosStub: AfiliadoRepositoryPort = {
  async buscarPorDocumento(tipo, numero) {
    return tipo === AF_001.tipoDocumento && numero === AF_001.numeroDocumento ? AF_001 : undefined;
  },
  async buscarPorId(id) {
    return id === AF_001.id ? AF_001 : undefined;
  },
};

function construirApp(): Express {
  const router = crearSesionesRouter({
    orquestador: new Orquestador(new LlmMock()),
    store: new InMemorySessionStore(),
    afiliados: afiliadosStub,
    otpValido: '123456',
    ttlMinutos: 15,
    maxIntentosOtp: 3,
  });
  return createApp(router);
}

describe('Flujo de sesiones (integración HTTP)', () => {
  let app: Express;

  beforeEach(() => {
    app = construirApp();
  });

  it('should create a session and return an initial message', async () => {
    // Act
    const res = await request(app).post('/sesiones').send();

    // Assert
    expect(res.status).toBe(201);
    expect(res.body.sessionId).toBeTypeOf('string');
    expect(res.body.mensaje).toContain('tratamiento de tus datos');
  });

  it('should validate identity with correct document and OTP (caso 1)', async () => {
    // Arrange
    const creada = await request(app).post('/sesiones').send();

    // Act
    const res = await request(app)
      .post(`/sesiones/${creada.body.sessionId}/identidad`)
      .send({ tipoDocumento: 'CC', numeroDocumento: 'PRUEBA-0001', otp: '123456' });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.identidadValidada).toBe(true);
  });

  it('should reject identity with wrong OTP without revealing details (caso 4)', async () => {
    // Arrange
    const creada = await request(app).post('/sesiones').send();

    // Act
    const res = await request(app)
      .post(`/sesiones/${creada.body.sessionId}/identidad`)
      .send({ tipoDocumento: 'CC', numeroDocumento: 'PRUEBA-0001', otp: '000000' });

    // Assert
    expect(res.status).toBe(401);
    expect(res.body.error.mensaje).not.toContain('OTP');
  });

  it('should require identity before delivering a certificate', async () => {
    // Arrange
    const creada = await request(app).post('/sesiones').send();

    // Act
    const res = await request(app)
      .post(`/sesiones/${creada.body.sessionId}/mensajes`)
      .send({ mensaje: 'quiero mi certificado de afiliación' });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('validando_identidad');
  });

  it('should reach executing state after identity validation and certificate request', async () => {
    // Arrange
    const creada = await request(app).post('/sesiones').send();
    const id = creada.body.sessionId;
    await request(app)
      .post(`/sesiones/${id}/identidad`)
      .send({ tipoDocumento: 'CC', numeroDocumento: 'PRUEBA-0001', otp: '123456' });

    // Act
    const res = await request(app)
      .post(`/sesiones/${id}/mensajes`)
      .send({ mensaje: 'certificado de afiliación' });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('ejecutando');
  });

  it('should return 404 for messages on an unknown session', async () => {
    // Act
    const res = await request(app)
      .post('/sesiones/inexistente/mensajes')
      .send({ mensaje: 'hola' });

    // Assert
    expect(res.status).toBe(404);
  });

  it('should return 400 for an empty message', async () => {
    // Arrange
    const creada = await request(app).post('/sesiones').send();

    // Act
    const res = await request(app)
      .post(`/sesiones/${creada.body.sessionId}/mensajes`)
      .send({ mensaje: '' });

    // Assert
    expect(res.status).toBe(400);
  });

  it('should block the session after max failed OTP attempts (bloqueo temporal)', async () => {
    // Arrange
    const creada = await request(app).post('/sesiones').send();
    const id = creada.body.sessionId;
    const otpMalo = { tipoDocumento: 'CC', numeroDocumento: 'PRUEBA-0001', otp: '000000' };
    await request(app).post(`/sesiones/${id}/identidad`).send(otpMalo);
    await request(app).post(`/sesiones/${id}/identidad`).send(otpMalo);
    await request(app).post(`/sesiones/${id}/identidad`).send(otpMalo);

    // Act
    const res = await request(app).post(`/sesiones/${id}/identidad`).send(otpMalo);

    // Assert
    expect(res.status).toBe(429);
  });

  it('should expire the session after TTL of inactivity', async () => {
    // Arrange: reloj controlado que salta 16 minutos entre creación y mensaje
    let t = 1_000_000;
    const router = crearSesionesRouter({
      orquestador: new Orquestador(new LlmMock()),
      store: new InMemorySessionStore(),
      afiliados: afiliadosStub,
      otpValido: '123456',
      ttlMinutos: 15,
      maxIntentosOtp: 3,
      ahora: () => t,
    });
    const appReloj = createApp(router);
    const creada = await request(appReloj).post('/sesiones').send();
    t += 16 * 60 * 1000;

    // Act
    const res = await request(appReloj)
      .post(`/sesiones/${creada.body.sessionId}/mensajes`)
      .send({ mensaje: 'hola' });

    // Assert
    expect(res.status).toBe(410);
  });
});
