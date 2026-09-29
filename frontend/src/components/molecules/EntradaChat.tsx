import { useState, type FormEvent, type JSX } from 'react';
import { Boton } from '../atoms/Boton.js';

interface Props {
  onEnviar: (texto: string) => void;
  deshabilitado: boolean;
}

export function EntradaChat({ onEnviar, deshabilitado }: Props): JSX.Element {
  const [texto, setTexto] = useState('');

  function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    const limpio = texto.trim();
    if (!limpio) return;
    onEnviar(limpio);
    setTexto('');
  }

  return (
    <form onSubmit={manejarEnvio} style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
      <label htmlFor="entrada-chat" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        Escribe tu mensaje
      </label>
      <input
        id="entrada-chat"
        type="text"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Escribe tu mensaje..."
        disabled={deshabilitado}
        maxLength={1000}
        style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', fontSize: '1rem', minWidth: 0 }}
      />
      <Boton type="submit" disabled={deshabilitado}>Enviar</Boton>
    </form>
  );
}
