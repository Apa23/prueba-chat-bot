# ADR-002 — Grounding por búsqueda léxica, sin vector DB

- **Estado:** Aceptado
- **Fecha:** 2026-09-29
- **Decisores:** Analista de soluciones (candidato)

## Contexto

El requisito B5 pide responder preguntas frecuentes "con RAG o grounding, indicando la
fuente", y ante preguntas fuera de alcance dar una respuesta segura y ofrecer un asesor
humano. La base de conocimiento son **8 preguntas frecuentes** definidas en el archivo de
datos ficticios, cada una con su respuesta y su fuente.

## Decisión

Implementar el grounding mediante **búsqueda léxica con umbral de relevancia** sobre las 8
FAQ, en lugar de una base de datos vectorial con embeddings. La FAQ seleccionada se pasa al
LLM como contexto para que redacte, y la fuente se toma del dato (no la genera el LLM). Si
ninguna FAQ supera el umbral, la consulta se considera **fuera de alcance** y se escala.

## Alternativas consideradas

1. **Vector DB + embeddings (RAG clásico).** Generar embeddings de las FAQ, almacenarlas en
   una base vectorial (Chroma, pgvector) y buscar por similitud semántica. Es el enfoque
   estándar para bases de conocimiento grandes, pero para **8 registros** implica montar
   infraestructura vectorial, un modelo de embeddings y latencia adicional, sin beneficio
   proporcional. Sobre-ingeniería para el tamaño del problema. Descartada.

2. **Pasar las 8 FAQ completas al LLM en cada consulta.** Caben de sobra en el contexto y el
   LLM elige. Simple, pero da menos control sobre el grounding y sobre la política de
   "fuera de alcance" (queda a criterio del modelo). Descartada por control y determinismo.

3. **Búsqueda léxica con umbral (elegida).** Cero infraestructura, determinista, testeable
   sin LLM. El umbral es el mecanismo de "fuera de alcance": si nada es suficientemente
   relevante, se escala en vez de improvisar.

## Consecuencias

**Positivas:**
- Proporcional al problema: sin infraestructura para buscar en 8 registros.
- El umbral materializa la política de alcance (`estaDentroDeAlcance`), conectando el dominio
  con el grounding real. Cubre caso 6 (responder con fuente) y caso 7 (fuera de alcance → escalar).
- La fuente se toma del dato, no del LLM: la cita es siempre real (el modelo no inventa fuentes).
- Determinista y testeable en aislamiento.

**Negativas / límites:**
- La búsqueda léxica no captura sinónimos ni similitud semántica: una pregunta redactada muy
  distinto a la FAQ podría no coincidir. Mitigación: normalización (acentos, may/min, stopwords)
  y umbral calibrado. En una base de conocimiento grande, se migraría a embeddings.

## Camino a producción
Si la base de conocimiento creciera (cientos/miles de documentos), se migraría a embeddings +
vector store (p. ej. pgvector o un servicio gestionado), manteniendo el mismo puerto/servicio de
grounding para no afectar al orquestador. La arquitectura hexagonal permite ese cambio en el adaptador.
