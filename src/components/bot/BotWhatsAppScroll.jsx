// Animación "Bot de WhatsApp para clínicas" (Gravity Studios), controlada por scroll.
// Al bajar, el video avanza; al subir, retrocede. Sin dependencias aparte de React.
// Las fuentes (Baloo Da 2, Baloo Bhaina 2 y Figtree) las sirve el sitio desde
// public/fonts. La escena es la de Claude Design sin cambios; lo de abajo de
// T_START es el envoltorio para la tarjeta de "Qué hacemos".
import React from 'react';

// Foto de la doctora en el encabezado del chat (antes iba embebida en base64).
const AVATAR = '/servicios/bot-avatar.webp';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const Easing = {
  easeOutCubic: t => 1 - Math.pow(1 - t, 3),
  easeInCubic: t => t * t * t,
  easeInQuad: t => t * t,
};
const TimeCtx = React.createContext({ T: 0 });
const useComposition = () => React.useContext(TimeCtx);

const ACC = '#3DDC97';
const C = { bg: '#000000', ink: '#E8EEF0', mute: '#93A3A9', line: '#1C2A30', panel: '#0E181C',
  waBg: '#0B141A', waHead: '#1F2C34', waIn: '#202C33', waOut: '#005C4B', waTime: '#8696A0', waBlue: '#53BDEB', waText: '#E9EDEF' };
const FONT = "'Figtree', system-ui, sans-serif";
const FH = "'Baloo Da 2', system-ui, sans-serif";
const FB = "'Baloo Bhaina 2', system-ui, sans-serif";
const GOLD = '#EABE3F';
const G = { cream: '#FFF2D3', mute: '#A9A08B', panel: '#0D0B07', line: '#2A2517', line2: '#4A4230' };

const MOTION = {
  enter: (T, s, d = 0.4) => Easing.easeOutCubic(clamp((T - s) / d, 0, 1)),
  exit: (T, s, d = 0.35) => Easing.easeInCubic(clamp((T - s) / d, 0, 1)),
  pulse: (T, s, d = 1.0) => { const x = (T - s) / d; if (x < 0 || x > 1) return 0; return x < 0.15 ? x / 0.15 : 1 - Easing.easeInQuad((x - 0.15) / 0.85); },
};
const vis = (T, a, b, fi = 0.3, fo = 0.3) => MOTION.enter(T, a, fi) * (1 - MOTION.exit(T, b - fo, fo));

const LAYOUTS = {
  h: { W: 1920, H: 1080,
    phone: { x: 150, y: 40, w: 540, h: 1000, r: 58, inset: 12, statusH: 46, headerH: 92, inputH: 88, padX: 18, chat: 24, time: 18, gap: 12, gapSame: 5, exitX: -260, exitY: 0 },
    panel: { x: 790, y: 180, w: 1000, h: 860, pad: 44, title: 34, listTop: 128, RH: 50, label: 20, value: 26, labelW: 250, stacked: false, chip: 21 },
    thought: { right: 130, top: 32, w: 640, label: 18, text: 24 },
    intro: { titleTop: 230, title: 76, titleW: 1400, cardTop: 600, cardW: 560, cardH: 168, k: 1 },
    doc: { x: 660, y: 40, w: 600, h: 1000, f: 1 },
    close: { f: 66, w: 1500 },
    threadV: false },
  v: { W: 1080, H: 1920,
    phone: { x: 30, y: 526, w: 1020, h: 1374, r: 76, inset: 14, statusH: 64, headerH: 130, inputH: 120, padX: 28, chat: 38, time: 24, gap: 18, gapSame: 7, exitX: 0, exitY: 200 },
    panel: { x: 90, y: 20, w: 900, h: 490, pad: 20, title: 24, listTop: 58, RH: 32, label: 16, value: 19, labelW: 180, stacked: false, chip: 16 },
    thought: { right: 90, top: 360, w: 480, label: 16, text: 20 },
    intro: { titleTop: 520, title: 84, titleW: 920, cardTop: 1060, cardW: 760, cardH: 220, k: 1.35 },
    doc: { x: 110, y: 150, w: 860, h: 1620, f: 1.4 },
    close: { f: 76, w: 920 },
    threadV: true, noThreads: true },
};

