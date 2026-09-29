# Declaración de uso de IA

## Qué herramientas usé y para qué

Usé un asistente de IA (agente de desarrollo) como **par de trabajo bajo mi dirección**, no como
generador autónomo. El asistente operó con un rol explícito de "guía para la toma de decisiones":
ante cada decisión relevante me presentaba alternativas con sus tradeoffs y la decisión la tomaba yo.

- **Diseño y arquitectura:** discutí y decidí la arquitectura hexagonal, el tool calling determinista,
  el grounding léxico (vs. vector DB) y el manejo de seguridad. La IA propuso opciones; yo elegí y
  justifiqué cada una (quedan en los ADR y en el material de sustentación).
- **Código:** la IA implementó siguiendo mis decisiones y las convenciones que definí (SOLID, límites
  de comentarios, versiones exactas). Trabajé por fases con checkpoints de revisión.
- **Pruebas:** la IA escribió pruebas siguiendo el patrón que fijé (AAA, comportamiento no
  implementación). Los 12 casos del anexo se ejecutaron con un script y se evaluaron con mi criterio.
- **Documentación:** ADR, C4, reportes de seguridad y este documento se redactaron con IA a partir de
  las decisiones tomadas, y los revisé.

## Qué validé o corregí de lo generado por IA

- **Corrí el build y las pruebas** tras cada cambio; el compilador estricto y el validador de calidad
  (hooks de pre-commit/pre-push) atraparon errores reales que la IA introdujo (p. ej. un símbolo usado
  antes de definirse, tipos de `req.params` en Express 5, una regla de lint inexistente), que corregí.
- **Rechacé un patrón Singleton** que se propuso inicialmente para la autorización: al ser una función
  pura sin estado, opté por inyección desde el composition root para no introducir estado global.
- **Detecté código muerto** (una condición que nunca se cumplía) al revisar la cobertura y lo eliminé
  en vez de cubrirlo con una prueba artificial.
- **Evalué los 12 casos con criterio propio**, reportando con transparencia los 2 casos parciales en
  vez de maquillar resultados.

## Una decisión en la que no seguí la sugerencia de la IA

Para el enlace de descarga del PDF, una opción simple era quitar la protección de la ruta y confiar en
que el token es la credencial. **No la seguí:** preferí mantener la ruta protegida por la clave y
descargar vía fetch autenticado (blob en memoria), para no relajar la seguridad ni exponer la clave en
la URL. Prioricé el control de acceso sobre la simplicidad, coherente con una entidad vigilada.

## Sobre el dominio de lo entregado

Cada decisión de diseño está documentada con sus alternativas y su justificación, precisamente para
poder defenderla. El objetivo del proceso fue fortalecer mi criterio, no delegar el pensamiento.
