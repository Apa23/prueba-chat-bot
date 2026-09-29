import type { JSX } from 'react';
import { Boton } from '../atoms/Boton.js';

interface Props {
  onResponder: (acepta: boolean) => void;
  deshabilitado: boolean;
}

export function ConsentimientoDatos({ onResponder, deshabilitado }: Props): JSX.Element {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', borderTop: '1px solid #e5e7eb', justifyContent: 'center' }}>
      <Boton type="button" onClick={() => onResponder(true)} disabled={deshabilitado}>
        Acepto
      </Boton>
      <Boton
        type="button"
        onClick={() => onResponder(false)}
        disabled={deshabilitado}
        style={{ background: '#9ca3af' }}
      >
        No acepto
      </Boton>
    </div>
  );
}
