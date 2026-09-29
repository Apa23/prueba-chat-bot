import { enmascararObjeto } from '../../application/seguridad/enmascarar-pii.js';

export interface LoggerSeguro {
  info(evento: string, datos?: unknown): void;
  advertencia(evento: string, datos?: unknown): void;
}

/**
 * Logger que enmascara PII antes de escribir. Único punto de logging del sistema para
 * garantizar que ningún dato de afiliado ni OTP salga en claro a la salida estándar.
 */
export class ConsoleLoggerSeguro implements LoggerSeguro {
  info(evento: string, datos?: unknown): void {
    this.emitir('INFO', evento, datos);
  }

  advertencia(evento: string, datos?: unknown): void {
    this.emitir('WARN', evento, datos);
  }

  private emitir(nivel: string, evento: string, datos?: unknown): void {
    const seguro = datos === undefined ? '' : JSON.stringify(enmascararObjeto(datos));
    console.log(`[${nivel}] ${evento} ${seguro}`.trim());
  }
}
