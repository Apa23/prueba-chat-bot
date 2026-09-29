import { describe, it, expect, beforeAll } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JsonAfiliadoRepository } from '../../src/infrastructure/persistencia/afiliado-repository-json.js';

const rutaDatos = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../data/datos_ficticios_chatbot.json',
);

describe('JsonAfiliadoRepository', () => {
  let repo: JsonAfiliadoRepository;

  beforeAll(() => {
    repo = new JsonAfiliadoRepository(rutaDatos);
  });

  it('should find an affiliate by document and map snake_case to camelCase', async () => {
    // Act
    const afiliado = await repo.buscarPorDocumento('CC', 'PRUEBA-0001');

    // Assert
    expect(afiliado?.id).toBe('AF-001');
    expect(afiliado?.numeroDocumento).toBe('PRUEBA-0001');
    expect(afiliado?.productos.pensionObligatoria?.fechaAfiliacion).toBe('15/03/2012');
  });

  it('should map voluntary pension tax data with camelCase keys', async () => {
    // Act
    const afiliado = await repo.buscarPorId('AF-002');

    // Assert
    expect(afiliado?.productos.pensionVoluntaria?.tributario['2024']?.saldo31Dic).toBe(45300000);
  });

  it('should return undefined when no affiliate matches the document', async () => {
    // Act
    const afiliado = await repo.buscarPorDocumento('CC', 'PRUEBA-9999');

    // Assert
    expect(afiliado).toBeUndefined();
  });

  it('should find an affiliate by id', async () => {
    // Act
    const afiliado = await repo.buscarPorId('AF-003');

    // Assert
    expect(afiliado?.productos.cesantias?.saldoActual).toBe(8750000);
  });
});
