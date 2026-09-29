# Capa: Infrastructure (infraestructura)

Adaptadores que implementan los puertos de `application`. Aquí vive todo lo que toca el
mundo exterior: procesos, red, disco, librerías de terceros.

## Adaptadores previstos
- `OllamaLlmAdapter` — implementa `LlmPort` hablando con Ollama vía HTTP.
- `JsonAfiliadoRepository` — implementa `AfiliadoRepositoryPort` leyendo `data/datos_ficticios_chatbot.json`.
- `PdfKitCertificadoAdapter` — implementa `CertificadoPdfPort` (marca de agua + código de verificación).
- `InMemorySessionStore` — implementa `SessionStorePort` (persistencia en memoria, por decisión de diseño).

## Regla de dependencias
Depende de `application` (implementa sus puertos) y de `domain`.
Es la capa MÁS externa junto con `interfaces`. Nada del dominio depende de aquí.

Defensa ante el panel: "Cambiar de Ollama a Bedrock, o del JSON a una DB real, es cambiar
un archivo de esta carpeta. El resto del sistema no se entera."
