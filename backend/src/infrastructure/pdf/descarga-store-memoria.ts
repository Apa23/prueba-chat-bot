import type { DescargaStorePort } from '../../application/puertos/certificado-pdf.js';

export class InMemoryDescargaStore implements DescargaStorePort {
  private readonly descargas = new Map<string, Buffer>();

  guardar(token: string, pdf: Buffer): void {
    this.descargas.set(token, pdf);
  }

  obtener(token: string): Buffer | undefined {
    return this.descargas.get(token);
  }
}
