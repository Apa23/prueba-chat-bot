import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type { Orquestador } from '../../application/orquestador/orquestador.js';
import type { SessionStorePort } from '../../application/puertos/session-store.js';
import type { AfiliadoRepositoryPort } from '../../application/puertos/afiliado-repository.js';
import type { GenerarCertificado } from '../../application/certificados/generar-certificado.js';
import { crearSesion, marcarIdentidadValidada, registrarIntentoOtpFallido, estaExpirada, estaBloqueadaPorOtp } from '../../domain/sesion.js';
import { validarIdentidad } from '../../domain/identidad.js';
import { estadoInicial } from '../../application/orquestador/estados.js';

export interface DependenciasSesiones {
  readonly orquestador: Orquestador;
  readonly store: SessionStorePort;
  readonly afiliados: AfiliadoRepositoryPort;
  readonly generarCertificado: GenerarCertificado;
  readonly otpValido: string;
  readonly ttlMinutos: number;
  readonly maxIntentosOtp: number;
  readonly baseUrlDescarga: string;
  readonly ahora?: () => number;
}

const mensajeSchema = z.object({ mensaje: z.string().min(1).max(1000) });
const identidadSchema = z.object({
  tipoDocumento: z.enum(['CC', 'CE']),
  numeroDocumento: z.string().min(1).max(50),
  otp: z.string().min(1).max(20),
});

function error(res: Response, status: number, codigo: string, mensaje: string): void {
  res.status(status).json({ error: { codigo, mensaje } });
}

export function crearSesionesRouter(deps: DependenciasSesiones): Router {
  const router = Router();
  const ahora = deps.ahora ?? (() => Date.now());

  router.post('/', async (_req: Request, res: Response) => {
    const id = randomUUID();
    const sesion = crearSesion(id, ahora());
    const conversacion = estadoInicial();
    deps.store.crear({ sesion, conversacion });
    const resultado = await deps.orquestador.procesarMensaje(conversacion, '', sesion);
    deps.store.guardar(id, { sesion, conversacion: resultado.estado });
    res.status(201).json({ sessionId: id, mensaje: resultado.mensaje });
  });

  router.post('/:id/mensajes', async (req: Request, res: Response) => {
    const sessionId = String(req.params.id);
    const parseo = mensajeSchema.safeParse(req.body);
    if (!parseo.success) {
      return error(res, 400, 'entrada_invalida', 'El mensaje es obligatorio.');
    }
    const estado = deps.store.obtener(sessionId);
    if (!estado) {
      return error(res, 404, 'sesion_no_encontrada', 'La sesión no existe.');
    }
    if (estaExpirada(estado.sesion, ahora(), deps.ttlMinutos)) {
      deps.store.eliminar(sessionId);
      return error(res, 410, 'sesion_expirada', 'La sesión expiró. Inicia una nueva.');
    }
    const resultado = await deps.orquestador.procesarMensaje(estado.conversacion, parseo.data.mensaje, estado.sesion);
    const sesionRefrescada = { ...estado.sesion, ultimaActividad: ahora() };
    deps.store.guardar(sessionId, { sesion: sesionRefrescada, conversacion: resultado.estado });

    if (resultado.estado.nombre === 'ejecutando' && resultado.estado.certificadoEnCurso) {
      const generacion = await deps.generarCertificado.ejecutar(
        sesionRefrescada.afiliadoAutorizadoId ?? '',
        resultado.estado.certificadoEnCurso,
        {
          anioGravable: resultado.estado.datosRecolectados.anioGravable,
          anio: resultado.estado.datosRecolectados.anio,
        },
        { sesion: sesionRefrescada, ahora: ahora() },
      );

      if (!generacion.ok) {
        return res.status(200).json({
          mensaje: 'No fue posible generar el certificado con los datos disponibles.',
          estado: 'completado',
          motivo: generacion.motivo,
        });
      }

      const estadoFinal = { ...resultado.estado, nombre: 'completado' as const };
      deps.store.guardar(sessionId, { sesion: sesionRefrescada, conversacion: estadoFinal });
      return res.status(200).json({
        mensaje: 'Tu certificado está listo.',
        estado: 'completado',
        enlaceDescarga: `${deps.baseUrlDescarga}/descargas/${generacion.token}`,
        codigoVerificacion: generacion.codigoVerificacion,
      });
    }

    res.status(200).json({ mensaje: resultado.mensaje, estado: resultado.estado.nombre });
  });

  router.post('/:id/identidad', async (req: Request, res: Response) => {
    const sessionId = String(req.params.id);
    const parseo = identidadSchema.safeParse(req.body);
    if (!parseo.success) {
      return error(res, 400, 'entrada_invalida', 'Datos de identidad incompletos.');
    }
    const estado = deps.store.obtener(sessionId);
    if (!estado) {
      return error(res, 404, 'sesion_no_encontrada', 'La sesión no existe.');
    }
    if (estaBloqueadaPorOtp(estado.sesion, deps.maxIntentosOtp)) {
      return error(res, 429, 'sesion_bloqueada', 'Demasiados intentos fallidos. Inicia una nueva sesión.');
    }
    const { tipoDocumento, numeroDocumento, otp } = parseo.data;
    const afiliado = await deps.afiliados.buscarPorDocumento(tipoDocumento, numeroDocumento);
    const resultado = validarIdentidad(tipoDocumento, numeroDocumento, otp, afiliado, deps.otpValido);

    if (!resultado.valida) {
      const sesionFallida = registrarIntentoOtpFallido(estado.sesion, ahora());
      deps.store.guardar(sessionId, { ...estado, sesion: sesionFallida });
      return error(res, 401, resultado.motivo, 'No fue posible validar tu identidad.');
    }

    const sesionValidada = marcarIdentidadValidada(estado.sesion, resultado.afiliadoId, ahora());
    deps.store.guardar(sessionId, { ...estado, sesion: sesionValidada });
    res.status(200).json({ identidadValidada: true });
  });

  return router;
}
