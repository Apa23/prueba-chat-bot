# Integración de servicios del backend

Convención de la arquitectura de referencia frontend: **el componente no sabe que existe HTTP**. Declara qué necesita, un hook lo resuelve y la vista solo decide qué pintar en cada estado.

Esta skill es agnóstica del proyecto: el flujo y las reglas de decisión no cambian. Lo único que varía de un repo a otro son los nombres concretos de sus piezas, y eso vive resuelto en el Paso 0.

---

## Paso 0 — Configuración de este proyecto

Antes de escribir código, carga `.claude/bindings/service-integration.bindings.md`. Vive **fuera** de esta carpeta a propósito: cuando actualices esta skill desde el repositorio de insumos de IA, reemplazas este archivo completo y el bindings del proyecto no se toca.

Ese archivo resuelve, con los nombres reales de este proyecto, los placeholders que usa este documento entre `<ángulos>`: `<FetchHook>`, `<PresetType>`, `<ResponseEnvelopeType>`, `<DomainTypesModule>`, `<ServicesRoot>`, `<InfraFolder>`, `<ConfigModule>`, `<ConstantsRoot>`, `<ErrorComponent>`, `<BlockingModal>`, `<ActionModal>`, `<FeedbackHook>`, `<KeyGenerator>`, `<TestRunner>`, `<TypeCheckCmd>`, `<TestCmd>`, `<BrandHeader>`, `<IdentifierLanguage>`.

Si `.claude/bindings/service-integration.bindings.md` **no existe**, créalo con esta plantilla y complétalo junto al desarrollador antes de continuar:

```markdown
# Bindings de integración de servicios

| Placeholder              | Qué representa                                                                        | Valor en este proyecto |
| ------------------------ | ------------------------------------------------------------------------------------- | ---------------------- |
| `<FetchHook>`            | Hook que resuelve el preset contra el backend; único punto de entrada HTTP            |                        |
| `<PresetType>`           | Tipo genérico del preset (`P`, `B`, `R`, `E`, `Data`)                                 |                        |
| `<ResponseEnvelopeType>` | Tipo del sobre de respuesta del backend                                               |                        |
| `<DomainTypesModule>`    | Módulo que expone enums y entidades de dominio para importar en presets               |                        |
| `<ServicesRoot>`         | Carpeta raíz de la capa de servicios                                                  |                        |
| `<InfraFolder>`          | Subcarpeta de infraestructura dentro de `<ServicesRoot>` (no es un scope de negocio)  |                        |
| `<ConfigModule>`         | Módulo que centraliza URLs base y variables de entorno                                |                        |
| `<ConstantsRoot>`        | Carpeta de mensajes y textos de UI                                                    |                        |
| `<ErrorComponent>`       | Bloque de error con reintento para una vista que depende de la consulta               |                        |
| `<BlockingModal>`        | Modal de carga global                                                                 |                        |
| `<ActionModal>`          | Modal de acción/confirmación, usado con `icon='danger'` en fallos que cortan el flujo |                        |
| `<FeedbackHook>`         | Hook de toasts para feedback fuera del ciclo del fetch                                |                        |
| `<KeyGenerator>`         | Generador de `key` único para un toast manual                                         |                        |
| `<TestRunner>`           | Runner de pruebas unitarias (jest / vitest / jasmine, etc.)                           |                        |
| `<TypeCheckCmd>`         | Comando de verificación de tipos                                                      |                        |
| `<TestCmd>`              | Comando para correr el spec de un scope                                               |                        |
| `<BrandHeader>`          | Cabecera obligatoria al inicio de cada archivo, si el proyecto usa una                |                        |
| `<IdentifierLanguage>`   | Idioma de identificadores vs. valores                                                 |                        |
```

Si el archivo existe pero alguna fila conserva el placeholder en vez de un valor real, **detente**: la skill no está configurada para este proyecto. En un flujo interactivo, pregúntale al desarrollador el valor que falta. Si te invocó un agente autónomo sin canal de pregunta, repórtalo como bloqueo estructurado en su salida — nunca inventes el valor ni dejes el placeholder literal en el código que escribas.

---

## Quick reference

