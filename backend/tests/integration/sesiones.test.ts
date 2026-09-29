import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/interfaces/http/createApp.js';
import { crearSesionesRouter } from '../../src/interfaces/http/sesiones-router.js';
import { Orquestador } from '../../src/application/orquestador/orquestador.js';
import { LlmMock } from '../../src/infrastructure/llm/llm-mock.js';
import { InMemorySessionStore } from '../../src/infrastructure/persistencia/session-store-memoria.js';
import { GenerarCertificado } from '../../src/application/certificados/generar-certificado.js';
import { ResponderFaq } from '../../src/application/faq/responder-faq.js';
import type { FaqRepositoryPort } from '../../src/application/puertos/faq-repository.js';
import { PdfKitCertificadoAdapter } from '../../src/infrastructure/pdf/pdfkit-certificado-adapter.js';
import { InMemoryDescargaStore } from '../../src/infrastructure/pdf/descarga-store-memoria.js';
import { crearDescargasRouter } from '../../src/interfaces/http/descargas-router.js';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { AfiliadoRepositoryPort } from '../../src/application/puertos/afiliado-repository.js';
import type { Afiliado } from '../../src/domain/afiliado.js';

const rutaPlantillas = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../data/plantillas-certificado.json',
);

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

const faqStub: FaqRepositoryPort = {
  listar: () => [
    { pregunta: '¿Para qué sirve el certificado tributario?', respuesta: 'Resume aportes y saldo.', fuente: 'Base de conocimiento' },
  ],
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
  const descargas = new InMemoryDescargaStore();
  const generarCertificado = new GenerarCertificado(
    afiliadosStub,
    new PdfKitCertificadoAdapter(rutaPlantillas),
    descargas,
  );
  const router = crearSesionesRouter({
    orquestador: new Orquestador(new LlmMock(), new ResponderFaq(faqStub)),
    store: new InMemorySessionStore(),
    afiliados: afiliadosStub,
    generarCertificado,
    otpValido: '123456',
    ttlMinutos: 15,
    maxIntentosOtp: 3,
    baseUrlDescarga: 'http://localhost:3001',
  });
  return createApp({ sesiones: router, descargas: crearDescargasRouter(descargas) });
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

  it('should generate a certificate and return a download link after identity validation', async () => {
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
    expect(res.body.estado).toBe('completado');
    expect(res.body.enlaceDescarga).toContain('/descargas/');
    expect(res.body.codigoVerificacion).toHaveLength(10);
  });

  it('should download a valid PDF from the generated link (flujo completo B4)', async () => {
    // Arrange
    const creada = await request(app).post('/sesiones').send();
    const id = creada.body.sessionId;
    await request(app)
      .post(`/sesiones/${id}/identidad`)
      .send({ tipoDocumento: 'CC', numeroDocumento: 'PRUEBA-0001', otp: '123456' });
    const generado = await request(app)
      .post(`/sesiones/${id}/mensajes`)
      .send({ mensaje: 'certificado de afiliación' });
    const token = generado.body.codigoVerificacion;

    // Act
    const descarga = await request(app).get(`/descargas/${token}`);

    // Assert
    expect(descarga.status).toBe(200);
    expect(descarga.headers['content-type']).toBe('application/pdf');
    expect(descarga.body.subarray(0, 5).toString('ascii')).toBe('%PDF-');
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
    const descargas = new InMemoryDescargaStore();
    const router = crearSesionesRouter({
      orquestador: new Orquestador(new LlmMock(), new ResponderFaq(faqStub)),
      store: new InMemorySessionStore(),
      afiliados: afiliadosStub,
      generarCertificado: new GenerarCertificado(afiliadosStub, new PdfKitCertificadoAdapter(rutaPlantillas), descargas),
      otpValido: '123456',
      ttlMinutos: 15,
      maxIntentosOtp: 3,
      baseUrlDescarga: 'http://localhost:3001',
      ahora: () => t,
    });
    const appReloj = createApp({ sesiones: router, descargas: crearDescargasRouter(descargas) });
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
