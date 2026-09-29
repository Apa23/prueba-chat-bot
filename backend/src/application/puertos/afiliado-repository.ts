import type { Afiliado } from '../../domain/afiliado.js';

export interface AfiliadoRepositoryPort {
  buscarPorDocumento(tipoDocumento: string, numeroDocumento: string): Promise<Afiliado | undefined>;
  buscarPorId(id: string): Promise<Afiliado | undefined>;
}
