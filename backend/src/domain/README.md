# Capa: Domain (dominio)

Entidades y reglas de negocio puras. **Cero dependencias externas** (ni Express, ni
Ollama, ni librerías de PDF, ni el sistema de archivos).

Aquí viven conceptos como: Afiliado, Certificado, TipoCertificado, Sesión, resultado
de validación de identidad. Y las reglas: qué datos requiere cada tipo de certificado,
cuándo una sesión está autorizada, cuándo un OTP es válido.

## Regla de dependencias
Nada de esta carpeta importa código de `application`, `infrastructure` o `interfaces`.
Las dependencias apuntan HACIA ADENTRO: las capas externas dependen del dominio, nunca al revés.

Defensa ante el panel: "El dominio no sabe que existe Ollama. Por eso puedo cambiar el
proveedor de LLM tocando solo un adaptador, sin tocar la lógica de negocio."
