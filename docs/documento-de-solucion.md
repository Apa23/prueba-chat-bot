# Documento de solución — Prototipo de chatbot con IA para certificados

**Opción B** · Prototipo de evaluación, no oficial · Datos 100% ficticios

## 1. Contexto y alcance

Los afiliados de un fondo de pensiones y cesantías solicitan certificados (afiliación, tributario,
cesantías) por canales asistidos. Este prototipo valida si un asistente conversacional con IA puede
resolver esas solicitudes en autoservicio, de forma segura y con buena experiencia.

**Incluido:** conversación en lenguaje natural; identificación del certificado (4 tipos); validación
de identidad simulada (documento + OTP); consulta de datos vía herramientas controladas; generación
del certificado en PDF con marca de agua y código de verificación; FAQs con grounding y cita de
fuente; escalamiento a asesor; seguridad de LLM (anti prompt-injection, aislamiento entre afiliados,
enmascaramiento de PII, consentimiento de datos); chat web protegido con clave.

**Dejado por fuera (consciente):** extracción de parámetros del texto libre (el año se pide en un paso
de recolección) y desambiguación automática cuando la solicitud es genérica. Se documentan en los
resultados de pruebas con su solución propuesta. Se priorizó la seguridad y un alcance acotado para
una noche de trabajo.

## 2. Arquitectura

Diagramas C4 (niveles 1 y 2) en `.kiro/reports/c4-diagramas.md`.

- **Frontend:** React + Vite, atomic design. Chat web con acceso por clave, formulario de identidad y
  consentimiento dedicados, descarga de PDF vía fetch autenticado.
- **Backend (BFF):** Node.js + TypeScript, **arquitectura hexagonal** (domain / application /
  infrastructure / interfaces). Única puerta entre el navegador y los servicios internos.
- **LLM:** Ollama local (`qwen2.5:7b`). El modelo solo interpreta lenguaje y redacta; **no accede a
  datos** ni ejecuta herramientas por su cuenta.
- **Persistencia:** en memoria (sesión conversacional). Los datos de afiliados y FAQs se leen de un
  JSON que simula el sistema origen.

El **orquestador** es una máquina de estados determinista: consentimiento → identificación de
intención → validación de identidad → recolección de datos → ejecución → completado; más escalamiento
a humano (fallo de negocio) y fallo técnico (terminal). Las decisiones las toma el código; el LLM
asiste con lenguaje.

El **registro de herramientas** es el punto único de ejecución: valida existencia, forma (Zod) y
autorización (regla de dominio `puedeAccederA`) antes de tocar datos.

## 3. Registros de decisiones (ADR)

- **ADR-001 — Hexagonal + BFF.** Máxima separación de capas; el dominio es testeable sin
  infraestructura y el proveedor de LLM/fuente de datos es intercambiable por adaptador. Alternativas
  descartadas: capas tradicionales (acoplamiento), NestJS (magia a defender en vivo).
- **ADR-002 — Grounding léxico sin vector DB.** Para 8 FAQs, una base vectorial es sobre-ingeniería.
  Búsqueda léxica con umbral: determinista, sin infraestructura, y el umbral es la política de "fuera
  de alcance". La fuente se toma del dato, no del LLM.
- **ADR implícito — Tool calling determinista.** El modelo local soporta tool calling nativo (probado),
  pero se controla desde el orquestador por seguridad, auditabilidad y previsibilidad: el LLM propone,
  la herramienta dispone.

(Detalle completo en `.kiro/reports/adr/`.)

## 4. Requisitos no funcionales

- **Seguridad:** autenticación del prototipo por clave; validación de entradas con Zod; aislamiento
  entre afiliados como invariante de dominio; enmascaramiento de PII en logs (OTP nunca se registra);
  consentimiento de datos auditable; mapeo a OWASP Top 10 LLM (`.kiro/reports/seguridad-owasp-llm.md`).
- **Escalabilidad:** el BFF es sin estado salvo la sesión (en memoria; en producción, Redis con TTL),
  lo que permite escalar horizontalmente.
- **Observabilidad:** logger seguro con eventos; detección de intentos de inyección como señal;
  latencia medida por interacción.
- **Disponibilidad:** health check para orquestadores de contenedores; fallo técnico degrada de forma
  explícita en vez de romperse.

## 5. Riesgos técnicos y mitigación

| Riesgo | Mitigación |
|--------|-----------|
| Prompt injection en el LLM | Defensa en capas: instrucciones de sistema + detección como señal + barrera dura de acceso a datos (el id del afiliado viene de la sesión, no del texto). |
| Alucinación del modelo | El LLM no provee datos; los da la herramienta. Si el dato no existe, se informa (no se inventa). |
| Baja calidad del modelo local | Orquestación determinista: la lógica crítica no depende de la calidad del modelo. Migrable a Bedrock por adaptador. |
| Fuga de PII en logs | Enmascaramiento en el único punto de logging; OTP nunca se registra. |
| Cold start de latencia | Modelo precargado en producción; o proveedor gestionado sin gestión de carga local. |

## 6. Camino a producción en AWS (entidad vigilada por la Superintendencia Financiera)

Arquitectura objetivo (diagrama en artefacto/repo):

- **Perímetro:** CloudFront + WAF (TLS, rate limiting, reglas OWASP). **Cognito** para autenticación
  fuerte con MFA/OTP real (reemplaza el OTP simulado).
- **Cómputo:** BFF en **ECS Fargate** con auto-scaling, en subredes privadas multi-AZ tras un ALB.
- **LLM:** **Amazon Bedrock** (modelo gestionado, residencia de datos en AWS, sin salida a terceros),
  alineado con privacidad y residencia exigidas a una entidad vigilada.
- **Datos:** integración con el sistema origen real vía API interna; **ElastiCache Redis** para sesión
  con TTL; **S3** para PDFs temporales (cifrado en reposo + lifecycle de expiración).
- **Secretos:** **Secrets Manager** (ninguna credencial en el repo).
- **Observabilidad:** CloudWatch (logs/métricas) + X-Ray (trazas de extremo a extremo), con
  identificador de correlación entre servicios.
- **Continuidad:** multi-AZ, health checks, auto-scaling; backups y estrategia de recuperación según
  RTO/RPO; trazabilidad y retención de logs conforme a normativa.
- **DevSecOps:** pipeline con SAST, SCA y detección de secretos (equivalente a los controles que hoy
  aplica el validador de commits/push); IaC (Terraform/CDK) para reproducibilidad.

## 7. Ejecución y pruebas

- Ejecutable localmente con un comando (`docker compose up`) + Ollama en el host.
- 103 pruebas automatizadas (unitarias de dominio + integración HTTP), cobertura de lógica ~96%.
- Los 12 casos del anexo B.3 ejecutados y documentados (`.kiro/reports/test-cases-results.md`):
  10/12 pasan, 2 parciales analizados con transparencia.
