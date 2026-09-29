/**
 * Componente raíz. En Fase 1 solo muestra el rótulo obligatorio y una verificación
 * de conexión con el backend. La estructura de atomic design se define en la fase del frontend.
 */
export function App() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: '48rem', margin: '0 auto' }}>
      <p
        role="note"
        style={{
          background: '#fff3cd',
          border: '1px solid #ffe69c',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
          fontSize: '0.875rem',
        }}
      >
        Prototipo de evaluación – no oficial
      </p>
      <h1>Asistente de certificados (prototipo)</h1>
      <p>Fase 1: andamiaje del proyecto. El chat se implementará en fases posteriores.</p>
    </main>
  );
}
