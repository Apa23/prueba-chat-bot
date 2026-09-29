import { z } from 'zod';
import type { ContextoEjecucion } from '../herramientas/contrato.js';
import { RegistroHerramientas } from '../herramientas/registro.js';
import type { AfiliadoRepositoryPort } from '../puertos/afiliado-repository.js';
import type { CertificadoPdfPort, DescargaStorePort } from '../puertos/certificado-pdf.js';
import type { CodigoCertificado } from '../../domain/certificado.js';
import { armarCertificado, type DatosCertificado } from './armar-certificado.js';

const NOMBRE_HERRAMIENTA = 'generar_certificado';

const entradaSchema = z.object({
  afiliadoId: z.string(),
  codigo: z.enum(['AFILIACION_PO', 'TRIBUTARIO_PV', 'CESANTIAS_SALDO', 'CESANTIAS_RETIROS']),
  anioGravable: z.string().optional(),
  anio: z.string().optional(),
});

type EntradaGeneracion = z.infer<typeof entradaSchema>;

export type ResultadoGeneracion =
  | { readonly ok: true; readonly token: string; readonly codigoVerificacion: string }
  | { readonly ok: false; readonly motivo: string };

/**
 * Registra la herramienta 'generar_certificado' con autorización obligatoria: el registro
 * verifica puedeAccederA(sesion, afiliadoId) ANTES de ejecutar, cerrando el círculo de
 * seguridad (el certificado solo se emite para el afiliado cuya identidad validó la sesión).
 */
export class GenerarCertificado {
  private readonly registro = new RegistroHerramientas();

  constructor(
    private readonly afiliados: AfiliadoRepositoryPort,
    private readonly pdf: CertificadoPdfPort,
    private readonly descargas: DescargaStorePort,
    private readonly ahora: () => number = () => Date.now(),
  ) {
    this.registro.registrar(
      {
        nombre: NOMBRE_HERRAMIENTA,
        descripcion: 'Genera el certificado en PDF de un afiliado autorizado',
        schemaEntrada: entradaSchema,
        requiereAutorizacion: true,
        ejecutar: (entrada, contexto) => this.ejecutarGeneracion(entrada, contexto),
      },
      (entrada) => (entrada as EntradaGeneracion).afiliadoId,
    );
  }

  async ejecutar(
    afiliadoId: string,
    codigo: CodigoCertificado,
    datos: DatosCertificado,
    contexto: ContextoEjecucion,
  ): Promise<ResultadoGeneracion> {
    const resultado = await this.registro.ejecutar(
      NOMBRE_HERRAMIENTA,
      { afiliadoId, codigo, ...datos },
      contexto,
    );

    if (!resultado.ok) {
      return { ok: false, motivo: resultado.motivo };
    }
    return resultado.salida as ResultadoGeneracion;
  }

  private async ejecutarGeneracion(
    entrada: EntradaGeneracion,
    _contexto: ContextoEjecucion,
  ): Promise<ResultadoGeneracion> {
    const afiliado = await this.afiliados.buscarPorId(entrada.afiliadoId);
    if (!afiliado) {
      return { ok: false, motivo: 'afiliado_no_encontrado' };
    }

    const armado = armarCertificado(afiliado, entrada.codigo, entrada, this.ahora());
    if (!armado.ok) {
      return { ok: false, motivo: armado.motivo };
    }

    const buffer = await this.pdf.generar(armado.certificado);
    const token = armado.certificado.codigoVerificacion;
    this.descargas.guardar(token, buffer);

    return { ok: true, token, codigoVerificacion: token };
  }
}
