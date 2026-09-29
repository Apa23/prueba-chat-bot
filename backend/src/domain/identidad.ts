import type { TipoDocumento } from './afiliado.js';

export interface DocumentoAfiliado {
  readonly id: string;
  readonly tipoDocumento: TipoDocumento;
  readonly numeroDocumento: string;
}

export type MotivoFalloIdentidad = 'documento_no_encontrado' | 'otp_incorrecto';

/**
 * Resultado tipado como discriminated union: obliga a quien consume a distinguir
 * entre éxito y fallo antes de leer el afiliadoId, evitando accesos no autorizados
 * por un chequeo booleano olvidado.
 */
export type ResultadoIdentidad =
  | { readonly valida: true; readonly afiliadoId: string }
  | { readonly valida: false; readonly motivo: MotivoFalloIdentidad };

/**
 * Validación de identidad (casos de prueba 1 y 4): la identidad es válida solo si el
 * documento coincide con un afiliado registrado Y el OTP ingresado es exactamente el
 * OTP válido. El orden de los chequeos no filtra si un documento existe cuando el OTP
 * falla, porque el documento se verifica primero de forma independiente.
 */
export function validarIdentidad(
  tipoDocumento: TipoDocumento,
  numeroDocumento: string,
  otpIngresado: string,
  afiliadoEsperado: DocumentoAfiliado | undefined,
  otpValido: string,
): ResultadoIdentidad {
  const documentoCoincide =
    afiliadoEsperado !== undefined &&
    afiliadoEsperado.tipoDocumento === tipoDocumento &&
    afiliadoEsperado.numeroDocumento === numeroDocumento;

  if (!documentoCoincide) {
    return { valida: false, motivo: 'documento_no_encontrado' };
  }

  if (otpIngresado !== otpValido) {
    return { valida: false, motivo: 'otp_incorrecto' };
  }

  return { valida: true, afiliadoId: afiliadoEsperado.id };
}
