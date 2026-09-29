---
name: git-conventions-proteccion
description: 'Convenciones de rama y commit de CerberusHooks v2 (Protección/Pragma) más el paso a paso completo para generarlos: detectar el ticket, preparar la rama, clasificar y agrupar archivos por tipo/scope, armar el mensaje dentro del límite de 50 caracteres, ejecutar el commit según el sistema operativo (Mac/Linux/Windows+WSL), y qué hacer si Cerberus bloquea. Úsalo siempre que se vaya a crear una rama o hacer `git commit`/`git push` en un microservicio del equipo, o cuando el usuario pida "haz el commit", "genera el commit", "crea commits de estos cambios", o equivalentes.'
---

# Git Conventions (CerberusHooks v2)

CerberusHooks v2 (`~/.cerberus`, instalado vía `core.hooksPath` global — aplica a **todos** los repos de la máquina) valida rama y mensaje de commit al vuelo. Fuente de verdad: `~/.cerberus/cerberus.config.yaml` → `checks.*`, campos `_pinned: true` — no se guían por variables de entorno ni por repo. Este skill existe para construir rama y mensaje **bien a la primera**, no para reimplementar esa validación.

Ticket = HU o Incidente

## No negociables

1. **Ticket obligatorio, nunca inventado.** Sale de la rama actual o de confirmación explícita del usuario.
2. **Scope = área de código modificada**.
3. **Nunca mezclar tipos distintos en un mismo commit.** El scope, en cambio, se agrupa con sentido común (ver sección 3.2) — no es un par (tipo, scope) = un commit automático.
4. **`git add` explícito, archivo por archivo** — nunca `git add .` ni `git add -A`.
5. **`--no-verify` nunca** se ejecuta ni se sugiere, bajo ninguna circunstancia — ni cuando falta el ticket ni cuando el hook bloquea por otro motivo.
6. **`git push` nunca automático** — solo si el usuario lo pide explícito en ese mismo turno.
7. **Nunca reescribir historia** (`--amend`, `rebase`) salvo pedido explícito.
8. **Nunca resolver conflictos de merge automáticamente** (`git pull`, etc.) — parar y pedir ayuda a la persona.
9. **Nunca intentar un commit sin `GITLAB_TOKEN` (o `GITLAB_PRIVATE_TOKEN`/`GITLAB_ACCESS_TOKEN`) en el entorno** — Cerberus ya no valida ni genera reporte sin ese token; avisá antes en vez de dejar que el hook bloquee sin contexto.

## 1 — Preparar la rama de trabajo

1. `git checkout develop`
2. `git pull origin develop` — obligatorio siempre. **Si hay conflictos, PARA y pedí ayuda** (no negociable 8).
   Ramas protegidas en Cerberus (nunca comitear/pushear directo ahí): `main`, `master`, `develop`, `development`, `certification`, `qa`, `ciberseguridad`.
3. Definí un `<tipo>` tentativo para el nombre (se puede corregir después si el diagnóstico revela otra naturaleza; renombrar con `git branch -m` antes de comitear).
4. Mostrá el nombre propuesto y esperá confirmación explícita.
5. `git checkout -b <nombre>`

### Formato del nombre de rama

```
<tipo>/<descripcion-corta-en-kebab-case>
```

- `<tipo>` (solo estos 4 prefijos — **vocabulario distinto al de commit**: `feature` completo, no `feat`; `refactor` no es prefijo de rama válido):
  - `feature` — funcionalidad/control nuevo que no existía.
  - `fix` — corrección de bug o falla de seguridad.
  - `chore` — mantenimiento sin impacto en lógica.
  - `INC` — asociado a un incidente en vez de una HU.
  - Para lo que a nivel de commit sería `refactor`/`test`/`docs`, usá el prefijo de rama más cercano de la lista (ej. reestructuración que corrige un hallazgo → `fix`).
