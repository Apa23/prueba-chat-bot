import { useEffect, useRef, type JSX } from 'react';
import { useChat } from '../../hooks/useChat.js';
import { ListaMensajes } from '../molecules/ListaMensajes.js';
import { EntradaChat } from '../molecules/EntradaChat.js';
import { FormularioIdentidad } from '../molecules/FormularioIdentidad.js';
import { ConsentimientoDatos } from '../molecules/ConsentimientoDatos.js';

export function VentanaChat({ accessKey }: { accessKey: string }): JSX.Element {
  const chat = useChat(accessKey);
  const iniciado = useRef(false);

  useEffect(() => {
    if (iniciado.current) return;
    iniciado.current = true;
    void chat.iniciar();
  }, [chat]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '70vh', border: '1px solid #e5e7eb', borderRadius: '0.75rem', overflow: 'hidden', background: 'white' }}>
      <ListaMensajes mensajes={chat.mensajes} cargando={chat.cargando} onDescargar={chat.descargar} />

      {chat.error && (
        <p role="alert" style={{ color: '#b00', padding: '0 1rem', fontSize: '0.85rem' }}>
          {chat.error}
        </p>
      )}

      {chat.requiereConsentimiento ? (
        <ConsentimientoDatos onResponder={chat.responderConsentimiento} deshabilitado={chat.cargando} />
      ) : chat.requiereIdentidad ? (
        <FormularioIdentidad onValidar={chat.validarIdentidad} deshabilitado={chat.cargando} />
      ) : null}

      {!chat.sesionTerminada && !chat.requiereConsentimiento ? (
        <EntradaChat onEnviar={chat.enviar} deshabilitado={chat.cargando} />
      ) : null}
    </div>
  );
}
