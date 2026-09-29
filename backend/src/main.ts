import { createApp } from './interfaces/http/createApp.js';
import { crearSesionesRouter } from './interfaces/http/sesiones-router.js';
import { crearDescargasRouter } from './interfaces/http/descargas-router.js';
import { Orquestador } from './application/orquestador/orquestador.js';
import { GenerarCertificado } from './application/certificados/generar-certificado.js';
import { ResponderFaq } from './application/faq/responder-faq.js';
import { OllamaLlmAdapter } from './infrastructure/llm/ollama-adapter.js';
import { InMemorySessionStore } from './infrastructure/persistencia/session-store-memoria.js';
import { JsonAfiliadoRepository } from './infrastructure/persistencia/afiliado-repository-json.js';
import { JsonFaqRepository } from './infrastructure/persistencia/faq-repository-json.js';
import { ConsoleLoggerSeguro } from './infrastructure/logging/logger-seguro.js';
import { crearMiddlewareAcceso } from './interfaces/http/middleware-acceso.js';
import { PdfKitCertificadoAdapter } from './infrastructure/pdf/pdfkit-certificado-adapter.js';
import { InMemoryDescargaStore } from './infrastructure/pdf/descarga-store-memoria.js';

const PORT = Number(process.env.PORT ?? 3001);
const RUTA_DATOS = process.env.RUTA_DATOS ?? '../data/datos_ficticios_chatbot.json';
const RUTA_PLANTILLAS = process.env.RUTA_PLANTILLAS ?? '../data/plantillas-certificado.json';
const OTP_VALIDO = process.env.OTP_VALIDO ?? '123456';
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

const llm = new OllamaLlmAdapter({
  baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
  modelo: process.env.OLLAMA_MODEL ?? 'qwen2.5:7b',
});
const logger = new ConsoleLoggerSeguro();
const faqRepo = new JsonFaqRepository(RUTA_DATOS);
const responderFaq = new ResponderFaq(faqRepo);
const orquestador = new Orquestador(llm, responderFaq, logger);
const store = new InMemorySessionStore();
const afiliados = new JsonAfiliadoRepository(RUTA_DATOS);
const pdf = new PdfKitCertificadoAdapter(RUTA_PLANTILLAS);
const descargas = new InMemoryDescargaStore();
const generarCertificado = new GenerarCertificado(afiliados, pdf, descargas);

const sesionesRouter = crearSesionesRouter({
  orquestador,
  store,
  afiliados,
  generarCertificado,
  otpValido: OTP_VALIDO,
  ttlMinutos: Number(process.env.SESSION_TTL_MINUTES ?? 15),
  maxIntentosOtp: Number(process.env.OTP_MAX_ATTEMPTS ?? 3),
  baseUrlDescarga: BASE_URL,
});

const ACCESS_KEY = process.env.PROTOTYPE_ACCESS_KEY ?? 'clave-de-prueba-local';

const app = createApp({
  sesiones: sesionesRouter,
  descargas: crearDescargasRouter(descargas),
  middlewareAcceso: crearMiddlewareAcceso(ACCESS_KEY),
});

app.listen(PORT, () => {
  console.log(`[certbot-backend] escuchando en http://localhost:${PORT}`);
});
