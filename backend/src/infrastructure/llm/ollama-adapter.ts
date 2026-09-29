import type { LlmPort } from '../../application/llm/llm-port.js';
import { intencionSchema, type Intencion } from '../../application/llm/intencion.js';

export interface OllamaConfig {
  readonly baseUrl: string;
  readonly modelo: string;
}

const PROMPT_CLASIFICACION = `Eres un clasificador de intención de un asistente de certificados de un fondo de pensiones y cesantías.
Clasifica el mensaje del usuario en UNA de estas intenciones y responde SOLO con JSON, sin texto adicional:
- Solicitar certificado: {"tipo":"solicitar_certificado","certificado":"AFILIACION_PO|TRIBUTARIO_PV|CESANTIAS_SALDO|CESANTIAS_RETIROS"}
- Pregunta frecuente: {"tipo":"pregunta_frecuente"}
- Pedir asesor humano: {"tipo":"solicitar_asesor"}
- No se entiende o fuera de alcance: {"tipo":"desconocida"}
Nunca inventes datos del usuario. Si dudas, responde {"tipo":"desconocida"}.`;

/**
 * Adaptador de producción del LLM sobre Ollama. Fuerza salida JSON (format: 'json') y valida
 * con Zod: si el modelo devuelve algo que no encaja en el schema de intención, degrada a
 * 'desconocida' (fallo de negocio que el orquestador maneja repreguntando), en vez de reintentar.
 * Los fallos técnicos (Ollama inalcanzable, HTTP != ok) se propagan como excepción para que el
 * orquestador transite a fallo técnico.
 */
export class OllamaLlmAdapter implements LlmPort {
  constructor(private readonly config: OllamaConfig) {}

  async clasificarIntencion(mensajeUsuario: string): Promise<Intencion> {
    const contenido = await this.chat(PROMPT_CLASIFICACION, mensajeUsuario, true);
    const parseado = this.parsearJson(contenido);
    const validacion = intencionSchema.safeParse(parseado);
    return validacion.success ? validacion.data : { tipo: 'desconocida' };
  }

  async redactar(instruccion: string, contexto: string): Promise<string> {
    return this.chat(instruccion, contexto, false);
  }

  private async chat(system: string, user: string, formatoJson: boolean): Promise<string> {
    const respuesta = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.modelo,
        stream: false,
        ...(formatoJson ? { format: 'json' } : {}),
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!respuesta.ok) {
      throw new Error(`Ollama respondió ${respuesta.status}`);
    }

    const cuerpo = (await respuesta.json()) as { message?: { content?: string } };
    return cuerpo.message?.content ?? '';
  }

  private parsearJson(contenido: string): unknown {
    try {
      return JSON.parse(contenido);
    } catch {
      return null;
    }
  }
}
