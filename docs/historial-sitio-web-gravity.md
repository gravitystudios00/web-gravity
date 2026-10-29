---
title: Historial del sitio web de Gravity
proyecto: gravity-studios.com
periodo: 2026-08-14 a 2026-10-17
tags: [gravity, sitio-web, astro, cloudflare, landing]
---

# Historial del sitio web de Gravity

Registro completo de la migración de **gravity-studios.com** de Framer a código propio (Astro + Cloudflare), desde el primer pedido hasta hoy. Va en orden cronológico, con las decisiones, los problemas que aparecieron y cómo se resolvieron.

- **Sitio en vivo:** https://gravity-studios.com
- **Repo:** `github.com/gravitystudios00/web-gravity` (privado), rama `main`
- **Carpeta local:** `C:\Claude\Web Gravity`
- **Documentos relacionados:** [[analisis-y-plan]] (análisis inicial del sitio en Framer) · [[tracking-y-medicion]] (tracking, UTMs, ManyChat)

---

## Resumen rápido: cómo está hoy

**Páginas**

| Ruta | Qué es | Indexada |
|---|---|---|
| `/` | Landing completa | Sí |
| `/hl1` `/hl2` `/hl3` | Variantes de headline para anuncios (hero + calendario + comparación) | No (`noindex`) |
| `/casos/guillermo` | Caso completo del Dr. Guillermo Cienfuegos, con scroll horizontal en desktop | Sí |
| `/video-t` | Página post-agenda: VSL + botón "Enviar Visto a Tomás" | No |
| `/video-j` | Página post-agenda: VSL + botón "Enviar Visto a Juan" | No |
| `/contacto`, `/legal` | **No existen todavía.** Están enlazadas desde el footer y dan 404 | — |

**Orden de la landing:** Hero (headline + VSL + botones) → **Casos de éxito** (tarjetas de Guille y Caro) → **Agendá tu auditoría** (Calendly) → Qué hacemos → Quiénes somos → Por qué elegirnos → CTA final → Footer. Más un botón flotante de WhatsApp.

**WhatsApp**

| Dónde | Número |
|---|---|
| Landing (todos los botones) y `/video-j` | +54 9 11 2757 0674 (`wa.me/5491127570674`) — antes +1 555 868 4087 |
| `/video-t` | Tomás: `542954748078` |

**Stack**

- **Astro 5**, sitio estático. Sin React ni hidratación.
- Estilos con los **tokens del Gravity Design System** (variables `--g-*`).
- **Hosting:** un Worker de Cloudflare llamado `web-gravity`, conectado a GitHub. Cada push a `main` buildea y publica solo. La configuración está en `wrangler.jsonc`, con los assets en `./dist`.
- **Video del VSL:** en Cloudflare R2, bucket `web-gravity-assets`, en 1080p. No puede ir en el sitio porque Cloudflare limita cada archivo a 25 MiB.
- **Analítica:** GA4. Desde el 17/10 también Microsoft Clarity y el seguimiento por persona con ManyChat (ver [[tracking-y-medicion]]).

---

## 1. Punto de partida: análisis del sitio en Framer (14/08)

### El pedido original

Juan pidió seis cambios a la landing, y preguntó si se podía rehacer con Claude Code y subirla a Cloudflare:

1. **Cambiar el headline**, porque el de ese momento hablaba de la garantía, que ya no se usa. Las tres opciones propuestas fueron:
   - "Vamos a multiplicar los pacientes en tu clínica con un sistema de captación con IA…"
   - "En los próximos 90 días vas a triplicar los pacientes…"
   - "Más pacientes calificados en menos de 90 días con un sistema que funciona 100% en automático con IA, descubrí cómo ⭣"
2. **Cambiar el VSL.**
3. **Cambiar la prueba social:** reseñas estilo Google Maps en un carrusel horizontal.
4. **Cambiar la diferenciación final.** El último ítem de Gravity en "¿Por qué elegirnos?" pasa a decir: *"En menos de 90 días tenés un sistema automático que trae pacientes nuevos todos los días"*.
5. Al menos **dos botones de WhatsApp**, porque el cliente está más acostumbrado al link directo que a un formulario.

