import type { LlmPort } from '../llm/llm-port.js';
import type { Sesion } from '../../domain/sesion.js';
import { datosFaltantesPara, type DatosRecolectados } from '../../domain/certificado.js';
import type { ResponderFaq } from '../faq/responder-faq.js';
import { type EstadoConversacion } from './estados.js';

export interface RespuestaOrquestador {
  readonly estado: EstadoConversacion;
  readonly mensaje: string;
}

const MENSAJE_FALLO_TECNICO =
  'En este momento no puedo procesar tu solicitud por un problema técnico. Por favor intenta más tarde.';

const MENSAJE_AUTORIZACION_DATOS =
  'Para atenderte, autorizas el tratamiento de tus datos personales conforme a la política de privacidad. ' +
  '¿Qué certificado necesitas?';

export class Orquestador {
  constructor(
    private readonly llm: LlmPort,
    private readonly responderFaq: ResponderFaq,
  ) {}

  async procesarMensaje(
    estado: EstadoConversacion,
    mensajeUsuario: string,
    sesion: Sesion,
  ): Promise<RespuestaOrquestador> {
    try {
      return await this.transicionar(estado, mensajeUsuario, sesion);
    } catch {
      return { estado: { ...estado, nombre: 'fallo_tecnico' }, mensaje: MENSAJE_FALLO_TECNICO };
    }
  }

  private async transicionar(
    estado: EstadoConversacion,
    mensajeUsuario: string,
    sesion: Sesion,
  ): Promise<RespuestaOrquestador> {
    if (estado.nombre === 'fallo_tecnico') {
      return { estado, mensaje: MENSAJE_FALLO_TECNICO };
    }

    if (estado.nombre === 'inicio') {
      return {
        estado: { ...estado, nombre: 'identificando_intencion' },
        mensaje: MENSAJE_AUTORIZACION_DATOS,
      };
    }

    const intencion = await this.llm.clasificarIntencion(mensajeUsuario);

    if (intencion.tipo === 'solicitar_asesor') {
      return this.escalar('Te comunico con un asesor humano y conservo el contexto de tu conversación.');
    }

    if (intencion.tipo === 'pregunta_frecuente') {
      const faq = await this.responderFaq.ejecutar(mensajeUsuario, { sesion, ahora: Date.now() });
      if (!faq.dentroDeAlcance) {
        return this.escalar('Esta consulta está fuera de mi alcance. Te ofrezco un asesor humano.');
      }
      const redactada = await this.llm.redactar(
        'Responde al usuario usando SOLO esta información y cita la fuente al final.',
        `${faq.respuesta}\n\nFuente: ${faq.fuente}`,
      );
      return { estado: { ...estado, nombre: 'identificando_intencion' }, mensaje: redactada };
    }

    if (intencion.tipo === 'desconocida') {
      return this.escalar('No comprendí tu solicitud. ¿Deseas que te comunique con un asesor humano?');
    }

    if (!sesion.identidadValidada) {
      return {
        estado: { ...estado, nombre: 'validando_identidad', certificadoEnCurso: intencion.certificado },
        mensaje: 'Antes de entregar información personal, valida tu identidad con tu documento y código OTP.',
      };
    }

    const faltantes = datosFaltantesPara(intencion.certificado, estado.datosRecolectados as DatosRecolectados);
    if (faltantes.length > 0) {
      return {
        estado: { ...estado, nombre: 'recolectando_datos', certificadoEnCurso: intencion.certificado },
        mensaje: `Para emitir tu certificado necesito: ${faltantes.join(', ')}.`,
      };
    }

    return {
      estado: { ...estado, nombre: 'ejecutando', certificadoEnCurso: intencion.certificado },
      mensaje: 'Generando tu certificado.',
    };
  }

  private escalar(mensaje: string): RespuestaOrquestador {
    return { estado: { nombre: 'escalado_humano', datosRecolectados: {} }, mensaje };
  }
}
