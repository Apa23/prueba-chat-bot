import { createHash } from 'node:crypto';
import type { Afiliado } from '../../domain/afiliado.js';
import type { CodigoCertificado } from '../../domain/certificado.js';
import type { CertificadoEmitido } from '../../domain/certificado-emitido.js';

export interface DatosCertificado {
  readonly anioGravable?: string;
  readonly anio?: string;
}

export type ResultadoArmado =
  | { readonly ok: true; readonly certificado: CertificadoEmitido }
  | { readonly ok: false; readonly motivo: 'producto_no_disponible' | 'anio_sin_datos' };

function codigoVerificacion(afiliadoId: string, codigo: string, ahora: number): string {
  return createHash('sha256').update(`${afiliadoId}|${codigo}|${ahora}`).digest('hex').slice(0, 10).toUpperCase();
}

function formatearPesos(valor: number): string {
  return `$${valor.toLocaleString('es-CO')}`;
}

export function armarCertificado(
  afiliado: Afiliado,
  codigo: CodigoCertificado,
  datos: DatosCertificado,
  ahora: number,
): ResultadoArmado {
  const base = { nombre: afiliado.nombre, documento: `${afiliado.tipoDocumento} ${afiliado.numeroDocumento}` };
  const cv = codigoVerificacion(afiliado.id, codigo, ahora);

  if (codigo === 'AFILIACION_PO') {
    const po = afiliado.productos.pensionObligatoria;
    if (!po) return { ok: false, motivo: 'producto_no_disponible' };
    return exito(codigo, afiliado.id, cv, {
      ...base,
      fechaAfiliacion: po.fechaAfiliacion,
      estado: po.estado,
      fondo: po.fondo,
    });
  }

  if (codigo === 'TRIBUTARIO_PV') {
    const pv = afiliado.productos.pensionVoluntaria;
    const anio = datos.anioGravable ?? '';
    const mov = pv?.tributario[anio];
    if (!pv) return { ok: false, motivo: 'producto_no_disponible' };
    if (!mov) return { ok: false, motivo: 'anio_sin_datos' };
    return exito(codigo, afiliado.id, cv, {
      ...base,
      anioGravable: anio,
      aportes: formatearPesos(mov.aportes),
      retiros: formatearPesos(mov.retiros),
      saldo31Dic: formatearPesos(mov.saldo31Dic),
      retencionContingente: formatearPesos(mov.retencionContingente),
    });
  }

  if (codigo === 'CESANTIAS_SALDO') {
    const ces = afiliado.productos.cesantias;
    if (!ces) return { ok: false, motivo: 'producto_no_disponible' };
    return exito(codigo, afiliado.id, cv, {
      ...base,
      saldoActual: formatearPesos(ces.saldoActual),
      fechaCorteSaldo: ces.fechaCorteSaldo,
    });
  }

  const ces = afiliado.productos.cesantias;
  const anio = datos.anio ?? '';
  if (!ces) return { ok: false, motivo: 'producto_no_disponible' };
  const retirosAnio = ces.retiros[anio];
  if (!retirosAnio || retirosAnio.length === 0) return { ok: false, motivo: 'anio_sin_datos' };
  const detalle = retirosAnio.map((r) => `${r.fecha}: ${formatearPesos(r.valor)} (${r.motivo})`).join('; ');
  return exito(codigo, afiliado.id, cv, { ...base, anio, detalleRetiros: detalle });
}

function exito(
  codigo: CodigoCertificado,
  afiliadoId: string,
  codigoVerif: string,
  campos: Record<string, string>,
): ResultadoArmado {
  return { ok: true, certificado: { codigo, afiliadoId, campos, codigoVerificacion: codigoVerif } };
}