### Qué había en Framer

- **Rutas:** `/`, cinco variantes `/hl1`–`/hl5` (la misma página copiada cinco veces), `/contacto`, `/video-t`, `/video-j`, `/legal` y `/404`.
- **Estructura de la home:**
  - Nav
  - Hero con un VSL de YouTube con autoplay (no funcionaba)
  - Calendly
  - Casos de éxito: un iframe de Google Drive con el video del congreso
  - Qué hacemos: tres puntos, el tercero sobre la garantía
  - Quiénes somos
  - "¿Por qué elegirnos?": comparación de 5 contra 5, con el quinto ítem sobre la garantía
- **Problemas que se encontraron:**
  - Sin Meta Pixel.
  - Typo en el H1: "en en".
  - Video del congreso en un iframe de Drive.
  - Autoplay de YouTube que no arrancaba.
  - Calendly cargando siempre, unos 500 KB.
  - SEO vacío: title "Gravity Funnel" y sin meta description.
  - Número de Tomás mal escrito, con un guión: `54295474-8078`.
  - 190 KB de HTML por página, porque Framer repite el markup por cada breakpoint.
  - Cinco variantes que había que mantener a mano.
- **Animaciones:** había **una sola**, la entrada del nav. Ninguna animación al scrollear, hovers con duración 0 y ningún carrusel.
- **Colores y tipografías:**
  - El sitio usaba el amarillo `#FFB400` y la fuente **Satoshi**.
  - El brandbook usa el amarillo `#EABE3F` y solo **Baloo Da 2** (titulares) y **Baloo Bhaina 2** (texto).
  - El sitio no respetaba el design system.

El análisis completo está en [[analisis-y-plan]].

### Decisiones de esa etapa

- **Stack:** Astro, desplegado en Cloudflare.
- **Headline:** la tercera opción, porque es la única que no promete un múltiplo que después no se pueda sostener.
- **Brandbook confirmado:** amarillo `#EABE3F` y solo las dos Baloo. Satoshi queda afuera.
- **El Gravity Design System**, que ya existía en Claude Design, se tomó como fuente. Se usaron directamente sus tokens, fuentes y reglas.
- **Claude Design o código.** Claude Design define cómo se ve un componente quieto. El código define cómo se comporta: movimiento, scroll, hover, carrusel y responsive. Las animaciones van en código.
- **Sin tráfico de anuncios por ahora**, así que el Meta Pixel queda preparado en la configuración pero apagado.
- **Reseñas:** se armó el carrusel completo con un archivo de datos aparte. Claude no inventó reseñas de médicos con caras de IA; el componente quedó listo para que se carguen los datos. Más adelante el carrusel se eliminó (ver sección 4).
- **Análisis sin diseño:** "es un análisis, no tenés que hacerlo lindo, quiero el contenido".

---

## 2. Primera versión de la landing (14/08)

Se armó con **una sola plantilla** que genera la home y las variantes. Para cambiar un headline se edita una línea en `src/data/site.ts`.

Qué quedó:

- **Hero** con el headline nuevo y el VSL con fachada: se ve el poster, y el video recién carga al hacer clic. Dos botones: calendario y WhatsApp.
- **Carrusel de reseñas:**
  - Loop de 42 segundos que se pausa al pasar el mouse.
  - Bordes con fade.
  - En mobile se desliza con el dedo y se encastra en cada tarjeta.
- **Caso congreso** con contadores animados: 1.400+, 6 meses, 2025.
- **Qué hacemos:** tres tarjetas, ya sin la garantía.
- **Quiénes somos:** fotos en proporción 4:5 que suben un poco al pasar el mouse.
- **Por qué elegirnos** con el ítem nuevo.
- **Calendly diferido:** carga recién cuando falta poco para llegar a la sección.
- **WhatsApp flotante** en mobile, que aparece al 25% del scroll.
- Todas las animaciones respetan la opción de "reducir movimiento" del sistema.

**Peso:** unos 47 KB de HTML más 27 KB de CSS, contra 190 KB de HTML solo en Framer.

