# Prototipo de chatbot con IA para generación de certificados

> **Prototipo de evaluación – no oficial.** Prueba técnica de Ingeniero de Soluciones TI (Opción B).
> Usa exclusivamente datos ficticios. No representa un canal oficial ni usa marca de ninguna entidad.

Asistente conversacional que atiende solicitudes de certificados de afiliados ficticios de un fondo de
pensiones y cesantías, y genera el documento en PDF. El modelo de lenguaje entiende la conversación,
pero **no accede a los datos directamente**: lo hace a través de herramientas controladas por el
orquestador, con validación de identidad y autorización por sesión.

## Arquitectura resumida

- **Backend (BFF):** Node.js + TypeScript, arquitectura hexagonal (domain / application /
  infrastructure / interfaces). Única puerta entre el navegador y los servicios internos.
- **Frontend:** React + Vite (chat web, atomic design), acceso protegido con clave.
- **LLM:** modelo local vía Ollama (`qwen2.5:7b`). Orquestación determinista (el LLM interpreta y
  redacta; el código decide).
- **Persistencia:** en memoria (sesión). Datos de afiliados y FAQs desde JSON (sin base de datos).

Documento de solución, diagramas C4, ADR y reportes en `docs/` y `.kiro/reports/`.

## Funcionalidades

Conversación en lenguaje natural · validación de identidad (documento + OTP) · consentimiento de datos
· generación de certificados en PDF (marca de agua + código de verificación) · FAQs con grounding y
cita de fuente · escalamiento a asesor · seguridad de LLM (anti prompt-injection, aislamiento entre
afiliados, enmascaramiento de PII).

## Requisitos previos

- Node.js >= 22
- [Ollama](https://ollama.com) corriendo en el host con el modelo:
  ```bash
  ollama pull qwen2.5:7b
  ```
- Docker + Docker Compose (para ejecución con un solo comando)

## Configuración

```bash
cp .env.example .env    # ajustar PROTOTYPE_ACCESS_KEY (clave del prototipo)
npm install             # workspaces del monorepo
```

## Ejecución local (desarrollo)

```bash
npm run dev:backend     # http://localhost:3001 (health en /health)
npm run dev:frontend    # http://localhost:5173
```

Ingresa la clave definida en `PROTOTYPE_ACCESS_KEY` en la pantalla de acceso.
OTP válido para todos los afiliados de prueba: `123456`. Documentos: `PRUEBA-0001` a `PRUEBA-0005`.

## Ejecución con Docker (un solo comando)

```bash
docker compose up
```

> Ollama corre en el host (aceleración de GPU en Apple Silicon); los contenedores lo alcanzan vía
> `host.docker.internal`. Detalle en `docker-compose.yml`.

## Pruebas

```bash
npm test                                      # pruebas del backend (103)
npm run test:coverage --workspace backend     # con cobertura (~96% de la lógica)
npx tsx backend/scripts/casos-prueba.ts        # los 12 casos del anexo B.3 (requiere backend + Ollama)
```

## Estructura del proyecto

```
backend/    BFF hexagonal (domain, application, infrastructure, interfaces) + tests
frontend/   React + Vite (atomic design)
data/       datos ficticios y plantillas de certificado
docs/        documento de solución, declaración de uso de IA
.kiro/       memoria de decisiones y reportes (ADR, C4, seguridad, casos de prueba, sustentación)
```

## Seguridad

- Ningún secreto se versiona: `.env` está en `.gitignore`; usar `.env.example` como plantilla.
- Acceso al prototipo protegido con `PROTOTYPE_ACCESS_KEY` (se comparte solo con el panel).
- Datos 100% ficticios. Mapeo OWASP Top 10 LLM en `.kiro/reports/seguridad-owasp-llm.md`.

## Notas

- Prototipo de evaluación: eliminar el despliegue al terminar el proceso de selección.
- Resultados de los 12 casos de prueba: `.kiro/reports/test-cases-results.md`.