| Decisión                        | Regla                                                                    |
| ------------------------------- | ------------------------------------------------------------------------ |
| Nombre de consulta              | `get<Cosa>.ts` → exporta `GET_<COSA>`                                    |
| Nombre de mutación              | `<cosa>Command.ts` → exporta `<COSA>_COMMAND`                            |
| Ubicación                       | `<ServicesRoot>/<scope>/` — nunca suelto en la raíz, nunca fuera         |
| `R` del preset                  | El **sobre** completo: `<ResponseEnvelopeType><Payload>`                 |
| `Data` del preset               | El **payload**: lo que `<FetchHook>` expone como `data`                  |
| Consulta al montar              | `autoFetch: true`                                                        |
| Consulta on-demand y comandos   | sin `autoFetch`; disparar `fetchData(params, body)`                      |
| `hasToken`                      | `true` si el endpoint está detrás de auth; `false` en catálogos abiertos |
| Éxito de consulta               | Sin mensaje. Se renderiza la data                                        |
| Éxito de comando                | Toast `success`                                                          |
| Error que tumba la vista        | `<ErrorComponent>` con `retry`, o `<ActionModal>` `icon='danger'`        |
| Error recuperable en formulario | Toast `danger`, formulario abierto                                       |
| Caché de una consulta           | `cache: true` en el preset. Solo catálogos; por omisión no cachea        |
| Consulta o comando que bloquea  | `blocking: true` en el consumo → `<BlockingModal>`                       |
| Fallo que el usuario debe ver   | `notifyError: true` + `errorMessage` de `<ConstantsRoot>/`               |

---

## 1. Preset

El preset es el objeto-comando: **URL, método y forma de los tipos**. Sin `fetch`, sin `axios`, sin lógica. Es lo único que cambia cuando cambia el contrato del endpoint.

```ts
/**
 * <BrandHeader>
 */

import { MASTER_BACKEND_URL } from '<ConfigModule>'
import { <PresetType>, <ResponseEnvelopeType>, DocumentType } from '<DomainTypesModule>'

type GetDocumentTypesPayload = DocumentType[]

export const GET_DOCUMENT_TYPES: <PresetType><
  undefined,                                       // P    → query params
  undefined,                                       // B    → body
  <ResponseEnvelopeType><GetDocumentTypesPayload>, // R    → el sobre del backend
  undefined,                                       // E    → error tipado
  GetDocumentTypesPayload                          // Data → lo que llega a `data`
> = {
  url: MASTER_BACKEND_URL + '/catalogo-documentos'
}
```

**Por qué `R` es el sobre y `Data` el payload:** `<FetchHook>` devuelve las dos cosas — `data` es el payload desenvuelto y `response` es el sobre completo— y `R` es lo que tipa el sobre.

Tipar `R` como el payload compila y deja `data` bien tipado, porque `Data` toma por defecto el valor de `R`. Lo que se rompe es el sobre: `R` deja de cumplir la restricción `R extends <ResponseEnvelopeType>`, TypeScript cae al tipo base y **`response.payload` queda como `unknown`**. Quien necesite leer el sobre tiene que castear.

Declarar los cinco slots cuesta cinco líneas y evita ese casteo.

La URL base sale siempre de `<ConfigModule>`, que centraliza las variables de entorno. Nunca un literal ni un `process.env` inline. Si el endpoint cuelga de una base que no está declarada ahí, se declara primero y se agrega su variable a los archivos de entorno del proyecto.

### Comando

Un comando declara `method`, `P` y `B`:

```ts
type RejectNoveltyPayload = { idSolicitud: string }

export const REJECT_NOVELTY_COMMAND: <PresetType><
  { idSolicitud: string },
  RejectionDetail,
  <ResponseEnvelopeType><RejectNoveltyPayload>,
  undefined,
  RejectNoveltyPayload
> = {
  url: NOVELTIES_BACKEND_URL + '/novedades/rechazo',
  method: 'POST'
}
```

Un comando **no** lleva `data` ni `body` horneados en el preset: el body viaja en la llamada, `fetchData(params, body)`. El preset describe la petición; los valores son del invocador.

### Nombres

`get` es el **único** prefijo permitido para consultas. Prohibidos `fetch`, `list`, `find`, `load`, `consult`, `retrieve`.

Todo lo que modifique data es un comando y termina en `Command`. Prohibidos `post`, `save`, `update`, `create`, `delete`, `submit` como prefijo de archivo — el verbo HTTP vive en `method`, no en el nombre.

