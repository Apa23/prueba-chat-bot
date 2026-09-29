import { puedeAccederA } from '../../domain/sesion.js';
import type {
  ContextoEjecucion,
  Herramienta,
  ResultadoHerramienta,
} from './contrato.js';

/**
 * Extrae, de los argumentos de una herramienta, el id del afiliado al que se pretende
 * acceder. Permite al registro verificar `puedeAccederA` de forma genérica sin conocer
 * la forma concreta de cada herramienta. Si devuelve undefined, no hay afiliado objetivo.
 */
export type ExtractorAfiliado = (entrada: unknown) => string | undefined;

interface EntradaRegistro {
  readonly herramienta: Herramienta<unknown, unknown>;
  readonly extraerAfiliadoId: ExtractorAfiliado;
}

export class RegistroHerramientas {
  private readonly herramientas = new Map<string, EntradaRegistro>();

  registrar<E, S>(herramienta: Herramienta<E, S>, extraerAfiliadoId: ExtractorAfiliado = () => undefined): void {
    this.herramientas.set(herramienta.nombre, {
      herramienta: herramienta as Herramienta<unknown, unknown>,
      extraerAfiliadoId,
    });
  }

  nombresDisponibles(): readonly string[] {
    return [...this.herramientas.keys()];
  }

  /**
   * Punto único de ejecución. Aplica, en orden, los tres controles que hacen segura la
   * ejecución propuesta por el LLM: (1) la herramienta debe existir, (2) los argumentos
   * deben validar contra el schema, (3) si requiere autorización, la sesión debe poder
   * acceder al afiliado objetivo (invariante de dominio `puedeAccederA`). Solo entonces
   * se ejecuta.
   */
  async ejecutar(
    nombre: string,
    argumentos: unknown,
    contexto: ContextoEjecucion,
  ): Promise<ResultadoHerramienta<unknown>> {
    const entrada = this.herramientas.get(nombre);
    if (!entrada) {
      return { ok: false, motivo: 'herramienta_no_encontrada' };
    }

    const validacion = entrada.herramienta.schemaEntrada.safeParse(argumentos);
    if (!validacion.success) {
      return { ok: false, motivo: 'argumentos_invalidos', detalle: validacion.error.message };
    }

    if (entrada.herramienta.requiereAutorizacion) {
      const afiliadoId = entrada.extraerAfiliadoId(validacion.data);
      if (afiliadoId === undefined || !puedeAccederA(contexto.sesion, afiliadoId)) {
        return { ok: false, motivo: 'no_autorizado' };
      }
    }

    const salida = await entrada.herramienta.ejecutar(validacion.data, contexto);
    return { ok: true, salida };
  }
}
