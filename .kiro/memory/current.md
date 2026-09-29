# current.md — Estado actual del proyecto

> Instantánea de dónde estamos. Se actualiza a medida que avanza el trabajo.
> A diferencia de definition.md (decisiones estables), este archivo cambia seguido.

## Última actualización
Lunes 28 de septiembre — sesión de arranque (noche de trabajo).

## Fase actual
**Fase 1 COMPLETADA y commiteada. Lista para Fase 2 (dominio y herramientas).**
Historial: 9 commits. Nota: 3 commits iniciales (20d49cf, 1cf7bbe, 87944fc) quedaron con
formato viejo por el intento forzado; el candidato decidió dejarlos (no reescribir historia).

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