| Operación                        | Archivo                      | Constante                    |
| -------------------------------- | ---------------------------- | ---------------------------- |
| Consultar catálogo de documentos | `getDocumentTypes.ts`        | `GET_DOCUMENT_TYPES`         |
| Consultar novedades pendientes   | `getPendingNovelties.ts`     | `GET_PENDING_NOVELTIES`      |
| Rechazar una novedad             | `rejectNoveltyCommand.ts`    | `REJECT_NOVELTY_COMMAND`     |
| Reintentar un paso del proceso   | `retryProcessStepCommand.ts` | `RETRY_PROCESS_STEP_COMMAND` |

El nombre distingue consulta de mutación de un vistazo, sin abrir el archivo. Ahí está el valor: en revisión de código, un `Command` que no declara `method` o un `get*` que sí lo declara salta a la vista.

### Ubicación

```
<ServicesRoot>/
  <InfraFolder>/   ← infraestructura (cliente HTTP, auth). NO es un scope de negocio
  <scope>/         ← un dominio de negocio por carpeta
    getX.ts
    xCommand.ts
    index.test.ts
```

Un scope es un dominio de negocio, no un tipo técnico: un scope por catálogo o por dominio funcional. Si el scope no existe, se crea la carpeta con su `index.test.ts`.

**Prohibido** dejar un setup en `<ServicesRoot>/` directamente, o fuera de `<ServicesRoot>/` (nada de setups en carpetas de hooks, utils o junto al componente). Si encuentras uno que incumple, **muévelo** — ver la sección _Reubicar setups que incumplen_.

### Caché

`cache` es **opt-in**: sin declararlo el preset no cachea, y ese es el default seguro. Solo lo activan los catálogos — datos que cambian por un despliegue del backend, nunca por una acción del usuario en la sesión actual.

```ts
export const GET_DOCUMENT_TYPES: <PresetType><...> = {
  url: MASTER_BACKEND_URL + '/catalogo-documentos',
  cache: true
}
```

No califican: listados (cambian con cada alta o baja que hace otro usuario), detalles de un registro, y ningún comando — mutar y servir la respuesta vieja de sesión sería mostrar un dato que el propio usuario acaba de invalidar.

El flag viaja como cabecera hacia el interceptor HTTP, que la lee y la borra **antes** de enviar la petición: si viajara, cada `GET` con caché pasaría a ser preflighted por CORS y el backend tendría que declararla en `Access-Control-Allow-Headers` solo para que el navegador la descarte.

---

## 2. Consumo con el hook

`<FetchHook>` es el único punto de entrada. Nunca un cliente HTTP directo en un componente o hook: eso se salta el Proxy y con él la caché, la renovación de token y el manejo del 401.

### Consulta que se dispara al montar

```tsx
const { data, isLoading, error } = <FetchHook>({
  setup: GET_DOCUMENT_TYPES,
  autoFetch: true,
  hasToken: false
})
```

### Consulta on-demand o comando

Sin `autoFetch`; el disparo es explícito. `fetchData` **rechaza** la promesa en error, así que todo disparo manual va dentro de `try/catch`. Sin el `catch` queda un unhandled rejection y el usuario se queda mirando un botón que no hizo nada:

```tsx
const { fetchData, isLoading } = <FetchHook>({
  setup: REJECT_NOVELTY_COMMAND,
  hasToken: true,
  notifyError: true,
  errorMessage: REJECT_ACTION_ERROR_MESSAGE,
  successMessage: REJECT_ACTION_SUCCESS_MESSAGE
})

const rejectNovelty = async (detail: RejectionDetail) => {
  try {
    await fetchData({ idSolicitud }, detail)
  } catch {
    // el hook ya disparó el toast de error vía notifyError
  }
}
```

`isLoading` deshabilita el disparador mientras el comando está en vuelo — sin eso el usuario dispara el comando dos veces.

### Dónde vive el consumo

Si la vista solo pinta la data —un select que carga un catálogo— el hook va en el componente. En cuanto haya estado derivado, paginación, filtros o feedback, se extrae a un hook `use<Vista>Vm` —nunca junto al componente— con su spec correspondiente.

---

## 3. Feedback: modal o toast

