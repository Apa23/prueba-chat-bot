import type { ButtonHTMLAttributes, JSX } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

export function Boton({ children, style, ...rest }: Props): JSX.Element {
  return (
    <button
      {...rest}
      style={{
        padding: '0.6rem 1rem',
        borderRadius: '0.5rem',
        border: 'none',
        background: rest.disabled ? '#999' : '#374151',
        color: 'white',
        cursor: rest.disabled ? 'not-allowed' : 'pointer',
        fontSize: '0.95rem',
        minHeight: '44px',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
