# Quiz de /plan → lo que tiene que hacer Cleo

> **Para el chat del bot de WhatsApp (Cleo, n8n + Chatwoot, `D:\Claude\Bot WhatsApp`).**
> La web ya está hecha: este documento explica qué le llega a Cleo y qué tiene que
> responder. Hay dos piezas para armar del lado del bot:
>
> 1. **Workflow "Gravity · Leads quiz"**: recibe el lead del formulario y lo guarda.
> 2. **Respuesta de Cleo al mensaje del quiz**: manda el plan que corresponde, etiqueta
>    la charla y la lleva a agendar la auditoría.

---

## 1. Cómo es el embudo

1. Anuncio de Meta → `https://gravity-studios.com/plan` (con UTM y `fbclid`).
2. La persona responde 6 preguntas (una por pantalla).
3. Deja nombre, WhatsApp e @ de Instagram de la clínica. En ese momento la web manda
   el **lead** al webhook de n8n (pieza 1), aunque después no escriba.
4. Pantalla "Abrí WhatsApp": a los 8 segundos (o al tocar el botón) se abre WhatsApp
   con el **mensaje ya escrito** al número de Juan **+54 9 11 2757 0674**, el mismo que
   atiende Cleo.
5. La persona toca enviar → Cleo le responde con su plan (pieza 2).

El texto del quiz y el armado del mensaje viven en `src/data/quiz.ts` de la web.

---

## 2. Las preguntas y sus claves

Cada respuesta tiene una clave corta. Las claves llegan en el lead (pieza 1). En el
mensaje de WhatsApp viaja la frase, y además la **referencia** con las claves de
cuello de botella y momento.

| Pregunta | Campo | Claves |
| --- | --- | --- |
| ¿Qué tipo de clínica tenés? | `clinica` | `estetica` · `odontologia` · `cirugia` · `dermatologia` · `otra` |
| ¿Cuántas consultas o valoraciones agendás por semana? | `consultas` | `0-5` · `5-15` · `15-30` · `30+` |
| ¿De dónde llegan hoy la mayoría de tus pacientes? | `origen` | `boca` · `instagram` · `anuncios` · `nose` |
| **¿Cuál es tu principal cuello de botella hoy?** | **`cuello`** | **`consultas` · `curiosos` · `respuesta` · `contenido` · `ausencias`** |
| ¿Quién responde hoy los mensajes de WhatsApp e Instagram? | `responde` | `yo` · `asistente` · `nadie` · `bot` |
| ¿En qué punto estás hoy? | `momento` | `1` = "Quiero llenar mi agenda en los próximos 90 días" · `2` = "Solo estoy curioseando" |

**El cuello de botella elige el plan** (sección 4). **El momento define la temperatura:**
`1` = caliente, `2` = frío.

---

## 3. El mensaje que le llega a Cleo

### Formato

```
Hola, quiero recibir mi plan personalizado para mi clínica.
Soy {nombre} ({@instagram}) y tengo una clínica de {clinica}. Hoy agendamos {consultas} consultas por semana, {origen}, {responde} y mi principal cuello de botella es que {cuello}.

Ref: PG-{clave cuello}-{momento}
```

- `{nombre}` es solo el primer nombre que escribió.
- **Cómo reconocerlo:** el mensaje empieza con `Hola, quiero recibir mi plan personalizado`
  **o** tiene una línea `Ref: PG-…`. Lo más confiable es la referencia:
  `/Ref:\s*PG-(consultas|curiosos|respuesta|contenido|ausencias)-([12])/`.

### Ejemplo real (generado por la web)

```
Hola, quiero recibir mi plan personalizado para mi clínica.
Soy Ana (@clinica.ana) y tengo una clínica de medicina estética. Hoy agendamos entre 5 y 15 consultas por semana, la mayoría de los pacientes llega por boca en boca, los mensajes los responde una asistente y mi principal cuello de botella es que llegan consultas pero preguntan el precio y desaparecen.

Ref: PG-curiosos-1
```

### Las frases exactas de cada respuesta

Sirven para leer las otras respuestas del texto si hace falta. Las claves también están en el lead.

