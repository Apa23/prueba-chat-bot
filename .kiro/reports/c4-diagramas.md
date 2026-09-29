# Diagramas C4 — Niveles 1 y 2

Diagramas en Mermaid (versionables). Renderizan en GitHub y en editores compatibles.

## Nivel 1 — Contexto

```mermaid
graph TB
    afiliado["Afiliado ficticio (usuario del prototipo)"]
    panel["Panel evaluador (acceso con clave)"]
    asesor["Asesor humano (simulado)"]

    sistema["Asistente de Certificados<br/>Prototipo conversacional con IA:<br/>valida identidad, genera certificados PDF,<br/>responde FAQs con grounding"]

    ollama["Ollama (LLM local) qwen2.5:7b<br/>interpreta lenguaje / redacta"]
    datos["Datos ficticios (JSON)<br/>afiliados, productos, FAQs"]

    afiliado -->|"conversa, solicita certificados"| sistema
    panel -->|"accede con clave de prototipo"| sistema
    sistema -->|"clasifica intención / redacta"| ollama
    sistema -->|"lee vía herramientas controladas"| datos
    sistema -.->|"escala casos fuera de alcance"| asesor
```

**Nota clave:** el LLM no accede a los datos directamente; el sistema lee la fuente a través de
herramientas con validación y autorización por sesión.

## Nivel 2 — Contenedores

```mermaid
graph TB
    afiliado["Afiliado / Panel"]

    subgraph proto["Prototipo (docker compose)"]
        front["Frontend — React + Vite<br/>chat web, atomic design"]
        subgraph bff["Backend / BFF — Node + TS (hexagonal)"]
            interfaces["Interfaces (HTTP)<br/>endpoints REST + middleware de acceso + registro de herramientas"]
            aplicacion["Application<br/>orquestador (máquina de estados), casos de uso, puertos, seguridad"]
            dominio["Domain<br/>entidades y reglas puras (puedeAccederA, validarIdentidad...)"]
            infra["Infrastructure<br/>adaptadores: Ollama, repos JSON, PDF (PDFKit), sesión en memoria, logger"]
        end
    end

    ollama["Ollama (host) qwen2.5:7b"]
    json["data/*.json (solo lectura)"]

    afiliado -->|"HTTPS/JSON + X-Access-Key"| front
    front -->|"REST: /sesiones, /mensajes, /identidad, /consentimiento, /descargas"| interfaces
    interfaces --> aplicacion
    aplicacion --> dominio
    aplicacion -->|"puertos (interfaces)"| infra
    infra -->|"HTTP /api/chat"| ollama
    infra -->|"lee"| json
```

**Dirección de dependencias:** hacia adentro. El dominio no conoce Ollama ni Express; cambiar de
proveedor de LLM o de fuente de datos es cambiar un adaptador de infraestructura.
