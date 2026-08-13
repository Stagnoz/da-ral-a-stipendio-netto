import { PARAMETRI_2026, IMPATRIATI_2026 } from './costanti.js';
import { 
  risolviDatore, 
  risolviRegione, 
  risolviComune, 
  imposteProgressive 
} from './utils.js';
import {
  detrazioneLavoroDipendente,
  detrazioneCuneo,
  detrazioneConiuge,
  detrazioneFigli,
  detrazioneAltriFamiliari,
  addizionaleLocale,
  bonusCuneo,
  trattamentoIntegrativo,
  esenzioneImpatriati
} from './tasse-dipendente.js';

/**
 * Calcola i contributi previdenziali a carico del dipendente.
 * Questi contributi vengono sottratti dalla RAL prima di calcolare le tasse.
 * 
 * @param {number} ral - Retribuzione annua lorda
 * @param {boolean} conMassimale - Se true, applica il tetto massimo contributivo
 * @param {Array} vociLavoratore - Eventuali contributi aggiuntivi (es. CIGS, FIS)
 */
export function contributiDipendente(ral, conMassimale, vociLavoratore) {
  const p = PARAMETRI_2026;
  
  // Se l'utente ha iniziato a lavorare dopo il '96, i contributi pensionistici
  // si calcolano solo fino a un tetto massimo.
  const baseContributivaPensionistica = conMassimale ? Math.min(ral, p.massimale) : ral;
  
  // Contributo base per la pensione (9.19%)
  const ivs = baseContributivaPensionistica * p.aliquotaInps;
  
  // Contributo aggiuntivo dell'1% sulla parte di stipendio molto alta
  const eccedenzaFascia = Math.max(0, baseContributivaPensionistica - p.primaFascia);
  const aggiuntivo = eccedenzaFascia * p.aliquotaAggiuntiva;

  // CIGS e FIS vengono calcolati sull'INTERA RAL, senza tetto massimo
  const minori = (vociLavoratore || []).map((v) => ({
    nome: v.nome,
    aliquota: v.aliquota,
    info: v.info,
    importo: ral * v.aliquota,
  }));
  const totaleMinori = minori.reduce((tot, v) => tot + v.importo, 0);

  return {
    baseContributiva: baseContributivaPensionistica,
    ivs,
    aggiuntivo,
    minori,
    totaleMinori,
    totale: ivs + aggiuntivo + totaleMinori,
    massimaleApplicato: conMassimale && ral > p.massimale,
  };
}

/**
 * Funzione principale che prende la RAL e calcola il Netto in Busta Paga.
 * Passa attraverso tutti gli step fiscali italiani e restituisce ogni voce.
 * 
 * @param {number} ral - Retribuzione Annua Lorda
 * @param {number} mensilita - Numero mensilità (12, 13 o 14)
 * @param {object} opzioni - Opzioni facoltative (familiari, comune, regione, ecc)
 */
