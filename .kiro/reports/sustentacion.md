# Material de sustentación — insumo vivo

> Archivo vivo que acumula lo importante para defender la solución ante el panel (45 min:
> demo, defensa de arquitectura, cambio en vivo, preguntas). Se actualiza en cada fase.
> Última actualización: fin de Fase 2.

## Frases clave (para responder con criterio)

- **Stack:** "Elijo lo que domino para poder defenderlo" — criterio válido bajo restricción de tiempo.
- **Tool calling:** "El LLM propone, la herramienta dispone."
- **Seguridad del LLM:** "La seguridad no depende de que el modelo se porte bien, sino de reglas de dominio verificadas."
- **Despliegue:** "Criterio de ingeniero de soluciones: saber cuándo NO construir."
- **Vulnerabilidades:** "El número de vulnerabilidades no es la métrica de riesgo; el vector sí."
- **Defensa en profundidad:** "No dependo de que la capa superior valide bien; las capas inferiores nunca ofrecen lo que el afiliado no tiene."

## Decisiones de arquitectura y su defensa

### Stack: React + Node.js/TypeScript
- Lo que se domina y se puede defender en vivo. Tipado end-to-end, un solo lenguaje, ecosistema
  maduro de PDF y validación (Zod).
- Tradeoff reconocido: Python tiene SDKs de LLM más maduros. Respuesta: para un prototipo con
  tool calling controlado y modelo local, Node da velocidad y unifica el stack; en producción
  se reconsideraría Python si el equipo lo domina.

### LLM local (Ollama, qwen2.5:7b)
- Cero costo, sin free tier, privacidad y residencia de datos local (relevante para entidad
  vigilada por la Superintendencia Financiera). Sin dependencia de aprobaciones externas.
- Tradeoff: menor calidad que modelos frontera. Se probó que el tool calling nativo funciona,
  pero se controla desde el orquestador por seguridad (ver abajo).

### Tool calling determinista (Camino B)
- El orquestador (código) controla el flujo y la ejecución; el LLM entiende lenguaje natural y
  propone intención, pero NO decide autónomamente acceder a datos.
- Cuatro razones por las que el LLM no toca los datos: (1) evita filtración/modificación,
  (2) evita ejecución no determinista, (3) contiene alucinaciones, (4) auditabilidad y
  autorización: cada acceso es una llamada explícita, loggeable, con verificación de sesión.
- Se probó que el modelo hace tool calling nativo; se eligió controlarlo a propósito. Posición
  fuerte: "funciona de las dos formas y elegí la más segura."

### Arquitectura hexagonal + BFF (ADR-001)
- Cuatro capas: domain / application / infrastructure / interfaces. Dependencias hacia adentro.
- El dominio no conoce Ollama ni Express → cambiar de proveedor de LLM o de fuente de datos es
  cambiar un adaptador. Fuerte para el "camino a producción en AWS".
- El BFF es la única puerta entre el navegador y los servicios internos: frontera de confianza
  donde viven autenticación, autorización por sesión, enmascaramiento de PII y el registro de tools.

### Despliegue local + video (no AWS real)
- Con una noche, la ventaja es tomar decisiones acertadas bajo restricción y defenderlas, no
  "desplegué en AWS". El camino a producción en AWS se demuestra como diseño (C4), sin gastar
  la noche. IaC como diseño objetivo en el documento de solución.

## Seguridad (el corazón de la Opción B)

### La invariante central: `puedeAccederA` (dominio, función pura)
- Una sesión solo accede a los datos del afiliado cuya identidad validó.
- Es dominio puro y testeable en aislamiento. Aunque el LLM se dejara engañar (caso de prueba 5),
  esta regla bloquea el acceso a otro afiliado.

### El registro de herramientas: punto de estrangulamiento único
- Toda ejecución que el LLM propone pasa por tres puertas antes de tocar datos:
  1. La herramienta debe existir (si el LLM alucina un nombre → `herramienta_no_encontrada`).
  2. Los argumentos deben validar contra el schema Zod (`safeParse`, no lanza → `argumentos_invalidos`).
  3. Si requiere autorización, la sesión debe poder acceder al afiliado objetivo → `no_autorizado`.
