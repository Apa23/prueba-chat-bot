import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JsonFaqRepository } from '../../src/infrastructure/persistencia/faq-repository-json.js';

const rutaDatos = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../data/datos_ficticios_chatbot.json',
);

describe('JsonFaqRepository', () => {
  it('should load the 8 FAQs from the data file with their source', () => {
    // Arrange
    const repo = new JsonFaqRepository(rutaDatos);

    // Act
    const faqs = repo.listar();

    // Assert
    expect(faqs).toHaveLength(8);
    expect(faqs.every((f) => f.fuente.length > 0)).toBe(true);
    expect(faqs.every((f) => f.pregunta.length > 0 && f.respuesta.length > 0)).toBe(true);
  });
});
