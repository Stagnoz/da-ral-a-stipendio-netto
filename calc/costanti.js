/**
 * Parametri e Costanti Fiscali 2026
 * 
 * Questo file contiene tutte le aliquote, scaglioni e regole base
 * per calcolare le tasse del dipendente e i costi dell'azienda.
 * Separare i dati dalla logica aiuta a mantenere il codice pulito
 * e facilita l'aggiornamento l'anno prossimo.
 */

export const PARAMETRI_2026 = {
  // Quota IVS (Invalidità, Vecchiaia, Superstiti) a carico del lavoratore dipendente (settore privato).
  // Rappresenta la percentuale di stipendio lordo che va all'INPS per la pensione.
  aliquotaInps: 0.0919,

  // Le due soglie contributive del 2026 (circolare INPS n. 6 del 30/1/2026).
  // primaFascia: superata questa soglia, si paga un 1% in più di contributi (art. 3-ter L. 438/1992).
  primaFascia: 56224,
  aliquotaAggiuntiva: 0.01,
  
  // massimale: tetto massimo su cui si pagano i contributi IVS. 
  // Oltre questa cifra non si versa più nulla all'INPS.
  // Vale solo per chi ha iniziato a lavorare (è iscritto INPS) dopo il 1° gennaio 1996.
  massimale: 122295,

  // Scaglioni IRPEF 2026 (Legge di Bilancio 2026, L. 199/2025).
  // L'IRPEF è progressiva: paghi la percentuale solo sulla parte di reddito che cade in quello scaglione.
  scaglioniIrpef: [
    { fino: 28000, aliquota: 0.23 },
    { fino: 50000, aliquota: 0.33 },
    { fino: Infinity, aliquota: 0.43 },
  ],

  // Valori di default usati se l'utente non seleziona nulla nell'interfaccia
  regioneDefault: 'lombardia',
  comuneDefault: 'milano',
};

// ===============================================================
// ADDIZIONALE REGIONALE 2026
// ===============================================================
// Tassa aggiuntiva regionale, applicata sull'imponibile fiscale.
// Ogni regione ha le sue regole: aliquota unica o a scaglioni.
export const REGIONI = {
  lombardia: {
    nome: 'Lombardia',
    scaglioni: [
      { fino: 15000, aliquota: 0.0123 },
      { fino: 28000, aliquota: 0.0158 },
      { fino: 50000, aliquota: 0.0172 },
      { fino: Infinity, aliquota: 0.0173 },
    ],
  },
  lazio: {
    nome: 'Lazio',
    scaglioni: [
      { fino: 15000, aliquota: 0.0173 },
      { fino: 28000, aliquota: 0.0273 },
      { fino: 50000, aliquota: 0.0293 },
      { fino: Infinity, aliquota: 0.0333 },
    ],
  },
  campania: {
    nome: 'Campania',
    scaglioni: [
      { fino: 15000, aliquota: 0.0203 },
      { fino: 28000, aliquota: 0.0213 },
      { fino: 50000, aliquota: 0.0233 },
      { fino: Infinity, aliquota: 0.0333 },
    ],
  },
  piemonte: {
    nome: 'Piemonte',
    scaglioni: [
      { fino: 15000, aliquota: 0.0162 },
      { fino: 28000, aliquota: 0.0213 },
      { fino: 50000, aliquota: 0.0275 },
      { fino: Infinity, aliquota: 0.0333 },
    ],
  },
  emiliaRomagna: {
    nome: 'Emilia-Romagna',
    scaglioni: [
      { fino: 15000, aliquota: 0.0133 },
      { fino: 28000, aliquota: 0.0193 },
      { fino: 50000, aliquota: 0.0203 },
      { fino: Infinity, aliquota: 0.0233 },
    ],
  },
  toscana: {
    nome: 'Toscana',
    scaglioni: [
      { fino: 15000, aliquota: 0.0142 },
      { fino: 28000, aliquota: 0.0143 },
      { fino: 50000, aliquota: 0.0144 },
      { fino: Infinity, aliquota: 0.0173 },
    ],
  },
  puglia: {
    nome: 'Puglia',
    scaglioni: [
      { fino: 15000, aliquota: 0.0123 },
      { fino: 28000, aliquota: 0.0148 },
      { fino: 50000, aliquota: 0.0173 },
      { fino: Infinity, aliquota: 0.0223 },
    ],
  },
  sicilia: {
    nome: 'Sicilia',
    scaglioni: [
      { fino: 15000, aliquota: 0.0123 },
      { fino: 28000, aliquota: 0.0153 },
      { fino: Infinity, aliquota: 0.0173 },
    ],
  },
  veneto: {
    nome: 'Veneto',
    // In Veneto c'è un'aliquota unica su tutto l'imponibile
    aliquota: 0.0123,
  },
};

