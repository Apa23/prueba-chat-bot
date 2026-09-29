import { createApp } from './interfaces/http/createApp.js';

/**
 * Composition root: aquí se ensambla la aplicación.
 * En fases posteriores, este archivo instanciará los adaptadores concretos
 * (Ollama, repositorio JSON, generador de PDF, store de sesión) y los inyectará
 * en los casos de uso. Es el único lugar que conoce todas las capas (DIP).
 */
const PORT = Number(process.env.PORT ?? 3001);

const app = createApp();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[certbot-backend] escuchando en http://localhost:${PORT}`);
});
