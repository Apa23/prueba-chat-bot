/**
 * Detección heurística de intentos de prompt injection, usada SOLO como señal de
 * observabilidad (no bloquea el flujo). Es imperfecta por naturaleza —genera falsos
 * positivos y negativos— por lo que no se toma como control de seguridad: la barrera real
 * es que el LLM no accede a datos (puedeAccederA). Aquí solo se registra la sospecha para
 * trazabilidad y métricas (OWASP LLM: monitoreo).
 */

const PATRONES: readonly RegExp[] = [
  /ignora( tus| las)? instrucciones/i,
  /olvida (lo anterior|tus instrucciones|las reglas)/i,
  /ignore (previous|prior) instructions/i,
  /(mu[eé]strame|revela|dime|cu[aá]les son).{0,20}(system prompt|instrucciones internas|tus reglas|tu configuraci[oó]n)/i,
  /act[uú]a como|ahora eres|pretende ser|haz de cuenta que eres/i,
  /(dame|gen[eé]rame|entr[eé]game).{0,30}(documento|afiliado)\s*(prueba|af)-?\d+/i,
];

export function pareceInyeccion(mensaje: string): boolean {
  return PATRONES.some((patron) => patron.test(mensaje));
}
