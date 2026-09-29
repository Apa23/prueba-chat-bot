# current.md — Estado actual del proyecto

> Instantánea de dónde estamos. Se actualiza a medida que avanza el trabajo.
> A diferencia de definition.md (decisiones estables), este archivo cambia seguido.

## Última actualización
Lunes 28 de septiembre — sesión de arranque (noche de trabajo).

## Fase actual
**Fase 5 COMPLETADA — grounding/FAQ. Casos 6 y 7 verificados con Ollama real. Siguiente: Fase 6 (seguridad LLM).**

## Fase 5 — resumen
- Grounding por búsqueda léxica con umbral (0.5), NO vector DB (ADR-002: proporcional a 8 FAQs).
- buscarFaqRelevante (función pura): normaliza acentos/mayúsculas/stopwords, puntúa por coincidencia
  de términos, devuelve la mejor solo si supera umbral; si no → fuera de alcance.
- FaqRepositoryPort + JsonFaqRepository (lee las 8 FAQ). ResponderFaq usa buscar_faq como herramienta
  PÚBLICA (requiereAutorizacion:false) en el registro. La fuente se toma del dato, no del LLM.
- estaDentroDeAlcance ahora se usa con semántica real (tieneGrounding), no hardcodeado.
- Orquestador: rama pregunta_frecuente responde con fuente si hay grounding, escala si no (casos 6, 7).
- 80 tests, cobertura 95.57%. Verificado en vivo: caso 6 (responde+cita fuente), caso 7 (escala).
- ADR-002 creado (grounding léxico sin vector DB).

## Fase 4 — resumen
- PDFKit (liviano, sin Chromium). Plantillas de contenido externalizadas a data/plantillas-certificado.json.
- PDF con rótulo de prototipo, marca de agua "SIN VALIDEZ" y código de verificación (hash corto = token).
- CertificadoPdfPort + PdfKitCertificadoAdapter; DescargaStorePort + InMemoryDescargaStore.
- armarCertificado (application): resuelve campos por producto, maneja caso 3 (anio_sin_datos, no inventa)
  y producto_no_disponible. Formatea pesos COP.
- GenerarCertificado usa el RegistroHerramientas con requiereAutorizacion:true → CIERRA el círculo de
  seguridad: el PDF solo se emite si puedeAccederA valida la sesión para ese afiliado.
- Endpoints: POST /sesiones/:id/mensajes genera al llegar a 'ejecutando'; GET /descargas/:token sirve el PDF.
- 72 tests, cobertura 95.85%. Verificado en vivo: conversación→identidad→PDF→descarga con Ollama real.
- Muestra de PDF en .kiro/reports/muestras/certificado-muestra.pdf (evidencia para demo).
- Decisión consciente: código de verificación = token de descarga (simplicidad prototipo). En prod
  serían distintos (token de un solo uso/expiración; código público que solo confirma autenticidad).

## Fase 3 — resumen
- Orquestador determinista (máquina de estados) con estado terminal de fallo técnico. LLM solo
  clasifica intención (JSON validado con Zod) y redacta; las decisiones las toma el código.
- LlmPort (puerto) + OllamaLlmAdapter (format:json + doble validación, degrada a 'desconocida')
  + LlmMock (doble determinista para desarrollo incremental).
- Puertos: AfiliadoRepositoryPort, SessionStorePort. Implementaciones: JsonAfiliadoRepository
  (mapea snake_case→camelCase), InMemorySessionStore.
- Endpoints REST separados por responsabilidad (SRP): POST /sesiones, POST /sesiones/:id/mensajes,
  POST /sesiones/:id/identidad. Errores consistentes con códigos HTTP. Bloqueo OTP (429), expiración (410).
- 61 tests (incluye integración HTTP con supertest), cobertura 98.61%. Verificado en vivo con Ollama.
- Latencia LLM medida: cold start ~7s, caliente 0.6-1.5s (en sustentacion.md).
- Aprendizaje: el build real (tsc) atrapó errores de tipos que tsx toleraba (req.params en Express 5).

## Fase 2 — resumen
- Dominio puro (español, inmutable): afiliado, certificado, sesion, identidad, faq,
  certificados-disponibles. Reglas: puedeAccederA, validarIdentidad, datosFaltantesPara,
  estaDentroDeAlcance, certificadosDisponiblesPara.
- Contrato de herramientas (application): Herramienta<E,S> con schema Zod + flag de autorización;
  RegistroHerramientas como punto único de ejecución con 3 controles (existencia, forma Zod,
  autorización vía puedeAccederA). Clase instanciable, inyectada desde composition root.
- Decisión de diseño: se descartó Singleton para la autorización (función pura sin estado);
  se usa inyección desde composition root (mejor testabilidad, sin estado global).
- 32 pruebas, todas verificando comportamiento. Tests trazados a casos B.3 (1,2,4,5,6,7,8).
- Parte de las reglas de dominio se delegaron a un sub-agente ("equipo") y se revisaron como analista.
- Fuente de datos: se mantiene una sola copia en data/ (se eliminó docs/), byte-idéntica al original.
- Material de sustentación centralizado en .kiro/reports/sustentacion.md (archivo vivo).