| Campo | Clave → frase en el mensaje |
| --- | --- |
| `clinica` | `estetica` → "medicina estética" · `odontologia` → "odontología estética" · `cirugia` → "cirugía plástica" · `dermatologia` → "dermatología" · `otra` → "otra especialidad" |
| `consultas` | `0-5` → "menos de 5" · `5-15` → "entre 5 y 15" · `15-30` → "entre 15 y 30" · `30+` → "más de 30" |
| `origen` | `boca` → "la mayoría de los pacientes llega por boca en boca" · `instagram` → "…por Instagram orgánico" · `anuncios` → "…por anuncios" · `nose` → "no tengo claro de dónde llega la mayoría de los pacientes" |
| `responde` | `yo` → "los mensajes los respondo yo" · `asistente` → "…los responde una asistente" · `nadie` → "…no los responde nadie de forma fija" · `bot` → "…los responde un bot" |
| `cuello` | `consultas` → "no llegan suficientes consultas" · `curiosos` → "llegan consultas pero preguntan el precio y desaparecen" · `respuesta` → "no damos abasto para responder rápido" · `contenido` → "no tengo tiempo para grabar contenido" · `ausencias` → "agendan pero después no vienen" |

---

## 4. Los 5 planes

Cada plan va en **3 mensajes cortos**, con unos segundos de "escribiendo…" entre uno y
otro. Nada de un bloque gigante.

Variables para personalizar:
- `{nombre}`
- `{clinica}`: la frase del tipo de clínica, por ejemplo "medicina estética"
- `{consultas}`: la frase de consultas por semana, por ejemplo "entre 5 y 15"

Si falta alguna, se saca la parte de la oración que la usa.

Los casos que se citan son los únicos reales que se pueden mencionar: **Dr. Guillermo
Cienfuegos** (cirujano plástico, Río Cuarto) y **Dra. Carolina Alonso** (odontóloga
estética, Bogotá). No inventar números ni otros casos.

### Plan `consultas`: "No llegan suficientes consultas"

**Mensaje 1 (diagnóstico)**
> ¡Hola {nombre}! Acá va tu plan 👇
>
> Con {consultas} consultas por semana, el problema no es tu servicio: es que hoy tu clínica de {clinica} depende de que el paciente te encuentre. Eso hace que la agenda sea impredecible.

**Mensaje 2 (plan de 90 días)**
> *Tu plan para los próximos 90 días:*
>
> *1. Oferta clara (semanas 1–2):* un tratamiento estrella con una propuesta que se entienda en 5 segundos. Sin eso, ningún anuncio funciona.
> *2. Contenido + anuncios (semanas 2–8):* videos que muestran resultados y responden las dudas antes de que pregunten. Con tu clon de IA no tenés que grabar 20 videos por mes.
> *3. Atención y agenda (semanas 4–12):* cada consulta que entra se responde al instante y termina en un turno agendado, no en un "lo pienso".
>
> La meta: 40 consultas agendadas en 90 días.

**Mensaje 3 (caso + pregunta)**
> Es lo mismo que hicimos con el Dr. Guillermo Cienfuegos, cirujano plástico en Río Cuarto: pasó de $0 vendidos en Instagram a USD 12.000 por semana.
>
> Para bajarlo a tu clínica: ¿cuál es el tratamiento que más te gustaría llenar?

### Plan `curiosos`: "Preguntan el precio y desaparecen"

**Mensaje 1**
> ¡Hola {nombre}! Acá va tu plan 👇
>
> Cuando el paciente pregunta "¿cuánto sale?" y desaparece, casi nunca es el precio: es que todavía no vio el valor. Le llega un número antes que una razón para elegirte.

**Mensaje 2**
> *Tu plan para los próximos 90 días:*
>
> *1. Contenido que filtra (semanas 1–4):* videos que explican el tratamiento, muestran resultados y hablan de la inversión. El que escribe después de verlos ya viene convencido.
> *2. Respuesta que vende (semanas 2–6):* nunca contestar solo el precio. Primero entender qué quiere mejorar, después explicar y recién ahí invitar a la valoración. Lo hace un asistente con IA las 24 h, con el tono de tu clínica.
> *3. Filtro antes de la agenda (semanas 4–12):* solo llegan a tu agenda pacientes calificados, no curiosos.

**Mensaje 3**
> El Dr. Guillermo Cienfuegos tenía el mismo problema: mucho movimiento y pocas ventas. Cambiamos el contenido para que venda en lugar de buscar vistas, y pasó a USD 12.000 por semana desde Instagram.
>
> Contame: ¿qué tratamiento es el que más te preguntan y menos cerrás?

