import { describe, it, expect, beforeAll } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { PdfKitCertificadoAdapter } from '../../src/infrastructure/pdf/pdfkit-certificado-adapter.js';
import type { CertificadoEmitido } from '../../src/domain/certificado-emitido.js';

const rutaPlantillas = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../data/plantillas-certificado.json',
);

const CERTIFICADO: CertificadoEmitido = {
  codigo: 'AFILIACION_PO',
  afiliadoId: 'AF-001',
  campos: { nombre: 'Mariana Ficticia Ejemplo', documento: 'CC PRUEBA-0001', fechaAfiliacion: '15/03/2012' },
  codigoVerificacion: 'ABC1234567',
};

describe('PdfKitCertificadoAdapter', () => {
  let adapter: PdfKitCertificadoAdapter;

  beforeAll(() => {
    adapter = new PdfKitCertificadoAdapter(rutaPlantillas);
  });

  it('should generate a non-empty PDF buffer with valid PDF signature', async () => {
    // Act
    const pdf = await adapter.generar(CERTIFICADO);

    // Assert
    expect(pdf.length).toBeGreaterThan(0);
    expect(pdf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('should throw when the template is unknown', async () => {
    // Arrange
    const invalido = { ...CERTIFICADO, codigo: 'INEXISTENTE' as CertificadoEmitido['codigo'] };

    // Act & Assert
    await expect(adapter.generar(invalido)).rejects.toThrow('Plantilla no encontrada');
  });
});