// ===============================================================
// ADDIZIONALE COMUNALE 2026
// ===============================================================
// `esenzioneFino` è una SOGLIA: sotto si paga 0. Sopra la soglia
// l'aliquota si applica su TUTTO l'imponibile, non solo sull'eccedenza.
export const COMUNI = {
  milano:  { nome: 'Milano',  regione: 'lombardia',     aliquota: 0.008,  esenzioneFino: 23000 },
  roma:    { nome: 'Roma',    regione: 'lazio',         aliquota: 0.009,  esenzioneFino: 14000 },
  napoli:  { nome: 'Napoli',  regione: 'campania',      aliquota: 0.01,   esenzioneFino: 12000 },
  bologna: { nome: 'Bologna', regione: 'emiliaRomagna', aliquota: 0.008,  esenzioneFino: 15000 },
  firenze: { nome: 'Firenze', regione: 'toscana',       aliquota: 0.002,  esenzioneFino: 25000 },
  bari:    { nome: 'Bari',    regione: 'puglia',        aliquota: 0.008,  esenzioneFino: 15000 },
  verona:  { nome: 'Verona',  regione: 'veneto',        aliquota: 0.008,  esenzioneFino: 12000 },
  palermo: { nome: 'Palermo', regione: 'sicilia',       aliquota: 0.0101, esenzioneFino: 0 },
  torino:  {
    nome: 'Torino', regione: 'piemonte', esenzioneFino: 11790,
    scaglioni: [
      { fino: 28000, aliquota: 0.008 },
      { fino: 50000, aliquota: 0.011 },
      { fino: Infinity, aliquota: 0.012 },
    ],
  },
};

// ===============================================================
// LATO AZIENDA E SETTORI
// ===============================================================
export const PARAMETRI_AZIENDA_2026 = {
  // Il TFR è circa una mensilità l'anno. Matematicamente si divide la retribuzione per 13,5.
  divisoreTfr: 13.5,
  // Di questo TFR, lo 0,50% finisce all'INPS per il fondo garanzia pensioni, non al dipendente.
  contributoTfrFondoPensioni: 0.005,
};

