# Capa: Application (aplicación)

Casos de uso y **puertos** (interfaces que el dominio/aplicación necesitan del mundo exterior).
Orquesta el flujo, pero no conoce los detalles de implementación.

Aquí vive el **orquestador conversacional** (Camino B, determinista): detectar intención →
pedir datos faltantes → validar identidad → decidir qué herramienta ejecutar. También los
casos de uso: ValidarIdentidad, ConsultarProductos, GenerarCertificado, ResponderFAQ.

## Puertos (interfaces) definidos aquí, implementados en infrastructure
- `LlmPort` — entender lenguaje natural / producir intención. Lo implementa el adaptador Ollama.
- `AfiliadoRepositoryPort` — leer datos de afiliados. Lo implementa el adaptador JSON.
- `CertificadoPdfPort` — generar el PDF. Lo implementa el adaptador de PDF.
- `SessionStorePort` — estado de sesión. Lo implementa el store en memoria.

## Regla de dependencias
Depende de `domain`. NO depende de `infrastructure` ni de `interfaces`.
Define interfaces (puertos); las implementaciones concretas se inyectan desde afuera (DIP).
