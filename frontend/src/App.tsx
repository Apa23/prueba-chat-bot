import { useState, type JSX } from 'react';
import { PantallaAcceso } from './components/organisms/PantallaAcceso.js';
import { VentanaChat } from './components/organisms/VentanaChat.js';

export function App(): JSX.Element {
  const [accessKey, setAccessKey] = useState<string | undefined>(undefined);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '1.5rem', maxWidth: '48rem', margin: '0 auto' }}>
      <p
        role="note"
        style={{
          background: '#fff3cd',
          border: '1px solid #ffe69c',
          borderRadius: '0.5rem',
          padding: '0.6rem 1rem',
          fontSize: '0.85rem',
          marginBottom: '1rem',
        }}
      >
        Prototipo de evaluación – no oficial
      </p>
      <h1 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.8rem)' }}>Asistente de certificados</h1>

      {accessKey ? <VentanaChat accessKey={accessKey} /> : <PantallaAcceso onAcceder={setAccessKey} />}
    </main>
  );
}
