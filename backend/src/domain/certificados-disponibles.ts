import type { Afiliado } from './afiliado.js';
import { CATALOGO_CERTIFICADOS, type CodigoCertificado } from './certificado.js';

/**
 * Defensa en profundidad (caso de prueba 8): un afiliado solo puede solicitar certificados
 * de productos que realmente posee. Esta regla vive en el dominio, no en el orquestador,
 * para que aunque una capa superior omita validar, las capas inferiores nunca ofrezcan un
 * certificado sin producto que lo respalde.
 */
export function certificadosDisponiblesPara(afiliado: Afiliado): readonly CodigoCertificado[] {
  return (Object.keys(CATALOGO_CERTIFICADOS) as CodigoCertificado[]).filter((codigo) => {
    const producto = CATALOGO_CERTIFICADOS[codigo].producto;
    return afiliado.productos[llaveProducto(producto)] !== undefined;
  });
}

function llaveProducto(
  producto: 'pension_obligatoria' | 'pension_voluntaria' | 'cesantias',
): keyof Afiliado['productos'] {
  switch (producto) {
    case 'pension_obligatoria':
      return 'pensionObligatoria';
    case 'pension_voluntaria':
      return 'pensionVoluntaria';
    case 'cesantias':
      return 'cesantias';
  }
}
