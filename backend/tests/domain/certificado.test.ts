import { describe, it, expect } from 'vitest';
import { datosFaltantesPara } from '../../src/domain/certificado.js';

describe('datosFaltantesPara', () => {
  it('should require anio_gravable for a tax certificate requested without a year (caso 2)', () => {
    // Arrange
    const datosSinAnio = {};

    // Act
    const faltantes = datosFaltantesPara('TRIBUTARIO_PV', datosSinAnio);

    // Assert
    expect(faltantes).toEqual(['anio_gravable']);
  });

  it('should return no missing data for a tax certificate when the year is provided', () => {
    // Arrange
    const datos = { anioGravable: '2025' };

    // Act
    const faltantes = datosFaltantesPara('TRIBUTARIO_PV', datos);

    // Assert
    expect(faltantes).toEqual([]);
  });

  it('should treat a blank year as missing data', () => {
    // Arrange
    const datos = { anioGravable: '   ' };

    // Act
    const faltantes = datosFaltantesPara('TRIBUTARIO_PV', datos);

    // Assert
    expect(faltantes).toEqual(['anio_gravable']);
  });

  it('should return no missing data for a certificate that requires none', () => {
    // Arrange
    const datos = {};

    // Act
    const faltantes = datosFaltantesPara('AFILIACION_PO', datos);

    // Assert
    expect(faltantes).toEqual([]);
  });

  it('should require anio for a cesantias withdrawals certificate without a year', () => {
    // Arrange
    const datos = {};

    // Act
    const faltantes = datosFaltantesPara('CESANTIAS_RETIROS', datos);

    // Assert
    expect(faltantes).toEqual(['anio']);
  });
});
