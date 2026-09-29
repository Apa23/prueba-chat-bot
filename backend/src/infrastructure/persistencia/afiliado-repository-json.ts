import { readFileSync } from 'node:fs';
import type { AfiliadoRepositoryPort } from '../../application/puertos/afiliado-repository.js';
import type { Afiliado, ProductosAfiliado } from '../../domain/afiliado.js';

interface AfiliadoJson {
  id: string;
  tipo_documento: string;
  numero_documento: string;
  nombre: string;
  correo_simulado: string;
  productos: Record<string, unknown>;
}

/**
 * Adaptador de datos que lee los afiliados del archivo ficticio. Aquí ocurre el mapeo del
 * formato del JSON (snake_case) al modelo de dominio (camelCase): el dominio no conoce la
 * forma del archivo. Los datos se cargan una vez al construir y quedan en memoria de solo lectura.
 */
export class JsonAfiliadoRepository implements AfiliadoRepositoryPort {
  private readonly afiliados: readonly Afiliado[];

  constructor(rutaArchivo: string) {
    const crudo = JSON.parse(readFileSync(rutaArchivo, 'utf-8')) as { afiliados: AfiliadoJson[] };
    this.afiliados = crudo.afiliados.map((a) => this.mapear(a));
  }

  async buscarPorDocumento(tipoDocumento: string, numeroDocumento: string): Promise<Afiliado | undefined> {
    return this.afiliados.find(
      (a) => a.tipoDocumento === tipoDocumento && a.numeroDocumento === numeroDocumento,
    );
  }

  async buscarPorId(id: string): Promise<Afiliado | undefined> {
    return this.afiliados.find((a) => a.id === id);
  }

  private mapear(a: AfiliadoJson): Afiliado {
    return {
      id: a.id,
      tipoDocumento: a.tipo_documento as Afiliado['tipoDocumento'],
      numeroDocumento: a.numero_documento,
      nombre: a.nombre,
      correoSimulado: a.correo_simulado,
      productos: this.mapearProductos(a.productos),
    };
  }

  private mapearProductos(productos: Record<string, unknown>): ProductosAfiliado {
    const resultado: Record<string, unknown> = {};
    if (productos.pension_obligatoria) {
      const po = productos.pension_obligatoria as Record<string, string>;
      resultado.pensionObligatoria = {
        fechaAfiliacion: po.fecha_afiliacion,
        estado: po.estado,
        fondo: po.fondo,
      };
    }
    if (productos.pension_voluntaria) {
      const pv = productos.pension_voluntaria as { tributario: Record<string, Record<string, number>> };
      resultado.pensionVoluntaria = { tributario: this.mapearTributario(pv.tributario) };
    }
    if (productos.cesantias) {
      const c = productos.cesantias as Record<string, unknown>;
      resultado.cesantias = {
        saldoActual: c.saldo_actual,
        fechaCorteSaldo: c.fecha_corte_saldo,
        retiros: c.retiros ?? {},
      };
    }
    return resultado as ProductosAfiliado;
  }

  private mapearTributario(
    tributario: Record<string, Record<string, number>>,
  ): Record<string, unknown> {
    const resultado: Record<string, unknown> = {};
    for (const [anio, mov] of Object.entries(tributario)) {
      resultado[anio] = {
        aportes: mov.aportes,
        retiros: mov.retiros,
        saldo31Dic: mov.saldo_31_dic,
        retencionContingente: mov.retencion_contingente,
      };
    }
    return resultado;
  }
}
