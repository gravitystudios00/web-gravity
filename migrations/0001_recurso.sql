-- Recurso de /recurso: usuarios, lo que generó cada uno y el log de lo que hizo.
-- Aplicar:  npx.cmd wrangler d1 migrations apply gravity-recurso --remote

CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL UNIQUE,          -- para retomar: /recurso?u=<codigo>
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT NOT NULL,
  profesion TEXT,
  servicios TEXT,                       -- JSON: [{"nombre": "...", "estrella": true}]
  ciudades TEXT,                        -- JSON: ["Córdoba", "Villa María"]
  pais TEXT,
  precio TEXT,                          -- precio aproximado del servicio estrella (opcional)
  diferencial TEXT,                     -- "algo que te diferencie" (opcional)
  utm TEXT,                             -- JSON
  fbc TEXT,
  ip TEXT,
  pais_ip TEXT,                         -- país que detecta Cloudflare
  creado TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX usuarios_creado ON usuarios (creado);
CREATE INDEX usuarios_ip ON usuarios (ip, creado);

CREATE TABLE generaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios (id),
  tipo TEXT NOT NULL,                   -- oferta | avatar | guion
  formato TEXT,                         -- talking_head | selfie | comentario | testimonio
  servicio TEXT,
  texto TEXT,
  tokens_entrada INTEGER,
  tokens_cache INTEGER,
  tokens_salida INTEGER,
  costo_usd REAL,
  estado TEXT NOT NULL DEFAULT 'ok',    -- ok | error
  creado TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX generaciones_usuario ON generaciones (usuario_id, tipo);
CREATE INDEX generaciones_creado ON generaciones (creado);

CREATE TABLE eventos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER REFERENCES usuarios (id),
  evento TEXT NOT NULL,
  dato TEXT,
  creado TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX eventos_usuario ON eventos (usuario_id, creado);
