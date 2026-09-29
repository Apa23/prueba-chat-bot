import { readFileSync } from 'node:fs';
import PDFDocument from 'pdfkit';
import type { CertificadoPdfPort } from '../../application/puertos/certificado-pdf.js';
import type { CertificadoEmitido } from '../../domain/certificado-emitido.js';

interface CampoPlantilla {
  etiqueta: string;
  origen: string;
}

interface Plantillas {
  marcaAgua: string;
  rotuloPrototipo: string;
  plantillas: Record<string, { titulo: string; campos: CampoPlantilla[] }>;
}

/**
 * Genera el PDF del certificado con PDFKit. Lee las definiciones de contenido de
 * data/plantillas-certificado.json (textos y campos ajustables sin tocar código) y estampa
 * la marca de agua "SIN VALIDEZ", el rótulo de prototipo y el código de verificación,
 * cumpliendo la restricción 5.6 (no confundir con un canal oficial).
 */
export class PdfKitCertificadoAdapter implements CertificadoPdfPort {
  private readonly plantillas: Plantillas;

  constructor(rutaPlantillas: string) {
    this.plantillas = JSON.parse(readFileSync(rutaPlantillas, 'utf-8')) as Plantillas;
  }

  async generar(certificado: CertificadoEmitido): Promise<Buffer> {
    const definicion = this.plantillas.plantillas[certificado.codigo];
    if (!definicion) {
      throw new Error(`Plantilla no encontrada para ${certificado.codigo}`);
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));

    const finalizado = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    this.pintarRotulo(doc);
    this.pintarMarcaAgua(doc);
    this.pintarTitulo(doc, definicion.titulo);
    this.pintarCampos(doc, definicion.campos, certificado.campos);
    this.pintarVerificacion(doc, certificado.codigoVerificacion);

    doc.end();
    return finalizado;
  }

  private pintarRotulo(doc: PDFKit.PDFDocument): void {
    doc.fontSize(9).fillColor('#b00').text(this.plantillas.rotuloPrototipo, { align: 'right' });
    doc.fillColor('black');
  }

  private pintarMarcaAgua(doc: PDFKit.PDFDocument): void {
    doc.save();
    doc.rotate(-45, { origin: [300, 400] });
    doc.fontSize(40).fillColor('#cccccc').text(this.plantillas.marcaAgua, 60, 400, { width: 500, align: 'center' });
    doc.restore();
    doc.fillColor('black');
  }

  private pintarTitulo(doc: PDFKit.PDFDocument, titulo: string): void {
    doc.moveDown(2).fontSize(18).text(titulo, { align: 'center' }).moveDown(1);
  }

  private pintarCampos(doc: PDFKit.PDFDocument, campos: CampoPlantilla[], valores: Readonly<Record<string, string>>): void {
    doc.fontSize(12);
    for (const campo of campos) {
      const valor = valores[campo.origen] ?? 'No disponible';
      doc.font('Helvetica-Bold').text(`${campo.etiqueta}: `, { continued: true });
      doc.font('Helvetica').text(valor);
      doc.moveDown(0.3);
    }
  }

  private pintarVerificacion(doc: PDFKit.PDFDocument, codigo: string): void {
    doc.moveDown(2).fontSize(10).fillColor('#555')
      .text(`Código de verificación: ${codigo}`, { align: 'left' });
    doc.fillColor('black');
  }
}
