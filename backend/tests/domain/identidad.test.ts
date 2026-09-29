import { describe, it, expect } from 'vitest';
import { validarIdentidad, type DocumentoAfiliado } from '../../src/domain/identidad.js';

const OTP_VALIDO = '123456';

const AFILIADO: DocumentoAfiliado = {
  id: 'AF-001',
  tipoDocumento: 'CC',
  numeroDocumento: 'PRUEBA-0001',
};

describe('validarIdentidad', () => {
  it('should return success with the affiliate id when document matches and OTP is valid (caso 1: identidad correcta)', () => {
    // Arrange
    const tipoDocumento = AFILIADO.tipoDocumento;
    const numeroDocumento = AFILIADO.numeroDocumento;

    // Act
    const resultado = validarIdentidad(tipoDocumento, numeroDocumento, OTP_VALIDO, AFILIADO, OTP_VALIDO);

    // Assert
    expect(resultado).toEqual({ valida: true, afiliadoId: 'AF-001' });
  });

  it('should reject with otp_incorrecto when document matches but OTP is wrong (caso 4: OTP incorrecto)', () => {
    // Arrange
    const otpIngresado = '000000';

    // Act
    const resultado = validarIdentidad(
      AFILIADO.tipoDocumento,
      AFILIADO.numeroDocumento,
      otpIngresado,
      AFILIADO,
      OTP_VALIDO,
    );

    // Assert
    expect(resultado).toEqual({ valida: false, motivo: 'otp_incorrecto' });
  });

  it('should reject with documento_no_encontrado when no affiliate matches the document', () => {
    // Arrange
    const afiliadoEsperado = undefined;

    // Act
    const resultado = validarIdentidad('CC', 'PRUEBA-9999', OTP_VALIDO, afiliadoEsperado, OTP_VALIDO);

    // Assert
    expect(resultado).toEqual({ valida: false, motivo: 'documento_no_encontrado' });
  });

  it('should reject with documento_no_encontrado when document type differs from the affiliate', () => {
    // Arrange: mismo número, tipo de documento distinto
    const tipoDocumento = 'CE';

    // Act
    const resultado = validarIdentidad(
      tipoDocumento,
      AFILIADO.numeroDocumento,
      OTP_VALIDO,
      AFILIADO,
      OTP_VALIDO,
    );

    // Assert
    expect(resultado).toEqual({ valida: false, motivo: 'documento_no_encontrado' });
  });
});