Es una decisión de UX, no de gusto. La tabla manda:

| Situación                                                     | Qué se muestra                                                     | Con qué                                                                        |
| ------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Consulta en vuelo, carga local                                | Estado de carga del propio control                                 | `isLoading` del control (select, shimmer)                                      |
| Consulta o comando en vuelo, carga global                     | Bloquea toda la pantalla                                           | `blocking: true` en `<FetchHook>` → `<BlockingModal>` se muestra y oculta solo |
| Consulta OK                                                   | **Nada.** El dato es el feedback                                   | —                                                                              |
| Consulta falla y la vista depende de ella                     | Bloque de error con reintento                                      | `<ErrorComponent>` con `retry={fetchData}`                                     |
| Consulta falla y era data secundaria (un select, un contador) | Nada. La vista sigue usable, el control queda vacío                | —                                                                              |
| Comando en vuelo                                              | Botón deshabilitado, además de la carga local o global que aplique | `isLoading`                                                                    |
| Comando OK                                                    | Toast de éxito                                                     | `successMessage` en `<FetchHook>`                                              |
| Comando falla, el usuario puede reintentar ahí mismo          | Toast de error, formulario abierto                                 | `notifyError: true` + `errorMessage` en `<FetchHook>`                          |
| Comando falla y corta el flujo                                | Modal con acción de salida                                         | `<ActionModal>` `icon='danger'`                                                |

El criterio detrás de la tabla: **el modal interrumpe, el toast informa.** Se interrumpe solo cuando el usuario no puede seguir sin decidir algo.

Nunca un toast de éxito por una consulta: el usuario no pidió nada, solo abrió la pantalla.

### Toast

`successMessage` y `notifyError` (ver el ejemplo del paso 2) cubren el toast de éxito y de error de cualquier consumo del hook. Para un toast fuera de ese ciclo —uno que no nace de un `fetchData`— se llama `<FeedbackHook>().addToast` directo, y ahí sí exige `key` único: se genera con `<KeyGenerator>`, nunca con el índice del arreglo ni un literal — dos toasts con la misma `key` y React descarta uno.

El texto sale de `<ConstantsRoot>/<dominio>.ts`. Prohibido el literal inline.

### Mensajes de error

Se muestra el campo de detalle del sobre de respuesta (`response` del hook): es el mensaje que el backend redacta para el usuario. **Nunca** `error.message`, que lo redacta el cliente HTTP y puede filtrar detalle interno. Cuando no hay sobre —fallo de red, 502— se cae al `errorMessage` declarado, que sale de `<ConstantsRoot>/<dominio>.ts`.

```tsx
if (error) return <<ErrorComponent> message={QUERY_ERROR_MESSAGE} retry={fetchData} />
```

`error` sirve para decidir _que_ hubo fallo y para loguear, no para mostrarse.

---

## 4. Integración de la data

`data` es el **payload** y es `undefined` hasta que resuelve. Tres reglas:

```tsx
// ✅ fallback en el consumo
options={data ?? []}

// ✅ derivar con useMemo
const total = useMemo(() => (data ?? []).length, [data])

// ❌ nunca
options={data!}                                  // revienta en el primer render
useEffect(() => setTotal(data.length), [data])   // estado derivado con efecto
```

Si la vista necesita el sobre y no solo el payload —código de respuesta, `errorType`, detalle del error— se usa el `response` que devuelve el hook.

> Al comparar el campo de resultado del sobre, usa el literal que declara `<ResponseEnvelopeType>`, no el que asumas por convención. Si no coincide, no compila; si lo casteas para forzarlo, la comparación queda siempre en falso.

---

## 5. `index.test.ts` del scope

Un solo spec por carpeta de scope, con un caso por preset. No hay carpeta de tests dentro de `<ServicesRoot>/<scope>/`: si existe, se consolida en `index.test.ts` y se borra.

```ts
/**
 * <BrandHeader>
 */

import { describe, expect, it } from '<TestRunner>'

import { GET_DOCUMENT_TYPES } from './getDocumentTypes'

describe('Master services unit tests', () => {
  it('GET_DOCUMENT_TYPES ', async () => {
    expect(GET_DOCUMENT_TYPES.data).toBeUndefined()
    expect(GET_DOCUMENT_TYPES.url).toMatch('/catalogo-documentos')
  })
})
```

