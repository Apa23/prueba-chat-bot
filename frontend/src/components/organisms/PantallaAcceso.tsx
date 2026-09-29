import { useState, type FormEvent, type JSX } from 'react';
import { Boton } from '../atoms/Boton.js';

interface Props {
  onAcceder: (clave: string) => void;
}

/**
 * Pantalla de acceso al prototipo (restricción 5.6). La clave se pasa al padre y se mantiene
 * en memoria; no se persiste en localStorage por seguridad.
 */
export function PantallaAcceso({ onAcceder }: Props): JSX.Element {
  const [clave, setClave] = useState('');

  function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    if (!clave.trim()) return;
    onAcceder(clave.trim());
  }

  return (
    <form onSubmit={manejarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '20rem', margin: '2rem auto' }}>
      <label htmlFor="clave-acceso">Clave de acceso al prototipo</label>
      <input
        id="clave-acceso"
        type="password"
        value={clave}
        onChange={(e) => setClave(e.target.value)}
        style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', fontSize: '1rem' }}
      />
      <Boton type="submit">Ingresar</Boton>
    </form>
  );
}
