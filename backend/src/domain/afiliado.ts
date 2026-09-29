/**
 * Entidades del Afiliado, en español por ser el lenguaje del negocio (fondo de pensiones
 * y cesantías). Tipos inmutables: un afiliado se lee, no se modifica desde la aplicación.
 */

export type TipoDocumento = 'CC' | 'CE';

export interface PensionObligatoria {
  readonly fechaAfiliacion: string;
  readonly estado: string;
  readonly fondo: string;
}

export interface MovimientoTributario {
  readonly aportes: number;
  readonly retiros: number;
  readonly saldo31Dic: number;
  readonly retencionContingente: number;
}

export interface PensionVoluntaria {
  readonly tributario: Readonly<Record<string, MovimientoTributario>>;
}

export interface RetiroCesantias {
  readonly fecha: string;
  readonly valor: number;
  readonly motivo: string;
}

export interface Cesantias {
  readonly saldoActual: number;
  readonly fechaCorteSaldo: string;
  readonly retiros: Readonly<Record<string, readonly RetiroCesantias[]>>;
}

export interface ProductosAfiliado {
  readonly pensionObligatoria?: PensionObligatoria;
  readonly pensionVoluntaria?: PensionVoluntaria;
  readonly cesantias?: Cesantias;
}

export interface Afiliado {
  readonly id: string;
  readonly tipoDocumento: TipoDocumento;
  readonly numeroDocumento: string;
  readonly nombre: string;
  readonly correoSimulado: string;
  readonly productos: ProductosAfiliado;
}