Qué se afirma por preset:

- `url` contiene el path del endpoint (`toMatch`, no `toBe` — la base viene de una variable de entorno y cambia por ambiente).
- `data` es `undefined`: el preset no trae respuesta horneada.
- En comandos, además `method`.

Un preset es un objeto declarativo sin comportamiento, así que ahí termina su prueba: se verifica el contrato, no una lógica que no tiene. La lógica se prueba en el spec del hook o del componente que lo consume, mockeando el cliente HTTP.

Cerrar corriendo el spec del scope y el del consumidor:

```bash
<TestCmd>
```

---

## Reubicar setups que incumplen

Al tocar `<ServicesRoot>/`, cualquier setup fuera de un scope se mueve. Es trabajo transversal, no de la funcionalidad en curso: va en su propio commit.

1. Detectar: un archivo suelto en `<ServicesRoot>/` (o un setup en una carpeta de hooks, utils o junto a un componente) que declare URL o método de un endpoint.
2. Mover al scope que le corresponde (`git mv`), renombrando según la convención (`get*` o `*Command`).
3. Actualizar los imports de los consumidores.
4. Un archivo que exporte consulta **y** mutación se parte en dos: cada rol a su archivo, con su nombre.
5. Consolidar su spec en el `index.test.ts` del scope destino y borrar el directorio de tests viejo.
6. Verificar: `<TypeCheckCmd>` y los specs de los consumidores en verde.

---

## Checklist

- [ ] Preset en `<ServicesRoot>/<scope>/`, nunca suelto ni fuera
- [ ] Nombre: `get*` para consulta, `*Command` para mutación
- [ ] Cabecera `<BrandHeader>` en el archivo
- [ ] URL base desde `<ConfigModule>`
- [ ] `R` = `<ResponseEnvelopeType><Payload>`, `Data` = `Payload`
- [ ] Consumo vía `<FetchHook>`, nunca el cliente HTTP directo
- [ ] `hasToken` acorde al endpoint
- [ ] `cache` decidido explícitamente, nunca dejado al default por omisión
- [ ] `blocking` decidido según si la carga es local o global
- [ ] `notifyError` decidido, con su `errorMessage` si es `true`
- [ ] Disparo manual dentro de `try/catch`
- [ ] Carga, éxito y error cubiertos según la tabla de feedback
- [ ] Mensajes desde `<ConstantsRoot>/`, nunca el `message` del error en pantalla
- [ ] `data ?? fallback`; derivados con `useMemo`
- [ ] `index.test.ts` del scope actualizado
- [ ] `<TypeCheckCmd>` limpio y specs en verde
- [ ] Setups incumplidores que hayas encontrado, reubicados

## Errores comunes

| Error                                           | Consecuencia                                                                                          |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Tipar `R` como el payload                       | `response.payload` queda `unknown`; obliga a castear el sobre                                         |
| Mock que devuelve el payload pelado             | El test pasa con `data` en `undefined`: falso verde                                                   |
| Cliente HTTP directo en el componente           | Se salta el Proxy: sin caché, sin refresh de token, sin manejo del 401                                |
| Clase, repositorio o fábrica por servicio       | Indirección que duplica lo que ya resuelve el preset + `<FetchHook>`                                  |
| Toast de éxito en una consulta                  | Ruido: el usuario no ejecutó ninguna acción                                                           |
| `message` del error en pantalla                 | Filtra detalle interno del backend                                                                    |
| `data!` o `data.length` sin fallback            | Crash en el primer render, antes de que resuelva                                                      |
| `useEffect` + `setState` para derivar de `data` | Render extra por cada respuesta                                                                       |
| `hasToken` mal puesto                           | Header innecesario en un catálogo abierto, o 401 silencioso                                           |
| Preset nuevo sin tocar `index.test.ts`          | El scope queda sin cobertura de contrato                                                              |
| Body horneado en el preset                      | El comando deja de ser reutilizable: un preset por caso                                               |
| Preset nuevo sin decidir la caché               | Nace sin caché, el default seguro, pero un catálogo sin `cache: true` pega al backend en cada montaje |
| `notifyError` sin `errorMessage`                | Un fallo de red —sin sobre del backend— deja el toast vacío                                           |