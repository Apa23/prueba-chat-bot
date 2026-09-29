export type CodigoCertificado =
  | 'AFILIACION_PO'
  | 'TRIBUTARIO_PV'
  | 'CESANTIAS_SALDO'
  | 'CESANTIAS_RETIROS';

export type RequisitoDato = 'anio_gravable' | 'anio' | 'tipo_cesantias';

export interface TipoCertificado {
  readonly codigo: CodigoCertificado;
  readonly nombre: string;
  readonly producto: 'pension_obligatoria' | 'pension_voluntaria' | 'cesantias';
  readonly datosRequeridos: readonly RequisitoDato[];
}

export const CATALOGO_CERTIFICADOS: Readonly<Record<CodigoCertificado, TipoCertificado>> = {
  AFILIACION_PO: {
    codigo: 'AFILIACION_PO',
    nombre: 'Certificado de afiliación a pensión obligatoria',
    producto: 'pension_obligatoria',
    datosRequeridos: [],
  },
  TRIBUTARIO_PV: {
    codigo: 'TRIBUTARIO_PV',
    nombre: 'Certificado tributario de pensión voluntaria',
    producto: 'pension_voluntaria',
    datosRequeridos: ['anio_gravable'],
  },
  CESANTIAS_SALDO: {
    codigo: 'CESANTIAS_SALDO',
    nombre: 'Certificado de saldo de cesantías',
    producto: 'cesantias',
    datosRequeridos: [],
  },
  CESANTIAS_RETIROS: {
    codigo: 'CESANTIAS_RETIROS',
    nombre: 'Certificado de retiros de cesantías',
    producto: 'cesantias',
    datosRequeridos: ['anio'],
  },
};
