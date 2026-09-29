# ADR-001 — Arquitectura hexagonal con backend actuando como BFF

- **Estado:** Aceptado
- **Fecha:** 2026-09-28
- **Decisores:** Analista de soluciones (candidato)

## Contexto

El prototipo (Opción B) debe integrar un LLM local, una fuente de datos ficticios, un
generador de PDF y un frontend de chat, cumpliendo requisitos fuertes de seguridad
(aislamiento de datos entre afiliados, el LLM no accede a datos directamente,
enmascaramiento de PII). Es una entidad vigilada por la Superintendencia Financiera, así
que la separación de responsabilidades y la trazabilidad son prioridad. Además, la
sustentación exige poder explicar y modificar el código en vivo, por lo que la estructura
debe ser clara y sin "magia".

## Decisión

Adoptar **arquitectura hexagonal (puertos y adaptadores)** en el backend, con cuatro capas:
`domain`, `application`, `infrastructure`, `interfaces`. El backend actúa como **BFF
(Backend for Frontend)**: única puerta entre el navegador y los servicios internos.

Regla de dependencias: apuntan hacia adentro. El dominio no depende de frameworks ni de
proveedores externos. Los puertos se definen en `application` y se implementan en
`infrastructure`, inyectando las implementaciones (DIP).

## Alternativas consideradas

1. **Arquitectura en capas tradicional (MVC/servicios) sin puertos explícitos.**
   Más rápida de montar, pero acopla la lógica de negocio a los detalles (Ollama, JSON,
   Express). Dificulta cambiar de proveedor de LLM y complica las pruebas unitarias del
   dominio. Descartada por acoplamiento.

2. **Framework opinado (NestJS).** Da estructura lista, pero añade curva de aprendizaje y
   abstracciones (decoradores, inyección propia) que habría que defender en vivo.
   Descartada para priorizar dominio total del código en la sustentación.

3. **Hexagonal con BFF (elegida).** Máxima separación, dominio testeable en aislamiento,
   proveedor de LLM y fuente de datos intercambiables por adaptador.

## Consecuencias

**Positivas:**
- El dominio se prueba sin Ollama ni red (pruebas unitarias rápidas y deterministas).
- Cambiar Ollama → Bedrock, o JSON → DB, es cambiar un adaptador. Fuerte para el
  "camino a producción en AWS".
- El BFF concentra seguridad: autenticación, autorización por sesión, enmascaramiento
  de PII, registro de herramientas. Frontera de confianza única.

**Negativas / costos:**
- Más archivos y ceremonia inicial que un enfoque plano. Justificado por el tamaño de la
  superficie de integración y los requisitos de seguridad.
- Requiere disciplina para no filtrar dependencias entre capas.

## Relación con la seguridad (OWASP LLM)
El BFF + hexagonal habilita el control de tool calling determinista (ver ADR sobre LLM):
el LLM nunca toca `infrastructure` de datos directamente; pasa por un caso de uso en
`application` que valida autorización de sesión.
