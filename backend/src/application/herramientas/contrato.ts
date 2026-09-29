import type { ZodType } from 'zod';
import type { Sesion } from '../../domain/sesion.js';

export interface ContextoEjecucion {
  readonly sesion: Sesion;
  readonly ahora: number;
}

/**
 * Contrato formal de una herramienta. El LLM propone (nombre + argumentos), pero solo se
 * ejecuta lo que encaja en este contrato: nombre registrado, argumentos válidos según el
 * schema, y autorización verificada. El guardarraíl que hace que "el LLM proponga y la
 * herramienta disponga".
 *
 * `requiereAutorizacion`: si accede a datos personales, el registro exige sesión con
 * identidad validada del afiliado antes de invocar `ejecutar` (defensa en profundidad).
 */
export interface Herramienta<Entrada, Salida> {
  readonly nombre: string;
  readonly descripcion: string;
  readonly schemaEntrada: ZodType<Entrada>;
  readonly requiereAutorizacion: boolean;
  ejecutar(entrada: Entrada, contexto: ContextoEjecucion): Promise<Salida> | Salida;
}

export type MotivoRechazo =
  | 'herramienta_no_encontrada'
  | 'argumentos_invalidos'
  | 'no_autorizado';

export type ResultadoHerramienta<Salida> =
  | { readonly ok: true; readonly salida: Salida }
  | { readonly ok: false; readonly motivo: MotivoRechazo; readonly detalle?: string };
