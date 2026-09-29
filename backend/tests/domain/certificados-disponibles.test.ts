import { describe, it, expect } from 'vitest';
import { certificadosDisponiblesPara } from '../../src/domain/certificados-disponibles.js';
import type { Afiliado } from '../../src/domain/afiliado.js';

function afiliadoBase(productos: Afiliado['productos']): Afiliado {
  return {
    id: 'AF-TEST',
    tipoDocumento: 'CC',
    numeroDocumento: 'PRUEBA-TEST',
    nombre: 'Afiliado Prueba',
    correoSimulado: 'prueba@correo-prueba.test',
    productos,
  };
}

describe('certificadosDisponiblesPara (defensa en profundidad, caso 8)', () => {
  it('should offer only the pension certificate for an affiliate with just mandatory pension', () => {
    // Arrange
    const afiliado = afiliadoBase({
      pensionObligatoria: { fechaAfiliacion: '15/03/2012', estado: 'Activo', fondo: 'Fondo moderado' },
    });

    // Act
    const disponibles = certificadosDisponiblesPara(afiliado);

    // Assert
    expect(disponibles).toEqual(['AFILIACION_PO']);
  });

  it('should offer all certificate types for an affiliate with the three products', () => {
    // Arrange
    const afiliado = afiliadoBase({
      pensionObligatoria: { fechaAfiliacion: '11/11/2015', estado: 'Activo', fondo: 'Fondo moderado' },
      pensionVoluntaria: { tributario: {} },
      cesantias: { saldoActual: 3100000, fechaCorteSaldo: '31/08/2026', retiros: {} },
    });

    // Act
    const disponibles = certificadosDisponiblesPara(afiliado);

    // Assert
    expect(disponibles).toEqual(['AFILIACION_PO', 'TRIBUTARIO_PV', 'CESANTIAS_SALDO', 'CESANTIAS_RETIROS']);
  });

  it('should not offer voluntary pension certificate when the affiliate lacks that product', () => {
    // Arrange
    const afiliado = afiliadoBase({
      pensionObligatoria: { fechaAfiliacion: '20/01/2019', estado: 'Activo', fondo: 'Fondo conservador' },
      cesantias: { saldoActual: 8750000, fechaCorteSaldo: '31/08/2026', retiros: {} },
    });

    // Act
    const disponibles = certificadosDisponiblesPara(afiliado);

    // Assert
    expect(disponibles).not.toContain('TRIBUTARIO_PV');
  });

  it('should offer no certificates for an affiliate with no products', () => {
    // Arrange
    const afiliado = afiliadoBase({});

    // Act
    const disponibles = certificadosDisponiblesPara(afiliado);

    // Assert
    expect(disponibles).toEqual([]);
  });
});
