import { describe, it, expect } from 'vitest';
import { enmascararDocumento, enmascararObjeto } from '../../src/application/seguridad/enmascarar-pii.js';

describe('enmascararDocumento', () => {
  it('should keep only the last character visible', () => {
    // Act & Assert
    expect(enmascararDocumento('PRUEBA-0001')).toBe('**********1');
  });

  it('should fully mask very short documents', () => {
    // Act & Assert
    expect(enmascararDocumento('12')).toBe('***');
  });
});

describe('enmascararObjeto', () => {
  it('should remove the OTP entirely (no trace)', () => {
    // Act
    const resultado = enmascararObjeto({ otp: '123456', tipoDocumento: 'CC' }) as Record<string, unknown>;

    // Assert
    expect(resultado.otp).toBeUndefined();
    expect('otp' in resultado).toBe(false);
  });

  it('should fully hide name and email', () => {
    // Act
    const resultado = enmascararObjeto({
      nombre: 'Mariana Ficticia Ejemplo',
      correoSimulado: 'mariana@correo.test',
    }) as Record<string, unknown>;

    // Assert
    expect(resultado.nombre).toBe('[PII]');
    expect(resultado.correoSimulado).toBe('[PII]');
  });

  it('should mark product values as sensitive', () => {
    // Act
    const resultado = enmascararObjeto({ aportes: 12000000, saldoActual: 8750000 }) as Record<string, unknown>;

    // Assert
    expect(resultado.aportes).toBe('[SENSIBLE]');
    expect(resultado.saldoActual).toBe('[SENSIBLE]');
  });

  it('should mask nested PII inside objects and arrays', () => {
    // Act
    const resultado = enmascararObjeto({
      afiliados: [{ numeroDocumento: 'PRUEBA-0001', nombre: 'Test' }],
    }) as { afiliados: Array<Record<string, unknown>> };

    // Assert
    expect(resultado.afiliados[0].numeroDocumento).toBe('**********1');
    expect(resultado.afiliados[0].nombre).toBe('[PII]');
  });

  it('should leave non-sensitive fields untouched', () => {
    // Act
    const resultado = enmascararObjeto({ estado: 'Activo', sesionId: 'abc' }) as Record<string, unknown>;

    // Assert
    expect(resultado.estado).toBe('Activo');
    expect(resultado.sesionId).toBe('abc');
  });
});
