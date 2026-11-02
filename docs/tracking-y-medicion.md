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

| Lo que hace la persona | Evento en Analytics y Clarity | Etiqueta en Chatwoot | Etiqueta en ManyChat (links viejos) | Evento de Meta* |
|---|---|---|---|---|
| Entra a cualquier página | `page_view` | — | — | `PageView` |
| Le da play al video | `vsl_play` | `web_vio_video` | `Web_vio_video` | `ViewContent` |
| Llega a la mitad del video | `vsl_50` | `web_vio_video_50` | `Web_vio_video_50` | — |
| Llega al 90% del video | `vsl_90` | `web_vio_video_completo` | `Web_vio_video_completo` | — |
| Toca un botón de "Agendá tu auditoría" | `calendar_click` | `web_click_agendar` | `Web_click_agendar` | `Lead` |
| Elige un horario en Calendly | `calendly_time` | `web_eligio_horario` | `Web_eligio_horario` | — |
| Confirma la reserva en Calendly | `calendly_booked` | `web_agendo` (verde) | `Web_agendo` | `Schedule` |
| Toca un botón de WhatsApp | `whatsapp_click` | `web_click_whatsapp` | `Web_click_whatsapp` | `Contact` |
| Abre el caso completo de Guille | `case_click` | `web_vio_caso` | `Web_vio_caso` | — |

\* El Meta Pixel todavía no está activo (falta el ID). Cuando se cargue en
`src/data/site.ts`, estos eventos empiezan a llegar solos.

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

## 7. API de ManyChat (sistema anterior)

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

## 8. Pendientes

- [ ] **Bio de Instagram:** cambiar el link por el de la sección 2.
- [ ] **Clave de ManyChat:** quedó escrita en un chat. Si ManyChat sigue
      activo, generar una nueva; si se cancela, borrar el secret.
- [ ] **Analytics → Eventos:** marcar como *eventos clave* `calendly_booked`,
      `whatsapp_click` y `vsl_90` (cuando aparezcan en la lista, 24–48 h).
- [ ] **Analytics → Definiciones personalizadas:** crear la dimensión
      "Origen del clic", alcance *evento*, parámetro `source`.
- [ ] **Analytics → Retención de datos:** pasar de 2 a 14 meses.
- [ ] **Clarity → Settings → Setup:** conectar con Google Analytics.
- [ ] **Meta Pixel (opcional):** cargar el ID en `src/data/site.ts` para
      remarketing.
- [ ] **Bots de Caro y Guille:** si sus mensajes mandan links a sus webs,
      se puede repetir lo mismo (hoy es solo para Gravity).

---

## 9. Dónde está en el código

| Archivo | Qué hace |
|---|---|
| `src/data/site.ts` | IDs de Analytics, Clarity y Meta Pixel |
| `src/layouts/Base.astro` | Lee `cw`, `mc` y UTMs, carga Clarity y Analytics, define `gTrack()` (el punto único que manda cada evento a todos lados) y escucha los clics con `data-track` |
| `src/components/Vsl.astro` | Eventos del video: play, 50% y 90% |
| `src/components/Agenda.astro` | Pasa UTMs y el código a Calendly y escucha cuando eligen horario o reservan |
| `worker/index.js` | Ruta `/api/mc`: con `cw` reenvía el evento a n8n; con `mc`, pone la etiqueta en ManyChat |
| `wrangler.jsonc` | Configuración del Worker (archivos estáticos + `/api/*`) |
| `D:\Claude\Bot WhatsApp\servidor\bot\nodos\armar-respuesta.js` | Genera el código y arma el link del mensaje de bienvenida |
| `D:\Claude\Bot WhatsApp\servidor\bot\nodos\web-evento.js` / `web-etiqueta.js` | Workflow "Eventos web": evento → etiqueta de Chatwoot |
