# definition.md — Memoria de largo plazo: decisiones generales

> Registro de las decisiones estructurales del proyecto y su justificación.
> Sirve como base para los ADR y para la defensa de arquitectura en la sustentación.
> Se actualiza cuando se toma una decisión nueva de alto nivel, no en cada cambio de código.

## Reto

Prueba de habilidades técnicas — Ingeniero de Soluciones TI (Protección S.A.).
**Opción B:** Prototipo de chatbot con IA para generación de certificados de afiliados
ficticios de un fondo de pensiones y cesantías. Genera certificados en PDF.

## Decisiones tomadas

### D1. Opción B (chatbot con IA)
- **Contexto:** El candidato elige entre A (servicio de tareas orientado a eventos) y B.
- **Decisión:** Opción B.
- **Razón:** El archivo de datos ficticios ya viene incluido; el énfasis en IA generativa,
  tool calling y seguridad de LLM permite demostrar criterio moderno y diferenciado.

### D2. Stack: React + Node.js/TypeScript
- **Alternativas consideradas:** Python (mejor ecosistema LLM/RAG), Java/Spring (robusto pero verboso).
- **Decisión:** Node.js/TypeScript en backend + React en frontend.
- **Razón:** Es el stack que el candidato domina y puede defender en vivo. Tipado
  end-to-end, un solo lenguaje, ecosistema maduro de PDF y validación (Zod). Elegir
  lo que se domina para poder sustentarlo ES un argumento de criterio válido.
- **Tradeoff reconocido:** Python tiene SDKs de LLM más maduros. Respuesta al panel:
  para un prototipo con tool calling controlado y modelo local, Node da velocidad y
  unifica el stack; en producción se reconsideraría Python si el equipo lo domina.

### D3. LLM local vía Ollama
- **Alternativas:** Bedrock (residencia AWS, pero requiere aprobación de acceso a modelos,
  riesgo de bloqueo para cuentas nuevas), OpenAI/Anthropic (mejores modelos, datos salen a EEUU).
- **Decisión:** Modelo local con Ollama.
- **Razón:** Cero costo, sin free tier disponible, privacidad total y residencia de datos
  local (relevante para entidad vigilada por la Superintendencia Financiera). Sin dependencia
  de aprobaciones externas en una sola noche de trabajo.
- **Tradeoff reconocido:** Menor calidad que modelos frontera; los modelos locales pequeños
  son poco confiables en tool calling nativo (ver D4).

### D4. Tool calling — Camino B: orquestación determinista
- **Contexto:** B3 exige que el LLM no acceda a datos directamente, solo vía herramientas
  con validación y autorización por sesión. Los modelos locales pequeños hacen tool calling
  nativo de forma poco confiable.
- **Decisión:** El orquestador (código) controla el flujo: detectar intención → pedir datos
  faltantes → validar identidad → ejecutar herramienta desde el código contra un registro
  formal de tools (schema validado con Zod). El LLM entiende lenguaje natural y produce una
  intención estructurada, pero NO decide autónomamente acceder a datos.
- **Razón / defensa ante el panel:** Cuatro ángulos por los que el LLM no toca los datos:
  (1) evita filtración/modificación de datos, (2) evita ejecución no determinista,
  (3) contiene alucinaciones, (4) **auditabilidad y autorización**: cada acceso queda como
  llamada explícita, loggeable, con verificación de que la sesión validó identidad para ESE
  afiliado. "El LLM propone, la herramienta dispone."
- **Stretch goal:** activar tool calling nativo del modelo (camino A) si sobra tiempo.

### D5. Despliegue local (docker compose) + video sin edición
- **Alternativas:** Desplegar en AWS real (alto costo de tiempo: IAM, red, contenedores,
  acceso protegido, y posible espera de aprobación de Bedrock).
- **Decisión:** `docker compose up` + video corto de una sola toma. IaC de AWS como diseño
  objetivo en el documento de solución, sin aplicarlo.
- **Razón:** Con una noche, la ventaja competitiva es tomar decisiones acertadas bajo
  restricción y defenderlas, no "desplegué en AWS". La rúbrica da 10% a despliegue vs.
  20% arquitectura + 30% sustentación. El "camino a producción en AWS" se demuestra como
  diseño (C4) sin gastar la noche. Criterio de ingeniero: saber cuándo NO construir.

### D6. Diferenciadores objetivo (opcionales, si alcanza el tiempo)
- Generación asíncrona orientada a eventos (solicitud encolada → worker genera PDF → notifica).
- Bloqueo temporal tras varios intentos fallidos de OTP.
- Métricas de negocio simuladas (tasa de contención, motivos de escalamiento).
- **Razón:** Cubren las tres dimensiones de valor: funcionalidad, seguridad y negocio.
  Marcados como "si alcanza", no como núcleo.

## Requisitos obligatorios de la Opción B (checklist de referencia)

- B1. Conversación NL, identificar tipo de certificado (mín. 3), pedir datos faltantes.
- B2. Validación de identidad simulada (documento + OTP fijo `123456`). Sin identidad, no entrega datos.
- B3. Consulta de datos vía tool calling a servicio que lee el JSON. No inventar datos.
- B4. PDF desde plantilla, con marca de agua "DOCUMENTO DE PRUEBA – SIN VALIDEZ" y código de verificación.
- B5. FAQs con RAG/grounding citando fuente. Fuera de alcance → respuesta segura + asesor humano.
- B6. Seguridad LLM: anti prompt-injection, aislamiento entre afiliados, enmascaramiento en logs,
  autorización de tratamiento de datos al inicio.
- B7. Interfaz: chat web sencillo o API con cliente mínimo.
- B.3 (5.4): Ejecutar los 12 casos de prueba, tabla de resultados, tasa de éxito, latencia, costo.

## Entregables obligatorios (ambas opciones)

- Documento de solución (máx 4 págs): contexto/alcance, C4 niveles 1 y 2, 2–3 ADR,
  requisitos no funcionales, riesgos, camino a producción en AWS (entidad vigilada).
- Repositorio Git público, commits incrementales, README completo, arquitectura Clean/Hexagonal.
- Pruebas: unitarias de negocio + al menos 1 de integración + reporte de cobertura.
- Pipeline CI (opcional): compilación, pruebas, y al menos un control de seguridad (SAST/SCA/secretos).
- Despliegue en nube (o local + video, ruta elegida). IaC deseable.
- Declaración de uso de IA (máx media pág).

## Datos ficticios (datos_ficticios_chatbot.json)

- 5 afiliados: AF-001 a AF-005. OTP válido para todos: `123456`.
- Tipos de certificado: AFILIACION_PO, TRIBUTARIO_PV (requiere año gravable),
  CESANTIAS_SALDO, CESANTIAS_RETIROS (requiere año).
- 8 FAQs con respuesta y fuente para el RAG/grounding.
