import { rapportoTroncato, imposteProgressive } from './utils.js';
import { IMPATRIATI_2026 } from './costanti.js';

// ===============================================================
// REGIME IMPATRIATI (art. 5 D.Lgs. 209/2023)
// ===============================================================

/**
 * Calcola la quota di reddito che il regime impatriati lascia fuori
 * dalla tassazione. Non è una detrazione: è una parte di imponibile
 * che non concorre a formare il reddito, quindi sparisce prima che
 * si calcolino IRPEF, detrazioni e addizionali.
 *
 * I contributi INPS restano pieni: l'agevolazione è solo fiscale.
 *
 * @param {number} imponibile - Imponibile fiscale (RAL meno contributi)
 * @param {string} chiave - 'base' (50%) o 'figli' (60%); qualsiasi altro valore = nessun regime
 * @returns {object|null} Dettaglio dell'abbattimento, oppure null se il regime non si applica
 */
export function esenzioneImpatriati(imponibile, chiave) {
  const regime = IMPATRIATI_2026.regimi[chiave];
  if (!regime || imponibile <= 0) return null;

  // Sopra il tetto l'eccedenza resta tassata per intero.
  const redditoAgevolato = Math.min(imponibile, IMPATRIATI_2026.tettoReddito);
  const eccedenza = Math.max(0, imponibile - IMPATRIATI_2026.tettoReddito);

  return {
    chiave,
    regime,
    quotaEsente: regime.quotaEsente,
    redditoAgevolato,
    eccedenzaOltreTetto: eccedenza,
    esenzione: redditoAgevolato * regime.quotaEsente,
    tettoApplicato: eccedenza > 0,
  };
}

// ===============================================================
// DETRAZIONI FISCALI (Sconti sulle tasse)
// ===============================================================
// Le detrazioni non riducono il reddito su cui calcoli le tasse, 
// ma riducono direttamente la tassa finale da pagare.

/**
 * Detrazione base per il fatto stesso di essere lavoratore dipendente (Art. 13 c. 1 TUIR).
 * Decresce man mano che il reddito sale e si azzera a 50.000 €.
 * 
 * @param {number} reddito - Imponibile fiscale
 * @returns {number} Sconto sulle tasse in euro
 */
export function detrazioneLavoroDipendente(reddito) {
  let detrazione = 0;
  
  if (reddito <= 15000) {
    detrazione = 1955;
  } else if (reddito <= 28000) {
    // Il calcolo qui usa la regola del TUIR: proporzione tronca sulla differenza
    detrazione = 1910 + 1190 * rapportoTroncato(28000 - reddito, 13000);
  } else if (reddito <= 50000) {
    detrazione = 1910 * rapportoTroncato(50000 - reddito, 22000);
  }
  
  // Maggiorazione fissa per la fascia di reddito medio (art. 13 c. 1.1)
  if (reddito > 25000 && reddito <= 35000) {
    detrazione += 65;
  }
  
  return detrazione;
}

/**
 * Taglio del Cuneo Fiscale (strutturale dal 2024).
 * Attenzione: sotto i 20.000 € NON è una detrazione dalle tasse, ma una 
 * "somma esentasse" che ti viene letteralmente bonificata insieme allo stipendio.
 *
 * @param {number} reddito - Imponibile fiscale
 * @returns {number} Bonus in euro da aggiungere al netto
 */
export function bonusCuneo(reddito) {
  if (reddito > 20000) return 0;
  
  let percentuale;
  if (reddito <= 8500) percentuale = 0.071;
  else if (reddito <= 15000) percentuale = 0.053;
  else percentuale = 0.048;
  
  return reddito * percentuale;
}

/**
 * Taglio del Cuneo Fiscale per i redditi tra 20.000 e 40.000.
 * In questa fascia, funziona invece come classica detrazione IRPEF.
 * 
 * @param {number} reddito - Imponibile fiscale
 * @returns {number} Sconto sulle tasse in euro
 */
export function detrazioneCuneo(reddito) {
  if (reddito <= 20000 || reddito > 40000) return 0;
  if (reddito <= 32000) return 1000;
  
  // Dai 32.000 ai 40.000 scende linearmente fino a zero
  return 1000 * ((40000 - reddito) / 8000);
}

/**
 * Trattamento Integrativo (Ex Bonus Renzi / 100 euro).
 * Spetta solo se l'imposta che dovresti pagare è più alta della detrazione da lavoro base.
 */
export function trattamentoIntegrativo(reddito, irpefLorda, detrazioneLavoro) {
  if (reddito <= 15000 && irpefLorda > detrazioneLavoro) {
    return 1200;
  }
  return 0; // Per i redditi più alti servirebbero altre detrazioni (es. mutui) non modellate qui
}

// ===============================================================
// DETRAZIONI PER FAMILIARI A CARICO (Art. 12 TUIR)
// ===============================================================
// La riforma ha spostato l'aiuto per i figli < 21 anni nell'Assegno Unico (che non è in busta).
// Qui rimangono: Coniuge, Figli tra 21-30 anni, Altri familiari conviventi.

export function detrazioneConiuge(reddito) {
  if (reddito <= 15000) {
    const r = rapportoTroncato(reddito, 15000);
    if (r === 0 || r >= 1) return 0;
    return 800 - 110 * r;
  }
  if (reddito <= 40000) {
    // Fascia piatta con piccoli "gradini" di maggiorazione
    let d = 690;
    if (reddito > 29000 && reddito <= 29200) d += 10;
    else if (reddito > 29200 && reddito <= 34700) d += 20;
    else if (reddito > 34700 && reddito <= 35000) d += 30;
    else if (reddito > 35000 && reddito <= 35100) d += 20;
    else if (reddito > 35100 && reddito <= 35200) d += 10;
    return d;
  }
  if (reddito <= 80000) {
    return 690 * rapportoTroncato(80000 - reddito, 40000);
  }
  return 0;
}

export function detrazioneFigli(reddito, numeroFigli) {
  if (numeroFigli <= 0) return 0;
  
  // La soglia si alza di 15.000 € per ogni figlio dal secondo in poi
  const soglia = 95000 + 15000 * (numeroFigli - 1);
  const r = rapportoTroncato(soglia - reddito, soglia);
  if (r === 0 || r >= 1) return 0;
  
  return numeroFigli * 950 * r;
}

export function detrazioneAltriFamiliari(reddito, numeroFamiliari) {
  if (numeroFamiliari <= 0) return 0;
  
  const r = rapportoTroncato(80000 - reddito, 80000);
  if (r === 0 || r >= 1) return 0;
  
  return numeroFamiliari * 750 * r;
}

// ===============================================================
// ADDIZIONALI LOCALI (Regione e Comune)
// ===============================================================

/**
 * Calcola la tassa aggiuntiva locale (regionale o comunale).
 * Se è prevista un'esenzione e l'imponibile è sotto la soglia, si paga 0.
 */
export function addizionaleLocale(imponibile, ente) {
  if (imponibile <= (ente.esenzioneFino || 0)) return 0;
  
  if (ente.scaglioni) {
    return imposteProgressive(imponibile, ente.scaglioni);
  }
  
  return imponibile * (ente.aliquota || 0);
}