export function calcolaNetto(ral, mensilita, opzioni = {}) {
  const p = PARAMETRI_2026;
  
  // Di default, chiunque ha iniziato dopo il 1996 ha il massimale
  const conMassimale = opzioni.conMassimale !== false;
  
  // Il tipo di inquadramento dell'azienda serve per sapere se il lavoratore paga CIGS/FIS
  const datore = risolviDatore(opzioni.preset);

  // STEP 1: Calcolo Contributi Previdenziali (INPS)
  const contributi = contributiDipendente(ral, conMassimale, datore.vociLavoratore);
  const contributiInps = contributi.totale;

  // STEP 2: Calcolo Imponibile Fiscale
  // Le tasse (IRPEF) NON si pagano su tutta la RAL, ma sulla RAL meno i contributi INPS.
  const imponibile = ral - contributiInps;

  // STEP 2-bis: Regime impatriati, se selezionato.
  // La quota agevolata non concorre a formare il reddito: si toglie qui,
  // prima di tutto il resto. Da questo punto in poi il reddito di
  // riferimento e' `imponibileIrpef`, quello ridotto.
  //
  // Con due eccezioni, che sono scritte nelle norme e non deducibili:
  // il taglio del cuneo e il trattamento integrativo guardano il reddito
  // complessivo COMPRESA la quota esente degli impatriati. Restano
  // quindi sull'imponibile pieno, piu' sotto.
  const impatriati = esenzioneImpatriati(imponibile, opzioni.impatriati);
  const esenzioneImp = impatriati ? impatriati.esenzione : 0;
  const imponibileIrpef = imponibile - esenzioneImp;

  // STEP 3: Calcolo IRPEF Lorda (Tasse di base)
  const irpefLorda = imposteProgressive(imponibileIrpef, p.scaglioniIrpef);

  // STEP 4: Calcolo Detrazioni (Sconti sulle tasse)
  const detrLavoro = detrazioneLavoroDipendente(imponibileIrpef);
  // Prima eccezione: l'ulteriore detrazione del cuneo si parametra sul
  // reddito complessivo comprensivo della quota esente (circ. AdE 4/E
  // del 16 maggio 2025). Con il regime attivo, quindi, non e' detto che
  // spetti solo perche' l'imponibile IRPEF e' sceso sotto i 40.000.
  const detrCuneo = detrazioneCuneo(imponibile);
  const detrConiuge = opzioni.coniuge ? detrazioneConiuge(imponibileIrpef) : 0;
  const detrFigli = detrazioneFigli(imponibileIrpef, opzioni.figli || 0);
  const detrAltri = detrazioneAltriFamiliari(imponibileIrpef, opzioni.altriFamiliari || 0);
  
  const detrFamiliari = detrConiuge + detrFigli + detrAltri;
  
  // Le detrazioni non possono superare le tasse: se gli sconti superano le tasse da pagare,
  // la tassa scende a 0 (non si va in credito, a meno di casi non coperti qui).
  const detrazioniTotali = Math.min(
    detrLavoro + detrCuneo + detrFamiliari,
    irpefLorda
  );
  
  // IRPEF Netta = Tasse Iniziali - Sconti
  const irpefNetta = irpefLorda - detrazioniTotali;

  // STEP 5: Tasse Locali (Regione e Comune)
  // Si pagano sull'imponibile, ma solo se l'IRPEF Netta è maggiore di zero.
  const regione = risolviRegione(opzioni.regione, opzioni.comune);
  const comune = risolviComune(opzioni.comune);
  
  let addizionaleRegionale = 0;
  let addizionaleComunale = 0;
  
  if (irpefNetta > 0) {
    addizionaleRegionale = addizionaleLocale(imponibileIrpef, regione);
    addizionaleComunale = addizionaleLocale(imponibileIrpef, comune);
  }

  // STEP 6: Bonus aggiuntivi in busta paga
  // Stessa eccezione della detrazione cuneo: la somma esentasse e il
  // trattamento integrativo si misurano sul reddito complessivo
  // comprensivo della quota esente (circ. AdE 4/E 2025 per il cuneo,
  // circ. AdE 29/E 2020 per il trattamento integrativo). Il regime
  // impatriati non fa scendere nessuno dentro queste fasce.
  const bonus = bonusCuneo(imponibile);
  // La soglia dei 15.000 guarda il reddito pieno, ma la condizione di
  // capienza no: quella confronta l'imposta lorda vera, che con il
  // regime e' piu' bassa. A redditi bassi puo' quindi non spettare.
  const integrativo = trattamentoIntegrativo(imponibile, irpefLorda, detrLavoro);

  // STEP 7: Risultato Finale
  // Sommiamo tutte le trattenute
  const totaleTrattenute = contributiInps + irpefNetta + addizionaleRegionale + addizionaleComunale;
  
  // Il Netto Annuo è: RAL - Trattenute + Bonus
  const nettoAnnuo = ral - totaleTrattenute + bonus + integrativo;
  const nettoMese = nettoAnnuo / mensilita;

  // Aliquota % effettiva visibile in busta (es. 9,19% o 9,76% se c'è CIGS/FIS)
  const quotaLavoratoreExtra = (datore.vociLavoratore || []).reduce((tot, v) => tot + v.aliquota, 0);
  const aliquotaLavoratore = p.aliquotaInps + quotaLavoratoreExtra;

  return {
    ral,
    mensilita,
    contributiInps,
    contributiIvs: contributi.ivs,
    contributiAggiuntivo: contributi.aggiuntivo,
    contributiMinori: contributi.minori,
    contributiMinoriTotale: contributi.totaleMinori,
    baseContributiva: contributi.baseContributiva,
    massimaleApplicato: contributi.massimaleApplicato,
    preset: datore,
    aliquotaLavoratore,
    imponibile,
    impatriati,
    esenzioneImpatriati: esenzioneImp,
    imponibileIrpef,
    irpefLorda,
    detrazioneLavoro: detrLavoro,
    detrazioneCuneo: detrCuneo,
    detrazioneConiuge: detrConiuge,
    detrazioneFigli: detrFigli,
    detrazioneAltriFamiliari: detrAltri,
    detrazioneFamiliari: detrFamiliari,
    detrazioniApplicate: detrazioniTotali,
    irpefNetta,
    addizionaleRegionale,
    addizionaleComunale,
    regione,
    comune,
    bonusCuneo: bonus,
    trattamentoIntegrativo: integrativo,
    totaleTrattenute,
    nettoAnnuo,
    nettoMese,
    incidenzaTrattenute: (totaleTrattenute - bonus - integrativo) / ral,
  };
}

/**
 * Quanto vale il regime impatriati, in euro: rifà lo stesso calcolo
 * senza il regime e restituisce la differenza.
 *
 * Si rifà il conto invece di sommare le imposte risparmiate perché il
 * regime non tocca solo l'IRPEF: sposta anche le detrazioni, le
 * addizionali e le somme del taglio del cuneo, che dipendono tutte dal
 * reddito. L'unico modo onesto di dire "quanto incassi in più" è
 * mettere a confronto i due netti.
 *
 * @param {object} r - Risultato di calcolaNetto con il regime attivo
 * @param {object} opzioni - Le stesse opzioni passate a calcolaNetto
 * @returns {object|null} Il confronto, oppure null se il regime non è attivo
 */
export function confrontoImpatriati(r, opzioni = {}) {
  if (!r.impatriati) return null;

  const senza = calcolaNetto(r.ral, r.mensilita, Object.assign({}, opzioni, { impatriati: '' }));

  const imposte = (x) => x.irpefNetta + x.addizionaleRegionale + x.addizionaleComunale;
  const guadagnoAnnuo = r.nettoAnnuo - senza.nettoAnnuo;

  return {
    senza,
    guadagnoAnnuo,
    guadagnoMese: guadagnoAnnuo / r.mensilita,
    // Il quinquennio è la durata massima del regime, non un impegno:
    // vale se la RAL resta questa per tutti e cinque gli anni.
    guadagnoDurata: guadagnoAnnuo * IMPATRIATI_2026.anni,
    nettoSenza: senza.nettoAnnuo,
    nettoCon: r.nettoAnnuo,
    imposteSenza: imposte(senza),
    imposteCon: imposte(r),
    quotaNettoInPiu: guadagnoAnnuo / senza.nettoAnnuo,
  };
}