### Pasada de detalle: luz, profundidad y movimiento

Juan pidió *"un trabajo más elaborado en detalles: animaciones, sombras, reflejos"*. Se agregó:

- **Tarjetas con volumen:**
  - Degradado vertical, como luz que cae desde arriba.
  - Un borde fino iluminado arriba.
  - Sombras en capas.
- **Reflejo que sigue al cursor** sobre cada tarjeta. Solo funciona con mouse.
- **Grano:** una capa de ruido sutil que solo aparece sobre las superficies.
- **Titular del hero** que aparece palabra por palabra, con 45 ms entre cada una.
- **Halo del hero** que "respira" en un ciclo de 14 segundos.
- **Barra de progreso de lectura** en el nav.
- **Botón primario:** un barrido de luz al pasar el mouse.
- **Botones:** suben 2 px al pasar el mouse. El de WhatsApp tiene un brillo verde propio.
- **Detalles:**
  - Un punto ámbar con brillo en cada eyebrow.
  - Anillo ámbar en los avatares.
  - Números de las métricas con brillo ámbar.
- **Calendly:** con el plan gratis no se pueden cambiar sus colores, así que siempre se ve blanco. Se lo enmarcó a propósito como una tarjeta crema, que es el tema claro del design system, para que no quede como un agujero blanco sobre fondo negro.

Respuesta de Juan: *"Me gusta, me gusta"*.

---

## 3. Caso de éxito del Dr. Guillermo Cienfuegos (14/08)

Reemplazó a la sección anterior de casos (el congreso). El componente del congreso, `CaseStudy.astro`, quedó en el proyecto sin usar.

### Enfoque

*"El contenido no tiene que ser viral. Tiene que vender."* Con Guille no se buscaron visualizaciones sino pacientes. Un reel con 300.000 vistas de gente que nunca se va a operar vale menos que uno con 8.000 vistas de la persona correcta.

### Datos del caso

- 5 meses de trabajo
- 27.5K seguidores
- USD 12.000 promedio por semana ingresados desde Instagram
- 50% del contenido generado con IA
- 80% de los mensajes automatizados
- Datos tomados del perfil: 190 publicaciones y 171.6K visualizaciones en 30 días

### Estructura (seis paneles)

1. **Tesis:**
   - Eyebrow: "Caso real · Dr. Guillermo Cienfuegos".
   - Titular: "El contenido no tiene que ser viral. Tiene que vender."
   - Dos párrafos de texto.
2. **Tres tarjetas con gráfico**, cada una animada al entrar en pantalla:
   - *Contenido con IA:* medidor semicircular al 50%. "La mitad del contenido no lo grabó él".
   - *Comunidad:* curva de crecimiento hasta 27.500. "Una audiencia con intención de operarse".
   - *Ingresos:* barras semanales, USD 12.000. "Instagram como canal de facturación".
3. **Tres puntos con tilde:**
   - "Contenido con criterio comercial"
   - "80% de los mensajes automatizados"
   - "5 meses, no 5 años"
4. **Perfil de Instagram**, con la captura y los números destacados.
5. **"Así responde el sistema, de punta a punta":** cuatro capturas del chatbot en orden:
   - `chat-1` Celeste: por qué la consulta se paga antes, y el alias.
   - `chat-2` Valen: alias y comprobante.
   - `chat-3` Gaby: comprobante y "confirmame nombre y DNI".
   - `chat-4` Carola: comprobante y "Listo ✅ agendada".
6. **Cierre:** "No es el caso de un influencer médico. Es el de un cirujano que dejó de depender de que un video explote." Más un botón de WhatsApp.

Los gráficos son SVG hechos a mano, sin librerías. El texto vive en `src/data/casoGuillermo.ts`.

### Cuidado de datos en las capturas

- Las primeras versiones tenían **CBU, CVU y números de operación completos**. No se subieron hasta que Juan las mandó tapadas.
- Sobre las versiones finales, el script `scripts/redact-chats.mjs` pixeló:
  - las caras de los pacientes, en el encabezado y en cada burbuja;
  - el número de operación de Mercado Pago que quedaba visible.
  Se usó pixelado y no blur, porque un blur suave sobre texto chico a veces se puede revertir.
