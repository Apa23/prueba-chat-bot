/**
 * FAQ como concepto de dominio. El contenido de las preguntas vive en la base de
 * conocimiento (JSON) y se accede por herramienta; aquí solo se modela la forma del
 * value object y la política de alcance.
 */

export interface PreguntaFrecuente {
  readonly pregunta: string;
  readonly respuesta: string;
  readonly fuente: string;
}

/**
 * Política de alcance (casos de prueba 6 y 7): una consulta se atiende solo si tiene
 * grounding en la base de conocimiento. Sin grounding (ej. recomendación de inversión)
 * se considera fuera de alcance y debe escalarse a un humano, no improvisar respuesta.
 */
export function estaDentroDeAlcance(consultaTieneGrounding: boolean): boolean {
  return consultaTieneGrounding;
}
