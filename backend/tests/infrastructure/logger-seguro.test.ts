import { describe, it, expect, vi, afterEach } from 'vitest';
import { ConsoleLoggerSeguro } from '../../src/infrastructure/logging/logger-seguro.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ConsoleLoggerSeguro', () => {
  it('should mask PII before writing to the output', () => {
    // Arrange
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const logger = new ConsoleLoggerSeguro();

    // Act
    logger.info('evento_prueba', { numeroDocumento: 'PRUEBA-0001', nombre: 'Mariana' });

    // Assert
    const salida = spy.mock.calls[0][0] as string;
    expect(salida).not.toContain('PRUEBA-0001');
    expect(salida).not.toContain('Mariana');
    expect(salida).toContain('[PII]');
  });

  it('should never write the OTP', () => {
    // Arrange
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const logger = new ConsoleLoggerSeguro();

    // Act
    logger.advertencia('validacion', { otp: '123456', tipoDocumento: 'CC' });

    // Assert
    const salida = spy.mock.calls[0][0] as string;
    expect(salida).not.toContain('123456');
  });
});