- `<descripcion-corta-en-kebab-case>`: resumen breve del cambio, en minúsculas, espacios → `-`, sin caracteres especiales. **Nunca lleva el ticket ni ningún código de vulnerabilidad** — eso va únicamente en el mensaje de commit (sección 4).

Ejemplos:

```
fix/corrige-validacion-token
feature/agrega-guard-de-rutas
chore/actualiza-dependencias-gradle
```

## 2 — Detectar el ticket

**Nunca asumas ni inventes el número de HU/INC.** Bajo el formato de rama de este skill (sección 1) el ticket **no** vive en el nombre de la rama.

1. Si la rama es **anterior** a este skill o la creó otra herramienta y por eso trae un patrón reconocible (`HU-63`, `INC-1029`), podés ofrecerlo como referencia y confirmarlo **una sola vez al principio de la sesión**, no en cada commit:
   > "Detecté `HU-63` en el nombre de la rama — ¿la uso para estos commits?"
2. En cualquier otro caso (lo esperable bajo este skill) — **no busques alternativas ni default a ningún ticket** — preguntá directo, sin sugerir un número:
   > "¿A qué HU o INC pertenece este cambio?"

Si el usuario insiste en que no aplica ninguno, explicá que el hook `commit-msg` va a rechazar el commit igual, y esperá un ticket real. No ofrezcas `--no-verify` como salida.

## 3 — Clasificar y agrupar los archivos antes del `git add`

```bash
git status --short
git diff HEAD -- .
git diff --staged
```

### 3.1 — Tipo de cada archivo (heurísticas en orden de prioridad)

Basate en la extensión/ruta del archivo y en sentido común sobre el contenido del diff — no asumas un stack específico (Java, Node, .NET, Python, Go, lo que sea, todos aplican):

| #   | Heurística                                                                                                                                                                                                  | Tipo final |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | Archivo de test: carpeta `test/`, `tests/`, `spec/`, `__tests__/`, o nombre `*Test.*`, `*Tests.*`, `*.spec.*`, `*_test.*`, `test_*.py`                                                                      | `test`     |
| 2   | Manifiesto de build/dependencias: `pom.xml`, `build.gradle*`, `package.json`, `package-lock.json`, `yarn.lock`, `*.csproj`, `*.sln`, `requirements.txt`, `pyproject.toml`, `go.mod`, `go.sum`, `Cargo.toml` | `chore`    |
| 3   | Config de CI/CD: `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`, `azure-pipelines.yml`                                                                                                               | `chore`    |
| 4   | Solo documentación: `*.md`, `CHANGELOG*`, comentarios/docstrings sin cambio de código                                                                                                                       | `docs`     |
| 5   | Solo estilos/markup sin lógica: `*.css`, `*.scss`, `*.less`, `*.html` cuando no agrega funcionalidad                                                                                                        | `chore`    |
| 6   | Agrega lógica de negocio nueva (métodos/clases/endpoints/componentes nuevos)                                                                                                                                | `feat`     |
| 7   | Corrige una condición, un bug evidente, o el usuario mencionó "error"/"bug"/"falla"                                                                                                                         | `fix`      |
| 8   | Reordena/limpia sin cambiar comportamiento externo                                                                                                                                                          | `refactor` |
| 9   | Toca configuración de performance (timeouts, caching, batch, índices, paralelismo) como mejora sin bug reportado                                                                                            | `refactor` |
| 9b  | Igual que 9, pero corrige una degradación ya reportada                                                                                                                                                      | `fix`      |
| 10  | No calza en nada de lo anterior (imports, formateo, renombrado menor, archivos generados)                                                                                                                   | `chore`    |
| 11  | El usuario indica explícitamente incidencia en producción                                                                                                                                                   | `INC`      |

Si hay duda real entre dos tipos, preguntá al usuario en vez de adivinar. El tipo final de cada fila ya está acotado a los únicos 7 tipos que confirma `checks.commit_msg.allowed_types` en `cerberus.config.yaml` (sección 4) — CerberusHooks **no acepta** `perf`, `style`, `build` ni `ci`.

