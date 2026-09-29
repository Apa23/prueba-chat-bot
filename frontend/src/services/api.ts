const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ApiError';
  }
}

export interface RespuestaMensaje {
  mensaje: string;
  estado: string;
  enlaceDescarga?: string;
  codigoVerificacion?: string;
}

export interface RespuestaSesion {
  sessionId: string;
  mensaje: string;
}

export interface DatosIdentidad {
  tipoDocumento: 'CC' | 'CE';
  numeroDocumento: string;
  otp: string;
}

/**
 * Cliente HTTP del BFF. Adjunta la clave de acceso del prototipo en cada llamada.
 * La clave se mantiene en memoria (no en localStorage) por seguridad.
 */
export class ApiClient {
  constructor(private readonly accessKey: string) {}

  private async request<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
    const respuesta = await fetch(`${BASE_URL}${ruta}`, {
      ...opciones,
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': this.accessKey,
        ...opciones.headers,
      },
    });
    if (!respuesta.ok) {
      const cuerpo = await respuesta.json().catch(() => ({}));
      throw new ApiError(respuesta.status, cuerpo?.error?.mensaje ?? 'Error de comunicación.');
    }
    return respuesta.json() as Promise<T>;
  }

  crearSesion(): Promise<RespuestaSesion> {
    return this.request<RespuestaSesion>('/sesiones', { method: 'POST' });
  }

  enviarMensaje(sessionId: string, mensaje: string): Promise<RespuestaMensaje> {
    return this.request<RespuestaMensaje>(`/sesiones/${sessionId}/mensajes`, {
      method: 'POST',
      body: JSON.stringify({ mensaje }),
    });
  }

  validarIdentidad(sessionId: string, datos: DatosIdentidad): Promise<{ identidadValidada: boolean }> {
    return this.request(`/sesiones/${sessionId}/identidad`, {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  }

  /**
   * Descarga el PDF vía fetch adjuntando la clave de acceso (X-Access-Key), ya que la ruta
   * está protegida. Un clic en <a href> no enviaría el header; por eso se descarga como blob
   * y se entrega al navegador desde memoria, sin exponer la clave en la URL.
   */
  async descargarPdf(enlace: string): Promise<Blob> {
    const ruta = enlace.startsWith('http') ? enlace : `${BASE_URL}${enlace}`;
    const respuesta = await fetch(ruta, { headers: { 'X-Access-Key': this.accessKey } });
    if (!respuesta.ok) {
      throw new ApiError(respuesta.status, 'No fue posible descargar el certificado.');
    }
    return respuesta.blob();
  }
}
