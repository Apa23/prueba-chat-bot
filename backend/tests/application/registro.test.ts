import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { RegistroHerramientas } from '../../src/application/herramientas/registro.js';
import type { Herramienta, ContextoEjecucion } from '../../src/application/herramientas/contrato.js';
import { crearSesion, marcarIdentidadValidada } from '../../src/domain/sesion.js';

const T0 = 1_000_000;

function contextoConAfiliado(afiliadoId: string): ContextoEjecucion {
  const sesion = marcarIdentidadValidada(crearSesion('s1', T0), afiliadoId, T0);
  return { sesion, ahora: T0 };
}

function contextoSinValidar(): ContextoEjecucion {
  return { sesion: crearSesion('s1', T0), ahora: T0 };
}

function herramientaConsulta(
  ejecutar = vi.fn().mockResolvedValue({ dato: 'ok' }),
): Herramienta<{ afiliadoId: string }, unknown> {
  return {
    nombre: 'consultar_afiliado',
    descripcion: 'Consulta datos de un afiliado',
    schemaEntrada: z.object({ afiliadoId: z.string() }),
    requiereAutorizacion: true,
    ejecutar,
  };
}

describe('RegistroHerramientas.ejecutar', () => {
  it('should reject with herramienta_no_encontrada when the tool name is unknown (LLM alucina nombre)', async () => {
    // Arrange
    const registro = new RegistroHerramientas();

    // Act
    const resultado = await registro.ejecutar('inexistente', {}, contextoSinValidar());

    // Assert
    expect(resultado).toEqual({ ok: false, motivo: 'herramienta_no_encontrada' });
  });

  it('should reject with argumentos_invalidos when arguments do not match the schema (LLM inventa args)', async () => {
    // Arrange
    const registro = new RegistroHerramientas();
    registro.registrar(herramientaConsulta(), (e) => (e as { afiliadoId: string }).afiliadoId);

    // Act
    const resultado = await registro.ejecutar('consultar_afiliado', { otro: 123 }, contextoConAfiliado('AF-001'));

    // Assert
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.motivo).toBe('argumentos_invalidos');
    }
  });

  it('should reject with no_autorizado when session validated a different affiliate (caso 5: aislamiento)', async () => {
    // Arrange
    const ejecutar = vi.fn();
    const registro = new RegistroHerramientas();
    registro.registrar(herramientaConsulta(ejecutar), (e) => (e as { afiliadoId: string }).afiliadoId);

    // Act: sesión validada para AF-001 intenta consultar AF-003
    const resultado = await registro.ejecutar(
      'consultar_afiliado',
      { afiliadoId: 'AF-003' },
      contextoConAfiliado('AF-001'),
    );

    // Assert
    expect(resultado).toEqual({ ok: false, motivo: 'no_autorizado' });
    expect(ejecutar).not.toHaveBeenCalled();
  });

  it('should reject with no_autorizado when identity was not validated', async () => {
    // Arrange
    const ejecutar = vi.fn();
    const registro = new RegistroHerramientas();
    registro.registrar(herramientaConsulta(ejecutar), (e) => (e as { afiliadoId: string }).afiliadoId);

    // Act
    const resultado = await registro.ejecutar(
      'consultar_afiliado',
      { afiliadoId: 'AF-001' },
      contextoSinValidar(),
    );

    // Assert
    expect(resultado).toEqual({ ok: false, motivo: 'no_autorizado' });
    expect(ejecutar).not.toHaveBeenCalled();
  });

  it('should execute the tool when name, arguments and authorization are all valid', async () => {
    // Arrange
    const ejecutar = vi.fn().mockResolvedValue({ dato: 'ok' });
    const registro = new RegistroHerramientas();
    registro.registrar(herramientaConsulta(ejecutar), (e) => (e as { afiliadoId: string }).afiliadoId);

    // Act
    const resultado = await registro.ejecutar(
      'consultar_afiliado',
      { afiliadoId: 'AF-001' },
      contextoConAfiliado('AF-001'),
    );

    // Assert
    expect(resultado).toEqual({ ok: true, salida: { dato: 'ok' } });
    expect(ejecutar).toHaveBeenCalledOnce();
  });

  it('should execute a non-authorized tool without checking session (ej. buscar_faq)', async () => {
    // Arrange
    const registro = new RegistroHerramientas();
    const herramientaPublica: Herramienta<Record<string, never>, string> = {
      nombre: 'buscar_faq',
      descripcion: 'Busca en la base de conocimiento',
      schemaEntrada: z.object({}),
      requiereAutorizacion: false,
      ejecutar: () => 'respuesta',
    };
    registro.registrar(herramientaPublica);

    // Act
    const resultado = await registro.ejecutar('buscar_faq', {}, contextoSinValidar());

    // Assert
    expect(resultado).toEqual({ ok: true, salida: 'respuesta' });
  });
});
