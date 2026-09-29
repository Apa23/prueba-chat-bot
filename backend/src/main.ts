import { createApp } from './interfaces/http/createApp.js';

// Composition root: único lugar que ensambla adaptadores concretos e inyecta dependencias (DIP).
const PORT = Number(process.env.PORT ?? 3001);

const app = createApp();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[certbot-backend] escuchando en http://localhost:${PORT}`);
});