## Fase 1 — resumen (lunes 28, noche)
- Monorepo con npm workspaces: backend/ (Express+TS hexagonal, BFF), frontend/ (React+Vite).
- Estructura hexagonal documentada (README por capa) como guion de defensa de arquitectura.
- Health check verificado en vivo (GET /health → 200). Tests 2/2, builds OK.
- Vitest + supertest establecidos (pruebas por comportamiento, no por internos).
- .gitignore protege secretos; .env.example sin valores reales; docker-compose con Ollama en host.
- ADR-001 (hexagonal + BFF) y reporte de seguridad de dependencias creados.
- Node actualizado a 22.23.3 (npm 10.9.9). Git conectado a github.com/Apa23/prueba-chat-bot.
- Análisis SCA: vulnerabilidades son dev-only; `npm audit --omit=dev` = 0. Documentado.
- Stack decisions: Express plano (sin NestJS), atomic design pendiente para fase de frontend.

## Hecho
- [x] Leída y entendida la prueba técnica (Opción B).
- [x] Leído el archivo de datos ficticios.
- [x] Decisiones generales tomadas (ver definition.md D1–D6).
- [x] Estructura .kiro creada (memory, reports).
- [x] AGENT.md con propósito y reglas.
- [x] Verificación de entorno COMPLETA (ver resultados abajo).

## Resultados de la verificación de entorno (lunes 28, noche)
- Hardware: Apple M4, 16 GB RAM, arm64. Sobra para modelo 7B.
- Docker v29.4.3 + Compose v5.1.3, daemon activo.
- Ollama v0.34.4 instalado vía brew services (corriendo).
- Modelo `qwen2.5:7b` (~4.7GB) descargado y responde.
- **Tool calling nativo FUNCIONA:** el modelo detectó intención y llamó
  `consultar_afiliado` con argumento `AF-001` correcto a la primera.
- Ya existe un PostgreSQL (postgres:14) corriendo en el puerto 5433 (entorno del candidato).

## Implicación estratégica del hallazgo
- El tool calling nativo funciona, pero se MANTIENE Camino B (orquestación determinista)
  como núcleo por seguridad. Ahora es una elección demostrable, no una limitación.
- Defensa reforzada: "funciona de las dos formas y elegí la más segura a propósito."
- Tool calling nativo queda como capa opcional para mostrar dominio en la demo.

## Decisiones abiertas para el candidato
- [ ] ¿Persistencia? Los datos de afiliados vienen del JSON (los lee la herramienta).
      Lo que sí hay que persistir: sesión conversacional (identidad, intentos OTP,
      expiración) y métricas. Definir si va en memoria, SQLite, o Postgres propio en compose.
- [ ] Confirmar el plan por fases.

## Siguiente
- [ ] Cerrar el plan por fases.
- [ ] Definir estructura de carpetas del proyecto (arquitectura hexagonal).

## Estado de Git / push
- Rama de trabajo: `feat/backend` (genérica para todo el backend). PUSHEADA a origin.
- Ramas protegidas en Cerberus (no admiten push directo): develop, master, certification, qa, ciberseguridad.
- Flujo: trabajar en feat/backend → push → abrir PR hacia develop en GitHub.
- pre_push de Cerberus valida: commits, SAST, compilación, tests. TODO PASA.
- PR pendiente de abrir: https://github.com/Apa23/prueba-chat-bot/pull/new/feat/backend

## Convención de commits (Cerberus — hook corporativo activo)
Se decidió CONVIVIR con Cerberus (validador corporativo de Protección, instalado global).
Reglas que DEBEN cumplirse en cada commit para pasar sin forzar:
- Formato: `tipo(scope): descripción [HU-XXX]`  — el scope entre paréntesis es OBLIGATORIO.
- Tipos permitidos: feat, fix, refactor, test, docs, INC, chore.
- max_length: 50 caracteres. min_description: 10. Referencia obligatoria prefijo HU o INC.
- Versiones de dependencias EXACTAS (sin ^). package.json debe tener scripts `test` y `start`.
- Requiere GITLAB_TOKEN (está en ~/.zshrc; pasar `source ~/.zshrc` en shells no interactivos).
- El menú interactivo de Cerberus lee de /dev/tty y cuelga shells no interactivos ante
  errores/warnings → asegurar que el commit pase LIMPIO (sin warnings) para no bloquear.
- pre_push exige cobertura >= 80% y compilación+tests en ramas protegidas. Tenerlo presente.
- Convención de referencia por fase: [HU-001] = Fase 1, [HU-002] = Fase 2, etc.

## Bloqueos / riesgos abiertos
- Ninguno crítico. Entorno firme. Convivencia con Cerberus resuelta.
- Nota para Fase 9 (CI): el pipeline propio (GitHub Actions) replicará controles equivalentes
  (SAST/SCA/secretos) ya que Cerberus apunta a infraestructura interna de Protección.

## Notas para la sustentación (se van acumulando aquí)
- Frase clave tool calling: "El LLM propone, la herramienta dispone."
- Argumento de stack: "Elijo lo que domino para poder defenderlo" es criterio válido.
- Argumento de despliegue: "Criterio de ingeniero de soluciones: saber cuándo no construir."
