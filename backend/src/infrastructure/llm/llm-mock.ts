import type { LlmPort } from '../../application/llm/llm-port.js';
import type { Intencion } from '../../application/llm/intencion.js';

/**
 * Doble determinista del LLM para desarrollo y pruebas. Clasifica por palabras clave y
 * devuelve respuestas fijas, permitiendo construir y probar el orquestador sin Ollama.
 * No es el adaptador de producción; el adaptador real (Ollama) implementa el mismo puerto.
 */
export class LlmMock implements LlmPort {
  async clasificarIntencion(mensajeUsuario: string): Promise<Intencion> {
    const texto = mensajeUsuario.toLowerCase();

    if (texto.includes('asesor') || texto.includes('humano') || texto.includes('persona')) {
      return { tipo: 'solicitar_asesor' };
    }
    // Una pregunta ("para qué sirve X") es FAQ aunque mencione un tipo de certificado:
    // la señal de pregunta se evalúa antes que la de solicitud de certificado.
    if (texto.includes('sirve') || texto.includes('que es') || texto.includes('qué es') || texto.includes('?')) {
      return { tipo: 'pregunta_frecuente' };
    }
    if (texto.includes('tributario') || texto.includes('renta')) {
      return { tipo: 'solicitar_certificado', certificado: 'TRIBUTARIO_PV' };
    }
    if (texto.includes('afiliaci')) {
      return { tipo: 'solicitar_certificado', certificado: 'AFILIACION_PO' };
    }
    if (texto.includes('saldo') && texto.includes('cesant')) {
      return { tipo: 'solicitar_certificado', certificado: 'CESANTIAS_SALDO' };
    }
    if (texto.includes('retiro') && texto.includes('cesant')) {
      return { tipo: 'solicitar_certificado', certificado: 'CESANTIAS_RETIROS' };
    }
    return { tipo: 'desconocida' };
  }

  async redactar(instruccion: string, contexto: string): Promise<string> {
    return contexto ? `${instruccion}\n\n${contexto}` : instruccion;
  }
}
