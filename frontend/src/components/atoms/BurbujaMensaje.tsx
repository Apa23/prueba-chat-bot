import type { JSX } from 'react';
import type { Mensaje } from '../../hooks/useChat.js';

function esEnlaceSeguro(url: string): boolean {
  return /^https?:\/\//.test(url);
}

/**
 * Renderiza un mensaje como TEXTO PLANO (JSX escapa el contenido): el texto del LLM nunca
 * se interpreta como HTML, neutralizando XSS desde el modelo. El enlace de descarga se
 * valida contra protocolos peligrosos (solo http/https) antes de renderizar (R-S1).
 */
export function BurbujaMensaje({ mensaje }: { mensaje: Mensaje }): JSX.Element {
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
      {mensaje.enlaceDescarga && esEnlaceSeguro(mensaje.enlaceDescarga) && (
        <div style={{ marginTop: '0.5rem' }}>
          <a href={mensaje.enlaceDescarga} target="_blank" rel="noopener noreferrer">
            Descargar certificado (PDF)
          </a>
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
