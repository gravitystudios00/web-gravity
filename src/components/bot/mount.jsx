import React from 'react';
import { createRoot } from 'react-dom/client';
import { BotStage } from './BotWhatsAppScroll.jsx';

/** Monta la animación del bot en `el`. Services.astro lo importa recién cuando
 *  la tarjeta se acerca a la pantalla, así React no pesa en la carga inicial. */
export function mountBot(el, getTrack) {
  createRoot(el).render(<BotStage getTrack={getTrack} />);
}
