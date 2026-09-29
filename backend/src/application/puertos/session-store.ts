import type { Sesion } from '../../domain/sesion.js';
import type { EstadoConversacion } from '../orquestador/estados.js';

export interface EstadoSesion {
  readonly sesion: Sesion;
  readonly conversacion: EstadoConversacion;
}

export interface SessionStorePort {
  crear(estado: EstadoSesion): void;
  obtener(sessionId: string): EstadoSesion | undefined;
  guardar(sessionId: string, estado: EstadoSesion): void;
  eliminar(sessionId: string): void;
}
