import { z } from 'zod';

export const intencionSchema = z.discriminatedUnion('tipo', [
  z.object({
    tipo: z.literal('solicitar_certificado'),
    certificado: z.enum(['AFILIACION_PO', 'TRIBUTARIO_PV', 'CESANTIAS_SALDO', 'CESANTIAS_RETIROS']),
  }),
  z.object({ tipo: z.literal('pregunta_frecuente') }),
  z.object({ tipo: z.literal('solicitar_asesor') }),
  z.object({ tipo: z.literal('desconocida') }),
]);

export type Intencion = z.infer<typeof intencionSchema>;
