# Gravity — análisis del sitio actual y plan de migración

Medido sobre `gravity-studios.com` en producción (último deploy: 9/2/2026).
Todo lo que sigue son valores leídos del DOM y del CSS computado, no estimaciones.

---

## 1. Qué hay hoy, literalmente

### 1.1 Animaciones

**El hallazgo principal: la página tiene una sola animación.**

| | Cantidad | Detalle |
|---|---|---|
| Animaciones de entrada | **1** | El navbar baja desde `y: -150` con `opacity 0.001 → 1`. Spring: `stiffness 320, damping 60, mass 1`. Es el único elemento con `data-framer-appear-id` en toda la página. |
| `@keyframes` propios | **0** | Los únicos que carga la página son el spinner de Calendly y el de carga de Framer. Ninguno es nuestro. |
| Animaciones al hacer scroll | **0** | Ninguna sección aparece, sube ni se desvanece al entrar en viewport. |
| Transiciones de hover | **0** | Los CTA declaran `transition: all 0s` — duración **cero**. El botón no reacciona al mouse. |
| Carruseles / marquees | **0** | — |
| Parallax / sticky | **0** | — |

Además, `transition: all` está declarado en **445 elementos** con duración 0. Es el
default de Framer: hoy no hace nada, y es un anti-patrón — anima también propiedades
de layout, así que si algún día toma duración, cuesta frames.

> **Conclusión:** la sensación de "hay muchas animaciones en la página" no se
> corresponde con lo que está publicado. Hay una entrada de navbar y nada más.
> Esto es una **oportunidad**, no un problema: partimos de cero y no hay que
> replicar nada complejo.

### 1.2 Color — lo que se usa vs. el brandbook

| Rol | Design System (brandbook) | Producción hoy | ¿Coincide? |
|---|---|---|---|
| Amarillo de marca | `#EABE3F` | `#FFB400` | ❌ más saturado y más naranja |
| Crema (texto) | `#FFF2D3` | `#FFF2D3` | ✅ |
| Fondo | `#000000` | `#060504` | ⚠️ casi |
| Blanco | `#FFFFFF` | `#FFFFFF` | ✅ |
| Links sin estilar | — | `#0000EE` (azul del navegador) | ❌ 14 elementos |

Ese `#0000EE` en 14 nodos es CSS que nunca se aplicó: son links que quedaron con
el color por defecto del navegador.

### 1.3 Tipografía

| Familia | Dónde | ¿Está en el DS? |
|---|---|---|
| Baloo Da 2 (w500) | Titulares: 22 / 26 / 35 / 37 / 40px | ✅ es la display |
| Baloo Bhaina 2 | Subtítulos: 10 / 13 / 20px | ✅ es la body |
| **Satoshi** | Nav y UI: 13 / 16 / 18 / 28 / 31px | ❌ **no existe en el DS** |
| Times New Roman | Aparece como fallback en algún nodo | ❌ fuente sin declarar |

El brandbook es explícito: *"Dos faces, ambas de la superfamilia Baloo… el
contraste entre las dos **es** el sistema tipográfico."* Satoshi es una tercera
fuente que no debería estar.

### 1.4 Forma y espaciado

| Elemento | Producción | Brandbook |
|---|---|---|
| CTA primario | `radius: 10px`, padding `9px 13px` | *"Botones y badges son pills completos"* (`999px`) |
| Foto de equipo 1 | 378×398, `radius: 24px` | — |
| Foto de equipo 2 | 268×367, `radius: 0px` | *"Nada en Gravity tiene una esquina de 0px"* |
| Foto de equipo 3 | 269×369, `radius: 0px` | idem |
| Sombras | `none` en todos los CTA | 5 niveles de elevación definidos, ninguno en uso |

Las tres fotos del equipo tienen **tamaños distintos** entre sí y dos de ellas
tienen esquina recta. El padding del CTA principal (9×13px) es de botón
secundario, no de la acción principal de la página.

### 1.5 Estructura técnica

- **Breakpoints:** `≥1200px` / `810–1199px` / `≤809px`
- Framer emite el markup **tres veces**, uno por breakpoint, con clases
  `hidden-72rtr7` / `hidden-21wxdw` / `hidden-1cww334` → **~190 KB de HTML por página**
- Todo el layout es `flex-direction: column`. No hay una sola grilla CSS.
- **Sin Meta Pixel.** `fbq` no existe en ninguna ruta. Solo GA4 (`G-4K6QNGC64M`).
- `<meta description>` y `og:description` vacíos. `<title>` = "Gravity Funnel".
- Typo en el H1 de la home: *"transformar desconocidos **en en** al menos 40 pacientes"*.

### 1.6 Contenido embebido

