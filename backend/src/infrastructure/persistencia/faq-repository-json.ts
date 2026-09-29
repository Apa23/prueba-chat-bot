import { readFileSync } from 'node:fs';
import type { FaqRepositoryPort } from '../../application/puertos/faq-repository.js';
import type { PreguntaFrecuente } from '../../domain/faq.js';

interface FaqJson {
  pregunta: string;
  respuesta: string;
  fuente: string;
}

export class JsonFaqRepository implements FaqRepositoryPort {
  private readonly faqs: readonly PreguntaFrecuente[];

  constructor(rutaArchivo: string) {
    const crudo = JSON.parse(readFileSync(rutaArchivo, 'utf-8')) as { faq: FaqJson[] };
    this.faqs = crudo.faq.map((f) => ({ pregunta: f.pregunta, respuesta: f.respuesta, fuente: f.fuente }));
  }

  listar(): readonly PreguntaFrecuente[] {
    return this.faqs;
  }
}
