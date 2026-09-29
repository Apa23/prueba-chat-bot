---
name: type-system-conventions
description: Úsala antes de declarar, mover o renombrar un `type` o una `interface` — decidir en qué carpeta vive, cómo nombrarlo, o cuando sospechas que ya existe uno parecido y estás a punto de redeclararlo. Cúbrela antes de escribir la primera línea de una declaración de tipo.
---

# Convenciones de types e interfaces

Dos principios sostienen todo lo demás:

1. **Un tipo se declara una sola vez.** Si un tipo nuevo comparte campos con
   uno existente, se **deriva** — no se copia.
2. **El tipo vive donde lo consumen.** Lo que usa un solo archivo se queda en
   ese archivo; lo que cruza carpetas sube a `src/types/`.

---

## Quick reference

| Decisión | Regla |
| --- | --- |
| Props de un componente | Inline en el `.tsx`, siempre `TProps` |
| Args de una función | Inline en su archivo |
| Compartido en la misma carpeta | `types.ts` co-locado |
| Consumido por servicios, hooks o varias pantallas | `src/types/business/<dominio>.ts` |
| Infraestructura (HTTP, rutas, caché, menú) | `src/types/system/technical.ts` |
| Primitiva de UI reutilizable | `src/types/system/transversal.ts` |
| Archivo suelto en `src/types/` raíz | **Prohibido**. Ahí solo vive `index.ts` |
| Declaración por defecto | `type`, no `interface` |
| Idioma | Inglés — excepto campos que replican el contrato del backend |
| Import de un tipo | `import type { … } from '@/types'` |
| Union de valores + su opción de select | `XxxValue` + `XxxOption = SelectOption<XxxValue>` |
| Tipo nuevo que se parece a otro | Derivar con `Pick`/`Omit`/`Partial`/`&` |

---

## 1. Dónde vive el tipo

Recorre el árbol de arriba hacia abajo y detente en el primer sí:

```
¿Es props de UN componente o args de UNA función?
  → sí: inline en ese archivo. Props se llaman TProps, sin excepción.

¿Lo comparten 2+ archivos de la MISMA carpeta, y nadie fuera?
  → sí: types.ts co-locado en esa carpeta.
     Ej: components/molecules/selects/types.ts, contexts/noveltyRegistration/types.ts

¿Lo consume un servicio, un hook, o más de una pantalla?
  → sí: src/types/business/<dominio>.ts — el dominio ya existente que le
     corresponde (affiliate, beneficiaries, novelty, payrollCalendar…).
     ¿Ningún dominio le calza? Se crea el archivo nuevo y se registra en
     business/index.ts. Nunca se cuelga de un dominio ajeno "porque queda cerca".

¿Es infraestructura, no negocio (HTTP, rutas, caché, menú)?
  → sí: src/types/system/technical.ts

¿Es una primitiva de UI reutilizable (LabeledValue, SelectOption, ProcessStep)?
  → sí: src/types/system/transversal.ts
```

**Prohibido crear archivos sueltos en `src/types/`.** La raíz solo contiene
`index.ts`. Todo tipo nuevo entra por `business/` o `system/`.

### Props: inline, y derivadas cuando se repiten

Los props de un componente son el caso donde declarar en el archivo **es** la
buena práctica: nadie más los consume y sacarlos rompe la lectura del
componente. Pero cuando varios componentes comparten la misma forma de props,
la forma se extrae una vez y cada componente la especializa:

```ts
// components/molecules/selects/types.ts — declarado una vez
export type TSelectProps<TOption> = {
  name?: string
  value?: TOption | null
  onChange?: (newValue: SingleValue<TOption>, actionMeta: ActionMeta<TOption>) => void
  // …
}

// PayrollCalendarStatusSelect.tsx — especializado, no recopiado
type TProps = TSelectProps<PayrollCalendarStatusOption>
```

Este es el patrón a seguir cuando aparece el tercer componente con props casi
iguales. Con dos, todavía puede ser coincidencia.

---

## 2. No redeclarar: derivar

**Antes de escribir `type X = {`, busca.** Si el tipo que vas a declarar
comparte 2 o más campos con uno existente, no lo copies: derívalo.

