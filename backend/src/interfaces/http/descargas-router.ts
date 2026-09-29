import { Router, type Request, type Response } from 'express';
import type { DescargaStorePort } from '../../application/puertos/certificado-pdf.js';

export function crearDescargasRouter(descargas: DescargaStorePort): Router {
  const router = Router();

  router.get('/:token', (req: Request, res: Response) => {
    const token = String(req.params.token);
    const pdf = descargas.obtener(token);
    if (!pdf) {
      return res.status(404).json({ error: { codigo: 'no_encontrado', mensaje: 'El documento no existe o expiró.' } });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificado-${token}.pdf"`);
    res.status(200).send(pdf);
  });

  return router;
}