### 3.2 — Scope de cada grupo

El scope es el módulo/área que ese grupo de archivos afecta (nunca la persona que commitea, nunca el ticket). Inferilo del nombre del paquete/carpeta padre significativo (`auth`, `datasource`, `router`, `config`) o del dominio funcional evidente en el diff.

- Agrupá primero por tipo (3.1) — **eso es innegociable** (ver no negociable 3).
- Dentro de un mismo tipo, subagrupar por scope es **sentido común, no un mecanismo automático**: el objetivo es un número de commits equilibrado, ni todo mezclado en uno solo ni fragmentado en commits casi idénticos que solo cambian el nombre de una carpeta.
  - **Separá** cuando los archivos de un mismo tipo pertenecen a cambios genuinamente independientes entre sí (features distintas, módulos sin relación) — eso sí se beneficia de revisarse por separado.
  - **No separes** solo porque el mismo cambio cohesivo toca varias capas de la arquitectura — ej. una feature en arquitectura hexagonal que modifica `domain`, `application` e `infrastructure` a la vez es **un solo commit**, con un scope que represente la feature/módulo completo (`login`, `auth`), no el nombre de cada capa. Tres commits `feat(domain)`/`feat(application)`/`feat(infrastructure)` con la misma descripción es fragmentación artificial, no separación real.
- Si tenés duda real sobre si separar o no, o qué nombre de scope usar, preguntale al usuario — mismo criterio que con el ticket.

El resultado son los grupos exactos que se van a stagear con `git add`, uno por commit.

## 4 — Armar el mensaje de commit

```
<tipo>(<scope>): <descripción> [<TICKET>]
```

Una sola línea. El límite de **50 caracteres** (`max_length: 50`) aplica **solo a la `<descripción>`** — tipo, scope y `[TICKET]` ya no restan espacio del presupuesto.

### Tipos válidos (verificados contra `checks.commit_msg.allowed_types` en `cerberus.config.yaml`)

| Tipo       | Uso                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------- |
| `feat`     | nueva funcionalidad                                                                               |
| `fix`      | corrección de errores (incluye bumps de dependencia que corrigen un CVE — nunca `build`)          |
| `refactor` | refactor sin cambio de comportamiento externo                                                     |
| `test`     | agregar o modificar tests                                                                         |
| `docs`     | solo documentación                                                                                |
| `chore`    | mantenimiento: build/deps, CI/CD, estilos, limpieza (ej. borrar certs vencidos, `Dockerfile.old`) |
| `INC`      | incidencia en producción, en vez de HU                                                            |

### Scope y ticket

- `<scope>`: sustantivo que describe el área (`security`, `certs`, `docker`, `deps`, `auth`...). Cualquiera que tenga sentido.
- `[<TICKET>]`: formato exacto `[HU-NNN]` o `[INC-NNN]`, número tal cual, con guion. Obligatorio siempre (ver sección 2).

### Descripción

- Español por defecto — a menos de que se indique lo contrario.
- Si el mensaje completo supera 50, acortá **solo la descripción** — nunca el tipo, el scope ni el ticket.

### Presupuesto de caracteres

**Contá siempre la descripción, carácter por carácter, antes de proponerla** — es lo único que cuenta contra el límite de 50:

```bash
DESC="update fast-uri to 3.1.5"; printf '%s → %s caracteres\n' "$DESC" "${#DESC}"
```

Mostrale ese número a la persona junto con el mensaje completo.

## 5 — Armar el plan y confirmar

Para cada grupo de la sección 3, armá el mensaje (sección 4) con su conteo de caracteres. Mostrale a la persona el plan completo: archivos de cada grupo + mensaje + conteo.

**ESPERA aprobación explícita antes de ejecutar cualquier `git commit`.**

## 6 — SOLO LEER PARA WINDOWS/LINUX

