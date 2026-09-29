import { describe, it, expect } from 'vitest';
import { armarCertificado } from '../../src/application/certificados/armar-certificado.js';
import type { Afiliado } from '../../src/domain/afiliado.js';

const T0 = 1_000_000;

const AF_TRIBUTARIO: Afiliado = {
  id: 'AF-002',
  tipoDocumento: 'CC',
  numeroDocumento: 'PRUEBA-0002',
  nombre: 'Carlos Inventado Prueba',
  correoSimulado: 'carlos@correo-prueba.test',
  productos: {
    pensionVoluntaria: {
      tributario: {
        '2024': { aportes: 12000000, retiros: 0, saldo31Dic: 45300000, retencionContingente: 0 },
      },
    },
  },
};

const AF_AFILIACION: Afiliado = {
  id: 'AF-001',
  tipoDocumento: 'CC',
  numeroDocumento: 'PRUEBA-0001',
  nombre: 'Mariana Ficticia Ejemplo',
  correoSimulado: 'mariana@correo-prueba.test',
  productos: {
    pensionObligatoria: { fechaAfiliacion: '15/03/2012', estado: 'Activo', fondo: 'Fondo moderado' },
  },
};

describe('armarCertificado', () => {
  it('should build an affiliation certificate with the affiliate data', () => {
    // Act
    const resultado = armarCertificado(AF_AFILIACION, 'AFILIACION_PO', {}, T0);

    // Assert
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.certificado.campos.fechaAfiliacion).toBe('15/03/2012');
      expect(resultado.certificado.codigoVerificacion).toHaveLength(10);
    }
  });

  it('should build a tax certificate for a year with data', () => {
    // Act
    const resultado = armarCertificado(AF_TRIBUTARIO, 'TRIBUTARIO_PV', { anioGravable: '2024' }, T0);

    // Assert
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.certificado.campos.saldo31Dic).toContain('45.300.000');
    }
  });

  it('should fail with anio_sin_datos for a tax year without data (caso 3: no inventar)', () => {
    // Act
    const resultado = armarCertificado(AF_TRIBUTARIO, 'TRIBUTARIO_PV', { anioGravable: '2099' }, T0);

    // Assert
    expect(resultado).toEqual({ ok: false, motivo: 'anio_sin_datos' });
  });

  it('should fail with producto_no_disponible when affiliate lacks the product', () => {
    // Act
    const resultado = armarCertificado(AF_AFILIACION, 'TRIBUTARIO_PV', { anioGravable: '2024' }, T0);

    // Assert
    expect(resultado).toEqual({ ok: false, motivo: 'producto_no_disponible' });
  });

  it('should build a cesantias balance certificate', () => {
    // Arrange
    const afiliado: Afiliado = {
      ...AF_AFILIACION,
      id: 'AF-003',
      productos: { cesantias: { saldoActual: 8750000, fechaCorteSaldo: '31/08/2026', retiros: {} } },
    };

    // Act
    const resultado = armarCertificado(afiliado, 'CESANTIAS_SALDO', {}, T0);

    // Assert
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.certificado.campos.saldoActual).toContain('8.750.000');
    }
  });

  it('should build a cesantias withdrawals certificate for a year with data (caso 9)', () => {
    // Arrange
    const afiliado: Afiliado = {
      ...AF_AFILIACION,
      id: 'AF-003',
      productos: {
        cesantias: {
          saldoActual: 8750000,
          fechaCorteSaldo: '31/08/2026',
          retiros: { '2025': [{ fecha: '10/03/2025', valor: 2500000, motivo: 'Educación' }] },
        },
      },
    };

    // Act
    const resultado = armarCertificado(afiliado, 'CESANTIAS_RETIROS', { anio: '2025' }, T0);

    // Assert
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.certificado.campos.detalleRetiros).toContain('Educación');
    }
  });

  it('should fail with anio_sin_datos for a withdrawals year without data', () => {
    // Arrange
    const afiliado: Afiliado = {
      ...AF_AFILIACION,
      id: 'AF-003',
      productos: { cesantias: { saldoActual: 8750000, fechaCorteSaldo: '31/08/2026', retiros: {} } },
    };

    // Act
    const resultado = armarCertificado(afiliado, 'CESANTIAS_RETIROS', { anio: '2020' }, T0);

    // Assert
    expect(resultado).toEqual({ ok: false, motivo: 'anio_sin_datos' });
  });

  it('should produce a deterministic verification code for the same inputs', () => {
    // Act
    const r1 = armarCertificado(AF_AFILIACION, 'AFILIACION_PO', {}, T0);
    const r2 = armarCertificado(AF_AFILIACION, 'AFILIACION_PO', {}, T0);

    // Assert
    if (r1.ok && r2.ok) {
      expect(r1.certificado.codigoVerificacion).toBe(r2.certificado.codigoVerificacion);
    }
  });
});
