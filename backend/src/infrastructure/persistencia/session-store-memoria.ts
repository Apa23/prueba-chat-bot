import type { EstadoSesion, SessionStorePort } from '../../application/puertos/session-store.js';

export class InMemorySessionStore implements SessionStorePort {
  private readonly sesiones = new Map<string, EstadoSesion>();

  crear(estado: EstadoSesion): void {
    this.sesiones.set(estado.sesion.id, estado);
  }

  obtener(sessionId: string): EstadoSesion | undefined {
    return this.sesiones.get(sessionId);
  }

  guardar(sessionId: string, estado: EstadoSesion): void {
    this.sesiones.set(sessionId, estado);
  }

  eliminar(sessionId: string): void {
    this.sesiones.delete(sessionId);
  }
}
