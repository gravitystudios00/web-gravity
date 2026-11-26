# Tracking y medición de la web

Qué se armó para saber **quién** entra a gravity-studios.com, **de dónde**
viene y **qué hace** adentro, y cómo se ve cada cosa.

- **17/10/2026:** primera versión, con ManyChat.
- **02/11/2026:** pasa a Chatwoot. Cleo ahora corre en n8n + Chatwoot (ver la
  nota de Obsidian `Gravity/WhatsApp/Bot_WhatsApp_n8n_Chatwoot.md`), y el link
  de Cleo lleva un código propio (`cw`) en lugar del ID de ManyChat (`mc`).

---

## 1. En una línea

Cada persona que entra desde el link de Cleo (WhatsApp) llega identificada con
un código de contacto. A partir de ahí, la web:

- graba su sesión en **Microsoft Clarity**, a su nombre;
- manda sus acciones a **Google Analytics 4**;
- le pone **etiquetas a su charla en Chatwoot** según lo que hizo (vio el
  video, eligió horario, agendó…);
- le pasa su código a **Calendly**, así cada reserva dice quién la hizo.

---

## 2. Los links

Cada link a la web lleva **UTMs**: etiquetas en la URL que dicen de dónde viene
la visita. Analytics y Clarity las leen solas.

| Dónde está el link | URL |
|---|---|
| Mensaje de bienvenida de Cleo (Chatwoot, desde 02/11/2026) | `https://gravity-studios.com/?utm_source=whatsapp&utm_medium=cleo&cw=<código>` |
| Bio de Instagram (@gravity.clinicas) | `https://gravity-studios.com/?utm_source=instagram&utm_medium=bio&utm_content=gravity.clinicas` |
| ~~Mensaje de Cleo en ManyChat~~ (hasta 28/10/2026) | `…&utm_medium=cleo&mc={{ID de contacto}}` |

- **El link de Cleo lo arma el bot solo** (nodo "Armar respuesta" del workflow
  "Bot Gravity · Entrada"). No hay que cargarlo a mano en ningún lado.
- Se mantuvieron los mismos `utm_source` y `utm_medium` que con ManyChat: los
  informes siguen de corrido.
- Los links viejos con `mc` siguen funcionando: si alguien los abre, las
  etiquetas van a ManyChat como antes.

### Qué significa cada parámetro

| Parámetro | Para qué sirve | Valores que usamos |
|---|---|---|
| `utm_source` | De qué plataforma viene | `whatsapp`, `instagram` |
| `utm_medium` | Desde qué lugar de esa plataforma | `cleo` (mensaje automático), `bio` (perfil) |
| `utm_campaign` | Campaña puntual (opcional) | — (todavía no se usa) |
| `utm_content` | Qué cuenta o pieza puntual (opcional) | `gravity.clinicas` (bio de esa cuenta) |
| `cw` | Código del contacto en el bot de Chatwoot: identifica a la persona | lo genera el bot |
| `mc` | ID del contacto en ManyChat (links viejos) | lo completaba ManyChat |

### El código `cw`

- Son **12 letras y números al azar** (por ejemplo `5ea7shk90lsq`), uno por
  contacto, guardado en la base del bot (`contactos.web_id`).
- Se genera en el mensaje de bienvenida. Si el contacto vuelve a escribir,
  conserva el mismo. "reiniciar bot" lo borra y la próxima bienvenida trae
  uno nuevo.
- **Por qué no el número de contacto de Chatwoot:** esos números son
  correlativos (1, 2, 3…). Cualquiera podría inventar el de otro y ponerle
  etiquetas. Un código al azar no se puede adivinar.
- **Dónde verlo:** en la nota interna que deja el bot al pasarle la charla a
  una persona, línea **"Web (Clarity): <código>"**.

### Links nuevos

Para cualquier link nuevo, mismo formato. Ejemplos:

- Historia de Instagram: `?utm_source=instagram&utm_medium=historia`
- Un anuncio: `?utm_source=meta&utm_medium=ads&utm_campaign=nombre-de-la-campaña`

Todo en minúsculas, sin espacios ni acentos.

---

## 3. Cómo se identifica a la persona

1. La persona toca el link de Cleo. Llega con `?cw=5ea7shk90lsq`.
2. La web guarda el código y los UTM **en su navegador**. Si vuelve otro día
   sin el link, sigue identificada.
3. La web **borra el código de la barra de direcciones**. Si la persona
   reenvía el link a alguien, ese otro no queda registrado como ella.
