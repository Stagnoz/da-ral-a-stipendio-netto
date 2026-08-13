import { PARAMETRI_2026 } from './costanti.js';
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
  trattamentoIntegrativo
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

  // STEP 3: Calcolo IRPEF Lorda (Tasse di base)
  const irpefLorda = imposteProgressive(imponibile, p.scaglioniIrpef);

  // STEP 4: Calcolo Detrazioni (Sconti sulle tasse)
  const detrLavoro = detrazioneLavoroDipendente(imponibile);
  const detrCuneo = detrazioneCuneo(imponibile);
  const detrConiuge = opzioni.coniuge ? detrazioneConiuge(imponibile) : 0;
  const detrFigli = detrazioneFigli(imponibile, opzioni.figli || 0);
  const detrAltri = detrazioneAltriFamiliari(imponibile, opzioni.altriFamiliari || 0);
  
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
    addizionaleRegionale = addizionaleLocale(imponibile, regione);
    addizionaleComunale = addizionaleLocale(imponibile, comune);
  }

  // STEP 6: Bonus aggiuntivi in busta paga
  const bonus = bonusCuneo(imponibile);
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
