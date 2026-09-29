import type { Request, Response, NextFunction } from 'express';

/**
 * Protege el acceso al prototipo con una clave compartida solo con el panel evaluador
 * (restricción 5.6). La clave se envía en el header X-Access-Key y se compara con la
 * configurada por entorno. Evita que un prototipo público se confunda con un canal oficial.
 */
export function crearMiddlewareAcceso(claveEsperada: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const claveRecibida = req.header('X-Access-Key');
    if (claveRecibida !== claveEsperada) {
      res.status(401).json({ error: { codigo: 'acceso_no_autorizado', mensaje: 'Clave de acceso inválida.' } });
      return;
    }
    next();
  };
}
