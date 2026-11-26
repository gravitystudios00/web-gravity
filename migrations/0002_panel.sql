-- Panel propio de visitantes (/admin/panel): quién entra a cada página de
-- gravity-studios.com, qué hace y, cuando deja sus datos, quién es.
-- Aplicar:  npx.cmd wrangler d1 migrations apply gravity-recurso --remote
--
-- visitante (vid, un navegador) ── sesiones ── eventos_web
--     └── persona (cuando deja datos en el quiz, el recurso, Calendly o llega desde Cleo)

CREATE TABLE personas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT,
  telefono TEXT UNIQUE,                 -- +<dígitos>; une a la persona entre dispositivos
  email TEXT,
  instagram TEXT,
  origen TEXT NOT NULL,                 -- quiz | recurso | calendly | cleo (dónde dejó datos por primera vez)
  cw TEXT,                              -- código del bot de Chatwoot (?cw=)
  mc TEXT,                              -- id de ManyChat (links viejos)
  recurso_usuario_id INTEGER REFERENCES usuarios (id),
  datos TEXT,                           -- JSON: respuestas del quiz, temperatura, profesión, reserva…
  creado TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX personas_email ON personas (email);
CREATE INDEX personas_cw ON personas (cw);
CREATE INDEX personas_actualizado ON personas (actualizado);

CREATE TABLE visitantes (
  vid TEXT PRIMARY KEY,
  persona_id INTEGER REFERENCES personas (id),
  primera_vez TEXT NOT NULL DEFAULT (datetime('now')),
  ultima_vez TEXT NOT NULL DEFAULT (datetime('now')),
  visitas INTEGER NOT NULL DEFAULT 0,   -- sesiones
  -- Primer contacto: con qué llegó la primera vez (no se pisa).
  first_source TEXT, first_medium TEXT, first_campaign TEXT, first_content TEXT, first_term TEXT,
  first_fbclid TEXT, first_referrer TEXT, first_pagina TEXT,
  -- Último contacto con UTM.
  last_source TEXT, last_medium TEXT, last_campaign TEXT, last_content TEXT, last_term TEXT,
  pais TEXT, region TEXT, ciudad TEXT, isp TEXT,
  dispositivo TEXT, so TEXT, navegador TEXT, idioma TEXT, pantalla TEXT, zona_horaria TEXT
);
CREATE INDEX visitantes_persona ON visitantes (persona_id);
CREATE INDEX visitantes_ultima ON visitantes (ultima_vez);

CREATE TABLE sesiones (
  sid TEXT PRIMARY KEY,
  vid TEXT NOT NULL,
  inicio TEXT NOT NULL DEFAULT (datetime('now')),
  fin TEXT NOT NULL DEFAULT (datetime('now')),
  pagina_entrada TEXT,
  utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, utm_content TEXT, utm_term TEXT,
  referrer TEXT,
  ip TEXT,
  paginas INTEGER NOT NULL DEFAULT 0,
  eventos INTEGER NOT NULL DEFAULT 0,
  segundos_activos INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX sesiones_vid ON sesiones (vid, inicio);
CREATE INDEX sesiones_inicio ON sesiones (inicio);

CREATE TABLE eventos_web (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vid TEXT NOT NULL,
  sid TEXT NOT NULL,
  ts TEXT NOT NULL,                     -- UTC, del navegador (corregido si viene del futuro)
  pagina TEXT NOT NULL,                 -- ruta: /, /plan/, /recurso/…
  evento TEXT NOT NULL,
  dato TEXT                             -- JSON, hasta 1 KB
);
CREATE INDEX eventos_web_vid ON eventos_web (vid, ts);
CREATE INDEX eventos_web_evento ON eventos_web (evento, ts);
CREATE INDEX eventos_web_ts ON eventos_web (ts);