4. Con el código, la web:
   - le pone nombre a la grabación en Clarity: **"WhatsApp 5ea7shk90lsq"**;
   - se lo pasa a Analytics como `user_id` (`cw-5ea7shk90lsq`);
   - se lo pasa a Calendly en `utm_content` (`cw-5ea7shk90lsq`);
   - lo usa para ponerle etiquetas a su charla en Chatwoot.

**Límite:** quien entra desde la bio de Instagram llega **anónimo**, porque ese
link es igual para todos. Se lo ve en Clarity y Analytics como visitante de
Instagram, pero sin nombre.

---

## 4. Qué medimos

| Lo que hace la persona | Evento en Analytics y Clarity | Etiqueta en Chatwoot | Etiqueta en ManyChat (links viejos) | Evento de Meta |
|---|---|---|---|---|
| Entra a cualquier página | `page_view` | — | — | `PageView` |
| Le da play al video | `vsl_play` | `web_vio_video` | `Web_vio_video` | `ViewContent` |
| Llega a la mitad del video | `vsl_50` | `web_vio_video_50` | `Web_vio_video_50` | — |
| Llega al 90% del video | `vsl_90` | `web_vio_video_completo` | `Web_vio_video_completo` | `VideoCompleto` |
| Toca un botón de "Agendá tu auditoría" | `calendar_click` | `web_click_agendar` | `Web_click_agendar` | — |
| Elige un horario en Calendly | `calendly_time` | `web_eligio_horario` | `Web_eligio_horario` | `EligioHorario` |
| Confirma la reserva en Calendly | `calendly_booked` | `web_agendo` (verde) | `Web_agendo` | `Schedule` |
| Toca un botón de WhatsApp | `whatsapp_click` | `web_click_whatsapp` | `Web_click_whatsapp` | `Contact` |
| Abre el caso completo de Guille | `case_click` | `web_vio_caso` | `Web_vio_caso` | — |

Detalle de Meta (qué va por pixel y qué por la API) en la sección 7.

- Los clics llevan además un dato `source` que dice **qué botón** fue: `hero`,
  `nav`, `agenda`, `flotante`, `cta-final`, etc.
- Las etiquetas de Chatwoot van **en minúsculas** porque Chatwoot no acepta
  mayúsculas. Ya están creadas en la cuenta "Gravity IA" (amarillas, y
  `web_agendo` en verde), cada una con su descripción.
- Se ponen en la **charla** del contacto (la última que registró el bot), no
  se borran las que ya tenía, y si ya la tenía no se repite.

**Probado el 02/11/2026** en producción: un evento mandado desde
gravity-studios.com con un código de prueba puso `web_vio_video` y
`web_click_agendar` en la charla de Juan en Chatwoot. Después se limpió.

---

## 5. Dónde se ve cada cosa

### Chatwoot — qué hizo cada contacto
- **Dónde:** chat.gravity-studios.com → la charla → panel derecho,
  **Etiquetas de la conversación**.
- **Filtrar:** en la bandeja, **Filtrar → Etiquetas** → por ejemplo
  `web_eligio_horario`.
- **Para qué:** priorizar a quien ya vio el video completo o abrió el
  calendario, y hacer seguimiento. Ejemplo: quien tiene `web_eligio_horario`
  pero no `web_agendo` empezó a reservar y no terminó.

### Microsoft Clarity — qué hizo cada persona
- **Dónde:** clarity.microsoft.com, proyecto `yzain7fn0c`.
- **Qué muestra:** la grabación de cada visita (como un video de su pantalla),
  mapas de calor de clics y de scroll, y los eventos de la tabla de arriba.
- **Buscar a una persona:** Filtros → **Custom user ID** → pegar su código
  (está en la nota interna del bot, "Web (Clarity)"). En la lista, sus
  grabaciones se llaman **"WhatsApp <código>"** (o "ManyChat <ID>" las viejas).
- El "User ID" que aparece en cada tarjeta de la lista (por ejemplo
  `g36mah`) es un ID **interno de Clarity**, no el del contacto.
- **Separar por origen (UTM):**
  - Filtros → **Tráfico** → Fuente / Medio / Campaña. Lee los UTM de la URL
    con la que entró a esa sesión.
  - Filtros → **Custom filters → Custom tags** → `utm_source` /
    `utm_medium` / `cw`. Los pone la web y se mantienen aunque la persona
    vuelva otro día sin UTM en el link.
  - En cada grabación: **More details** muestra la fuente, el medio y las
    etiquetas personalizadas.
