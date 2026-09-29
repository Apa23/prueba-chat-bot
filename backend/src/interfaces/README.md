# Capa: Interfaces (entrada / driving adapters)

Puntos de entrada al sistema. Traducen el mundo exterior (HTTP) en llamadas a los casos
de uso de `application`. Este backend actúa como **BFF (Backend for Frontend)**: es la
única puerta entre el navegador y los servicios internos (LLM, datos, PDF).

## Contenido previsto
- API HTTP (Express): endpoints del chat, validación de identidad, descarga de PDF.
- **Registro de herramientas (tools)**: catálogo formal de las herramientas que el
  orquestador puede ejecutar, cada una con su schema de entrada/salida validado con Zod.
  Este registro es el guardarraíl: el LLM propone una intención, pero solo se ejecuta si
  coincide con una herramienta registrada y la sesión está autorizada.
- Middlewares transversales: autenticación (clave del prototipo), enmascaramiento de PII
  en logs, manejo de errores consistente (códigos HTTP + estructura de error estándar).

## Por qué BFF (defensa ante el panel)
El frontend nunca habla con Ollama ni toca el JSON. El BFF es la frontera de confianza:
aquí viven autenticación, autorización por sesión, validación y enmascaramiento. El
navegador no puede saltarse el orquestador.

## Regla de dependencias
Depende de `application`. Es capa externa. El dominio no depende de aquí.
