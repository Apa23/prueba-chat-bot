import { z } from 'zod';
import { RegistroHerramientas } from '../herramientas/registro.js';
import type { ContextoEjecucion } from '../herramientas/contrato.js';
import type { FaqRepositoryPort } from '../puertos/faq-repository.js';
import { buscarFaqRelevante, type FaqRelevante } from './buscar-faq.js';
import { estaDentroDeAlcance } from '../../domain/faq.js';

const NOMBRE_HERRAMIENTA = 'buscar_faq';
const UMBRAL_RELEVANCIA = 0.5;

export type ResultadoFaq =
  | { readonly dentroDeAlcance: true; readonly respuesta: string; readonly fuente: string }
  | { readonly dentroDeAlcance: false };

/**
 * Registra 'buscar_faq' como herramienta pública (requiereAutorizacion: false): las FAQ no
 * son datos personales. Si ninguna FAQ supera el umbral, la consulta está fuera de alcance
 * (estaDentroDeAlcance = false) y debe escalarse; no se improvisa respuesta (casos 6 y 7).
 * La fuente se toma del dato de la FAQ, no la genera el LLM, para que la cita sea siempre real.
 */
export class ResponderFaq {
  private readonly registro = new RegistroHerramientas();

  constructor(private readonly faqs: FaqRepositoryPort) {
    this.registro.registrar({
      nombre: NOMBRE_HERRAMIENTA,
      descripcion: 'Busca la pregunta frecuente más relevante en la base de conocimiento',
      schemaEntrada: z.object({ consulta: z.string() }),
      requiereAutorizacion: false,
      ejecutar: (entrada) => this.buscar(entrada.consulta),
    });
  }

  async ejecutar(consulta: string, contexto: ContextoEjecucion): Promise<ResultadoFaq> {
    const resultado = await this.registro.ejecutar(NOMBRE_HERRAMIENTA, { consulta }, contexto);
    if (!resultado.ok) {
      return { dentroDeAlcance: false };
    }

    const relevante = resultado.salida as FaqRelevante | undefined;
    const tieneGrounding = relevante !== undefined;
    if (!estaDentroDeAlcance(tieneGrounding) || !relevante) {
      return { dentroDeAlcance: false };
    }

    return {
      dentroDeAlcance: true,
      respuesta: relevante.faq.respuesta,
      fuente: relevante.faq.fuente,
    };
  }

  private buscar(consulta: string): FaqRelevante | undefined {
    return buscarFaqRelevante(consulta, this.faqs.listar(), UMBRAL_RELEVANCIA);
  }
}