- Si una sesión no tiene ni UTM ni etiquetas, entró directo (escribiendo la
  dirección, desde un buscador o desde un link sin UTM).
- Las grabaciones aparecen entre 1 y 2 horas después de la visita.
- Es gratis y sin límite de grabaciones.

### Google Analytics 4 — números y embudo
- **Dónde:** analytics.google.com, propiedad con ID `G-4K6QNGC64M`.
- **Qué muestra:** cuánta gente entra, desde dónde (por UTM), y cuántos
  llegan a cada paso: video → mitad → final → calendario → reserva.
- **Ver origen:** Informes → Adquisición → Adquisición de tráfico, por
  "Fuente / medio de la sesión".
- **Ver eventos:** Informes → Interacción → Eventos.
- Los eventos nuevos tardan 24–48 h en aparecer en las listas.

### Calendly — quién agendó
- En cada reserva, los campos UTM traen el origen (`whatsapp` / `cleo`) y en
  `utm_content` el código del contacto (`cw-…`, o `mc-…` en las viejas).

---

## 6. Cómo viaja un evento (Chatwoot)

```
Navegador ──► gravity-studios.com/api/mc          (Worker de Cloudflare)
                 │  valida el evento y el código
                 ▼
              n8n.gravity-studios.com/webhook/web-evento-4f9c2a
                 │  workflow "Bot Gravity · Eventos web" (botWebEventos01)
                 │  busca el código en la base del bot → número de charla
                 ▼
              API de Chatwoot: lee las etiquetas de la charla y suma la nueva
```

- **Sin claves nuevas:** el Worker no necesita ninguna clave para esto. n8n
  usa la credencial "Chatwoot Bot" (el token del agent bot), que ya existía.
- **Seguridad:** el Worker solo acepta los 8 eventos de la tabla, desde la
  propia web, y n8n solo actúa si el código existe en la base. Nadie puede
  poner otras etiquetas ni etiquetar a otro contacto.
- **Ver qué pasó con cada evento:** n8n → workflow "Bot Gravity · Eventos web"
  → **Executions**.
