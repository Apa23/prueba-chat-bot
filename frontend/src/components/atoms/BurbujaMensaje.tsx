import type { JSX } from 'react';
import type { Mensaje } from '../../hooks/useChat.js';

interface Props {
  mensaje: Mensaje;
  onDescargar?: (enlace: string) => void;
}

/**
 * Renderiza un mensaje como TEXTO PLANO (JSX escapa el contenido): el texto del LLM nunca
 * se interpreta como HTML, neutralizando XSS desde el modelo. El enlace de descarga se
 * valida contra protocolos peligrosos (solo http/https) antes de renderizar (R-S1).
 */
export function BurbujaMensaje({ mensaje, onDescargar }: Props): JSX.Element {
  const esUsuario = mensaje.autor === 'usuario';
  return (
    <div
      style={{
        alignSelf: esUsuario ? 'flex-end' : 'flex-start',
        background: esUsuario ? '#374151' : '#e5e7eb',
        color: esUsuario ? 'white' : '#111',
        padding: '0.6rem 0.9rem',
        borderRadius: '0.75rem',
        maxWidth: '80%',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {mensaje.texto}
      {mensaje.enlaceDescarga && onDescargar && (
        <div style={{ marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={() => onDescargar(mensaje.enlaceDescarga as string)}
            style={{ background: 'none', border: 'none', color: '#1d4ed8', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' }}
          >
            Descargar certificado (PDF)
          </button>
        </div>
      )}
      {mensaje.codigoVerificacion && (
        <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', opacity: 0.8 }}>
          Código de verificación: {mensaje.codigoVerificacion}
        </div>
      )}
    </div>
  );
}
