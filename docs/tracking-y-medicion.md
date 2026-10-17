# Tracking y medición de la web

Qué se armó el 17/10/2026 para saber **quién** entra a gravity-studios.com,
**de dónde** viene y **qué hace** adentro, y cómo se ve cada cosa.

---

## 1. En una línea

Cada persona que entra desde el link de Cleo (WhatsApp) llega identificada con
su ID de contacto de ManyChat. A partir de ahí, la web:

- graba su sesión en **Microsoft Clarity**, a su nombre;
- manda sus acciones a **Google Analytics 4**;
- le pone **etiquetas en ManyChat** según lo que hizo (vio el video, eligió
  horario, agendó…);
- le pasa su ID a **Calendly**, así cada reserva dice quién la hizo.

---

## 2. Los links

Cada link a la web lleva **UTMs**: etiquetas en la URL que dicen de dónde viene
la visita. Analytics y Clarity las leen solas.

| Dónde está el link | URL |
|---|---|
| Mensaje de Cleo en WhatsApp (ManyChat) | `https://gravity-studios.com/?utm_source=whatsapp&utm_medium=cleo&mc={{ID de contacto}}` |
| Bio de Instagram | `https://gravity-studios.com/?utm_source=instagram&utm_medium=bio` |

- `{{ID de contacto}}` se inserta con el selector de variables de ManyChat
  (el botón de "+" en el campo de URL), no se escribe a mano. En el editor se
  ve como una etiqueta azul que dice **Id de contacto**.
- El link de Cleo **ya está cargado** en el flujo de ManyChat.
- El link de la bio **falta cambiarlo** en Instagram.

### Qué significa cada parámetro

| Parámetro | Para qué sirve | Valores que usamos |
|---|---|---|
| `utm_source` | De qué plataforma viene | `whatsapp`, `instagram` |
| `utm_medium` | Desde qué lugar de esa plataforma | `cleo` (mensaje automático), `bio` (perfil) |
| `utm_campaign` | Campaña puntual (opcional) | — (todavía no se usa) |
| `mc` | ID del contacto en ManyChat: identifica a la persona | lo completa ManyChat |

### Links nuevos

Para cualquier link nuevo, mismo formato. Ejemplos:

- Historia de Instagram: `?utm_source=instagram&utm_medium=historia`
- Un DM de ManyChat en Instagram: `?utm_source=instagram&utm_medium=dm&mc={{ID de contacto}}`
- Un anuncio: `?utm_source=meta&utm_medium=ads&utm_campaign=nombre-de-la-campaña`

Todo en minúsculas, sin espacios ni acentos. Si el link sale de ManyChat,
sumarle siempre `&mc={{ID de contacto}}`: es lo que permite saber quién es.

---

## 3. Cómo se identifica a la persona

1. La persona toca el link de Cleo. Llega con `?mc=1572193852` (su ID).
2. La web guarda el ID y los UTM **en su navegador**. Si vuelve otro día sin
   el link, sigue identificada.
3. La web **borra el `mc` de la barra de direcciones**. Si la persona reenvía
   el link a alguien, ese otro no queda registrado como ella.
4. Con el ID, la web:
   - le pone nombre a la grabación en Clarity;
   - se lo pasa a Analytics como `user_id`;
   - se lo pasa a Calendly en `utm_content` (como `mc-1572193852`);
   - lo usa para ponerle etiquetas en ManyChat.

**Límite:** quien entra desde la bio de Instagram llega **anónimo**, porque ese
link es igual para todos. Se lo ve en Clarity y Analytics como visitante de
Instagram, pero sin nombre. Solo queda identificado si después entra por un
link de ManyChat.

---

## 4. Qué medimos

| Lo que hace la persona | Evento en Analytics y Clarity | Etiqueta en ManyChat | Evento de Meta* |
|---|---|---|---|
| Entra a cualquier página | `page_view` | — | `PageView` |
| Le da play al video | `vsl_play` | `Web_vio_video` | `ViewContent` |
| Llega a la mitad del video | `vsl_50` | `Web_vio_video_50` | — |
| Llega al 90% del video | `vsl_90` | `Web_vio_video_completo` | — |
| Toca un botón de "Agendá tu auditoría" | `calendar_click` | `Web_click_agendar` | `Lead` |
| Elige un horario en Calendly | `calendly_time` | `Web_eligio_horario` | — |
| Confirma la reserva en Calendly | `calendly_booked` | `Web_agendo` | `Schedule` |
| Toca un botón de WhatsApp | `whatsapp_click` | `Web_click_whatsapp` | `Contact` |
| Abre el caso completo de Guille | `case_click` | `Web_vio_caso` | — |

\* El Meta Pixel todavía no está activo (falta el ID). Cuando se cargue en
`src/data/site.ts`, estos eventos empiezan a llegar solos.

- Los clics llevan además un dato `source` que dice **qué botón** fue: `hero`,
  `nav`, `agenda`, `flotante`, `cta-final`, etc.
