import { useCallback, useRef, useState } from 'react';
import { ApiClient, ApiError, type DatosIdentidad } from '../services/api.js';

export interface Mensaje {
  readonly id: string;
  readonly autor: 'usuario' | 'asistente';
  readonly texto: string;
  readonly enlaceDescarga?: string;
  readonly codigoVerificacion?: string;
}

export interface ChatFacade {
  readonly mensajes: readonly Mensaje[];
  readonly cargando: boolean;
  readonly requiereIdentidad: boolean;
  readonly error: string | undefined;
  iniciar(): Promise<void>;
  enviar(texto: string): Promise<void>;
  validarIdentidad(datos: DatosIdentidad): Promise<void>;
}

let contador = 0;
function nuevoId(): string {
  contador += 1;
  return `m${contador}`;
}

/**
 * Facade del chat: expone al componente una interfaz simple (mensajes, estados, acciones)
 * y oculta la coordinación entre el estado local y el cliente del BFF. El componente no
 * conoce el protocolo HTTP ni el manejo de sesión.
 */
export function useChat(accessKey: string): ChatFacade {
  const clienteRef = useRef(new ApiClient(accessKey));
  const sessionIdRef = useRef<string | undefined>(undefined);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargando, setCargando] = useState(false);
  const [requiereIdentidad, setRequiereIdentidad] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const agregar = useCallback((mensaje: Mensaje) => {
    setMensajes((prev) => [...prev, mensaje]);
  }, []);

  const ejecutar = useCallback(async (accion: () => Promise<void>) => {
    setCargando(true);
    setError(undefined);
    try {
      await accion();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Ocurrió un error inesperado.');
    } finally {
      setCargando(false);
    }
  }, []);

  const iniciar = useCallback(
    () =>
      ejecutar(async () => {
        const sesion = await clienteRef.current.crearSesion();
        sessionIdRef.current = sesion.sessionId;
        agregar({ id: nuevoId(), autor: 'asistente', texto: sesion.mensaje });
      }),
    [agregar, ejecutar],
  );

  const enviar = useCallback(
    (texto: string) =>
      ejecutar(async () => {
        if (!sessionIdRef.current) return;
        agregar({ id: nuevoId(), autor: 'usuario', texto });
        const r = await clienteRef.current.enviarMensaje(sessionIdRef.current, texto);
        setRequiereIdentidad(r.estado === 'validando_identidad');
        agregar({ id: nuevoId(), autor: 'asistente', texto: r.mensaje, enlaceDescarga: r.enlaceDescarga, codigoVerificacion: r.codigoVerificacion });
      }),
    [agregar, ejecutar],
  );

  const validarIdentidad = useCallback(
    (datos: DatosIdentidad) =>
      ejecutar(async () => {
        if (!sessionIdRef.current) return;
        await clienteRef.current.validarIdentidad(sessionIdRef.current, datos);
        setRequiereIdentidad(false);
        agregar({ id: nuevoId(), autor: 'asistente', texto: 'Identidad validada. ¿Qué certificado necesitas?' });
      }),
    [agregar, ejecutar],
  );

  return { mensajes, cargando, requiereIdentidad, error, iniciar, enviar, validarIdentidad };
}
