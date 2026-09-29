/**
 * Sesión conversacional: el estado que habilita o no el acceso a datos personales.
 * Modelada como estado inmutable con transiciones puras (cada operación devuelve una
 * nueva sesión) para que las reglas de seguridad sean triviales de probar y razonar.
 */

export interface Sesion {
  readonly id: string;
  readonly identidadValidada: boolean;
  readonly afiliadoAutorizadoId?: string;
  readonly intentosOtpFallidos: number;
  readonly creadaEn: number;
  readonly ultimaActividad: number;
}

export function crearSesion(id: string, ahora: number): Sesion {
  return {
    id,
    identidadValidada: false,
    afiliadoAutorizadoId: undefined,
    intentosOtpFallidos: 0,
    creadaEn: ahora,
    ultimaActividad: ahora,
  };
}

export function marcarIdentidadValidada(sesion: Sesion, afiliadoId: string, ahora: number): Sesion {
  return {
    ...sesion,
    identidadValidada: true,
    afiliadoAutorizadoId: afiliadoId,
    intentosOtpFallidos: 0,
    ultimaActividad: ahora,
  };
}

export function registrarIntentoOtpFallido(sesion: Sesion, ahora: number): Sesion {
  return {
    ...sesion,
    intentosOtpFallidos: sesion.intentosOtpFallidos + 1,
    ultimaActividad: ahora,
  };
}

/**
 * Invariante de seguridad central (B6, caso de prueba 5): una sesión solo accede a los
 * datos del afiliado cuya identidad validó. No depende del LLM ni de infraestructura;
 * aunque el modelo se dejara engañar, esta regla bloquea el acceso a otro afiliado.
 */
export function puedeAccederA(sesion: Sesion, afiliadoIdSolicitado: string): boolean {
  return sesion.identidadValidada && sesion.afiliadoAutorizadoId === afiliadoIdSolicitado;
}

export function estaBloqueadaPorOtp(sesion: Sesion, maxIntentos: number): boolean {
  return sesion.intentosOtpFallidos >= maxIntentos;
}

export function estaExpirada(sesion: Sesion, ahora: number, ttlMinutos: number): boolean {
  const ttlMs = ttlMinutos * 60 * 1000;
  return ahora - sesion.ultimaActividad > ttlMs;
}