- **Bug del script:** `sharp` no encadena dos `.resize()`. La primera corrida dijo que había funcionado pero no tapó nada. Se resolvió haciéndolo en dos pasadas.
- **Fuga evitada:** los originales sin tapar estaban dentro de `public/`, y se habrían publicado. Se movieron a `_originales/`, que está fuera de `public/` y en `.gitignore`.
- **Perfil:** se recortó la fila "Edit profile / Share profile", que delataba la vista de administrador.
- **Peso:** las imágenes pasaron a WebP de calidad 90, de 4,2 MB a 344 KB.
- Juan confirmó que la facturación se publica y que **el tema está hablado con Guille**. No hay que volver a plantearlo.

---

## 4. Fotos del equipo, logos y scroll horizontal (15/08)

### Multimedia

- **Fotos del equipo:**
  - Juan Manuel: `DSC_0217-4.jpg`. Tomás: `DSC_0187-3.jpg`.
  - Recortadas a 4:5 con encuadre a mano.
  - La de Juan pasó de 13 MB a 35 KB. La de Tomás, de 975 KB a 119 KB.
- **Logos** tomados de `C:\Claude\Gravity Brandbook`:
  - Componente `Logo.astro`, con versión amarilla, negra o crema según el fondo.
  - Reemplazó los tres placeholders que había: nav (logo completo), footer (ícono + "Studios") y la columna "Gravity" de la comparación.
- **Favicon:** de 16, 32, 180 y 512 px. Antes no había ninguno.
- **Imagen para compartir el link** (Open Graph): logo sobre negro con halo ámbar.
- **Scripts reutilizables:** `scripts/process-brand.mjs` y `scripts/process-team.mjs`.

### Scroll horizontal en el caso de Guille

Lo pidió Juan con esta referencia: https://scroll-driven-animations.style/demos/horizontal-section/waapi/

También pidió **eliminar el carrusel de reseñas** y **poner el Calendly en su lugar**, justo después del hero.

- Nuevo orden: Hero → Calendario → Caso Guillermo → Qué hacemos → Quiénes somos → Por qué elegirnos → CTA final.
- El carrusel salió de la página. Sus archivos (`Reviews.astro`, `Stars.astro` y `reviews.ts`) quedaron en el proyecto.
- **Cómo funciona el scroll:**
  - En desktop, la sección queda fija en pantalla y el scroll vertical la mueve de costado.
  - Está hecho con animaciones ligadas al scroll del navegador, como el demo de referencia.
  - El recorrido se mide en píxeles reales y la altura de la sección sale de ese recorrido, así que el desplazamiento queda 1:1 con el scroll en cualquier pantalla.
  - Se recalcula cuando terminan de cargar las imágenes y el Calendly, y cuando cambia el tamaño de la ventana.
- **Diagnóstico falso descartado:** durante la prueba el panel de vista previa estaba oculto y el navegador no dibujaba ningún cuadro. Por eso las animaciones parecían rotas sin estarlo.

### Mobile-first

Juan pidió: *"el desktop está perfecto, no lo toques"*. En mobile, todo vertical, sin scroll horizontal, y que **cada sección entre en una pantalla de teléfono** cambiando solo tamaños y disposición, nunca el contenido.

- **Bug del logo:** se veía aplastado, con una proporción de 5,55 en lugar de la real de 4,12. También pasaba en desktop. Se arregló con `aspect-ratio`.
- **Enfoque:** en el breakpoint mobile se achican los tokens del design system (tamaños de texto y espaciados). Toda la página se reduce en proporción sin tocar contenido. Hay un segundo escalón para pantallas bajas, de 740 px de alto o menos. Todo está en `src/styles/mobile.css`.
- **Tarjetas de métricas en mobile:** pasaron a formato horizontal (gráfico chico, número y texto) para que las tres entren juntas en una pantalla.
- **Resultado** en un Galaxy S20 Ultra, en pantallas por sección:

  | Sección | Antes | Después |
  |---|---|---|
  | Hero | 0,83 | 0,68 |
  | Agenda | 1,17 | 0,81 |
  | Qué hacemos | 1,29 | 0,82 |
  | Quiénes somos | 1,09 | 0,81 |
  | Por qué elegirnos | 1,31 | 0,85 |

