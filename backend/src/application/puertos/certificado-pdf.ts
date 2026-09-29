import type { CertificadoEmitido } from '../../domain/certificado-emitido.js';

export interface CertificadoPdfPort {
  generar(certificado: CertificadoEmitido): Promise<Buffer>;
}

export interface DescargaStorePort {
  guardar(token: string, pdf: Buffer): void;
  obtener(token: string): Buffer | undefined;
}