const MSGS = [
  { id: 'p1', who: 'p', at: 3.0, time: '10:02', ad: true, text: 'Hola! vi el anuncio de las carillas, cuánto sale el diseño en resina?' },
  { id: 'b1', who: 'b', at: 4.5, time: '10:02', text: '¡Hola, Valentina! Te hago una pregunta: si hoy pudieras mejorar algo de tu sonrisa, hay algo que cambiarías?', buttons: ['Sii', 'No, esta perfecta'] },
  { id: 'b2', who: 'b', at: 6.0, time: '10:02', text: 'El precio depende del material, de cuántos dientes se trabajen y de lo que necesite tu caso; eso lo define Carolina en la valoración, que no tiene costo.' },
  { id: 'p2', who: 'p', at: 7.8, time: '10:09', text: 'sí, los tengo como amarillos y uno de adelante lo tengo desgastado' },
  { id: 'b3', who: 'b', at: 10.4, time: '10:10', text: 'qué has intentado o qué tratamiento te has hecho hasta ahora para mejorar eso?' },
  { id: 'p3', who: 'p', at: 11.8, time: '10:14', text: 'me hice un blanqueamiento hace como 2 años pero se me volvieron a poner amarillos. y la resina se mancha? porque una amiga me dijo que sí' },
  { id: 'b4', who: 'b', at: 14.6, time: '10:15', text: 'Te gustaría que revisemos tu caso y te ayude a agendar una valoración?' },
  { id: 'p4a', who: 'p', at: 16.3, time: '10:20', text: 'y eso duele? me da miedo que me limen los dientes' },
  { id: 'p4b', who: 'p', at: 17.0, time: '10:20', text: 'se puede pagar en cuotas?' },
  { id: 'p5', who: 'p', at: 19.4, time: '10:31', text: 'dale sí. atienden los sábados? trabajo toda la semana' },
  { id: 'b4b', who: 'b', at: 21.0, time: '10:31', text: 'Tranquila, los dientes no se liman. Y las formas de pago te las explicamos en la consulta.' },
  { id: 'b5', who: 'b', at: 22.4, time: '10:32', opts: ['Bogotá', 'Cajicá', 'Virtual'] },
  { id: 'p6', who: 'p', at: 23.6, time: '10:34', text: 'Cajicá me queda perfecto, vivo en Chía' },
  { id: 'b6', who: 'b', at: 25.2, time: '10:35', text: 'perfecto, me regalas tu nombre completo?' },
  { id: 'p7', who: 'p', at: 26.0, time: '10:36', text: 'Valentina Rojas Méndez' },
  { id: 'b7', who: 'b', at: 28.7, time: '11:15', text: 'Valentina! mañana sábado 24 tengo 3:30 pm o 5:00 pm en Cajicá, cuál te sirve?' },
  { id: 'p8', who: 'p', at: 29.6, time: '11:22', text: '3:30 porfa' },
  { id: 'b8', who: 'b', at: 30.4, time: '11:24', text: 'Listo, te espero mañana a las 3:30 pm en Sabana Park torre 2, consultorio 411' },
];
const MI = {}; MSGS.forEach((m, i) => { MI[m.id] = i; });

const FIELDS = [
  { label: 'Origen', val: 'Anuncio de carillas (Click to WhatsApp)', src: 'p1', at: 3.7 },
  { label: 'Consulta', val: 'precio', src: 'p1', at: 4.0 },
  { label: 'Motivo de consulta', chips: ['color amarillo', 'desgaste en diente frontal'], src: 'p2', at: 8.4 },
  { label: 'Antecedente', val: 'blanqueamiento hace 2 años', src: 'p3', at: 12.5 },
  { label: 'Duda', val: '¿la resina se mancha?', src: 'p3', at: 13.0 },
  { label: 'Inquietud', val: 'miedo al desgaste del diente', src: 'p4a', at: 16.9 },
  { label: 'Pregunta', val: 'formas de pago', src: 'p4b', at: 17.6 },
  { label: 'Estado', val: 'Quiere agendar valoración', src: 'p5', at: 20.0 },
  { label: 'Disponibilidad', val: 'sábados', src: 'p5', at: 20.5 },
  { label: 'Sede', val: 'Cajicá, Sabana Park', src: 'p6', at: 24.2 },
  { label: 'Zona', val: 'Chía', src: 'p6', at: 24.7 },
  { label: 'Nombre', val: 'Valentina Rojas Méndez', src: 'p7', at: 26.6 },
  { label: 'Cita', val: 'Sábado 24 de octubre, 3:30 pm, Cajicá', src: 'p8', at: 30.9, key: true },
];

const THOUGHTS = [
  { kind: 'think', at: 5.0, until: 7.9, text: 'No doy precio sin valorar. Derivo a valoración gratuita.' },
  { kind: 'note', at: 8.8, until: 11.7, text: 'Respondió dos preguntas en un solo mensaje. El asistente avanza solo al siguiente paso.' },
  { kind: 'think', at: 18.0, until: 21.2, text: 'Respondo con tranquilidad y vuelvo a proponer la valoración.' },
];

const NOTIF = [
  ['Paciente', 'Valentina Rojas Méndez'],
  ['Cita', 'Sábado 24 de octubre, 3:30 pm, Cajicá'],
  ['Motivo', 'dientes amarillos y desgaste en un diente frontal'],
  ['Antecedente', 'blanqueamiento hace 2 años'],
  ['Inquietudes', 'miedo a que limen los dientes, pago en cuotas, atención los sábados'],
  ['Origen', 'anuncio de carillas'],
];

function lerpColor(a, b, t) {
  const pa = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16));
  return 'rgb(' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',') + ')';
}
function stepInterp(T, events, v0, d) {
  let v = v0;
  for (const e of events) { if (T < e.t) break; v = v + (e.v - v) * MOTION.enter(T, e.t, d); }
  return v;
}
const fmtMin = m => Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');