- En un iPhone SE, "qué hacemos" y "quiénes somos" se pasan entre 4 y 9 px.
- **Bug introducido y corregido:** un `width: 100%` en los paneles inflaba el recorrido del scroll en desktop de 3.831 px a 7.743 px. Desktop quedó verificado igual que antes.
- Se trabajó en la rama `mobile-first-layout`, y Juan mergeó el **PR #1** a `main`.

---

## 5. VSL nuevo en 1080p y deploy en Cloudflare (21 y 22/08)

### VSL

- **Original:** `VSL 2.mp4`, de 431 MB, 3:46 y 1080p.
- Primero se comprimió a 720p (34,5 MB). Juan pidió 1080p, así que se volvió a procesar: **115 MB** en 1080p nativo.
- **No hace más lenta la página**, porque el video no se descarga hasta que alguien aprieta play. Mientras tanto solo se ve el poster, de unos 28 KB.
- El poster es el cuadro de los 0,3 segundos. El video tiene subtítulos grabados desde el principio y en ese cuadro el gesto es mejor.
- **Script:** `node scripts/process-vsl.mjs "ruta\video.mp4"` comprime, genera el poster y lo sube a R2. Con `--720p` genera la versión liviana.
- El original se borró de Descargas, como pidió Juan.

### Dónde vive el video

- Cloudflare limita **cada archivo a 25 MiB**, así que el video no entra como archivo del sitio.
- Va en **R2**, en el bucket nuevo `web-gravity-assets`, con acceso público. Permite adelantar y retroceder en el reproductor.
- Ya existía otro bucket, `gravity-media`, con contenido de otra cosa. No se tocó.
- El video nunca pasó por git ni por `public/`. Localmente queda en `_local-media/`, que está en `.gitignore`.

### El deploy

1. Primero se subió a un proyecto de **Cloudflare Pages** `web-gravity`, con la URL de preview `mobile-first-layout.web-gravity.pages.dev`.
2. Juan avisó que el deploy daba error: **"Missing entry-point to Worker script or to assets directory"**.
3. **Causa:** había **un Worker `web-gravity` conectado a GitHub desde el 15/08**. Ese Worker es el que sirve `gravity-studios.com`. Fallaba porque el repo no tenía `wrangler.jsonc`.
4. Se agregó `wrangler.jsonc` apuntando a `./dist` y se probó antes con `--dry-run`.
5. **Segundo problema:** el arreglo estaba solo en la rama, mientras que `main` ya tenía el PR #1 mergeado. Se mergeó la rama a `main`.
6. Resultado: **gravity-studios.com ya sirve el sitio nuevo** y Framer quedó afuera.

**Pendiente opcional:** el proyecto de Pages `web-gravity` no se usa. Se puede borrar, pero solo con confirmación de Juan.

### Indexación en Google

Juan pidió *"indexalo, sí"*. Había **dos bloqueos**:

1. `Base.astro` traía `noindex` activado por defecto, de cuando era un preview.
2. `robots.txt` tenía `Disallow: /`, que bloqueaba todo el sitio.

Ahora:

- La home es indexable.
- `/hl1`–`/hl3` siguen en `noindex`, porque son casi iguales a la home y competirían con ella.
- Hay un sitemap (`@astrojs/sitemap`) que deja afuera las variantes `hl*` y las páginas `video-*`.
- Cloudflare agrega automáticamente al `robots.txt` un bloque que **bloquea los rastreadores de IA** (GPTBot, ClaudeBot, Google-Extended y otros) y deja pasar a los buscadores. Se desactiva desde el panel de Cloudflare si algún día interesa aparecer citado en ChatGPT o Perplexity.
- **Paso que le queda a Juan:** cargar el sitio en Google Search Console y pedir la indexación de la home.

---

## 6. Páginas `/video-t` y `/video-j` (22/08)