- **El código del workflow** está en `D:\Claude\Bot WhatsApp\servidor\bot\`
  (nodos `web-evento.js` y `web-etiqueta.js`, y `generar.mjs`).

---

## 7. Meta: pixel y API de conversiones (desde el 26/11/2026)

**Un solo conjunto de datos para toda la web:** "Gravity Pixel - 23/11"
(`4149392285331933`), compartido con la cuenta publicitaria Gravity Studios.
Lo usan el pixel del navegador (`src/data/site.ts`) y la API de conversiones del
Worker (`META_PIXEL_ID` en `wrangler.jsonc`, token en el secret
`META_CAPI_TOKEN`). El conjunto de WhatsApp (`1646784303520550`) es otro: lo
usa el bot de n8n para eventos de mensajes.

**Un evento distinto por funnel**, así cada campaña se optimiza por lo suyo y
los informes no se mezclan:

| Funnel | Evento | Cuándo | Por |
|---|---|---|---|
| Landing | `Schedule` | Confirmó la auditoría en Calendly | pixel + API, con nombre, email y teléfono de la reserva |
| Landing | `EligioHorario` (propio) | Eligió día y hora en Calendly | pixel + API |
| Landing | `VideoCompleto` (propio) | Vio el 90% del video | pixel + API |
| Landing | `ViewContent` | Le dio play al video | pixel |
| Landing | `Contact` | Tocó un botón de WhatsApp | pixel |
| Quiz (`/plan`) | `Lead` | Abrió WhatsApp con su plan | pixel + API |
| Quiz (`/plan`) | `LeadCaliente` (propio) | Lo anterior + quiere llenar la agenda en 90 días | pixel + API |
| Recurso (`/recurso`) | `Lead` / `Contact` | Se registró / tocó WhatsApp | API |
| Todas | `PageView` | Entró a la página | pixel |

- **Pixel + API con el mismo `event_id`:** Meta junta los dos y lo cuenta una
  vez. Si el navegador bloquea el pixel, igual llega el del servidor.
- **`Schedule` solo sale con una reserva real:** el Worker lee la reserva en
  Calendly (secret `CALENDLY_TOKEN`, el mismo token que usa n8n) y descarta las
  que no existen, no están activas o tienen más de 2 horas.
- **El Worker manda también las cookies del pixel** (`_fbp`, `_fbc`), la IP y
  el navegador, para que Meta reconozca a la persona aunque no haya datos.

**Cómo optimizar cada campaña:**
- **Quiz:** por `Lead` (o una conversión personalizada de `LeadCaliente`).
- **Landing:** por `Schedule`. Mientras haya pocas reservas (Meta necesita
  ~50 por semana para salir de aprendizaje), por `EligioHorario`.
- **Eventos propios** (`EligioHorario`, `VideoCompleto`, `LeadCaliente`):
  para optimizar por ellos hay que crear una **conversión personalizada** en el
  Administrador de eventos → Conversiones personalizadas → Crear → origen
  "Gravity Pixel - 23/11", evento → el evento propio.

**Probar:** abrir "Probar eventos" en el Administrador de eventos (origen
Sitio web), pegar en `META_TEST_EVENT_CODE` (`wrangler.jsonc`) el código que
muestra ahí, publicar y probar. Mientras está cargado, los eventos de la API
**no cuentan** para las campañas: dejarlo vacío al terminar. Un código de una
sesión vieja no sirve (Meta los toma como prueba y no aparecen en ningún lado).

## 8. Panel propio de visitantes (desde el 26/11/2026)

**Dónde:** `gravity-studios.com/admin/panel/`. Pide la clave `ADMIN_KEY` (la
misma del admin del recurso, `/admin/recurso/`), que se carga con
`npx wrangler secret put ADMIN_KEY`.

**Qué es:** un registro propio de cada visitante de todas las páginas (landing,
`/hl1`–`/hl3`, `/plan`, `/recurso`, casos, `/video-j`, `/video-t`,
`/privacidad`), guardado en la base D1 `gravity-recurso`. Al ser de nuestro
dominio, los bloqueadores de anuncios no lo cortan.

**Cómo identifica:**
- Cada navegador tiene un `vid` (16 caracteres, localStorage `g_vid` + cookie
  `g_vid` de 1 año) y cada visita un `sid` (se renueva tras 30 min sin
  actividad).
- Guarda con qué llegó **la primera vez** (UTM, `fbclid`, referrer y página de
  entrada) y con qué llegó en cada visita.
- **Se convierte en persona** cuando deja datos: quiz (`/api/lead`), recurso
  (registro, encuesta o cuando retoma), Calendly (al agendar) o cuando llega
  desde Cleo con `cw`. Si el teléfono o el email ya existen, se une a la misma
  persona aunque sea otro dispositivo.

**Qué registra:** todos los eventos de `gTrack` (video, Calendly, WhatsApp,
quiz, recurso…), más `page_view`, `page_leave` (tiempo activo y scroll máximo),
`section_view` (secciones con `id` vistas al 40 %), `click` (texto y destino de
cada link o botón), `vsl_25`/`vsl_75`/`vsl_100` y `vsl_pause`. El Worker suma
IP, país, región, ciudad, proveedor de internet, dispositivo, sistema y
navegador (detecta el navegador interno de Instagram y Facebook).

**Qué muestra el panel:**
- **Resumen:** visitantes, nuevos, visitas, con nombre, reservas, leads,
  fuentes y anuncios (primer contacto) con lo que hizo cada uno, páginas con
  tiempo y scroll, retención del video, secciones vistas, lugares y
  dispositivos.
- **Embudos:** landing (entró → casos → play → 50 % → 90 % → agenda → horario →
  agendó), quiz (entró → empezó → preguntas 1–6 → datos → WhatsApp) y recurso.
- **Personas:** con filtros para recontactar ("eligió horario y no agendó",
  "dejó datos en el quiz y no abrió WhatsApp", "vio el video y no agendó", "se
  registró en el recurso y no generó"), link directo a WhatsApp, detalle con la
  línea de tiempo completa en todos sus dispositivos y exportación a Excel.
- **Visitas en vivo:** las últimas 100 visitas, con o sin nombre, con su
  recorrido.

**Retención:** lo anónimo se borra a los 180 días (cron diario del Worker,
07:00 UTC). Lo de personas identificadas queda.

**Ir a Clarity desde el panel:** en Clarity, Filtros → Custom tags → `vid` = el
código que muestra el detalle de la persona.

**Para saber qué anuncio trajo a cada persona,** usar en los anuncios de Meta:
`?utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_term={{adset.name}}&utm_content={{ad.name}}`

**Privacidad:** `/privacidad` describe todo esto. Está enlazada en el pie de
todas las páginas y en los formularios del quiz y del recurso.

## 9. API de ManyChat (sistema anterior)

Desde el 28/10/2026 Cleo ya no corre en ManyChat. La integración sigue activa
solo para los links viejos con `mc` que todavía anden dando vueltas.

- **La clave** está guardada como **secret** del Worker `web-gravity` en
  Cloudflare, con el nombre `MANYCHAT_API_KEY`. No está en el código ni en
  GitHub. Para cambiarla: `npx wrangler secret put MANYCHAT_API_KEY`, o
  Cloudflare → Workers → web-gravity → Settings → Variables and Secrets.
- **Cuando se cancele ManyChat**, se puede borrar ese secret: sin la clave, la
  parte de ManyChat del Worker no hace nada.
- **Qué permite la API de ManyChat:** contactos, etiquetas, campos
  personalizados, disparar flujos existentes y mandar mensajes. **No permite**
  crear o editar flujos, leer conversaciones ni ver estadísticas.

---

## 10. Pendientes

- [ ] **Bio de Instagram:** cambiar el link por el de la sección 2.
- [ ] **Clave de ManyChat:** quedó escrita en un chat. Si ManyChat sigue
      activo, generar una nueva; si se cancela, borrar el secret.
- [ ] **Analytics → Eventos:** marcar como *eventos clave* `calendly_booked`,
      `whatsapp_click` y `vsl_90` (cuando aparezcan en la lista, 24–48 h).
- [ ] **Analytics → Definiciones personalizadas:** crear la dimensión
      "Origen del clic", alcance *evento*, parámetro `source`.
- [ ] **Analytics → Retención de datos:** pasar de 2 a 14 meses.
- [ ] **Clarity → Settings → Setup:** conectar con Google Analytics.
- [x] ~~Token de la API de conversiones~~: el anterior daba "Bad signature";
      se cargó uno nuevo el 26/11/2026 y Meta acepta los eventos.
- [x] ~~Sacar `META_TEST_EVENT_CODE`~~: vacío desde el 26/11/2026.
- [ ] **Prueba real del `Schedule`:** hacer una reserva de prueba en la web y
      ver que llegue (Administrador de eventos → Resumen, ~20 min).
- [ ] **Coincidencia avanzada automática** del pixel: activarla en la
      configuración del conjunto de datos.
- [ ] **Conversiones personalizadas** para `EligioHorario` y `LeadCaliente`.
- [ ] **Bots de Caro y Guille:** si sus mensajes mandan links a sus webs,
      se puede repetir lo mismo (hoy es solo para Gravity).

---

## 11. Dónde está en el código

| Archivo | Qué hace |
|---|---|
| `src/data/site.ts` | IDs de Analytics, Clarity y Meta Pixel |
| `src/layouts/Base.astro` | Lee `cw`, `mc` y UTMs, carga Clarity y Analytics, define `gTrack()` (el punto único que manda cada evento a todos lados) y escucha los clics con `data-track` |
| `src/components/Vsl.astro` | Eventos del video: play, 50% y 90% |
| `src/components/Agenda.astro` | Pasa UTMs y el código a Calendly y escucha cuando eligen horario o reservan |
| `worker/index.js` | Ruta `/api/mc`: con `cw` reenvía el evento a n8n; con `mc`, pone la etiqueta en ManyChat. Ruta `/api/capi-web`: eventos de Meta de la landing |
| `worker/meta.js` | Envío a la API de conversiones de Meta |
| `worker/calendly.js` | Lee la reserva de Calendly para el `Schedule` |
| `worker/tracking.js` | `/api/t` (eventos del panel), `identificar` (visitante → persona) y la limpieza diaria |
| `worker/panel.js` | API del panel (`/api/panel/*`) |
| `src/pages/admin/panel.astro` | El panel |
| `migrations/0002_panel.sql` | Tablas `personas`, `visitantes`, `sesiones` y `eventos_web` |
| `wrangler.jsonc` | Configuración del Worker (archivos estáticos + `/api/*`) |
| `D:\Claude\Bot WhatsApp\servidor\bot\nodos\armar-respuesta.js` | Genera el código y arma el link del mensaje de bienvenida |
| `D:\Claude\Bot WhatsApp\servidor\bot\nodos\web-evento.js` / `web-etiqueta.js` | Workflow "Eventos web": evento → etiqueta de Chatwoot |
