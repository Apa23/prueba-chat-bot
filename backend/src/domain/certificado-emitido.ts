import type { CodigoCertificado } from './certificado.js';

export interface CertificadoEmitido {
  readonly codigo: CodigoCertificado;
  readonly afiliadoId: string;
  readonly campos: Readonly<Record<string, string>>;
  readonly codigoVerificacion: string;
}