export const PRESET_DATORE = {
  terziario: {
    nome: 'Terziario, commercio e servizi',
    nota: 'oltre 15 dipendenti',
    inail: 0.004, 
    voci: [
      { nome: 'IVS — fondo pensioni', aliquota: 0.2381, ivs: true, info: 'datoreIvs' },
      { nome: 'Malattia', aliquota: 0.0244, info: 'datoreMalattia' },
      { nome: 'FIS — fondo di integrazione salariale', aliquota: 0.0053, info: 'datoreFis' },
      { nome: 'NASpI — disoccupazione', aliquota: 0.0161, info: 'datoreNaspi' },
      { nome: 'CIGS — cassa integrazione straordinaria', aliquota: 0.006, info: 'datoreCigs' },
      { nome: 'CUAF — ex assegni familiari', aliquota: 0.0068, info: 'datoreCuaf' },
      { nome: 'Maternità', aliquota: 0.0024, info: 'datoreMaternita' },
      { nome: 'Fondo di garanzia TFR', aliquota: 0.002, info: 'datoreFondoGaranzia' },
    ],
    vociLavoratore: [
      { nome: 'CIGS — quota a carico del lavoratore', aliquota: 0.003, info: 'lavCigs' },
      { nome: 'FIS — quota a carico del lavoratore', aliquota: 0.0027, info: 'lavFis' },
    ],
  },
  industriaPiccola: {
    nome: 'Industria, fino a 15 dipendenti',
    nota: 'niente CIGS sotto la soglia',
    inail: 0.005, 
    voci: [
      { nome: 'IVS — fondo pensioni', aliquota: 0.2381, ivs: true, info: 'datoreIvs' },
      { nome: 'CIGO — cassa integrazione ordinaria', aliquota: 0.017, info: 'datoreCigo' },
      { nome: 'NASpI — disoccupazione', aliquota: 0.0161, info: 'datoreNaspi' },
      { nome: 'CUAF — ex assegni familiari', aliquota: 0.0068, info: 'datoreCuaf' },
      { nome: 'Maternità', aliquota: 0.0046, info: 'datoreMaternita' },
      { nome: 'Fondo di garanzia TFR', aliquota: 0.002, info: 'datoreFondoGaranzia' },
    ],
    vociLavoratore: [],
  },
  industriaGrande: {
    nome: 'Industria, oltre 50 dipendenti',
    nota: 'CIGO al 2%, più CIGS',
    inail: 0.005,
    voci: [
      { nome: 'IVS — fondo pensioni', aliquota: 0.2381, ivs: true, info: 'datoreIvs' },
      { nome: 'CIGO — cassa integrazione ordinaria', aliquota: 0.02, info: 'datoreCigo' },
      { nome: 'NASpI — disoccupazione', aliquota: 0.0161, info: 'datoreNaspi' },
      { nome: 'CIGS — cassa integrazione straordinaria', aliquota: 0.006, info: 'datoreCigs' },
      { nome: 'CUAF — ex assegni familiari', aliquota: 0.0068, info: 'datoreCuaf' },
      { nome: 'Maternità', aliquota: 0.0046, info: 'datoreMaternita' },
      { nome: 'Fondo di garanzia TFR', aliquota: 0.002, info: 'datoreFondoGaranzia' },
    ],
    vociLavoratore: [
      { nome: 'CIGS — quota a carico del lavoratore', aliquota: 0.003, info: 'lavCigs' },
    ],
  },
};

export const AGEVOLAZIONI_2026 = {
  under30: {
    nome: 'Under 30, prima assunzione a tempo indeterminato',
    breve: 'Under 30',
    requisito: 'meno di 30 anni e mai avuto un contratto a tempo indeterminato',
    sconto: 0.5,
    tettoAnnuo: 3000,
    inail: false,
    mesi: 36,
    norma: 'L. 205/2017 art. 1 c. 100 ss. — INPS circ. 57/2023, causale Uniemens EG30',
    adempimento: 'nessuna istanza: lo sconto si espone direttamente in Uniemens con la causale EG30.',
  },
  donna: {
    nome: 'Donna in condizione svantaggiata',
    breve: 'Donna svantaggiata',
    requisito: 'almeno 50 anni e disoccupata da oltre 12 mesi, oppure di qualsiasi età se priva di impiego regolarmente retribuito da 24 mesi...',
    sconto: 0.5,
    tettoAnnuo: null,
    inail: true,
    mesi: 18,
    norma: 'L. 92/2012 art. 4 c. 8-11',
    adempimento: 'modulo 92-2012 dal Cassetto previdenziale.',
  },
  over50: {
    nome: 'Over 50 disoccupato da oltre 12 mesi',
    breve: 'Over 50',
    requisito: 'più di 50 anni e disoccupato da oltre 12 mesi',
    sconto: 0.5,
    tettoAnnuo: null,
    inail: true,
    mesi: 18,
    norma: 'L. 92/2012 art. 4 c. 8',
    adempimento: 'modulo 92-2012 dal Portale Agevolazioni.',
  },
};