- La autorización se reusa del dominio (`puedeAccederA`), no se reimplementa: un solo lugar de verdad.
- Se verifica ANTES de ejecutar; probado que la herramienta no se invoca si falla la autorización.

### Defensa en profundidad
- `certificadosDisponiblesPara` (dominio): un afiliado solo puede pedir certificados de productos
  que realmente posee. Aunque el orquestador omita validar, las capas inferiores no ofrecen de más.

### Manejo de secretos y datos
- `PROTOTYPE_ACCESS_KEY` por variable de entorno (secreto real); OTP `123456` es valor de prueba,
  no secreto. Distinción explícita.
- `.gitignore` deja fuera PDFs confidenciales y `.env`; el JSON ficticio sí entra (la app lo necesita).

## DevSecOps

### Convivencia con Cerberus (validador corporativo de Protección)
- El código pasa las mismas puertas de calidad que el de Protección: conventional commits,
  versiones exactas de dependencias, detección de secretos, SAST (Semgrep), ESLint.
- Punto de sustentación: se adoptaron controles de calidad corporativos en un repo personal.

### Análisis de dependencias (SCA)
- `npm audit` reportó vulnerabilidades, pero `npm audit --omit=dev` = 0: todas son de
  dependencias de desarrollo (dev server de Vitest/Vite/esbuild), no del artefacto de producción.
- Decisión: documentar y monitorear en CI, no aplicar fix forzado (breaking change sin reducir
  riesgo real). Criterio: analizar el vector, no reaccionar al número.

## Latencia del LLM (medida contra Ollama real, qwen2.5:7b en M4/16GB)
- Clasificación de intención: primera llamada ~7.3s (cold start, carga del modelo de 4.7GB a RAM),
  llamadas en caliente 0.6–1.5s. Promedio de la corrida de prueba ~2s (arrastrado por el cold start).
- Los 6 casos de prueba de clasificación acertaron, incluido el fuera de alcance ("chiste" → desconocida).
- Defensa: latencia en caliente aceptable para chat; el cold start se mitiga en producción
  manteniendo el modelo precargado (o con Bedrock, sin gestión de carga local).

## Orquestador conversacional (Fase 3)
- Máquina de estados determinista: inicio → identificando_intencion → validando_identidad →
  recolectando_datos → ejecutando → completado; más escalado_humano (fallo de negocio) y
  fallo_tecnico (fallo de plataforma, terminal).
- El LLM SOLO clasifica intención (JSON validado con Zod) y redacta. Las decisiones (validar,
  autorizar, qué falta, escalar) las toma el código. "El LLM interpreta y redacta; decide el orquestador."
- Distinción clave: JSON inválido del modelo → 'desconocida' (repregunta); Ollama caído → excepción
  → fallo_tecnico terminal. Fallo de negocio vs. fallo de plataforma, separados por diseño.
- Endpoints REST separados por responsabilidad (SRP): crear sesión / enviar mensaje / validar identidad.
- Verificado END-TO-END con Ollama real: crear sesión → validar identidad → pedir certificado → ejecutando.

## Generación de certificados PDF (Fase 4, B4)
- PDFKit por ser liviano y sin dependencias de navegador (defendible en Docker sin Chromium).
- Círculo de seguridad cerrado: la generación pasa por el RegistroHerramientas con autorización;
  el PDF solo se emite si puedeAccederA valida la sesión para ese afiliado. Aunque el orquestador
  tuviera un bug, el registro bloquea la emisión no autorizada.
- Caso 3 cubierto: si el año no tiene datos, devuelve anio_sin_datos (no inventa). Regla en armarCertificado.
- PDF con rótulo de prototipo + marca de agua "SIN VALIDEZ" + código de verificación (cumple 5.6 y B4).
- Decisión consciente (defensa): código de verificación = token de descarga por simplicidad. En prod
  serían distintos: token de un solo uso con expiración corta; código de verificación público que solo
  confirma autenticidad sin dar acceso al documento.
- Entrega por enlace temporal: GET /descargas/:token. En memoria (coherente con persistencia efímera).

## Grounding de FAQs (Fase 5, B5) — ADR-002
- Búsqueda léxica con umbral, NO vector DB. Defensa: "solución proporcional al problema; 8 FAQs no
  justifican infraestructura vectorial". Muestra criterio de no sobre-ingenierizar.
