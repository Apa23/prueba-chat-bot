import { describe, it, expect } from 'vitest';
import { estaDentroDeAlcance } from '../../src/domain/faq.js';

describe('estaDentroDeAlcance', () => {
  it('should be within scope when the query has grounding in the knowledge base (caso 6: FAQ con fuente)', () => {
    // Arrange
    const consultaTieneGrounding = true;

    // Act
    const dentroDeAlcance = estaDentroDeAlcance(consultaTieneGrounding);

    // Assert
    expect(dentroDeAlcance).toBe(true);
  });

  it('should be out of scope when the query lacks grounding, escalating to a human (caso 7: recomendación de inversión)', () => {
    // Arrange
    const consultaTieneGrounding = false;

    // Act
    const dentroDeAlcance = estaDentroDeAlcance(consultaTieneGrounding);

    // Assert
    expect(dentroDeAlcance).toBe(false);
  });
});
