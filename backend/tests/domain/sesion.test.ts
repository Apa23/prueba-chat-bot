import { describe, it, expect } from 'vitest';
import {
  crearSesion,
  marcarIdentidadValidada,
  registrarIntentoOtpFallido,
  puedeAccederA,
  estaBloqueadaPorOtp,
  estaExpirada,
} from '../../src/domain/sesion.js';

const T0 = 1_000_000; // instante base arbitrario (epoch ms) para tests deterministas

describe('puedeAccederA (invariante de seguridad central)', () => {
  it('should deny access when identity is not validated', () => {
    // Arrange
    const sesion = crearSesion('s1', T0);

    // Act
    const permitido = puedeAccederA(sesion, 'AF-001');

    // Assert
    expect(permitido).toBe(false);
  });

  it('should allow access only to the affiliate whose identity was validated', () => {
    // Arrange
    const sesion = marcarIdentidadValidada(crearSesion('s1', T0), 'AF-001', T0);

    // Act & Assert
    expect(puedeAccederA(sesion, 'AF-001')).toBe(true);
  });

  it('should deny access to a different affiliate even after validation (caso 5: aislamiento)', () => {
    // Arrange: sesión validada para AF-001 intenta acceder a AF-003
    const sesion = marcarIdentidadValidada(crearSesion('s1', T0), 'AF-001', T0);

    // Act
    const permitido = puedeAccederA(sesion, 'AF-003');

    // Assert
    expect(permitido).toBe(false);
  });
});

describe('marcarIdentidadValidada', () => {
  it('should not mutate the original session (inmutabilidad)', () => {
    // Arrange
    const original = crearSesion('s1', T0);

    // Act
    const validada = marcarIdentidadValidada(original, 'AF-001', T0);

    // Assert
    expect(original.identidadValidada).toBe(false);
    expect(validada.identidadValidada).toBe(true);
    expect(validada).not.toBe(original);
  });

  it('should reset failed OTP attempts on successful validation', () => {
    // Arrange
    let sesion = crearSesion('s1', T0);
    sesion = registrarIntentoOtpFallido(sesion, T0);

    // Act
    const validada = marcarIdentidadValidada(sesion, 'AF-001', T0);

    // Assert
    expect(validada.intentosOtpFallidos).toBe(0);
  });
});

describe('estaBloqueadaPorOtp', () => {
  it('should block the session when failed attempts reach the maximum', () => {
    // Arrange
    let sesion = crearSesion('s1', T0);
    sesion = registrarIntentoOtpFallido(sesion, T0);
    sesion = registrarIntentoOtpFallido(sesion, T0);
    sesion = registrarIntentoOtpFallido(sesion, T0);

    // Act & Assert
    expect(estaBloqueadaPorOtp(sesion, 3)).toBe(true);
  });

  it('should not block the session below the maximum attempts', () => {
    // Arrange
    const sesion = registrarIntentoOtpFallido(crearSesion('s1', T0), T0);

    // Act & Assert
    expect(estaBloqueadaPorOtp(sesion, 3)).toBe(false);
  });
});

describe('estaExpirada', () => {
  it('should expire the session after the TTL of inactivity', () => {
    // Arrange
    const sesion = crearSesion('s1', T0);
    const dieciseisMinutosDespues = T0 + 16 * 60 * 1000;

    // Act & Assert
    expect(estaExpirada(sesion, dieciseisMinutosDespues, 15)).toBe(true);
  });

  it('should keep the session alive within the TTL', () => {
    // Arrange
    const sesion = crearSesion('s1', T0);
    const cincoMinutosDespues = T0 + 5 * 60 * 1000;

    // Act & Assert
    expect(estaExpirada(sesion, cincoMinutosDespues, 15)).toBe(false);
  });
});