En Windows, Cerberus **solo** funciona invocado desde WSL (los hooks son scripts bash en `~/.cerberus/hooks/*`, no corren nativos en cmd/PowerShell).

```bash
UNAME=$(uname -s 2>/dev/null || echo "SIN_UNAME")
```

- **`Linux`** con `$WSL_DISTRO_NAME` o `/proc/version` conteniendo `microsoft` → ya estás dentro de WSL. Comandos tal cual, sin envolver nada.
- **Cualquier otro caso** (sin `uname`, o `MINGW*`/`MSYS*`/`CYGWIN*`) → Windows nativo, fuera de WSL. Los hooks no van a correr ahí; invocá vía WSL:

  ```bash
  wsl git -C "$(wslpath -a "$(pwd)")" commit -m "mensaje"
  # o, ya parado en la ruta WSL del repo:
  wsl bash -lc "cd '<ruta-wsl-del-repo>' && git commit -m 'mensaje'"
  ```

  No asumas cuál forma aplica sin confirmarla; si no sabés la ruta WSL o la distro, preguntá antes de intentar el commit.

  > Esta rama de la lógica (Windows+WSL) no fue validada en una máquina real — está basada en comportamiento documentado, no en una prueba directa. Si falla al primer uso, ajustala con la evidencia real del error.

Comando real de staging + commit, una vez resuelto el entorno:

```bash
git add <archivo1> <archivo2> ...
git commit -m "<tipo>(<scope>): <descripción> [<TICKET>]"
```

## 7 — Si Cerberus bloquea

1. Mostrá el error exacto. La consola solo dice _cuántos_ hallazgos hay; el detalle está en el reporte HTML (solo se genera si hay errores o advertencias — un commit limpio no genera HTML):

   ```bash
   grep -o 'msg-text">[^<]*' ~/.cerberus/reports/last_commit_error.html | sed 's/msg-text">//'
   # push bloqueado: last_push_error.html
   # log de observabilidad de la corrida: ~/.cerberus/logs/cerberus.log
   ```

   Cerberus ahora pregunta si querés abrir el reporte en el navegador (timeout 30s) y, si hay errores, si cancelar o forzar (timeout 2 min) — sin respuesta, asume siempre la opción segura (no abre, no fuerza). En una sesión no interactiva no esperes esa respuesta: leé el HTML/log directo con los comandos de arriba.

2. Corregí según este skill y reintentá. Si el propio error de Cerberus lista tipos/límite distintos a los de acá, **ese mensaje manda** (la config puede cambiar).
3. Nunca `--no-verify` ni equivalentes.
4. **Si bloquea por contenido preexistente NO relacionado con el cambio actual** (ej. higiene de `package.json` que arreglar sería scope creep): no es un rechazo de formato, así que no aplica "corregir y reintentar". El escape es `git cforce commit -m "..."` (sigue validando mensaje/secretos, deja trazabilidad para revisión de reviewer) — **solo con aprobación explícita**, mostrando los hallazgos que se están forzando.

**Si Cerberus no está instalado, está incompleto, o su hook falla al ejecutarse** (error del hook en sí, no rechazo de formato): exponé el problema y preguntá si la persona se detiene a repararlo (repo `cerberus-hooks-validator`, `./check.sh`) o continúa sin él. Si elige continuar: registralo donde corresponda, y asumí vos la validación manual del formato de rama/mensaje (incluido el conteo de caracteres) antes de cada comando git.

## 8 — Reportar el resultado

```
Commits creados:
  1. <hash-corto> feat(usuario): agrega campo consulta [HU-63]
  2. <hash-corto> test(usuario): agrega tests campo consulta [HU-63]
  3. <hash-corto> fix(auth): corrige validacion de token [HU-63]

Próximos pasos:
  - Revisa con `git log --oneline -n <N>`
  - git push (cuando estés listo)
```

Si un commit falla (hook u otro motivo), reportá el error completo y **detenete** — no sigas con los commits restantes hasta resolverlo.
