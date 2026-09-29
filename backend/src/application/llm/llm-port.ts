import type { Intencion } from './intencion.js';

/**
 * Puerto del LLM: el único punto por el que el orquestador usa el modelo. Se limita a dos
 * responsabilidades acotadas —interpretar y redactar— porque las DECISIONES las toma el
 * orquestador determinista, no el modelo. El LLM nunca ejecuta herramientas ni accede a datos.
 *
 * Ambas operaciones pueden fallar por causas técnicas (modelo caído, timeout); esos fallos
 * los captura el orquestador y transitan al estado de fallo técnico, no a una regla de negocio.
 */
export interface LlmPort {
  clasificarIntencion(mensajeUsuario: string): Promise<Intencion>;
  redactar(instruccion: string, contexto: string): Promise<string>;
}
