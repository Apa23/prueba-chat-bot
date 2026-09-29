import { describe, it, expect } from 'vitest';
import { Orquestador } from '../../src/application/orquestador/orquestador.js';
import { estadoInicial } from '../../src/application/orquestador/estados.js';
import { LlmMock } from '../../src/infrastructure/llm/llm-mock.js';
import type { LlmPort } from '../../src/application/llm/llm-port.js';
import { crearSesion, marcarIdentidadValidada } from '../../src/domain/sesion.js';

const T0 = 1_000_000;

function orquestadorConMock(): Orquestador {
  return new Orquestador(new LlmMock());
}

function sesionSinValidar() {
  return crearSesion('s1', T0);
}

function sesionValidada(afiliadoId = 'AF-001') {
  return marcarIdentidadValidada(crearSesion('s1', T0), afiliadoId, T0);
}

describe('Orquestador.procesarMensaje', () => {
  it('should ask for data authorization and intent from the initial state', async () => {
    // Arrange
    const orq = orquestadorConMock();

    // Act
    const { estado, mensaje } = await orq.procesarMensaje(estadoInicial(), '', sesionSinValidar());

    // Assert
    expect(estado.nombre).toBe('identificando_intencion');
    expect(mensaje).toContain('tratamiento de tus datos');
  });

  it('should require identity validation before delivering a certificate (compuerta de identidad)', async () => {
    // Arrange
    const orq = orquestadorConMock();
    const estado = { nombre: 'identificando_intencion' as const, datosRecolectados: {} };

    // Act
    const resultado = await orq.procesarMensaje(estado, 'quiero mi certificado de afiliación', sesionSinValidar());

    // Assert
    expect(resultado.estado.nombre).toBe('validando_identidad');
    expect(resultado.estado.certificadoEnCurso).toBe('AFILIACION_PO');
  });

  it('should ask for missing year when a tax certificate is requested without it (caso 2)', async () => {
    // Arrange
    const orq = orquestadorConMock();
    const estado = { nombre: 'identificando_intencion' as const, datosRecolectados: {} };

    // Act
    const resultado = await orq.procesarMensaje(estado, 'necesito el certificado tributario', sesionValidada());

    // Assert
    expect(resultado.estado.nombre).toBe('recolectando_datos');
    expect(resultado.mensaje).toContain('anio_gravable');
  });

  it('should move to executing when identity is validated and no data is missing', async () => {
    // Arrange
    const orq = orquestadorConMock();
    const estado = { nombre: 'identificando_intencion' as const, datosRecolectados: {} };

    // Act
    const resultado = await orq.procesarMensaje(estado, 'certificado de afiliación', sesionValidada());

    // Assert
    expect(resultado.estado.nombre).toBe('ejecutando');
    expect(resultado.estado.certificadoEnCurso).toBe('AFILIACION_PO');
  });

  it('should answer a frequent question using the LLM redaction (caso 6)', async () => {
    // Arrange
    const orq = orquestadorConMock();
    const estado = { nombre: 'identificando_intencion' as const, datosRecolectados: {} };

    // Act
    const resultado = await orq.procesarMensaje(estado, '¿para qué sirve el certificado tributario?', sesionSinValidar());

    // Assert
    expect(resultado.estado.nombre).toBe('identificando_intencion');
    expect(resultado.mensaje.length).toBeGreaterThan(0);
  });

  it('should escalate when the intent is unknown (fuera de comprensión)', async () => {
    // Arrange
    const orq = orquestadorConMock();
    const estado = { nombre: 'identificando_intencion' as const, datosRecolectados: {} };

    // Act
    const resultado = await orq.procesarMensaje(estado, 'cuéntame un chiste', sesionSinValidar());

    // Assert
    expect(resultado.estado.nombre).toBe('escalado_humano');
  });

  it('should escalate to a human when the user asks for an advisor (caso 11)', async () => {
    // Arrange
    const orq = orquestadorConMock();
    const estado = { nombre: 'identificando_intencion' as const, datosRecolectados: {} };

    // Act
    const resultado = await orq.procesarMensaje(estado, 'quiero hablar con un asesor', sesionValidada());

    // Assert
    expect(resultado.estado.nombre).toBe('escalado_humano');
  });

  it('should transition to technical failure when the LLM throws (fallo técnico terminal)', async () => {
    // Arrange
    const llmQueFalla: LlmPort = {
      clasificarIntencion: async () => {
        throw new Error('modelo caído');
      },
      redactar: async () => 'x',
    };
    const orq = new Orquestador(llmQueFalla);
    const estado = { nombre: 'identificando_intencion' as const, datosRecolectados: {} };

    // Act
    const resultado = await orq.procesarMensaje(estado, 'certificado tributario', sesionValidada());

    // Assert
    expect(resultado.estado.nombre).toBe('fallo_tecnico');
    expect(resultado.mensaje).toContain('problema técnico');
  });

  it('should stay in technical failure once reached (estado terminal)', async () => {
    // Arrange
    const orq = orquestadorConMock();
    const estadoFallo = { nombre: 'fallo_tecnico' as const, datosRecolectados: {} };

    // Act
    const resultado = await orq.procesarMensaje(estadoFallo, 'hola de nuevo', sesionValidada());

    // Assert
    expect(resultado.estado.nombre).toBe('fallo_tecnico');
  });
});
