# Prototipo de chatbot con IA para generación de certificados

> **Prototipo de evaluación – no oficial.** Construido para la prueba técnica de Ingeniero
> de Soluciones TI (Opción B). Usa exclusivamente datos ficticios. No representa un canal
> oficial ni usa marca de ninguna entidad.

Asistente conversacional que atiende solicitudes de certificados de afiliados ficticios de
un fondo de pensiones y cesantías, y genera el documento en PDF. El modelo de lenguaje
entiende la conversación, pero **no accede a los datos directamente**: lo hace a través de
herramientas controladas por el orquestador, con validación de identidad y autorización por sesión.

## Arquitectura resumida

- **Backend (BFF)**: Node.js + TypeScript, arquitectura hexagonal (puertos y adaptadores).
  Única puerta entre el navegador y los servicios internos (LLM, datos, PDF).
  - `domain` — entidades y reglas de negocio puras.
  - `application` — casos de uso, orquestador conversacional y puertos.
  - `infrastructure` — adaptadores (Ollama, repositorio JSON, PDF, sesión en memoria).
  - `interfaces` — API HTTP y registro de herramientas (tools).
- **Frontend**: React + Vite (chat web).
- **LLM**: modelo local vía Ollama (`qwen2.5:7b`). Sin costo, sin dependencia de nube.
- **Persistencia**: en memoria (sesión conversacional). Los datos de afiliados se leen del
  archivo de datos ficticios; no hay base de datos por decisión de alcance (ver ADR).

Diagramas C4 (niveles 1 y 2) y ADR en `.kiro/reports/`.

## Requisitos previos

- Node.js >= 22
- [Ollama](https://ollama.com) corriendo en el host con el modelo descargado:
  ```bash
  ollama pull qwen2.5:7b
  ```
- Docker + Docker Compose (para la ejecución con un solo comando)

## Cómo ejecutar localmente (desarrollo)

```bash
# 1. Instalar dependencias (workspaces del monorepo)
npm install

# 2. Copiar variables de entorno
cp .env.example .env   # ajustar PROTOTYPE_ACCESS_KEY

# 3. Backend (en una terminal)
npm run dev:backend

# 4. Frontend (en otra terminal)
npm run dev:frontend
```

- Backend: http://localhost:3001 (health check en `/health`)
- Frontend: http://localhost:5173

## Cómo ejecutar con Docker (un solo comando)

```bash
docker compose up
```

> Ollama corre en el host (no en contenedor) por aceleración de GPU en Apple Silicon; los
> contenedores lo alcanzan vía `host.docker.internal`. Detalle en `docker-compose.yml`.

## Cómo ejecutar las pruebas

```bash
npm test                              # pruebas del backend
npm run test:coverage --workspace backend   # con reporte de cobertura
```

## Estado del proyecto

En construcción (prueba técnica). El avance por fases y las decisiones se documentan en
`.kiro/memory/` y `.kiro/reports/`.

## Notas de seguridad

- Ningún secreto se versiona: `.env` está en `.gitignore`; usar `.env.example` como plantilla.
- El acceso al prototipo se protege con `PROTOTYPE_ACCESS_KEY` (se comparte solo con el panel).
- Datos 100% ficticios (`data/datos_ficticios_chatbot.json`).