- El umbral ES la política de fuera de alcance: si nada supera el umbral → escala a humano (caso 7),
  no improvisa. Conecta con estaDentroDeAlcance del dominio.
- La fuente se toma del dato de la FAQ, no la genera el LLM → la cita es siempre real (caso 6).
- El LLM redacta a partir del contexto (la FAQ seleccionada), no accede al JSON de FAQs directo
  (coherente con B3: buscar_faq es una herramienta, aunque pública por no ser dato personal).
- Verificado en vivo: caso 6 respondió citando "Base de conocimiento... sección Certificados";
  caso 7 (recomendación de inversión) escaló a asesor sin dar asesoría financiera.
- Límite reconocido: la búsqueda léxica no capta sinónimos; en KB grande se migraría a embeddings
  cambiando solo el adaptador (hexagonal lo permite).

## Seguridad del LLM (Fase 6, B6) — ver reporte OWASP en seguridad-owasp-llm.md
- Principio rector: no asumo que el LLM sea infalible; las barreras duras son deterministas (código).
- Prompt injection: defensa en capas. La barrera REAL es que el id del afiliado viene de la sesión
  autenticada, no del texto del usuario. Un injection exitoso no filtra datos de otro afiliado (caso 5).
- Caso 12 verificado en vivo: pedir el system prompt → no lo revela, escala.
- Detección de injection como SEÑAL de observabilidad, no bloqueo (heurística imperfecta; decisión
  consciente para evitar falsos positivos que rompan UX). Defendible: "no bloqueo por heurística".
- Enmascaramiento de PII en logs: documento parcial, nombre/correo ocultos, valores sensibles marcados,
  OTP nunca se registra. "Un log filtrado no revela información de ningún afiliado."
- Mapeo OWASP Top 10 LLM completo en reporte dedicado (LLM01, 02, 06, 07, 08, 09, 10).
- Consentimiento explícito de tratamiento de datos: no solo se informa, se REGISTRA la aceptación
  como acción auditable (endpoint dedicado POST /consentimiento, no un mensaje interpretado por el LLM).
  Con opción real de rechazar: al rechazar se elimina la sesión y se bloquea la UI (respeto real, no cosmético).
  Defensa: "para una entidad vigilada, el consentimiento es un acto legal de primera clase, con su propio endpoint y registro."

## Frontend de chat (Fase 7, B7)
- React + Vite, atomic design (atoms/molecules/organisms). Hook useChat con patrón facade:
  el componente no conoce HTTP ni sesión, solo consume una interfaz simple.
- Seguridad de renderizado: texto plano (JSX escapa el contenido del LLM → sin XSS), nunca
  dangerouslySetInnerHTML. Enlace de descarga validado contra javascript: y con rel=noopener.
- Clave de acceso en memoria, no en localStorage (R-S6). OTP como campo password, fuera del hilo.
- Middleware de acceso en el BFF (restricción 5.6): rutas protegidas con X-Access-Key; health público.
- Sin estado global (Redux/Zustand): para un chat es sobre-ingeniería, useState/useRef basta.

## Pruebas (20% de la rúbrica)
- 99 pruebas backend al cierre de Fase 7 (frontend sin tests de UI aún; se pueden añadir en Fase 8/9) (incluye prueba de integración HTTP con supertest). Patrón: Vitest
  + AAA, nombres `should + acción + resultado`,
  tiempo determinista (constantes, no Date.now()), un comportamiento por test.
- Tests trazados a los casos del anexo B.3 (1, 2, 4, 5, 6, 7, 8 nombrados en los tests).
- Se prueba comportamiento observable, no detalles internos (ej. health check vía HTTP con supertest).

## Preguntas probables del panel y respuesta preparada
- *"¿Por qué el LLM no accede a los datos directamente?"* → ver Tool calling determinista.
- *"¿Cómo garantizas el aislamiento entre afiliados (caso 5)?"* → invariante `puedeAccederA` + registro.
- *"¿Por qué no usaste base de datos?"* → persistencia en memoria por alcance; datos de afiliados
  se leen del JSON que simula el sistema origen; en producción sería Redis con TTL para sesión.
- *"¿Por qué Node y no Python?"* → ver Stack.
- *"¿Por qué no desplegaste en AWS?"* → ver Despliegue; camino a producción demostrado como diseño.