// ===============================================================
// REGIME IMPATRIATI ("rientro dei cervelli")
// ===============================================================
// Non è un'agevolazione contributiva come quelle qui sopra: non tocca
// i contributi né il costo aziendale. Abbatte l'imponibile fiscale del
// lavoratore, quindi entra nel calcolo del netto e non in quello del
// datore. Il datore però lo applica direttamente in busta paga, su
// richiesta scritta del dipendente.
export const IMPATRIATI_2026 = {
  // L'abbattimento si ferma qui: la parte di reddito oltre i 600.000 €
  // resta tassata per intero.
  tettoReddito: 600000,
  anni: 5,
  norma: 'art. 5 D.Lgs. 209/2023',
  adempimento: 'richiesta scritta al datore di lavoro, che applica la riduzione in busta paga; ' +
    'in mancanza, si recupera in dichiarazione.',
  regimi: {
    base: {
      nome: 'Impatriati — quota esente 50%',
      breve: 'Impatriati 50%',
      quotaEsente: 0.5,
      requisito: 'residenza estera nei 3 periodi d\'imposta precedenti (6 o 7 se si rientra ' +
        'presso lo stesso datore o gruppo), impegno a restare fiscalmente in Italia 4 anni, ' +
        'requisiti di elevata qualificazione o specializzazione',
    },
    figli: {
      nome: 'Impatriati con figlio minore — quota esente 60%',
      breve: 'Impatriati 60%',
      quotaEsente: 0.6,
      requisito: 'gli stessi requisiti del 50%, più il trasferimento con un figlio minore ' +
        'residente in Italia, oppure la nascita o adozione di un minore durante il periodo agevolato',
    },
  },
};

export const FONTE_MEDIE = 'JP Salary Outlook 2026';

export const MEDIE_RETRIBUTIVE = {
  generale: { nome: 'tutti i dipendenti', frase: 'dei dipendenti del settore privato', ral: 32991, anno: 2025, fonte: FONTE_MEDIE },
  qualifiche: {
    operaio:   { nome: 'operaio',   frase: 'degli operai',   ral: 27909,  anno: 2025, fonte: FONTE_MEDIE },
    impiegato: { nome: 'impiegato', frase: 'degli impiegati', ral: 34635, anno: 2025, fonte: FONTE_MEDIE },
    quadro:    { nome: 'quadro',    frase: 'dei quadri',     ral: 56551,  anno: 2025, fonte: FONTE_MEDIE },
    dirigente: { nome: 'dirigente', frase: 'dei dirigenti',  ral: 106556, anno: 2025, fonte: FONTE_MEDIE },
  },
  settori: {
    finanza:      { nome: 'servizi finanziari e assicurativi', frase: 'di chi lavora nei servizi finanziari e assicurativi', ral: 45461, anno: 2025, fonte: FONTE_MEDIE },
    ingegneria:   { nome: 'ingegneria e studi tecnici',        frase: "di chi lavora nell'ingegneria e negli studi tecnici", ral: 44033, anno: 2025, fonte: FONTE_MEDIE },
    tlc:          { nome: 'telecomunicazioni',                 frase: 'di chi lavora nelle telecomunicazioni',              ral: 41914, anno: 2025, fonte: FONTE_MEDIE },
    industria:    { nome: 'industria e utilities',             frase: "di chi lavora nell'industria e nelle utilities",     ral: 34000, anno: 2025, fonte: FONTE_MEDIE, stimato: true },
    commercio:    { nome: 'servizi e commercio',               frase: 'di chi lavora nei servizi e nel commercio',          ral: 31000, anno: 2025, fonte: FONTE_MEDIE, stimato: true },
    edilizia:     { nome: 'edilizia',                          frase: "di chi lavora nell'edilizia",                        ral: 30000, anno: 2025, fonte: FONTE_MEDIE, stimato: true },
    ristorazione: { nome: 'alberghi e ristorazione',           frase: 'di chi lavora negli alberghi e nella ristorazione',  ral: 28344, anno: 2025, fonte: FONTE_MEDIE },
    persona:      { nome: 'servizi alla persona',              frase: 'di chi lavora nei servizi alla persona',             ral: 28013, anno: 2025, fonte: FONTE_MEDIE },
    agricoltura:  { nome: 'agricoltura',                       frase: "di chi lavora nell'agricoltura",                     ral: 26640, anno: 2025, fonte: FONTE_MEDIE },
  },
};