| Qué | Dónde | Problema |
|---|---|---|
| VSL | YouTube `ygHrlIzxOt0`, con `autoplay=1` | El navegador bloquea autoplay con sonido → se ve un frame congelado. Carga ~700 KB de JS antes de que el usuario haga clic. |
| Video del congreso | **iframe de Google Drive** | Lento, sin poster, sin analítica, se rompe si cambian los permisos del archivo. |
| Calendario | Calendly inline | ~500 KB que cargan aunque nadie llegue a esa sección. |
| WhatsApp | Solo en `/video-t` y `/video-j` | Cero en la landing. El número de Tomás está mal escrito: `phone=54295474-8078`. |

---

## 2. Cómo estructuraría cada sección

Leyenda de la última columna: **YO** = lo hago en código · **VOS** = necesita una
decisión o un diseño tuyo en Claude Design.

| # | Sección | Hoy | Propuesta | Movimiento | Quién |
|---|---|---|---|---|---|
| 1 | **Nav** | Entra desde arriba, 4 links | Igual, + botón WhatsApp. Se compacta y gana fondo al scrollear | Mantener el spring actual + shrink on scroll | YO |
| 2 | **Hero** | Eyebrow + H1 + VSL autoplay + 1 CTA | Headline nuevo, VSL con fachada (poster → clic → carga), **2 CTA**: calendario + WhatsApp | Stagger de entrada: eyebrow → H1 → sub → video → CTA, 60ms entre cada uno | YO |
| 3 | **Prueba social** ⭐ | iframe de Drive del congreso | **Carrusel horizontal de reseñas** estilo Google Maps, avatar + estrellas + texto, loop infinito | Marquee continuo CSS, pausa al hover, swipe nativo en mobile, respeta `prefers-reduced-motion` | YO — datos y fotos: VOS |
| 4 | **Caso congreso** | Mezclado con la prueba social | Sección propia: video self-hosteado + 3 métricas (`Stat` del DS) | Contador que sube al entrar en viewport | YO |
| 5 | **Qué hacemos** | 3 bullets, el 3º es la garantía | 3 tarjetas (`Card` del DS). El 3º ya no habla de garantía | Reveal escalonado al entrar, 80ms de offset | YO |
| 6 | **Quiénes somos** | Texto largo + 2 fotos desparejas | Texto acortado + `TeamCard` uniformes (mismo ratio, radius del DS) | Lift al hover: `translateY(-4px)` + `--g-shadow-md`, 200ms | YO — fotos parejas: VOS |
| 7 | **Por qué elegirnos** | 2 columnas, 5 vs 5 | Igual, con ✓ ámbar / ✗ gris. **Último item cambiado** | Filas que entran alternadas izq/der | YO |
| 8 | **Calendario** | Calendly inline siempre cargado | Carga diferida al llegar a la sección + **WhatsApp como alternativa visible** | Fade al montar | YO |
| 9 | **CTA final** | No existe | Bloque nuevo: WhatsApp grande + link al calendario | — | YO |
| 10 | **Footer** | Mínimo | Logo, legal, contacto | — | YO |
| — | **WhatsApp flotante** | No existe | Burbuja fija en mobile | Entra a los 3s o al 25% de scroll | YO |

### Sobre el VSL y el video del congreso

Los dos salen de donde están hoy:
- **VSL** → fachada con poster. Cuando me pases el video nuevo es cambiar un ID.
- **Congreso** → sacarlo de Google Drive. Si me pasás el archivo lo self-hosteo
  en **Cloudflare Stream** (mismo proveedor que el hosting, sin iframe de terceros).

---

## 3. Reparto de trabajo: yo vs. Claude Design

**La regla que separa las dos cosas:**

> **Claude Design** define cómo se ve un componente **parado**: color, tipografía,
> espaciado, estados, variantes.
> **El código (yo)** define cómo se **comporta**: movimiento, scroll, hover,
> carrusel, swipe, responsive real.

El design system ya trae el vocabulario de motion — `--g-duration-fast/base/slow`,
`--g-ease-out`, `--g-ease-in-out`. Está definido; lo que falta es **aplicarlo**, y
eso es código.

### Lo que hago yo, sin que toques nada

Todas las animaciones de la lista de arriba, el carrusel completo (loop, autoplay,
pausa al hover, swipe, accesibilidad), la fachada del VSL, los hovers, el scroll
reveal, los contadores, el responsive, el WhatsApp flotante, el tracking, el SEO
y el deploy.

**Respondiendo puntualmente:** las animaciones de las tarjetas del equipo **no**
hay que hacerlas en Claude Design. El hover, el lift y la sombra los escribo yo
con los tokens del DS.

### Lo que conviene que hagas vos

