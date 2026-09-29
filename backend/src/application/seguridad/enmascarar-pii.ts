/**
 * Enmascara datos personales de afiliados antes de que lleguen a los logs. Un log filtrado
 * no debe revelar información de ningún afiliado (requisito B6, entidad vigilada). El OTP
 * NUNCA se enmascara: simplemente no debe entrar a esta función ni a los logs.
 */

export function enmascararDocumento(documento: string): string {
  if (documento.length <= 2) {
    return '***';
  }
  return `${'*'.repeat(documento.length - 1)}${documento.slice(-1)}`;
}

const CAMPOS_DOCUMENTO = new Set(['numeroDocumento', 'documento']);
const CAMPOS_PII_TOTAL = new Set(['nombre', 'correoSimulado', 'correo']);
const CAMPOS_VALOR_SENSIBLE = new Set([
  'aportes', 'retiros', 'saldo31Dic', 'saldoActual', 'retencionContingente', 'valor', 'detalleRetiros',
]);

/**
 * Recorre un objeto y reemplaza campos con PII o valores sensibles por marcadores. El OTP se
 * ELIMINA por completo (no se enmascara: no debe quedar traza). El documento se enmascara
 * parcialmente (últimos dígitos, útil para soporte); nombre y correo se ocultan totalmente;
 * los valores de producto (saldos, aportes) se marcan como sensibles.
 */
export function enmascararObjeto(entrada: unknown): unknown {
  if (Array.isArray(entrada)) {
    return entrada.map((v) => enmascararObjeto(v));
  }
  if (entrada !== null && typeof entrada === 'object') {
    const resultado: Record<string, unknown> = {};
    for (const [clave, valor] of Object.entries(entrada)) {
      if (clave === 'otp') {
        continue;
      }
      if (CAMPOS_DOCUMENTO.has(clave)) {
        resultado[clave] = typeof valor === 'string' ? enmascararDocumento(valor) : '[PII]';
      } else if (CAMPOS_PII_TOTAL.has(clave)) {
        resultado[clave] = '[PII]';
      } else if (CAMPOS_VALOR_SENSIBLE.has(clave)) {
        resultado[clave] = '[SENSIBLE]';
      } else {
        resultado[clave] = enmascararObjeto(valor);
      }
    }
    return resultado;
  }
  return entrada;
}
