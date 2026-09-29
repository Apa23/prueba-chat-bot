import type { PreguntaFrecuente } from '../../domain/faq.js';

export interface FaqRepositoryPort {
  listar(): readonly PreguntaFrecuente[];
}