Menos de lo que pensás — **el design system ya cubre casi todo**. Tiene `Card`,
`Avatar`, `Badge`, `Stat`, `List`, `Button`, `Navbar`, `Section`, `Container`,
`Grid`, `Stack`, `Logo` y 30 componentes más.

Revisando qué necesita esta landing contra lo que ya existe, falta **un solo
átomo**:

| Qué falta | Por qué | Se compone de |
|---|---|---|
| **`Stars` / `Rating`** | No existe ningún componente de puntuación en el DS y el carrusel lo necesita | Nuevo — 5 estrellas, `--g-accent`, tamaños sm/md |

El `ReviewCard` y el `TeamCard` **no hace falta diseñarlos**: salen de componer
`Card` + `Avatar` + `Stars`, que es exactamente como manda la guía del sistema
(*"Antes de escribir un `<div>` con CSS custom, fijate si `Stack`, `Grid`,
`Surface` o `Card` ya lo hacen"*).

Y hay **dos decisiones de marca** que son tuyas, no mías:

1. **¿Confirmamos `#EABE3F` y jubilamos `#FFB400`?** El DS dice que el de marca es
   el primero. El cambio se va a notar: el amarillo nuevo es más apagado y más
   elegante, el actual es más estridente.
2. **¿Sacamos Satoshi?** El brandbook dice dos fuentes Baloo y nada más.

### Los assets que sí dependen de vos

- Las reseñas del carrusel (texto, nombres, fotos) — el componente queda listo y vacío
- Las fotos del equipo, recortadas al mismo ratio
- El video del congreso como archivo
- El ID del VSL nuevo
- El Meta Pixel ID

---

## 4. Mejoras mínimas propuestas

Ordenadas por impacto sobre esfuerzo.

| # | Mejora | Por qué | Esfuerzo |
|---|---|---|---|
| 1 | **Instalar el Meta Pixel** | Estás corriendo ads sin píxel: sin retargeting y sin optimización por conversión. Es lo más caro de la lista. | 5 min |
| 2 | **Botones de WhatsApp** | Pedido tuyo, y coincide con lo que ya funciona en `/video-t`. | — |
| 3 | **Arreglar el número de Tomás** | `54295474-8078` tiene un guión en el medio. | 1 min |
| 4 | **Fachada en el VSL** | El autoplay de hoy no funciona y se ve un frame congelado. Además ahorra ~700 KB. | 20 min |
| 5 | **Sacar el video del congreso de Google Drive** | Es el punto más frágil del sitio. | 30 min + el archivo |
| 6 | **Calendly diferido** | ~500 KB que hoy cargan siempre. | 15 min |
| 7 | **Corregir el typo "en en"** | Está en el H1 de la home. | 1 min |
| 8 | **Title + meta description reales** | Hoy están vacíos y el title es "Gravity Funnel". | 10 min |
| 9 | **Una sola plantilla para hl1–hl5** | Hoy son 5 páginas duplicadas: cada cambio de copy se hace 5 veces. | Ya resuelto en el scaffold |
| 10 | **`noindex` en las variantes** | 5 páginas casi idénticas indexadas se canibalizan entre sí. | 2 min |
| 11 | **Alinear formas al brandbook** | CTA en pill, fotos con radius, sombras del DS. | 30 min |
| 12 | **CTA primario más grande** | 9×13px de padding es tamaño de botón secundario. | 5 min |
| 13 | **Respetar `prefers-reduced-motion`** | Ya está en el `global.css` del scaffold. | Hecho |

### Una propuesta de contenido, fuera de lo técnico

La página no tiene **precio, proceso ni FAQ**. Un prospecto que llega del anuncio
no sabe qué pasa después de agendar, cuánto cuesta ni cuánto dura. Una sección de
proceso en 3 o 4 pasos, entre "por qué elegirnos" y el calendario, suele levantar
la tasa de agenda más que cualquier animación. Es una decisión tuya de copy — yo
armo la sección cuando me digas.

---

## 5. Estado del scaffold

Ya está en `C:\Claude\Web Gravity`:

```
package.json / astro.config.mjs      Astro 5 instalado
src/styles/tokens.css                tokens del Gravity Design System
src/styles/global.css                reset + primitivas + botones pill
src/layouts/Base.astro               SEO, OG, GA4, Meta Pixel, tracking de clics
src/data/site.ts                     headlines, WhatsApp, VSL, Calendly, config
src/data/reviews.ts                  array vacío para las reseñas
src/components/WhatsAppButton.astro  con mensaje y evento por sección
src/components/Vsl.astro             fachada + carga diferida
public/fonts/*.woff2                 14 archivos, las 2 Baloo self-hosteadas
scripts/fetch-fonts.mjs              regenera las fuentes
```

**Alcance confirmado:** sitio completo (home, hl1–hl5, /contacto, /video-t,
/video-j, /legal) a Cloudflare Pages.