- Son las páginas que se ven después de agendar. Tienen la misma estructura que en Framer:
  - isotipo y titular con acentos en ámbar;
  - bajada y tres puntos con tilde;
  - texto de urgencia;
  - VSL;
  - botón con el mensaje "VISTO" ya escrito.
- `/video-t` va a Tomás y `/video-j` a Juan.
- El número de Tomás quedó corregido, sin el guión.
- Las dos salen de un mismo componente, `VideoPage.astro`. Cada página es un archivo de tres líneas y el texto está en `site.ts`.
- El VSL ganó la opción de ocultar el texto *"En 4 minutos te explicamos nuestro método"*, que en estas páginas repetía el titular. En la home se sigue mostrando.
- En un iPhone 16 entran en una pantalla con el botón visible.
- Tienen `noindex` y no están en el sitemap.

---

## 7. Tarjetas de casos, página propia de Guille y WhatsApp nuevo (05/10)

Lo que pidió Juan:

1. **WhatsApp nuevo** +1 555 868 4087 en la landing y en `/video-j`. `/video-t` sigue con Tomás. Juan probó `wa.me/15558684087` y confirmó que funciona.
2. **El caso completo de Guille, sin cambios, a su propia página:** `/casos/guillermo`.
3. **En la landing, una tarjeta por cliente:**
   - **Guille:**
     - Foto.
     - "Vino con un problema puntual: conseguir más ventas."
     - **"De $0 vendidos en Instagram a USD 12.000 por semana"**.
     - El gráfico de barras, rotulado "Ingresos semanales desde Instagram".
     - "Ver el caso completo →", que lleva a `/casos/guillermo`.
     - Se agregó una barra en cero al principio, rotulada "Antes", para que el gráfico arranque en $0 igual que el texto.
   - **Caro (Dra. Carolina Alonso, odontóloga estética, Bogotá):**
     - Foto.
     - "Vino con un problema puntual: no tenía tiempo para grabar contenido."
     - Clip del clon con IA hablando, en loop y sin sonido. Corre solo cuando está en pantalla.
     - Juan pidió que el clip vaya entero ("no lo cortes"): dura 30 s y pesa 1,69 MB.
     - **Sin link**, porque todavía no tiene página.
   - Título de la sección: "Clínicas que ya trabajan con el sistema". Rótulo del clip: "Su clon con IA graba por ella". Se cambian en `src/data/casos.ts`.

**Archivos nuevos:**

- `src/components/Cases.astro` (la sección)
- `src/components/CaseCard.astro` (la tarjeta reutilizable)
- `src/data/casos.ts` (los textos)
- `src/pages/casos/guillermo.astro` (la página del caso)
- `scripts/process-case-media.mjs` (recorta las fotos a 4:5 y procesa el clip)

**Arreglos en el camino:**

- Los links del menú y del botón "Ver el calendario" eran relativos y se rompían desde `/casos/guillermo`. Ahora son `/#casos-de-exito`, `/#agenda` y los demás.
- El video del clon se salía de su recuadro.
- El link de "ver el caso completo" no cubría toda la tarjeta.

---

## 8. Casos de éxito arriba del calendario (16/10)

Juan marcó en dos capturas del celular dónde quería la sección: **Casos de éxito** pasó a ir justo debajo de los botones del hero y **antes de "Agendá tu auditoría"**. Commit `9ede8e4`, verificado en producción.

Las variantes `/hl1`–`/hl3` siguen sin la sección de casos. Se puede agregar si hace falta.

---

## 9. Tracking por persona (17/10, otra sesión)

Se hizo en una sesión paralela y está documentado en detalle en [[tracking-y-medicion]]. En resumen:

- Los links pueden llevar `?mc=<id de contacto de ManyChat>` más UTMs. Se guardan en el navegador y el `mc` se borra de la URL.
- **Microsoft Clarity** identifica la sesión con ese id, y GA4 lo recibe como `user_id`.
- **Eventos nuevos:**
  - `vsl_50` y `vsl_90`: alguien vio el 50% y el 90% del VSL.
  - `calendly_time`: eligió un horario en el calendario.
  - `calendly_booked`: agendó.
