import { useState, type FormEvent, type JSX } from 'react';
import { Boton } from '../atoms/Boton.js';
import type { DatosIdentidad } from '../../services/api.js';

interface Props {
  onValidar: (datos: DatosIdentidad) => void;
  deshabilitado: boolean;
}

const campo = { padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', fontSize: '1rem', width: '100%' };

export function FormularioIdentidad({ onValidar, deshabilitado }: Props): JSX.Element {
  const [tipoDocumento, setTipoDocumento] = useState<'CC' | 'CE'>('CC');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [otp, setOtp] = useState('');

  function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    if (!numeroDocumento.trim() || !otp.trim()) return;
    onValidar({ tipoDocumento, numeroDocumento: numeroDocumento.trim(), otp: otp.trim() });
    setOtp('');
  }

  return (
    <form
      onSubmit={manejarEnvio}
      style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem', margin: '0 1rem' }}
    >
      <strong style={{ fontSize: '0.9rem' }}>Valida tu identidad</strong>
      <label>
        Tipo de documento
        <select value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value as 'CC' | 'CE')} style={campo} disabled={deshabilitado}>
          <option value="CC">Cédula de ciudadanía</option>
          <option value="CE">Cédula de extranjería</option>
        </select>
      </label>
      <label>
        Número de documento
        <input type="text" value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} maxLength={50} style={campo} disabled={deshabilitado} />
      </label>
      <label>
        Código OTP
        <input type="password" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={20} autoComplete="one-time-code" style={campo} disabled={deshabilitado} />
      </label>
      <Boton type="submit" disabled={deshabilitado}>Validar identidad</Boton>
    </form>
  );
}
