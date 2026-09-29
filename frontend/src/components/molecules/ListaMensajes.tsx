import type { JSX } from 'react';
import type { Mensaje } from '../../hooks/useChat.js';
import { BurbujaMensaje } from '../atoms/BurbujaMensaje.js';
import { Spinner } from '../atoms/Spinner.js';

interface Props {
  mensajes: readonly Mensaje[];
  cargando: boolean;
  onDescargar: (enlace: string) => void;
}

export function ListaMensajes({ mensajes, cargando, onDescargar }: Props): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        padding: '1rem',
        overflowY: 'auto',
        flex: 1,
        minHeight: 0,
      }}
    >
      {mensajes.map((m) => (
        <BurbujaMensaje key={m.id} mensaje={m} onDescargar={onDescargar} />
      ))}
      {cargando && (
        <div style={{ alignSelf: 'flex-start', padding: '0.5rem' }}>
          <Spinner />
        </div>
      )}
    </div>
  );
}
