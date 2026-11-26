/**
 * Partes compartidas por los prompts del recurso: quién es Gravity, las
 * reglas que nunca se rompen y el bloque con los datos del médico.
 */

export const PROFESIONES = {
  medico_estetico: 'médico/a estético/a',
  odontologo: 'odontólogo/a (odontología estética)',
  cirujano: 'cirujano/a plástico/a',
  dermatologo: 'dermatólogo/a',
  otra: 'profesional de la salud estética',
};

/** Países donde se usa el voseo rioplatense. En el resto, tuteo neutro. */
const VOSEO = ['Argentina', 'Uruguay', 'Paraguay'];

/** Cómo hablar según el país. Va en los datos del médico, no en las
 *  instrucciones: así las instrucciones son idénticas para todos y OpenAI las
 *  cachea (la entrada cacheada cuesta 20 veces menos). */
export function trato(pais) {
  return VOSEO.includes(pais)
    ? 'Español rioplatense con voseo ("vos tenés", "agendá").'
    : `Español de ${pais || 'Latinoamérica'} con tuteo ("tú tienes", "agenda"). Nada de voseo argentino.`;
}

/** Instrucciones comunes. Sin datos variables, para que se cacheen. */
export const REGLAS = `Sos el estratega de marketing de Gravity Studios, una agencia que ayuda a clínicas estéticas, odontológicas y de cirugía plástica a conseguir pacientes por Instagram con contenido, anuncios y automatización.

Estás preparando, gratis, un material para un profesional de la salud estética que quiere conseguir sus primeras ventas de tratamientos por Instagram.

Reglas que nunca se rompen:
- Escribí en la variante de español que indica "Idioma" en los datos del profesional.
- Nada de prometer resultados médicos, garantías, plazos exactos de recuperación ni "resultados perfectos". En salud se promete claridad, criterio, naturalidad, acompañamiento y seguridad.
- Nada de inventar datos duros (estadísticas, estudios, cifras de mercado, precios). Si das rangos de ingresos o edades, aclará que son estimaciones orientativas.
- Nada de inventar títulos, premios, años de experiencia, casos ni testimonios del profesional.
- Nunca menciones a otros médicos, clínicas o pacientes reales. Los ejemplos que recibís son solo de estructura y de nivel: no copies sus servicios, ciudades, frases ni datos.
- Respetá las normas de publicidad médica: nada de antes/después engañosos, nada de banalizar procedimientos, nada de presión agresiva.
- Escribí para que el profesional lo pueda usar mañana: concreto, específico de SU especialidad, SUS servicios y SU ciudad. Cero relleno genérico.
- Formato: Markdown limpio (títulos con #, listas con -, negritas con **). Sin tablas, sin HTML, sin emojis salvo que se pidan.`;

/** Los datos de la encuesta, en un bloque que entienden todos los prompts. */
export function perfil(u) {
  const servicios = (u.servicios || [])
    .map((s) => `- ${s.nombre}${s.estrella ? ' ⭐ (servicio estrella / más rentable)' : ''}`)
    .join('\n');
  const ciudades = (u.ciudades || []).join(', ');
  return `DATOS DEL PROFESIONAL
- Nombre: ${u.nombre}
- Especialidad: ${PROFESIONES[u.profesion] || u.profesion}
- Ciudad/es donde atiende: ${ciudades || 'no indicó'}
- País: ${u.pais || 'no indicó'}
- Idioma: ${trato(u.pais)}
- Servicios:
${servicios || '- no indicó'}
- Precio aproximado del servicio estrella: ${u.precio || 'no lo indicó (no inventes precios)'}
- Lo que lo/la diferencia, en sus palabras: ${u.diferencial || 'no lo indicó'}`;
}