### Plan `respuesta`: "No damos abasto para responder rápido"

**Mensaje 1**
> ¡Hola {nombre}! Acá va tu plan 👇
>
> Cada mensaje que tarda horas en responderse es un paciente que le escribe a otra clínica. El problema no es la demanda, es la capacidad de atenderla a tiempo.

**Mensaje 2**
> *Tu plan para los próximos 90 días:*
>
> *1. Asistente 24/7 (semanas 1–3):* un asistente con IA en WhatsApp e Instagram que responde al instante, hace las preguntas correctas y anota los datos del paciente. Antes de salir a hablar con pacientes lo probás todo lo que quieras.
> *2. Agenda conectada (semanas 2–4):* reserva directa en el calendario de cada profesional, sin choques de horarios y con recordatorios automáticos.
> *3. Humano solo cuando suma (semanas 4–12):* las consultas difíciles pasan a tu equipo, ya calificadas y con todo el contexto.

**Mensaje 3**
> Es justo lo que estás viendo ahora: te estoy respondiendo yo, el asistente de Gravity 😉 Esto mismo lo instalamos en tu clínica.
>
> ¿Cuántos mensajes por día les llegan más o menos?

### Plan `contenido`: "No tengo tiempo para grabar contenido"

**Mensaje 1**
> ¡Hola {nombre}! Acá va tu plan 👇
>
> Hoy el paciente elige al especialista que ve hablando en cámara. Pero entre la consulta y la clínica, grabar todas las semanas es imposible. Y si no hay contenido, no hay consultas.

**Mensaje 2**
> *Tu plan para los próximos 90 días:*
>
> *1. Tu clon de IA (semanas 1–2):* grabás una sola vez y creamos un clon con tu imagen y tu voz.
> *2. Contenido y anuncios sin grabar (semanas 2–12):* nosotros hacemos los guiones, el clon los graba y nosotros editamos. Vos solo aprobás.
> *3. Del video a la agenda (semanas 4–12):* cada video lleva a una conversación por WhatsApp que termina en un turno agendado.

**Mensaje 3**
> Así trabajamos con la Dra. Carolina Alonso, odontóloga estética en Bogotá. No tenía tiempo para grabar: creamos su clon de IA, que hace el contenido por ella, y pasó de cero agendas a ocho por semana.
>
> ¿Querés ver cómo quedaría un video con tu clon?

### Plan `ausencias`: "Agendan pero no vienen"

**Mensaje 1**
> ¡Hola {nombre}! Acá va tu plan 👇
>
> Cuando agendan y no vienen, casi siempre es porque el paciente agendó sin estar convencido o porque nadie le recordó el turno. Las dos cosas se resuelven con sistema.

**Mensaje 2**
> *Tu plan para los próximos 90 días:*
>
> *1. Calificar antes de agendar (semanas 1–3):* el paciente llega a la agenda sabiendo qué tratamiento le conviene y cuánto invierte. No es lo mismo un curioso que un paciente decidido.
> *2. Recordatorios automáticos (semanas 2–4):* confirmación al agendar, recordatorio el día anterior y unas horas antes. Si no puede venir, reprograma con un clic.
> *3. Seguimiento (semanas 4–12):* el que no vino recibe un mensaje para volver a agendar, en vez de perderse.

**Mensaje 3**
> Con la Dra. Carolina Alonso armamos todo el recorrido, del contenido a la agenda, y pasó de cero agendas a ocho por semana.
>
> ¿Más o menos cuántos pacientes por semana te quedan sin venir?

### Después del plan, en los 5 casos

- Seguir la charla con la respuesta a la pregunta del mensaje 3, como Cleo ya lo hace hoy.
- El objetivo es la **auditoría gratis**. Link de Calendly:
  `https://calendly.com/d/cyfg-zrj-grb/llamada-de-consultoria-con-gravity-studios-clon`.
- **Lead frío (momento `2`):** mismo plan. Pero no empujar la auditoría enseguida:
  primero la pregunta, y la invitación recién si responde con interés.

---

## 5. Etiquetas de Chatwoot