const Ticks = ({ s }) => (
  <svg width={s * 1.15} height={s * 0.75} viewBox="0 0 17 11" style={{ display: 'block' }}>
    <path d="M1 6l3 3 6-7M7 9l1 1 7-8" fill="none" stroke={C.waBlue} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function StatusBar({ h, time, fs, pad }) {
  return (
    <div style={{ height: h, background: C.waHead, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${pad}px`, color: C.waText, fontSize: fs, fontWeight: 600, flexShrink: 0, overflow: 'hidden' }}>
      <div style={{ fontVariantNumeric: 'tabular-nums' }}>{time}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: fs * 0.35 }}>
        {[0.45, 0.65, 0.85, 1].map((k, i) => <div key={i} style={{ width: fs * 0.18, height: fs * 0.7 * k, background: C.waText, borderRadius: 1, alignSelf: 'flex-end' }}></div>)}
        <div style={{ width: fs * 1.4, height: fs * 0.7, border: `2px solid ${C.waText}`, borderRadius: 4, marginLeft: fs * 0.3, padding: 1.5, boxSizing: 'border-box' }}>
          <div style={{ width: '85%', height: '100%', background: C.waText, borderRadius: 1.5 }}></div>
        </div>
      </div>
    </div>
  );
}

function Bubble({ m, P, e, hl }) {
  const isP = m.who === 'p';
  const r = P.chat * 0.6;
  const bg = isP ? lerpColor(C.waOut, '#0B7D62', hl) : C.waIn;
  const timeEl = (
    <span style={{ float: 'right', display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: P.chat * 0.6, marginTop: P.chat * 0.55, marginBottom: -P.chat * 0.1, fontSize: P.time, lineHeight: 1, color: isP ? '#A9CFC6' : C.waTime }}>
      {m.time}{isP && <Ticks s={P.time} />}
    </span>
  );
  const box = { background: bg, color: C.waText, fontSize: P.chat, lineHeight: 1.32, padding: `${P.chat * 0.36}px ${P.chat * 0.52}px`, borderRadius: r, display: 'flow-root',
    boxShadow: hl > 0 ? `0 0 0 ${2.5}px rgba(61,220,151,${hl}), 0 0 28px rgba(61,220,151,${0.4 * hl})` : 'none' };
  if (isP) box.borderTopRightRadius = 4; else box.borderTopLeftRadius = 4;
  const btn = { background: C.waIn, color: C.waBlue, fontSize: P.chat * 0.95, fontWeight: 600, textAlign: 'center', padding: `${P.chat * 0.42}px ${P.chat * 0.5}px`, borderRadius: r * 0.7 };
  return (
    <div data-msg="" style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: 3, opacity: e, transform: `translateY(${(1 - e) * 14}px) scale(${0.97 + 0.03 * e})`, transformOrigin: isP ? 'right bottom' : 'left bottom' }}>
      {m.opts ? (
        <React.Fragment>
          {m.opts.map((o, i) => <div key={i} style={Object.assign({}, btn, i === 0 ? { borderTopLeftRadius: 4 } : {})}>{o}</div>)}
        </React.Fragment>
      ) : (
        <div style={box}>
          {m.ad && (
            <div style={{ display: 'flex', alignItems: 'center', gap: P.chat * 0.5, background: 'rgba(0,0,0,0.25)', borderRadius: r * 0.6, padding: P.chat * 0.3, marginBottom: P.chat * 0.35 }}>
              <div style={{ width: P.chat * 2.1, height: P.chat * 2.1, borderRadius: r * 0.5, background: '#0E3B33', flexShrink: 0 }}></div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: P.chat * 0.92 }}>Carillas de resina</div>
                <div style={{ fontSize: P.time, color: '#A9CFC6', marginTop: 2 }}>Click to WhatsApp</div>
              </div>
            </div>
          )}
          {m.text}{timeEl}
        </div>
      )}
      {m.buttons && m.buttons.map((b, i) => <div key={i} style={btn}>{b}</div>)}
    </div>
  );
}

function Phone({ L, T, colRef, geo, ty, statusTime, hls, op, sx, sy }) {
  const P = L.phone;
  const vh = P.h - 2 * P.inset - P.statusH - P.headerH - P.inputH;
  let typing = null;
  MSGS.forEach((m, j) => { if (m.who === 'b' && T >= m.at - 0.4 && T < m.at + 0.05 && j > 0) typing = j; });
  const typingTop = geo && typing != null ? geo[typing - 1].top + geo[typing - 1].h + P.gap : 0;
  const tOp = typing != null ? MOTION.enter(T, MSGS[typing].at - 0.4, 0.15) * (1 - MOTION.exit(T, MSGS[typing].at - 0.05, 0.1)) : 0;
  const ag = vis(T, 26.6, 28.3, 0.3, 0.3);
  const agP = clamp((T - 26.7) / 1.4, 0, 1);
  const hdrF = P.chat * 1.05;
  return (
    <div style={{ position: 'absolute', left: P.x, top: P.y, width: P.w, height: P.h, borderRadius: P.r, background: '#04070A', fontFamily: FONT, boxShadow: '0 0 0 2px #1E2A30, 0 40px 90px rgba(0,0,0,0.55)', opacity: op, transform: `translate(${sx}px,${sy}px)` }}>
      <div style={{ position: 'absolute', inset: P.inset, borderRadius: P.r - P.inset, overflow: 'hidden', background: C.waBg, display: 'flex', flexDirection: 'column' }}>
        <StatusBar h={P.statusH} time={statusTime} fs={P.time} pad={P.padX * 1.6} />
        <div style={{ height: P.headerH, background: C.waHead, display: 'flex', alignItems: 'center', gap: P.chat * 0.6, padding: `0 ${P.padX}px`, flexShrink: 0, borderBottom: '1px solid #18242B' }}>
          <svg width={hdrF} height={hdrF} viewBox="0 0 24 24"><path d="M20 12H5M11 5l-7 7 7 7" fill="none" stroke={C.waText} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <img src={AVATAR} alt="" style={{ width: P.headerH * 0.62, height: P.headerH * 0.62, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
          <div style={{ color: C.waText, fontSize: hdrF, fontWeight: 600, whiteSpace: 'nowrap' }}>Dra Carolina Alonso</div>
        </div>
        <div style={{ height: vh, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          <div ref={colRef} style={{ position: 'absolute', left: 0, top: 0, width: '100%', boxSizing: 'border-box', padding: `${P.gap}px ${P.padX}px 0`, transform: `translateY(${ty}px)` }}>
            {MSGS.map((m, i) => {
              const same = i > 0 && MSGS[i - 1].who === m.who;
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: m.who === 'p' ? 'flex-end' : 'flex-start', marginTop: i === 0 ? 0 : (same ? P.gapSame : P.gap) }}>
                  <Bubble m={m} P={P} e={MOTION.enter(T, m.at, 0.32)} hl={hls[i] || 0} />
                </div>
              );
            })}
            <div style={{ position: 'absolute', left: P.padX, top: typingTop, opacity: tOp, background: C.waIn, borderRadius: P.chat * 0.6, borderTopLeftRadius: 4, padding: `${P.chat * 0.55}px ${P.chat * 0.7}px`, display: 'flex', gap: P.chat * 0.28 }}>
              {[0, 1, 2].map(k => <div key={k} style={{ width: P.chat * 0.32, height: P.chat * 0.32, borderRadius: '50%', background: C.waTime, opacity: 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(T * 14 - k * 1.1)) }}></div>)}
            </div>
          </div>
          <div style={{ position: 'absolute', inset: 0, background: `rgba(5,10,12,${0.55 * ag})`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: ag > 0 ? 1 : 0 }}>
            <div style={{ opacity: ag, transform: `scale(${0.94 + 0.06 * ag})`, background: '#13221F', border: '1px solid rgba(61,220,151,0.5)', borderRadius: P.chat * 0.9, padding: `${P.chat * 0.8}px ${P.chat}px`, width: '72%', boxSizing: 'border-box' }}>
              <div style={{ color: C.waText, fontSize: P.chat, fontWeight: 600, lineHeight: 1.3, textAlign: 'center' }}>El asistente consulta la agenda de la doctora</div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', marginTop: P.chat * 0.7, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${agP * 100}%`, background: ACC, borderRadius: 3 }}></div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ height: P.inputH, display: 'flex', alignItems: 'center', gap: P.chat * 0.4, padding: `0 ${P.padX * 0.7}px`, flexShrink: 0 }}>
          <div style={{ flex: 1, height: P.inputH * 0.62, borderRadius: P.inputH, background: C.waHead, display: 'flex', alignItems: 'center', padding: `0 ${P.chat * 0.8}px`, color: C.waTime, fontSize: P.chat }}>Mensaje</div>
          <div style={{ width: P.inputH * 0.62, height: P.inputH * 0.62, borderRadius: '50%', background: '#21C063', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={P.inputH * 0.3} height={P.inputH * 0.3} viewBox="0 0 24 24" style={{ display: 'block', marginLeft: P.inputH * 0.03 }}><path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.99.99 0 00-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" fill="#0B141A" /></svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({ L, T, scroll, op, tr }) {
  const Q = L.panel;
  const listH = Q.h - Q.listTop - Q.pad * 0.6;
  return (
    <div style={{ position: 'absolute', left: Q.x, top: Q.y, width: Q.w, height: Q.h, background: G.panel, border: `1px solid ${G.line}`, borderRadius: 28, boxSizing: 'border-box', opacity: op, transform: tr, transformOrigin: 'center', boxShadow: '0 30px 80px rgba(0,0,0,0.45)' }}>
      <div style={{ position: 'absolute', left: Q.pad, right: Q.pad, top: Q.pad, fontSize: Q.title, fontFamily: FH, fontWeight: 700, lineHeight: 1.2, color: G.cream }}>Lo que anota el asistente mientras conversa</div>
      <div style={{ position: 'absolute', left: Q.pad, right: Q.pad, top: Q.listTop, height: listH, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, transform: `translateY(${-scroll}px)` }}>
          {FIELDS.map((f, i) => {
            const e = MOTION.enter(T, f.at, 0.4);
            const fresh = MOTION.pulse(T, f.at, 1.4);
            const on = T >= f.at;
            const valColor = f.key ? GOLD : G.cream;
            const value = f.chips ? (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'nowrap' }}>
                {f.chips.map((c, k) => {
                  const ce = MOTION.enter(T, f.at + k * 0.15, 0.35);
                  return <div key={k} style={{ opacity: ce, transform: `scale(${0.9 + 0.1 * ce})`, fontSize: Q.chip, fontWeight: 600, color: GOLD, whiteSpace: 'nowrap' }}>{c}{k < f.chips.length - 1 ? ',' : ''}</div>;
                })}
              </div>
            ) : (
              <div style={{ fontSize: Q.value, fontFamily: FH, fontWeight: f.key ? 700 : 500, color: valColor, whiteSpace: 'nowrap', opacity: e, transform: `translateX(${(1 - e) * -12}px)` }}>{f.val}</div>
            );
            return (
              <div key={i} style={{ height: Q.RH, position: 'relative', display: 'flex', flexDirection: Q.stacked ? 'column' : 'row', alignItems: Q.stacked ? 'flex-start' : 'center', justifyContent: Q.stacked ? 'center' : 'flex-start', gap: Q.stacked ? 4 : 0, paddingLeft: Q.label * 1.6, borderBottom: `1px solid ${G.line}`, boxSizing: 'border-box', background: `rgba(234,190,63,${0.1 * fresh})` }}>
                <div style={{ position: 'absolute', left: Q.label * 0.3, top: '50%', width: Q.label * 0.55, height: Q.label * 0.55, marginTop: -Q.label * 0.275, borderRadius: '50%', boxSizing: 'border-box', border: `2px solid ${on ? GOLD : G.line2}`, background: on ? GOLD : 'transparent', transform: `scale(${1 + 0.35 * fresh})` }}></div>
                <div style={{ width: Q.stacked ? 'auto' : Q.labelW, flexShrink: 0, fontSize: Q.label, color: f.key && on ? GOLD : G.mute, fontWeight: 500 }}>{f.label}</div>
                {on ? value : <div style={{ width: f.chips ? '42%' : '30%', height: Q.label * 0.5, borderRadius: 99, background: G.line }}></div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Thoughts({ L, T, hide }) {
  const TH = L.thought;
  return (
    <React.Fragment>
      {THOUGHTS.map((th, i) => {
        const o = vis(T, th.at, th.until, 0.35, 0.3) * hide;
        const note = th.kind === 'note';
        return (
          <div key={i} style={{ position: 'absolute', right: TH.right, top: TH.top, width: TH.w, opacity: o, visibility: o > 0.001 ? 'visible' : 'hidden', transform: `translateY(${(1 - o) * 10}px) scale(${0.96 + 0.04 * o})`, transformOrigin: 'left bottom', background: note ? '#1A1608' : '#14110A', border: `1.5px solid ${note ? 'rgba(234,190,63,0.55)' : '#3A3320'}`, borderRadius: 24, padding: `${TH.text * 0.6}px ${TH.text * 0.9}px`, boxSizing: 'border-box', boxShadow: '0 18px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ fontSize: TH.label, color: note ? GOLD : G.mute, fontWeight: 600, marginBottom: 6 }}>{note ? 'Nota' : 'El asistente piensa'}</div>
            <div style={{ fontSize: TH.text, lineHeight: 1.32, color: G.cream, fontStyle: note ? 'normal' : 'italic', textWrap: 'pretty' }}>{th.text}</div>
            {!note && <div style={{ position: 'absolute', left: 36, bottom: -16, width: 16, height: 16, borderRadius: '50%', background: '#14110A', border: '1.5px solid #3A3320' }}></div>}
            {!note && <div style={{ position: 'absolute', left: 22, bottom: -30, width: 9, height: 9, borderRadius: '50%', background: '#14110A', border: '1.5px solid #3A3320' }}></div>}
          </div>
        );
      })}
    </React.Fragment>
  );
}

function Threads({ L, T, bubbleAbs, scroll, on }) {
  const Q = L.panel;
  if (!on) return null;
  return (
    <svg width={L.W} height={L.H} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', overflow: 'visible' }}>
      {FIELDS.map((f, i) => {
        const b = bubbleAbs(MI[f.src]);
        const live = T >= f.at && T <= f.at + 1.15 && b;
        const draw = MOTION.enter(T, f.at, 0.45);
        const fade = 1 - MOTION.exit(T, f.at + 0.7, 0.4);
        const ex = Q.x + Q.pad + Q.label * 0.575, ey = Q.y + Q.listTop + i * Q.RH + Q.RH / 2 - scroll;
        let d = '';
        if (b) {
          if (L.threadV) {
            const sx = b.x + b.w * 0.5, sy = b.y - 4;
            d = `M${sx},${sy} C${sx},${sy - 160} ${ex - 40},${ey + 160} ${ex},${ey}`;
          } else {
            const sx = b.x + b.w + 6, sy = b.y + b.h / 2;
            d = `M${sx},${sy} C${sx + 140},${sy} ${ex - 160},${ey} ${ex},${ey}`;
          }
        }
        return (
          <g key={i} opacity={live ? fade : 0}>
            <path d={d} pathLength="1" fill="none" stroke={GOLD} strokeOpacity="0.18" strokeWidth="10" strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1 - draw} />
            <path d={d} pathLength="1" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1 - draw} />
          </g>
        );
      })}
    </svg>
  );
}

function DoctorPhone({ L, T }) {
  const D = L.doc, f = D.f;
  const e = MOTION.enter(T, 32.5, 0.7), x = MOTION.exit(T, 38.0, 0.4);
  const op = e * (1 - x);
  const ne = MOTION.enter(T, 33.35, 0.45);
  const ce = MOTION.enter(T, 34.7, 0.4);
  const ev = MOTION.enter(T, 35.1, 0.5);
  const ck = MOTION.enter(T, 35.7, 0.35);
  const hours = ['3:00 pm', '3:30 pm', '4:00 pm'];
  const rowH = 58 * f;
  return (
    <div style={{ position: 'absolute', left: D.x, top: D.y, width: D.w, height: D.h, borderRadius: 60 * f, background: '#000000', fontFamily: FB, boxShadow: '0 0 0 2px #2A2517, 0 40px 90px rgba(0,0,0,0.55)', opacity: op, visibility: op > 0.001 ? 'visible' : 'hidden', transform: `translateY(${(1 - e) * 120}px) scale(${1 - 0.04 * x})` }}>
      <div style={{ position: 'absolute', inset: 12 * f, borderRadius: 48 * f, overflow: 'hidden', background: '#0A0905', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 46 * f, display: 'flex', alignItems: 'center', padding: `0 ${30 * f}px`, color: G.cream, fontSize: 18 * f, fontWeight: 600 }}>11:24</div>
        <div style={{ padding: `${30 * f}px ${22 * f}px`, display: 'flex', flexDirection: 'column', gap: 18 * f }}>
          <div style={{ opacity: ne, transform: `translateY(${(1 - ne) * -24}px) scale(${0.94 + 0.06 * ne})`, background: '#14110A', border: '1.5px solid rgba(234,190,63,0.55)', borderRadius: 28 * f, padding: `${24 * f}px ${26 * f}px`, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 * f, marginBottom: 16 * f }}>
              <div style={{ width: 14 * f, height: 14 * f, borderRadius: '50%', background: GOLD, flexShrink: 0 }}></div>
              <div style={{ fontSize: 28 * f, fontFamily: FH, fontWeight: 700, color: G.cream, lineHeight: 1.15 }}>Nueva valoración agendada</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 * f }}>
              {NOTIF.map(([k, v], i) => {
                const re = MOTION.enter(T, 33.6 + i * 0.12, 0.35);
                return (
                  <div key={i} style={{ opacity: re, transform: `translateY(${(1 - re) * 8}px)` }}>
                    <div style={{ fontSize: 18 * f, color: k === 'Cita' ? GOLD : G.mute, fontWeight: 600 }}>{k}</div>
                    <div style={{ fontSize: 22 * f, fontFamily: FH, color: k === 'Cita' ? GOLD : G.cream, fontWeight: k === 'Cita' || k === 'Paciente' ? 700 : 500, lineHeight: 1.28, textWrap: 'pretty' }}>{v}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ opacity: ce, transform: `translateY(${(1 - ce) * 20}px)`, background: '#100E08', border: `1px solid ${G.line}`, borderRadius: 28 * f, padding: `${20 * f}px ${24 * f}px` }}>
            <div style={{ fontSize: 20 * f, fontFamily: FH, fontWeight: 700, color: G.cream, marginBottom: 12 * f }}>Sábado 24 de octubre</div>
            <div style={{ position: 'relative' }}>
              {hours.map((h, i) => (
                <div key={i} style={{ height: rowH, display: 'flex', alignItems: 'flex-start', borderTop: `1px solid ${G.line}`, fontSize: 18 * f, color: G.mute, paddingTop: 6 * f, boxSizing: 'border-box' }}>{h}</div>
              ))}
              <div style={{ position: 'absolute', left: 104 * f, right: 0, top: rowH + 4 * f, height: rowH - 8 * f, borderRadius: 12 * f, background: 'rgba(234,190,63,0.16)', border: `1.5px solid ${GOLD}`, display: 'flex', alignItems: 'center', padding: `0 ${14 * f}px`, fontSize: 19 * f, fontWeight: 600, color: G.cream, whiteSpace: 'nowrap', overflow: 'hidden', opacity: ev, transform: `translateY(${(1 - ev) * -70 * f}px)` }}>Valoración · Valentina Rojas Méndez</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 * f, marginTop: 14 * f, opacity: ck, transform: `translateY(${(1 - ck) * 8}px)` }}>
              <div style={{ width: 32 * f, height: 32 * f, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transform: `scale(${0.6 + 0.4 * ck})` }}>
                <svg width={18 * f} height={18 * f} viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div style={{ fontSize: 22 * f, fontFamily: FH, fontWeight: 600, color: GOLD }}>Ya está en tu calendario</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Piece({ orientation, threads }) {
  const L = LAYOUTS[orientation === 'vertical' ? 'v' : 'h'];
  const { T } = useComposition();
  const colRef = React.useRef(null);
  const [geo, setGeo] = React.useState(null);
  React.useLayoutEffect(() => {
    const el = colRef.current; if (!el) return;
    const measure = () => {
      const g = Array.from(el.querySelectorAll('[data-msg]')).map(k => ({ top: k.offsetTop, left: k.offsetLeft, w: k.offsetWidth, h: k.offsetHeight }));
      setGeo(prev => JSON.stringify(prev) === JSON.stringify(g) ? prev : g);
    };
    measure();
    if (document.fonts) document.fonts.ready.then(measure);
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const P = L.phone, Q = L.panel;
  const vx = P.x + P.inset, vy = P.y + P.inset + P.statusH + P.headerH;
  const vh = P.h - 2 * P.inset - P.statusH - P.headerH - P.inputH;
  const typingH = P.chat * 0.32 + 2 * P.chat * 0.55;
  let ty = vh - P.gap;
  if (geo && geo.length === MSGS.length) {
    const bottom = j => geo[j].top + geo[j].h;
    const ev = [];
    MSGS.forEach((m, j) => {
      if (m.who === 'b' && j > 0) ev.push({ t: m.at - 0.4, v: bottom(j - 1) + P.gap + typingH });
      ev.push({ t: m.at, v: bottom(j) });
    });
    ty = vh - P.gap - stepInterp(T, ev, 0, 0.35);
  }

  const listH = Q.h - Q.listTop - Q.pad * 0.6;
  const scroll = stepInterp(T, FIELDS.map((f, i) => ({ t: f.at, v: Math.max(0, (i + 1) * Q.RH - listH) })), 0, 0.4);

  let cur = '10:02';
  MSGS.forEach(m => { if (T >= m.at) cur = m.time; });
  if (T >= 27.2 && T < 28.7) cur = fmtMin(Math.round(636 + 39 * MOTION.enter(T, 27.2, 0.7)));

  const hls = MSGS.map((m, i) => FIELDS.reduce((a, f) => MI[f.src] === i ? Math.max(a, MOTION.pulse(T, f.at, 1.0)) : a, 0));

  const pIn = MOTION.enter(T, 2.0, 0.65), pOut = MOTION.exit(T, 32.2, 0.6);
  const phoneOp = pIn * (1 - pOut);
  const sx = P.exitX * pOut, sy = (1 - pIn) * 60 + P.exitY * pOut;
  const bubbleAbs = j => (geo && geo[j]) ? { x: vx + sx + geo[j].left, y: vy + sy + ty + geo[j].top, w: geo[j].w, h: geo[j].h } : null;

  const D = L.doc;
  const fly = MOTION.enter(T, 32.7, 0.8);
  const lift = MOTION.enter(T, 32.35, 0.3) * (1 - fly);
  const pdx = (D.x + D.w / 2) - (Q.x + Q.w / 2), pdy = (D.y + 330 * D.f) - (Q.y + Q.h / 2);
  const panelTr = `translate(${pdx * fly}px,${pdy * fly}px) scale(${(1 + 0.02 * lift) * (1 - 0.6 * fly)})`;
  const panelOp = MOTION.enter(T, 2.2, 0.6) * (1 - MOTION.exit(T, 33.15, 0.45));

  const I = L.intro;
  const tE = MOTION.enter(T, 0.1, 0.5), tX = MOTION.exit(T, 2.0, 0.4);
  const cE = MOTION.enter(T, 0.7, 0.45);
  const cardFly = MOTION.enter(T, 2.4, 0.8);
  const cardOp = cE * (1 - MOTION.exit(T, 3.0, 0.25));
  let cdx = 0, cdy = 0, cs = 1;
  if (geo && geo[0]) {
    const tyF = vh - P.gap - (geo[0].top + geo[0].h);
    const bx = vx + geo[0].left, by = vy + tyF + geo[0].top;
    cdx = (bx + geo[0].w / 2) - L.W / 2; cdy = (by + geo[0].h / 2) - (I.cardTop + I.cardH / 2); cs = geo[0].w / I.cardW;
  }
  const k = I.k;

  const CL = L.close;
  const clE = MOTION.enter(T, 38.25, 0.45);
  const clO = clE * (1 - MOTION.exit(T, 39.55, 0.4));

  return (
    <div data-screen-label={'t=' + Math.floor(T) + 's'} style={{ position: 'absolute', inset: 0, background: C.bg, fontFamily: FB, color: G.cream, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: (L.W - I.titleW) / 2, width: I.titleW, top: I.titleTop, textAlign: 'center', fontFamily: FH, color: G.cream, fontSize: I.title, fontWeight: 700, lineHeight: 1.12, letterSpacing: '-0.01em', textWrap: 'balance', opacity: tE * (1 - tX), transform: `translateY(${(1 - tE) * 24 - tX * 30}px)` }}>Así trabaja tu asistente de WhatsApp mientras vos atendés</div>

      <Phone L={L} T={T} colRef={colRef} geo={geo} ty={ty} statusTime={cur} hls={hls} op={phoneOp} sx={sx} sy={sy} />
      <DoctorPhone L={L} T={T} />
      <Panel L={L} T={T} scroll={scroll} op={panelOp} tr={panelTr} />
      <Thoughts L={L} T={T} hide={1 - MOTION.exit(T, 32.2, 0.3)} />
      <Threads L={L} T={T} bubbleAbs={bubbleAbs} scroll={scroll} on={threads !== false && !L.noThreads} />

      <div style={{ position: 'absolute', left: (L.W - I.cardW) / 2, top: I.cardTop, width: I.cardW, height: I.cardH, boxSizing: 'border-box', opacity: cardOp, visibility: cardOp > 0.001 ? 'visible' : 'hidden', transform: `translate(${cdx * cardFly}px,${cdy * cardFly + (1 - cE) * 20}px) scale(${1 + (cs - 1) * cardFly})`, transformOrigin: 'center', background: '#14110A', border: '1.5px solid #24404A', borderRadius: 24 * k, padding: 24 * k, display: 'flex', alignItems: 'center', gap: 24 * k, boxShadow: '0 30px 70px rgba(0,0,0,0.5)' }}>
        <div style={{ width: I.cardH - 48 * k, height: I.cardH - 48 * k, borderRadius: 16 * k, background: '#2A2310', flexShrink: 0 }}></div>
        <div>
          <div style={{ fontSize: 22 * k, color: GOLD, fontWeight: 600 }}>Click to WhatsApp</div>
          <div style={{ fontSize: 40 * k, fontFamily: FH, fontWeight: 700, color: G.cream, marginTop: 4 }}>Carillas de resina</div>
        </div>
      </div>

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: CL.f * 0.8, opacity: clO, visibility: clO > 0.001 ? 'visible' : 'hidden' }}>
        <div style={{ maxWidth: CL.w, textAlign: 'center', fontFamily: FH, fontSize: CL.f, fontWeight: 700, color: G.cream, lineHeight: 1.15, letterSpacing: '-0.01em', textWrap: 'balance', transform: `translateY(${(1 - clE) * 18}px)` }}>
          El asistente atiende, califica y agenda. <span style={{ color: GOLD }}>Vos llegás solo a la valoración.</span>
        </div>
        <div style={{ fontSize: CL.f * 0.36, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600, color: GOLD, transform: `translateY(${(1 - clE) * 10}px)` }}>Gravity Studios</div>
      </div>
    </div>
  );
}



const T_START = 0.6, T_END = 39.4;

/**
 * Escena vertical (1080×1920) escalada para llenar su contenedor, con el
 * tiempo atado al scroll: al bajar avanza, al subir retrocede.
 *
 * getTrack() devuelve { runway, sticky }: el elemento largo que se recorre y
 * el que queda fijo adentro. El progreso es cuánto del runway ya pasó por
 * debajo del sticky. Lo decide Services.astro porque cambia según la pantalla
 * (en el teléfono se fija solo el video; en escritorio, la fila de tarjetas).
 */
export function BotStage({ getTrack }) {
  const boxRef = React.useRef(null);
  const [T, setT] = React.useState(T_START);
  const [scale, setScale] = React.useState(0);
  const target = React.useRef(T_START), cur = React.useRef(T_START), raf = React.useRef(0);

  React.useEffect(() => {
    const box = boxRef.current;
    // Suaviza el salto entre posiciones de scroll (la rueda del mouse avanza a
    // saltos de ~100px) para que la animación no se vea a los tirones.
    const tick = () => {
      const d = target.current - cur.current;
      cur.current = Math.abs(d) < 0.002 ? target.current : cur.current + d * 0.18;
      setT(cur.current);
      raf.current = Math.abs(target.current - cur.current) > 0 ? requestAnimationFrame(tick) : 0;
    };
    const onScroll = () => {
      const { runway, sticky } = getTrack();
      if (!runway || !sticky) return;
      const r = runway.getBoundingClientRect();
      const top = parseFloat(getComputedStyle(sticky).top) || 0;
      const total = r.height - sticky.offsetHeight;
      const p = total > 0 ? clamp((top - r.top) / total, 0, 1) : 0;
      target.current = T_START + p * (T_END - T_START);
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    };
    const ro = new ResizeObserver(() => {
      setScale(Math.min(box.clientWidth / LAYOUTS.v.W, box.clientHeight / LAYOUTS.v.H));
      onScroll();
    });
    ro.observe(box);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div ref={boxRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }}>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: LAYOUTS.v.W, height: LAYOUTS.v.H, transform: `translate(-50%, -50%) scale(${scale})`, visibility: scale ? 'visible' : 'hidden' }}>
        <TimeCtx.Provider value={{ T }}>
          <Piece orientation="vertical" threads={false} />
        </TimeCtx.Provider>
      </div>
    </div>
  );
}