```bash
# ¿ya existe algo con este nombre o cerca?
grep -rn "Beneficiary" src/types/

# ¿ya existe algo con esta forma? busca por un campo distintivo
grep -rn "vigencia" src/types/
```

### Qué utilidad usar

| Necesitas | Utilidad | Ejemplo real del repo |
| --- | --- | --- |
| Un subconjunto de campos | `Pick<T, K>` | `Pick<PayrollCalendarVersion, 'vigencia' \| 'estado'>` |
| Todo menos unos campos | `Omit<T, K>` | `Omit<NoveltySummaryResponse, 'addedBeneficiaries' \| 'removedBeneficiaries'>` |
| Los mismos campos, opcionales | `Partial<T>` | `PayrollCalendarFilter` |
| Un mapa llave → valor | `Record<K, V>` | `Partial<Record<ModifiableDataValue, string>>` |
| Lo mismo más campos nuevos | `T & { … }` | `ModifiedBeneficiarySummary = BeneficiaryIdentitySummary & { … }` |
| La misma forma con otro tipo dentro | Genérico `<T>` | `SelectOption<TValue>` |
| Reemplazar el tipo de un campo | `Omit<T, K> & { K: nuevo }` | `NoveltyAnalysisBeneficiariesResponse` |

### Ejemplo: la misma entidad, derivada

`PayrollCalendarFilter` filtra sobre `PayrollCalendarVersion`. Es la misma
entidad vista de otra forma, así que se deriva:

```ts
// ❌ Redeclarado — si `estado` cambia de tipo, esto queda desincronizado
export type PayrollCalendarFilter = {
  vigencia?: number
  estado?: PayrollCalendarStatus
}

// ✅ Derivado — sigue a la fuente sola
export type PayrollCalendarFilter =
  Partial<Pick<PayrollCalendarVersion, 'vigencia' | 'estado'>>
```

### Cuándo NO derivar

Derivar acopla. Solo se deriva cuando los dos tipos son **la misma entidad**;
si son contratos distintos que hoy coinciden, se declaran por separado aunque
se parezcan.

`BeneficiaryRecord` (lo que devuelve el backend) y `NewBeneficiaryDraft` (lo
que el usuario captura para crear uno) describen el mismo concepto de negocio
pero son **contratos distintos con dueños distintos**: uno lo mueve el backend,
el otro el formulario. Derivar uno del otro haría que un cambio del backend
rompa el formulario sin razón. Se quedan separados.

La pregunta que decide: *si el tipo fuente cambia, ¿el derivado DEBE cambiar
también?* Sí → derivar. No → declarar aparte.

---

## 3. Naming

**Todo en inglés**: tipos, campos, genéricos, nombres de archivo.

**La única excepción** son los campos que replican literalmente el contrato del
backend. Ahí el campo mantiene el nombre del contrato — renombrarlo obligaría a
mapear en cada punto de consumo — pero **el tipo que los contiene sí se nombra
en inglés**:

```ts
export type AffiliateInfo = {          // ← nombre en inglés
  identificacion: Identification       // ← campos del contrato, intocables
  primerNombre: string
  segundoNombre: string | null
}
```

Cuando un tipo mezcla ambos, deja explícito de dónde viene el contrato con un
comentario de una línea, no con un sufijo en el nombre.

### Convenciones de nombre

| Forma | Convención | Ejemplo |
| --- | --- | --- |
| Union de valores literales | `XxxValue` | `NoveltyTypeValue`, `BeneficiaryStatusValue` |
| Su opción de select | `XxxOption = SelectOption<XxxValue>` | `BeneficiaryStatusOption` |
| Respuesta de un endpoint | `XxxResponse` | `AffiliateByIdResponse` |
| Body de un endpoint | `XxxRequest` o `XxxPayload` | `NoveltySummaryRequest` |
| Props de componente | `TProps` | siempre, en el `.tsx` |
| Genérico | `T` + nombre | `TValue`, `TOption` |

Todo tipo va en **PascalCase**. Hay outliers en el repo (`variantType` en
`transversal.ts`, `PayrollCalendarStatus` sin el sufijo `Value`); se corrigen
al tocar ese archivo, no en un barrido aparte.

---

## 4. `type` vs `interface`

**`type` por defecto.** El repo tiene 254 `type` contra 5 `interface`: la
convención ya está tomada. `type` compone con `&`, `Omit`, `Pick` y uniones;
`interface` no.