- Calendly recibe los UTMs y el `mc`.
- El Worker tiene un endpoint `/api/mc` que pone etiquetas `Web_*` en el contacto de ManyChat. La clave de ManyChat se guarda como secreto del Worker.
- **Límite de ManyChat:** con la clave de la API se pueden manejar contactos, etiquetas y campos, pero **no crear ni editar flujos**.

---

## Pendientes

- [ ] **`/contacto` y `/legal`:** están enlazadas desde el footer de todas las páginas y dan 404.
- [ ] Pedir la indexación de la home en **Google Search Console** (lo tiene que hacer Juan con su cuenta).
- [ ] **Página propia de Caro.** Cuando exista, se le agrega el link a su tarjeta en `src/data/casos.ts`.
- [ ] Decidir si las variantes `/hl1`–`/hl3` muestran la sección de casos.
- [ ] Opcional: borrar el proyecto de Cloudflare Pages `web-gravity`, que no se usa.
- [ ] Opcional: borrar los archivos sin uso, que hoy no afectan al sitio:
  - el carrusel de reseñas: `Reviews.astro`, `Stars.astro` y `reviews.ts`
  - el caso del congreso: `CaseStudy.astro`
- [ ] Revisar las pendientes de tracking listadas en [[tracking-y-medicion]].

---

## Cómo hacer cambios comunes

| Quiero cambiar… | Dónde |
|---|---|
| Headlines, textos generales, números de WhatsApp, links de VSL | `src/data/site.ts` |
| Textos de las tarjetas de casos (Guille y Caro) | `src/data/casos.ts` |
| Textos y datos del caso completo de Guille | `src/data/casoGuillermo.ts` |
| Orden de las secciones de la landing | `src/components/Landing.astro` |
| Tamaños en mobile | `src/styles/mobile.css` |
| Qué páginas entran al sitemap | `astro.config.mjs` |

**Scripts para assets** (se corren desde la carpeta del proyecto):

| Script | Para qué |
|---|---|
| `node scripts/process-vsl.mjs "ruta\video.mp4"` | Nuevo VSL: comprime, genera el poster y sube a R2 |
| `node scripts/process-case-media.mjs` | Fotos y clip de las tarjetas de casos |
| `node scripts/process-team.mjs` | Fotos del equipo |
| `node scripts/process-brand.mjs` | Logos y favicon |
| `node scripts/redact-chats.mjs` | Pixelar caras y datos en capturas de chats |

**Publicar:** commit y push a `main`. Cloudflare buildea y publica solo en uno o dos minutos.

**Reglas:**

- Nada sensible va dentro de `public/`, porque todo lo que está ahí se publica tal cual.
- Los originales van en `_originales/` y los videos pesados en `_local-media/`. Las dos carpetas están en `.gitignore`.

---

## Historial de commits

| Commit | Fecha | Qué |
|---|---|---|
| `8ee6243` | 15/08 | Commit inicial: la landing nueva |
| `1794cee` | 15/08 | Ajustes al scroll del caso de Guillermo |
| `d6e3efc` | 15/08 | Rediseño del layout mobile sin tocar el desktop |
| `830cb7b` | 15/08 | Merge del PR #1 (mobile-first-layout) |
| `8cfa4b1` | 21/08 | VSL propio en 1080p, servido desde R2 |
| `793e675` | 22/08 | `wrangler.jsonc` para que funcione el deploy por Git |
| `4e43607` | 22/08 | Merge a main: VSL en R2 más el fix del deploy |
| `767529d` | 22/08 | Sitio abierto a la indexación de Google |
| `fd1face` | 22/08 | `/video-t` y `/video-j` migradas desde Framer |
| `f8be9d5` | 05/10 | Tarjetas de casos, página propia de Guille y WhatsApp nuevo |
| `ef6e080` | 05/10 | Fotos de Guille y Caro y clip del clon |
| `9ede8e4` | 16/10 | Casos de éxito arriba del calendario |
| `38f7b24` | 17/10 | Tracking por persona: Clarity, id de ManyChat y etiquetas |
| `6070d9c` | 17/10 | Documentación del tracking |
