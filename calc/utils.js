import { REGIONI, COMUNI, PRESET_DATORE, PARAMETRI_2026 } from './costanti.js';

/**
 * Applica una tabella di scaglioni progressivi a un imponibile.
 * La logica è quella dell'IRPEF: paghi l'aliquota solo sulla parte
 * di reddito che cade all'interno di quello scaglione specifico.
 * 
 * @param {number} imponibile - L'importo su cui calcolare le tasse
 * @param {Array} scaglioni - Array di oggetti { fino: numero, aliquota: numero }
 * @returns {number} L'imposta totale calcolata
 */
export function imposteProgressive(imponibile, scaglioni) {
  let imposta = 0;
  let precedente = 0;
  
  for (const s of scaglioni) {
    // Se l'imponibile è inferiore alla base di questo scaglione, abbiamo finito
    if (imponibile <= precedente) break;
    
    // Calcoliamo la "quota" di imponibile che cade dentro questo scaglione
    const quota = Math.min(imponibile, s.fino) - precedente;
    
    // Aggiungiamo l'imposta relativa a questa quota
    imposta += quota * s.aliquota;
    
    // Aggiorniamo la base per il prossimo scaglione
    precedente = s.fino;
  }
  
  return imposta;
}

/**
 * Calcola il rapporto per il decalage delle detrazioni.
 * (Art. 13 c. 6 TUIR): Se il rapporto è maggiore di zero, 
 * "si assume nelle prime quattro cifre decimali".
 * Si tratta di un troncamento (taglio), non di un arrotondamento classico.
 * 
 * @param {number} numeratore 
 * @param {number} denominatore 
 * @returns {number} Rapporto troncato alla quarta cifra decimale
 */
export function rapportoTroncato(numeratore, denominatore) {
  const r = numeratore / denominatore;
  if (r <= 0) return 0;
  return Math.trunc(r * 10000) / 10000;
}

/**
 * Risolve la regione in base all'input dell'utente.
 * Se non viene passata, la deduce dal comune. Se nemmeno il comune è utile, usa il default.
 */
export function risolviRegione(scelta, comune) {
  if (scelta && typeof scelta === 'object') return scelta;
  if (REGIONI[scelta]) return REGIONI[scelta];
  
  if (typeof comune === 'string' && COMUNI[comune]) {
    return REGIONI[COMUNI[comune].regione];
  }
  
  return REGIONI[PARAMETRI_2026.regioneDefault];
}

/**
 * Risolve il comune in base all'input dell'utente.
 */
export function risolviComune(scelta) {
  if (scelta && typeof scelta === 'object') return scelta;
  return COMUNI[scelta] || COMUNI[PARAMETRI_2026.comuneDefault];
}

/**
 * Risolve l'inquadramento del datore di lavoro.
 * Il default è l'industria piccola (fino a 15 dipendenti) per evitare di addebitare
 * CIGS non dovute a chi non compila il campo.
 */
export function risolviDatore(scelta) {
  if (scelta && typeof scelta === 'object') return scelta;
  return PRESET_DATORE[scelta] || PRESET_DATORE.industriaPiccola;
}
