# Seguridad del asistente — Mapeo OWASP Top 10 para LLM (2025)

> Evidencia de cómo el prototipo aborda los riesgos de seguridad de aplicaciones con LLM (B6).
> Principio rector: no se asume que el LLM sea infalible; las barreras duras son deterministas
> y viven en el código (control de acceso a datos), no en el modelo.

| OWASP LLM | Riesgo | Cómo se aborda en el prototipo |
|---|---|---|
| LLM01 Prompt Injection | Manipular el modelo para saltarse reglas | Defensa en capas: (1) instrucciones de sistema con guardarraíles, (2) detección heurística como SEÑAL de observabilidad (no bloqueo), (3) barrera dura: el LLM no accede a datos, el id del afiliado viene de la sesión autenticada, no del texto del usuario (casos 5 y 12). |
| LLM02 Divulgación de información sensible | Filtrar datos de otros afiliados / PII | `puedeAccederA` (invariante de dominio): una sesión solo accede a su afiliado. El registro de herramientas valida autorización antes de ejecutar. Enmascaramiento de PII en logs; el OTP nunca se registra. |
| LLM06 Agencia excesiva | El LLM ejecuta acciones no autorizadas | El LLM NO ejecuta herramientas: solo clasifica intención y redacta. El orquestador determinista decide y ejecuta vía el registro con autorización. |
| LLM07 Fuga del system prompt | Revelar instrucciones internas | Instrucción explícita de no revelar el prompt; verificado en vivo (caso 12: no lo reveló, escaló). La barrera de datos no depende de esto. |
| LLM08 Debilidades de datos/vectores | Grounding manipulable | Grounding léxico determinista sobre datos fijos; la fuente se toma del dato, no la genera el LLM. Sin vector store que envenenar (ADR-002). |
| LLM09 Desinformación / alucinación | Inventar datos | El LLM no accede a datos; los provee la herramienta. Si el dato no existe (año sin datos), se informa, no se inventa (caso 3). Los certificados se arman desde el repositorio, no desde el modelo. |
| LLM10 Consumo no acotado | Abuso de recursos | Validación de longitud de entrada (Zod), sesión con expiración (TTL) y bloqueo por intentos fallidos de OTP. |

## Controles transversales
- **Autorización de tratamiento de datos** al inicio de cada sesión (mensaje inicial).
- **Aislamiento entre afiliados**: probado end-to-end (caso 5) y por invariante de dominio.
- **Enmascaramiento de PII**: documento parcial, nombre/correo ocultos, valores marcados como sensibles,
  OTP eliminado del log. Un log filtrado no revela información de ningún afiliado.
- **Autenticación del prototipo**: `PROTOTYPE_ACCESS_KEY` por variable de entorno (restricción 5.6).

## Límite reconocido (honestidad ante el panel)
La detección de prompt injection por patrones es heurística: tiene falsos positivos y negativos.
Por eso se usa como señal de observabilidad, no como control. La seguridad real es el control de
acceso determinista: un injection exitoso no puede filtrar datos de otro afiliado porque el id del
afiliado proviene de la sesión autenticada, no del texto que el usuario (o atacante) escribe.
