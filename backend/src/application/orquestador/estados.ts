import type { CodigoCertificado } from '../../domain/certificado.js';

export type NombreEstado =
  | 'inicio'
  | 'esperando_consentimiento'
  | 'identificando_intencion'
  | 'validando_identidad'
  | 'recolectando_datos'
  | 'ejecutando'
  | 'completado'
  | 'escalado_humano'
  | 'sesion_terminada'
  | 'fallo_tecnico';

/**
 * Estado de la conversación. `certificadoEnCurso` y `datosRecolectados` acompañan el
 * progreso de una solicitud. `escalado_humano` cubre fallos de NEGOCIO controlados
 * (fuera de alcance, petición del usuario); `fallo_tecnico` cubre fallos de PLATAFORMA
 * (LLM caído, excepción) donde ni siquiera escalar a un humano es posible.
 */
export interface EstadoConversacion {
  readonly nombre: NombreEstado;
  readonly certificadoEnCurso?: CodigoCertificado;
  readonly datosRecolectados: Readonly<Record<string, string>>;
}

export function estadoInicial(): EstadoConversacion {
  return { nombre: 'inicio', datosRecolectados: {} };
}
