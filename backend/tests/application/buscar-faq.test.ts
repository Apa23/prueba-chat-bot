import { describe, it, expect } from 'vitest';
import { buscarFaqRelevante } from '../../src/application/faq/buscar-faq.js';
import type { PreguntaFrecuente } from '../../src/domain/faq.js';

const FAQS: readonly PreguntaFrecuente[] = [
  { pregunta: '¿Para qué sirve el certificado tributario?', respuesta: 'Resume aportes y saldo del año gravable.', fuente: 'KB Certificados' },
  { pregunta: '¿Qué es el certificado de afiliación?', respuesta: 'Confirma afiliación a pensión obligatoria.', fuente: 'KB Certificados' },
  { pregunta: '¿Cómo verifico que un certificado es auténtico?', respuesta: 'Con el código de verificación.', fuente: 'KB Seguridad' },
];

const UMBRAL = 0.5;

describe('buscarFaqRelevante', () => {
  it('should find the tax certificate FAQ for a related query (caso 6)', () => {
    // Act
    const resultado = buscarFaqRelevante('para qué sirve el certificado tributario', FAQS, UMBRAL);

    // Assert
    expect(resultado?.faq.fuente).toBe('KB Certificados');
    expect(resultado?.faq.respuesta).toContain('aportes');
  });

  it('should return undefined when the query is out of scope (caso 7: recomendación de inversión)', () => {
    // Act
    const resultado = buscarFaqRelevante('en qué fondo me recomiendas invertir mi dinero', FAQS, UMBRAL);

    // Assert
    expect(resultado).toBeUndefined();
  });

  it('should return undefined for an empty query', () => {
    // Act
    const resultado = buscarFaqRelevante('   ', FAQS, UMBRAL);

    // Assert
    expect(resultado).toBeUndefined();
  });

  it('should match despite accents and casing', () => {
    // Act
    const resultado = buscarFaqRelevante('COMO VERIFICO un certificado autentico', FAQS, UMBRAL);

    // Assert
    expect(resultado?.faq.fuente).toBe('KB Seguridad');
  });

  it('should reject a query that shares no meaningful terms with any FAQ', () => {
    // Act
    const resultado = buscarFaqRelevante('horario de atención telefónica sábados', FAQS, UMBRAL);

    // Assert
    expect(resultado).toBeUndefined();
  });
});
