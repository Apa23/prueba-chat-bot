import type { PreguntaFrecuente } from '../../domain/faq.js';

export interface FaqRelevante {
  readonly faq: PreguntaFrecuente;
  readonly puntaje: number;
}

const PALABRAS_VACIAS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'que', 'qué', 'para', 'por',
  'con', 'como', 'cómo', 'mi', 'mis', 'se', 'es', 'y', 'a', 'en', 'sirve', 'puedo',
]);

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ');
}

function terminosRelevantes(texto: string): string[] {
  return normalizar(texto)
    .split(/\s+/)
    .filter((t) => t.length > 2 && !PALABRAS_VACIAS.has(t));
}

/**
 * Grounding por búsqueda léxica sobre las FAQ (proporcional al problema: 8 preguntas no
 * justifican una vector DB, ver ADR-002). Puntúa por proporción de términos de la pregunta
 * de la FAQ que aparecen en la consulta. Devuelve la mejor FAQ solo si supera el umbral;
 * si ninguna lo supera, la consulta se considera fuera de alcance (escala a humano, caso 7).
 */
export function buscarFaqRelevante(
  consulta: string,
  faqs: readonly PreguntaFrecuente[],
  umbral: number,
): FaqRelevante | undefined {
  const terminosConsulta = new Set(terminosRelevantes(consulta));
  if (terminosConsulta.size === 0) {
    return undefined;
  }

  let mejor: FaqRelevante | undefined;
  for (const faq of faqs) {
    const terminosFaq = terminosRelevantes(faq.pregunta);
    if (terminosFaq.length === 0) {
      continue;
    }
    const coincidencias = terminosFaq.filter((t) => terminosConsulta.has(t)).length;
    const puntaje = coincidencias / terminosFaq.length;
    if (puntaje > (mejor?.puntaje ?? 0)) {
      mejor = { faq, puntaje };
    }
  }

  return mejor && mejor.puntaje >= umbral ? mejor : undefined;
}