| Etiqueta | Cuándo |
| --- | --- |
| `quiz_lead` | Siempre que llega un mensaje del quiz |
| `quiz_consultas` · `quiz_curiosos` · `quiz_respuesta` · `quiz_contenido` · `quiz_ausencias` | Según el cuello de botella |
| `quiz_frio` | Si el momento es `2` ("Solo estoy curioseando") |

Van en minúsculas, igual que las `web_*`.

---

## 6. Pieza 1: workflow "Gravity · Leads quiz" (webhook del formulario)

**URL que ya usa la web** (Worker, `worker/index.js`, constante `N8N_LEADS`):

```
POST https://n8n.gravity-studios.com/webhook/quiz-lead-36a69739
Content-Type: application/json
```

**El Worker ya valida todo antes de mandar.**
- Solo llegan las claves de la tabla de la sección 2.
- El teléfono viene en formato `+` y entre 8 y 15 dígitos.
- El Instagram viene como `@usuario`.
- Los bots que caen en el campo trampa no se reenvían.

**Payload de ejemplo**

```json
{
  "received_at": "2026-11-23T16:14:50.760Z",
  "name": "Ana María",
  "phone": "+541123456789",
  "instagram": "@clinica.ana",
  "answers": {
    "clinica": "estetica",
    "consultas": "5-15",
    "origen": "boca",
    "cuello": "curiosos",
    "responde": "asistente",
    "momento": "1"
  },
  "temperature": "caliente",
  "ref": "PG-curiosos-1",
  "utm": { "source": "facebook", "medium": "paid", "campaign": "plan-clinicas" },
  "fbclid": "IwAR…",
  "country": "AR"
}
```

`utm`, `fbclid` y `country` pueden faltar.

**Qué tiene que hacer el workflow:**
1. **Guardar la fila en una hoja de Google "Leads quiz"** con estas columnas: fecha, nombre, teléfono, Instagram, las 6 respuestas, temperatura, ref, UTM, país, y una columna "¿Escribió por WhatsApp?" que se marca en el paso 3.
2. Si se puede, **crear o actualizar el contacto en Chatwoot** por teléfono, con nombre e Instagram.
3. **Cruce con la charla:** cuando llega el mensaje de WhatsApp con `Ref: PG-…`, buscar la fila por teléfono y marcar "Escribió por WhatsApp = sí". Así se ve quién dejó los datos y nunca escribió, para hacerle seguimiento.
   - **Ojo con Argentina:** el formulario guarda `+54` + el número tal como lo escribieron, por ejemplo `+541123456789`. En WhatsApp el mismo número llega como `5491123456789`, con el 9. Para comparar, sacar el `9` después del `54`, o comparar los últimos 10 dígitos.
4. Responder `200` rápido. La web no espera la respuesta.

**Mientras el workflow no exista**, el webhook da 404 y el lead no se pierde: el Worker lo escribe en sus logs (Cloudflare → Workers → web-gravity → Logs) con el texto `LEAD NO GUARDADO`.

---

## 7. Casos borde

| Situación | Qué hace Cleo |
| --- | --- |
| Borró la línea `Ref:` o editó el mensaje | Intentar leer el cuello de botella por la frase (tabla de la sección 3). Si no aparece, preguntarlo con las 5 opciones y mandar el plan después. |
| Escribe desde otro número que el del formulario | Igual se reconoce por el texto. El cruce con la hoja queda sin hacer, no es un problema. |
| Manda el mensaje dos veces | No repetir el plan. Si ya tiene `quiz_lead`, seguir la conversación donde quedó. |
| Ya era contacto de Cleo (charla vieja) | Mandar el plan igual y sumar las etiquetas `quiz_*`. |
| Lead frío (`momento` = 2) | Mismo plan, seguimiento más suave (sección 4). |
| Pregunta precios de Gravity | Lo mismo que hoy: llevarlo a la auditoría. |

---

## 8. Cómo probarlo de punta a punta

1. Entrar a `https://gravity-studios.com/plan?utm_source=test`, responder el quiz con un número de prueba y abrir WhatsApp.
2. Verificar:
   - En la hoja "Leads quiz", la fila con `utm.source = test`.
   - En Chatwoot, la charla con `quiz_lead` y `quiz_<clave>`.
   - Que Cleo mandó el plan correcto en 3 mensajes.
3. Repetir con "Solo estoy curioseando" y verificar `quiz_frio`.
