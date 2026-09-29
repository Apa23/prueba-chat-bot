import { describe, it, expect } from 'vitest';
import { ResponderFaq } from '../../src/application/faq/responder-faq.js';
import type { FaqRepositoryPort } from '../../src/application/puertos/faq-repository.js';
import type { ContextoEjecucion } from '../../src/application/herramientas/contrato.js';
import { crearSesion } from '../../src/domain/sesion.js';

const faqRepo: FaqRepositoryPort = {
  listar: () => [
    { pregunta: '¿Para qué sirve el certificado tributario?', respuesta: 'Soporta la declaración de renta.', fuente: 'KB Certificados' },
  ],
};

const contexto: ContextoEjecucion = { sesion: crearSesion('s1', 1_000_000), ahora: 1_000_000 };

describe('ResponderFaq.ejecutar', () => {
  it('should answer within scope citing the source when a relevant FAQ exists (caso 6)', async () => {
    // Arrange
    const responder = new ResponderFaq(faqRepo);

    // Act
    const resultado = await responder.ejecutar('para qué sirve el certificado tributario', contexto);

    // Assert
    expect(resultado.dentroDeAlcance).toBe(true);
    if (resultado.dentroDeAlcance) {
      expect(resultado.fuente).toBe('KB Certificados');
      expect(resultado.respuesta).toContain('renta');
    }
  });

  it('should report out of scope when no FAQ is relevant (caso 7)', async () => {
    // Arrange
    const responder = new ResponderFaq(faqRepo);

    // Act
    const resultado = await responder.ejecutar('recomiéndame un fondo de inversión', contexto);

    // Assert
    expect(resultado.dentroDeAlcance).toBe(false);
  });
});
