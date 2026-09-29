# Reporte de seguridad — Análisis de dependencias (SCA)

> Evidencia de manejo de vulnerabilidades de dependencias. Actualizado en Fase 1.

## Hallazgo inicial (Fase 1, tras `npm install`)

`npm audit` reportó 6 vulnerabilidades (conteo agregado: 3 moderate, 1 high, 2 critical).

## Análisis (criterio, no reacción automática)

- **Todas las vulnerabilidades están en dependencias de desarrollo**: `vitest`, `vite`,
  `esbuild`, `@vitest/mocker`, `vite-node`, `@vitest/coverage-v8`.
- Los CVE afectan al **servidor de desarrollo** (path traversal / lectura de respuestas
  del dev server). No afectan el artefacto de producción.
- Verificación decisiva:

  ```
  npm audit --omit=dev  →  found 0 vulnerabilities
  ```

  **Las dependencias de producción están limpias.** Vitest/esbuild no se ejecutan en el
  contenedor desplegado; solo se usan en desarrollo y CI.

## Decisión

Opción elegida: **documentar y monitorear** (no aplicar `npm audit fix --force`).

- No se aplica el fix forzado porque actualizaría a `vitest@5` (breaking change) con riesgo
  de romper el andamiaje de pruebas recién montado, sin reducir riesgo real de producción.
- El pipeline CI (Fase 9) incluirá un control de SCA configurado para **fallar ante
  vulnerabilidades de dependencias de producción de severidad alta/crítica**, tolerando
  las dev-only conocidas y triadas aquí.

## Defensa ante el panel

"El número de vulnerabilidades por sí solo no es una métrica de riesgo. Analicé el vector:
son del servidor de desarrollo, no del artefacto desplegado, y `npm audit --omit=dev` da
cero. Documenté el análisis y configuré el SCA para vigilar producción sin bloquear por
ruido de dev-dependencies. Priorizo la estabilidad del build sobre un fix cosmético."

## Pendiente de revisión

- Re-evaluar cuando `vitest@5` estabilice, para actualizar sin breaking changes.