- Las etiquetas de ManyChat solo se ponen a quien llegó con `mc`.
- Las etiquetas se crean solas en ManyChat la primera vez que hacen falta.
- La etiqueta `Entro_a_la_landing` es distinta: la pone el propio flujo de
  ManyChat cuando tocan el botón del mensaje, no la web.

**Probado el 17/10/2026** con el contacto de Juan: llegaron todas las
etiquetas de lo que se hizo en la prueba (`Web_vio_video`, `_50`,
`_completo`, `Web_vio_caso`, `Web_click_agendar`, `Web_eligio_horario`).

---

## 5. Dónde se ve cada cosa

### Microsoft Clarity — qué hizo cada persona
- **Dónde:** clarity.microsoft.com, proyecto `yzain7fn0c`.
- **Qué muestra:** la grabación de cada visita (como un video de su pantalla),
  mapas de calor de clics y de scroll, y los eventos de la tabla de arriba.
- **Buscar a una persona:** Filtros → **Custom user ID** → pegar su ID de
  ManyChat (está en su ficha de contacto, debajo de la foto).
- **Separar por origen:** Filtros → Custom tags → `utm_source` / `utm_medium`.
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

### ManyChat — qué hizo cada contacto
- **Dónde:** la ficha de cada contacto → Etiquetas de contacto.
- **Para qué:** segmentar y armar seguimientos. Ejemplo: a quien tiene
  `Web_eligio_horario` pero no `Web_agendo`, escribirle a los 30 minutos.

### Calendly — quién agendó
- En cada reserva, los campos UTM traen el origen (`whatsapp` / `cleo`) y en
  `utm_content` el ID del contacto (`mc-…`).

---

## 6. API de ManyChat

### Dónde está la clave
- Guardada como **secret** del Worker `web-gravity` en Cloudflare, con el
  nombre `MANYCHAT_API_KEY`. No está en el código ni en GitHub.
- Para cambiarla: generar una nueva en ManyChat (Configuración → API) y correr
  ```bash
  npx wrangler secret put MANYCHAT_API_KEY
  ```
  o cargarla en Cloudflare → Workers → web-gravity → Settings → Variables and
  Secrets.
- **Pendiente:** la clave actual quedó escrita en un chat. Conviene generar
  una nueva y reemplazarla.

### Qué se puede hacer con la API
- Contactos: buscarlos, ver su información y etiquetas, crearlos y actualizarlos.
- Etiquetas: crearlas, borrarlas, ponerlas y sacarlas.
- Campos personalizados: crearlos y cargarles valores por contacto.
- Disparar un flujo que ya existe para un contacto.
- Mandar mensajes (en WhatsApp, fuera de las 24 h, solo con plantillas
  aprobadas).

### Qué NO se puede hacer con la API
- Crear o editar flujos, disparadores, secuencias o palabras clave.
- Leer conversaciones o historial de chat.
- Ver estadísticas de los flujos.

Los flujos se arman en el editor de ManyChat. Lo que sí se puede es que un
flujo llame a nuestro Worker (bloque "Solicitud externa" o "Contenido
dinámico") para resolver la lógica en código.

### Lo que hace la web con la API hoy
Solo una cosa: poner las etiquetas `Web_*` de la tabla de la sección 4. La web
manda el evento a `gravity-studios.com/api/mc`, y el Worker de Cloudflare es el
que habla con ManyChat usando la clave. Solo acepta esos 8 eventos y solo
pedidos que vengan desde la propia web: nadie puede usarlo para poner otras
etiquetas.

---

## 7. Pendientes

- [ ] **Bio de Instagram:** cambiar el link por el de la sección 2.
- [ ] **Clave de ManyChat:** generar una nueva y reemplazarla (sección 6).
- [ ] **Analytics → Eventos:** marcar como *eventos clave* `calendly_booked`,
      `whatsapp_click` y `vsl_90` (cuando aparezcan en la lista, 24–48 h).
- [ ] **Analytics → Definiciones personalizadas:** crear la dimensión
      "Origen del clic", alcance *evento*, parámetro `source`.
- [ ] **Analytics → Retención de datos:** pasar de 2 a 14 meses.
- [ ] **Clarity → Settings → Setup:** conectar con Google Analytics.
- [ ] **Meta Pixel (opcional):** cargar el ID en `src/data/site.ts` para
      remarketing.

---

## 8. Dónde está en el código

| Archivo | Qué hace |
|---|---|
| `src/data/site.ts` | IDs de Analytics, Clarity y Meta Pixel |
| `src/layouts/Base.astro` | Lee `mc` y UTMs, carga Clarity y Analytics, define `gTrack()` (el punto único que manda cada evento a todos lados) y escucha los clics con `data-track` |
| `src/components/Vsl.astro` | Eventos del video: play, 50% y 90% |
| `src/components/Agenda.astro` | Pasa UTMs y `mc` a Calendly y escucha cuando eligen horario o reservan |
| `worker/index.js` | Ruta `/api/mc`: convierte el evento en etiqueta y la pone en ManyChat |
| `wrangler.jsonc` | Configuración del Worker (archivos estáticos + `/api/*`) |
