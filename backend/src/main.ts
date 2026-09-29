import { createApp } from './interfaces/http/createApp.js';
import { crearSesionesRouter } from './interfaces/http/sesiones-router.js';
import { Orquestador } from './application/orquestador/orquestador.js';
import { OllamaLlmAdapter } from './infrastructure/llm/ollama-adapter.js';
import { InMemorySessionStore } from './infrastructure/persistencia/session-store-memoria.js';
import { JsonAfiliadoRepository } from './infrastructure/persistencia/afiliado-repository-json.js';

const PORT = Number(process.env.PORT ?? 3001);
const RUTA_DATOS = process.env.RUTA_DATOS ?? '../data/datos_ficticios_chatbot.json';
const OTP_VALIDO = process.env.OTP_VALIDO ?? '123456';

const llm = new OllamaLlmAdapter({
  baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
  modelo: process.env.OLLAMA_MODEL ?? 'qwen2.5:7b',
});
const orquestador = new Orquestador(llm);
const store = new InMemorySessionStore();
const afiliados = new JsonAfiliadoRepository(RUTA_DATOS);

const sesionesRouter = crearSesionesRouter({
  orquestador,
  store,
  afiliados,
  otpValido: OTP_VALIDO,
  ttlMinutos: Number(process.env.SESSION_TTL_MINUTES ?? 15),
  maxIntentosOtp: Number(process.env.OTP_MAX_ATTEMPTS ?? 3),
});

const app = createApp(sesionesRouter);

app.listen(PORT, () => {
  console.log(`[certbot-backend] escuchando en http://localhost:${PORT}`);
});
