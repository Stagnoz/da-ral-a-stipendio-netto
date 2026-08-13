import { PARAMETRI_2026, PARAMETRI_AZIENDA_2026, AGEVOLAZIONI_2026 } from './costanti.js';
import { risolviDatore } from './utils.js';

/**
 * Calcola l'aliquota totale (percentuale di tasse base) del datore di lavoro.
 * Somma tutte le voci specifiche del settore (es. fondo pensioni, malattia, NASpI).
 */
export function aliquotaDatore(preset) {
  return preset.voci.reduce((tot, v) => tot + v.aliquota, 0);
}

/**
 * Valuta quale agevolazione fiscale per l'azienda è più conveniente economicamente.
 * Ne viene applicata una sola, la migliore.
 * 
 * @param {string[]} chiavi - Agevolazioni applicabili (es. 'under30', 'donna')
 * @param {number} contributiDatore - L'ammontare pieno dei contributi datore
 * @param {number} inail - Il costo base INAIL
 */
export function valutaAgevolazioni(chiavi, contributiDatore, inail) {
  const valutate = (chiavi || [])
    .filter((k) => AGEVOLAZIONI_2026[k])
    .map((k) => {
      const agevolazione = AGEVOLAZIONI_2026[k];
      
      // L'INAIL fa parte dello sconto solo se la norma lo prevede
      const baseInail = agevolazione.inail ? inail : 0;
      
      // Calcolo dello sconto lordo
      const scontoLordo = (contributiDatore + baseInail) * agevolazione.sconto;
      
      // Applichiamo il tetto annuo se esiste (es. max 3.000€ per under30)
      const scontoTotale = agevolazione.tettoAnnuo !== null 
        ? Math.min(scontoLordo, agevolazione.tettoAnnuo) 
        : scontoLordo;
        
      // Se c'è un tetto, riduciamo in proporzione le quote contributi e INAIL
      const fattore = scontoLordo > 0 ? scontoTotale / scontoLordo : 0;
      
      return {
        chiave: k,
        agevolazione: agevolazione,
        scontoContributi: contributiDatore * agevolazione.sconto * fattore,
        scontoInail: baseInail * agevolazione.sconto * fattore,
        totale: scontoTotale,
        // Valutazione sul lungo termine (es. uno sconto minore che dura 36 mesi 
        // può essere meglio di uno maggiore che dura 18)
        totaleDurata: scontoTotale * (agevolazione.mesi / 12),
        tettoRaggiunto: agevolazione.tettoAnnuo !== null && scontoLordo > agevolazione.tettoAnnuo,
      };
    })
    // Ordiniamo dalla più conveniente alla meno conveniente (prima per anno, poi per durata totale)
    .sort((a, b) => (b.totale - a.totale) || (b.totaleDurata - a.totaleDurata));

  return {
    valutate,
    migliore: valutate.length ? valutate[0] : null,
    scartate: valutate.slice(1),
  };
}

/**
 * Calcola il costo totale di un dipendente per l'azienda.
 * La spesa non è solo la RAL, ma RAL + Contributi Azienda + TFR + INAIL.
 * 
 * @param {number} ral - Retribuzione Annua Lorda
 * @param {object} opzioni - Inquadramento, massimale, agevolazioni
 */
export function calcolaCostoAzienda(ral, opzioni = {}) {
  const p = PARAMETRI_2026;
  const a = PARAMETRI_AZIENDA_2026;
  
  const preset = risolviDatore(opzioni.preset);
  const conMassimale = opzioni.conMassimale !== false;

  // Il tetto massimo INPS si applica solo al Fondo Pensioni (voce IVS), non al resto
  const baseIvs = conMassimale ? Math.min(ral, p.massimale) : ral;

  // Calcolo di tutte le micro-tasse a carico del datore
  const voci = preset.voci.map((v) => ({
    nome: v.nome,
    aliquota: v.aliquota,
    info: v.info,
    ivs: !!v.ivs,
    base: v.ivs ? baseIvs : ral,
    importo: (v.ivs ? baseIvs : ral) * v.aliquota,
  }));
  
  const contributiDatore = voci.reduce((tot, v) => tot + v.importo, 0);

  // Calcolo premio assicurazione INAIL (infortuni)
  const tassoInail = opzioni.inail !== undefined ? opzioni.inail : preset.inail;
  const inail = ral * tassoInail;

  // Agevolazioni / Sconti
  const ag = valutaAgevolazioni(opzioni.agevolazioni, contributiDatore, inail);
  const scontoContributi = ag.migliore ? ag.migliore.scontoContributi : 0;
  const scontoInail = ag.migliore ? ag.migliore.scontoInail : 0;
  const sconto = scontoContributi + scontoInail;

  // TFR (Trattamento Fine Rapporto - "Liquidazione")
  // Equivale a dividere la RAL per 13,5.
  const tfrTotale = ral / a.divisoreTfr;
  // Lo 0.50% però non va al dipendente ma al Fondo Pensioni INPS
  const tfrAlFondoPensioni = ral * a.contributoTfrFondoPensioni;
  const tfrAccantonato = tfrTotale - tfrAlFondoPensioni;

  // COSTO TOTALE
  const costoPieno = ral + contributiDatore + inail + tfrTotale;
  const costoTotale = costoPieno - sconto;

  return {
    ral,
    preset,
    voci,
    contributiDatore,
    contributiDatoreNetti: contributiDatore - scontoContributi,
    aliquotaDatore: aliquotaDatore(preset),
    massimaleApplicato: conMassimale && ral > p.massimale,
    tassoInail,
    inail,
    inailNetto: inail - scontoInail,
    agevolazione: ag.migliore,
    agevolazioniScartate: ag.scartate,
    scontoContributi,
    scontoInail,
    sconto,
    tfrTotale,
    tfrAccantonato,
    tfrAlFondoPensioni,
    costoPieno,
    costoTotale,
    costoMensile: costoTotale / 12,
    moltiplicatore: costoTotale / ral,
    moltiplicatorePieno: costoPieno / ral,
  };
}
