import type { JSX } from 'react';

export function Spinner(): JSX.Element {
  return (
    <span
      role="status"
      aria-label="Cargando"
      style={{
        display: 'inline-block',
        width: '1rem',
        height: '1rem',
        border: '2px solid #ccc',
        borderTopColor: '#555',
        borderRadius: '50%',
        animation: 'girar 0.8s linear infinite',
      }}
    />
  );
}