`interface` solo se justifica en un caso: **extender un tipo que viene de una
librería**, donde `extends` expresa la intención mejor que una intersección.

```ts
// ✅ Único uso legítimo en el repo
interface AxiosResponseFromCache extends AxiosResponse {
  __fromCache: boolean
}
```

Si estás por escribir `interface` y no estás extendiendo un tipo externo, es un
`type`.

---

## 5. Modo auditoría

Cuando toques un archivo de tipos, o cuando el árbol de decisión te mande a un
dominio que ya existe, corre esta revisión antes de agregar:

```bash
# 1. Tipos con nombres casi iguales — candidatos a colapsar
grep -rhn "^export type" src/types/ | sort

# 2. Formas duplicadas: busca un campo distintivo del tipo que vas a crear
grep -rn "fechaNacimiento\|idTramite" src/types/

# 3. Tipos declarados fuera de src/types/ que ya cruzaron de carpeta
grep -rn "^export type" src/components src/pages src/hooks --include="*.ts" --include="*.tsx"
```

Para colapsar dos tipos casi iguales sin romper consumidores:

1. Elige la fuente de verdad: el más completo, o el que refleja el contrato del backend.
2. Reescribe el otro como derivación (`Pick`/`Omit`/`Partial`/`&`).
3. **No borres el nombre del tipo derivado** — sigue exportándose, ahora apunta a la derivación. Los imports existentes siguen compilando.
4. Corre `npx tsc --noEmit`. Si pasa, el colapso es correcto por construcción.

El punto 3 es lo que hace segura esta operación: solo cambia la definición, no
la superficie pública.

---

## 6. Tamaño de archivo

Cerberus bloquea el commit de archivos de código sobre **200 líneas**.
`novelty.ts` ya va en 162.

Cuando un archivo de dominio se acerca al límite, se parte **por sub-dominio
real** — un archivo nuevo que un lector pueda nombrar sin abrirlo — y se
registra en el `index.ts` del nivel. Nunca por corte arbitrario a mitad de
lista.

Si el archivo creció por tipos casi duplicados, primero corre el modo auditoría
de la sección 5: colapsar suele devolver más líneas que partir.

---

## Anti-patrones

| Anti-patrón | Por qué rompe | En su lugar |
| --- | --- | --- |
| `type X = { …los mismos 8 campos de Y… }` | Dos fuentes de verdad; se desincronizan en silencio | Derivar de `Y` |
| Archivo nuevo en `src/types/` raíz | Rompe la taxonomía; nadie sabe si es negocio o sistema | `business/` o `system/` |
| Tipo de dominio declarado dentro de un `.tsx` | El segundo consumidor lo copia en vez de importarlo | Subirlo a `src/types/business/` |
| `interface` para un objeto plano | No compone con `Omit`/`Pick`/uniones | `type` |
| Props llamadas `Props` o `ModalProps` | Convive con `TProps` y obliga a leer para saber cuál es | `TProps` |
| Campos en español en un tipo que no es contrato del backend | Mezcla idiomas sin razón que lo justifique | Inglés |
| `import { SomeType }` sin `type` | El bundler no puede borrarlo con certeza | `import type { SomeType }` |
| Derivar dos contratos distintos porque hoy coinciden | Un cambio del backend rompe el formulario | Declararlos separados (ver §2) |

**Nota sobre barrels y tree-shaking:** la regla global de performance prohíbe
barrel imports que anulen el tree-shaking. `@/types` **no** es ese caso: es un
barrel exclusivamente de tipos, y los tipos se borran en compilación. Importar
desde `@/types` con `import type` tiene costo runtime cero. La regla sigue
aplicando a barrels de código.

---

## Red flags — para antes de escribir

- Estás copiando campos de otro tipo con el mouse.
- Estás creando un archivo directamente en `src/types/`.
- Estás escribiendo `interface` y no hay un tipo de librería de por medio.
- Estás nombrando las props de un componente con algo que no es `TProps`.
- Estás declarando un tipo en un `.tsx` que un servicio también va a necesitar.
- Estás escribiendo campos en español y no vienen de un contrato del backend.

Cualquiera de estos: vuelve al árbol de la sección 1 o al `grep` de la
sección 2 antes de seguir.
