/**
 * Recurso de /recurso: "Tus primeras 10 ventas de tratamientos por Instagram".
 *
 * Todo el texto de la página vive acá. Los prompts de la IA están en
 * worker/recurso/prompts/ y los topes en worker/recurso/limits.js: si cambiás
 * la cantidad de guiones gratis, cambiala en los dos lugares.
 */

export const recurso = {
  title: 'Tus primeras 10 ventas de tratamientos por Instagram · Gravity Studios',
  description:
    'Armá gratis con IA la oferta de tu clínica, el perfil de tu paciente ideal y tus primeros guiones listos para grabar.',

  hero: {
    kicker: 'Recurso gratis para médicos estéticos, odontólogos y cirujanos plásticos',
    /** `accent: true` lo pinta de ámbar. */
    title: [
      { text: 'El sistema para conseguir tus ' },
      { text: 'primeras 10 ventas de tratamientos por Instagram', accent: true },
      { text: '… armado con IA para tu clínica' },
    ],
    lead: 'En 10 minutos tenés tu oferta, el perfil exacto de tu paciente ideal y tus primeros guiones listos para grabar. Es el mismo sistema que usamos con nuestros clientes.',
    cta: 'Armar mi sistema gratis',
    proof: 'El mismo método que usamos con especialistas que ya venden por Instagram',
  },

  /** Los 3 entregables, como pasos del camino a las 10 ventas. */
  pasos: [
    {
      n: '01',
      title: 'Tu oferta',
      text: 'Por qué un paciente te elige a vos y no a la clínica de enfrente. Tu promesa, tus diferenciales y cómo responder cada objeción.',
    },
    {
      n: '02',
      title: 'Tu paciente ideal',
      text: 'A quién le hablás: qué le preocupa, qué piensa antes de consultar y qué lo hace decidir. Para que cada video le hable a una persona real.',
    },
    {
      n: '03',
      title: 'Tus guiones',
      text: 'Qué publicar para que te escriban: guiones listos para grabar en 4 formatos, con la estructura que usamos con nuestros clientes.',
    },
  ],

  gate: {
    title: 'Empecemos. ¿A nombre de quién armamos tu sistema?',
    lead: 'Así lo guardamos y podés volver a verlo cuando quieras.',
    name: 'Tu nombre',
    phone: 'Tu WhatsApp',
    email: 'Tu email',
    submit: 'Empezar',
    consent:
      'Al continuar aceptás que Gravity Studios te contacte por WhatsApp o email, y que el material es orientativo: los resultados dependen de cada profesional.',
  },

  survey: {
    title: 'Contanos de tu clínica',
    lead: 'Con esto la IA arma todo a tu medida. Te lleva 2 minutos.',
    profesion: '¿Qué sos?',
    profesiones: [
      { key: 'medico_estetico', label: 'Médico/a estético/a' },
      { key: 'odontologo', label: 'Odontólogo/a' },
      { key: 'cirujano', label: 'Cirujano/a plástico/a' },
      { key: 'dermatologo', label: 'Dermatólogo/a' },
      { key: 'otra', label: 'Otra especialidad' },
    ],
    servicios: '¿Qué servicios ofrecés?',
    serviciosHint: 'Marcá con ⭐ tu servicio estrella: el que más te gusta hacer o el más rentable (uno o dos).',
    servicioPlaceholder: 'Ej.: Diseño de sonrisa',
    addServicio: '+ Agregar servicio',
    maxServicios: 10,
    ciudades: '¿En qué ciudad o ciudades atendés?',
    ciudadPlaceholder: 'Ej.: Córdoba',
    addCiudad: '+ Agregar ciudad',
    maxCiudades: 5,
    pais: 'País',
    opcional: 'Opcional, pero mejora mucho el resultado',
    precio: 'Precio aproximado de tu servicio estrella',
    precioPlaceholder: 'Ej.: USD 800',
    diferencial: '¿Qué te diferencia de otros profesionales?',
    diferencialPlaceholder: 'Ej.: 12 años de experiencia, trabajo solo con resina de alta gama…',
    submit: 'Guardar y seguir',
  },

  paises: [
    'Argentina',
    'Colombia',
    'México',
    'España',
    'Chile',
    'Uruguay',
    'Perú',
    'Ecuador',
    'Paraguay',
    'Bolivia',
    'Costa Rica',
    'Panamá',
    'Guatemala',
    'República Dominicana',
    'Venezuela',
    'Estados Unidos',
    'Otro',
  ],

  pasosApp: {
    oferta: {
      n: '01',
      title: 'Tu oferta',
      lead: 'La base de todo: qué vendés de verdad, a quién y por qué te eligen.',
      button: 'Generar mi oferta',
      loading: 'Armando tu oferta… tarda cerca de un minuto. Podés ir leyendo mientras aparece.',
    },
    avatar: {
      n: '02',
      title: 'Tu paciente ideal',
      lead: 'Quién es, qué le preocupa y qué lo hace decidir. Se arma a partir de tu oferta.',
      button: 'Generar mi paciente ideal',
      loading: 'Armando el perfil de tu paciente ideal…',
      locked: 'Primero generá tu oferta.',
    },
    guiones: {
      n: '03',
      title: 'Tus guiones',
      lead: 'Elegí el formato y el servicio, y generá guiones listos para grabar.',
      button: 'Generar guion',
      loading: 'Escribiendo tu guion…',
      locked: 'Primero generá tu paciente ideal.',
      formato: 'Formato',
      servicio: 'Servicio',
      limite: '¿Querés un mes de guiones y que te los grabe tu clon de IA? Lo hacemos con nuestros clientes.',
      limiteCta: 'Hablar con Gravity',
    },
  },

  formatos: [
    { key: 'talking_head', label: 'Talking head', hint: 'Hablás a cámara en el consultorio' },
    { key: 'selfie', label: 'Selfie', hint: 'Con el celular en la mano, más cercano' },
    { key: 'comentario', label: 'Respondiendo al comentario', hint: 'Respondés la duda de un paciente' },
    { key: 'testimonio', label: 'Testimonio', hint: 'Guía para grabar a un paciente' },
  ],

  /** Guiones gratis por médico (igual que TOPE_USUARIO.guion en el Worker). */
  guionesGratis: 6,

  nudge: {
    title: '¿Te está sirviendo?',
    text: 'Si querés, revisamos tu caso y te armamos un diagnóstico gratis de tu clínica: qué publicar, cómo responder los mensajes y cómo llegar a esas primeras 10 ventas.',
    button: 'Quiero mi diagnóstico gratis',
    dismiss: 'Seguir generando',
    floating: '¿Hablamos?',
  },

  shortDisclaimer: 'Generado con IA. Revisalo antes de publicar. Los resultados dependen de cada profesional.',

  disclaimer:
    'Este recurso es una herramienta educativa generada con inteligencia artificial. Los resultados dependen de cada profesional, de cómo aplique el material y de su mercado; Gravity Studios no garantiza ventas, pacientes ni resultados. El contenido generado debe ser revisado por el profesional antes de publicarlo y cumplir con las normas de publicidad médica de su país. Gravity Studios no se hace responsable por el uso que se haga de este material.',
};

/** El mensaje de WhatsApp del cartel, con lo que ya sabemos del médico. */
export function nudgeMessage(nombre: string, profesion: string, estrella: string) {
  const prof = recurso.survey.profesiones.find((p) => p.key === profesion)?.label.toLowerCase();
  return (
    `Hola! Soy ${nombre.split(/\s+/)[0]}` +
    (prof ? `, ${prof}` : '') +
    `. Usé el recurso de las primeras 10 ventas por Instagram` +
    (estrella ? ` para ${estrella}` : '') +
    ` y quiero el diagnóstico gratis de mi clínica.`
  );
}
