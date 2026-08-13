(() => {
  // calc/costanti.js
  var PARAMETRI_2026 = {
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
      { fino: 28e3, aliquota: 0.23 },
      { fino: 5e4, aliquota: 0.33 },
      { fino: Infinity, aliquota: 0.43 }
    ],
    // Valori di default usati se l'utente non seleziona nulla nell'interfaccia
    regioneDefault: "lombardia",
    comuneDefault: "milano"
  };
  var REGIONI = {
    lombardia: {
      nome: "Lombardia",
      scaglioni: [
        { fino: 15e3, aliquota: 0.0123 },
        { fino: 28e3, aliquota: 0.0158 },
        { fino: 5e4, aliquota: 0.0172 },
        { fino: Infinity, aliquota: 0.0173 }
      ]
    },
    lazio: {
      nome: "Lazio",
      scaglioni: [
        { fino: 15e3, aliquota: 0.0173 },
        { fino: 28e3, aliquota: 0.0273 },
        { fino: 5e4, aliquota: 0.0293 },
        { fino: Infinity, aliquota: 0.0333 }
      ]
    },
    campania: {
      nome: "Campania",
      scaglioni: [
        { fino: 15e3, aliquota: 0.0203 },
        { fino: 28e3, aliquota: 0.0213 },
        { fino: 5e4, aliquota: 0.0233 },
        { fino: Infinity, aliquota: 0.0333 }
      ]
    },
    piemonte: {
      nome: "Piemonte",
      scaglioni: [
        { fino: 15e3, aliquota: 0.0162 },
        { fino: 28e3, aliquota: 0.0213 },
        { fino: 5e4, aliquota: 0.0275 },
        { fino: Infinity, aliquota: 0.0333 }
      ]
    },
    emiliaRomagna: {
      nome: "Emilia-Romagna",
      scaglioni: [
        { fino: 15e3, aliquota: 0.0133 },
        { fino: 28e3, aliquota: 0.0193 },
        { fino: 5e4, aliquota: 0.0203 },
        { fino: Infinity, aliquota: 0.0233 }
      ]
    },
    toscana: {
      nome: "Toscana",
      scaglioni: [
        { fino: 15e3, aliquota: 0.0142 },
        { fino: 28e3, aliquota: 0.0143 },
        { fino: 5e4, aliquota: 0.0144 },
        { fino: Infinity, aliquota: 0.0173 }
      ]
    },
    puglia: {
      nome: "Puglia",
      scaglioni: [
        { fino: 15e3, aliquota: 0.0123 },
        { fino: 28e3, aliquota: 0.0148 },
        { fino: 5e4, aliquota: 0.0173 },
        { fino: Infinity, aliquota: 0.0223 }
      ]
    },
    sicilia: {
      nome: "Sicilia",
      scaglioni: [
        { fino: 15e3, aliquota: 0.0123 },
        { fino: 28e3, aliquota: 0.0153 },
        { fino: Infinity, aliquota: 0.0173 }
      ]
    },
    veneto: {
      nome: "Veneto",
      // In Veneto c'è un'aliquota unica su tutto l'imponibile
      aliquota: 0.0123
    }
  };
  var COMUNI = {
    milano: { nome: "Milano", regione: "lombardia", aliquota: 8e-3, esenzioneFino: 23e3 },
    roma: { nome: "Roma", regione: "lazio", aliquota: 9e-3, esenzioneFino: 14e3 },
    napoli: { nome: "Napoli", regione: "campania", aliquota: 0.01, esenzioneFino: 12e3 },
    bologna: { nome: "Bologna", regione: "emiliaRomagna", aliquota: 8e-3, esenzioneFino: 15e3 },
    firenze: { nome: "Firenze", regione: "toscana", aliquota: 2e-3, esenzioneFino: 25e3 },
    bari: { nome: "Bari", regione: "puglia", aliquota: 8e-3, esenzioneFino: 15e3 },
    verona: { nome: "Verona", regione: "veneto", aliquota: 8e-3, esenzioneFino: 12e3 },
    palermo: { nome: "Palermo", regione: "sicilia", aliquota: 0.0101, esenzioneFino: 0 },
    torino: {
      nome: "Torino",
      regione: "piemonte",
      esenzioneFino: 11790,
      scaglioni: [
        { fino: 28e3, aliquota: 8e-3 },
        { fino: 5e4, aliquota: 0.011 },
        { fino: Infinity, aliquota: 0.012 }
      ]
    }
  };
  var PARAMETRI_AZIENDA_2026 = {
    // Il TFR è circa una mensilità l'anno. Matematicamente si divide la retribuzione per 13,5.
    divisoreTfr: 13.5,
    // Di questo TFR, lo 0,50% finisce all'INPS per il fondo garanzia pensioni, non al dipendente.
    contributoTfrFondoPensioni: 5e-3
  };
  var PRESET_DATORE = {
    terziario: {
      nome: "Terziario, commercio e servizi",
      nota: "oltre 15 dipendenti",
      inail: 4e-3,
      voci: [
        { nome: "IVS \u2014 fondo pensioni", aliquota: 0.2381, ivs: true, info: "datoreIvs" },
        { nome: "Malattia", aliquota: 0.0244, info: "datoreMalattia" },
        { nome: "FIS \u2014 fondo di integrazione salariale", aliquota: 53e-4, info: "datoreFis" },
        { nome: "NASpI \u2014 disoccupazione", aliquota: 0.0161, info: "datoreNaspi" },
        { nome: "CIGS \u2014 cassa integrazione straordinaria", aliquota: 6e-3, info: "datoreCigs" },
        { nome: "CUAF \u2014 ex assegni familiari", aliquota: 68e-4, info: "datoreCuaf" },
        { nome: "Maternita\u0300", aliquota: 24e-4, info: "datoreMaternita" },
        { nome: "Fondo di garanzia TFR", aliquota: 2e-3, info: "datoreFondoGaranzia" }
      ],
      vociLavoratore: [
        { nome: "CIGS \u2014 quota a carico del lavoratore", aliquota: 3e-3, info: "lavCigs" },
        { nome: "FIS \u2014 quota a carico del lavoratore", aliquota: 27e-4, info: "lavFis" }
      ]
    },
    industriaPiccola: {
      nome: "Industria, fino a 15 dipendenti",
      nota: "niente CIGS sotto la soglia",
      inail: 5e-3,
      voci: [
        { nome: "IVS \u2014 fondo pensioni", aliquota: 0.2381, ivs: true, info: "datoreIvs" },
        { nome: "CIGO \u2014 cassa integrazione ordinaria", aliquota: 0.017, info: "datoreCigo" },
        { nome: "NASpI \u2014 disoccupazione", aliquota: 0.0161, info: "datoreNaspi" },
        { nome: "CUAF \u2014 ex assegni familiari", aliquota: 68e-4, info: "datoreCuaf" },
        { nome: "Maternita\u0300", aliquota: 46e-4, info: "datoreMaternita" },
        { nome: "Fondo di garanzia TFR", aliquota: 2e-3, info: "datoreFondoGaranzia" }
      ],
      vociLavoratore: []
    },
    industriaGrande: {
      nome: "Industria, oltre 50 dipendenti",
      nota: "CIGO al 2%, piu\u0300 CIGS",
      inail: 5e-3,
      voci: [
        { nome: "IVS \u2014 fondo pensioni", aliquota: 0.2381, ivs: true, info: "datoreIvs" },
        { nome: "CIGO \u2014 cassa integrazione ordinaria", aliquota: 0.02, info: "datoreCigo" },
        { nome: "NASpI \u2014 disoccupazione", aliquota: 0.0161, info: "datoreNaspi" },
        { nome: "CIGS \u2014 cassa integrazione straordinaria", aliquota: 6e-3, info: "datoreCigs" },
        { nome: "CUAF \u2014 ex assegni familiari", aliquota: 68e-4, info: "datoreCuaf" },
        { nome: "Maternita\u0300", aliquota: 46e-4, info: "datoreMaternita" },
        { nome: "Fondo di garanzia TFR", aliquota: 2e-3, info: "datoreFondoGaranzia" }
      ],
      vociLavoratore: [
        { nome: "CIGS \u2014 quota a carico del lavoratore", aliquota: 3e-3, info: "lavCigs" }
      ]
    }
  };
  var AGEVOLAZIONI_2026 = {
    under30: {
      nome: "Under 30, prima assunzione a tempo indeterminato",
      breve: "Under 30",
      requisito: "meno di 30 anni e mai avuto un contratto a tempo indeterminato",
      sconto: 0.5,
      tettoAnnuo: 3e3,
      inail: false,
      mesi: 36,
      norma: "L. 205/2017 art. 1 c. 100 ss. \u2014 INPS circ. 57/2023, causale Uniemens EG30",
      adempimento: "nessuna istanza: lo sconto si espone direttamente in Uniemens con la causale EG30."
    },
    donna: {
      nome: "Donna in condizione svantaggiata",
      breve: "Donna svantaggiata",
      requisito: "almeno 50 anni e disoccupata da oltre 12 mesi, oppure di qualsiasi et\xE0 se priva di impiego regolarmente retribuito da 24 mesi...",
      sconto: 0.5,
      tettoAnnuo: null,
      inail: true,
      mesi: 18,
      norma: "L. 92/2012 art. 4 c. 8-11",
      adempimento: "modulo 92-2012 dal Cassetto previdenziale."
    },
    over50: {
      nome: "Over 50 disoccupato da oltre 12 mesi",
      breve: "Over 50",
      requisito: "pi\xF9 di 50 anni e disoccupato da oltre 12 mesi",
      sconto: 0.5,
      tettoAnnuo: null,
      inail: true,
      mesi: 18,
      norma: "L. 92/2012 art. 4 c. 8",
      adempimento: "modulo 92-2012 dal Portale Agevolazioni."
    }
  };
  var IMPATRIATI_2026 = {
    // L'abbattimento si ferma qui: la parte di reddito oltre i 600.000 €
    // resta tassata per intero.
    tettoReddito: 6e5,
    anni: 5,
    norma: "art. 5 D.Lgs. 209/2023",
    adempimento: "richiesta scritta al datore di lavoro, che applica la riduzione in busta paga; in mancanza, si recupera in dichiarazione.",
    regimi: {
      base: {
        nome: "Impatriati \u2014 quota esente 50%",
        breve: "Impatriati 50%",
        quotaEsente: 0.5,
        requisito: "residenza estera nei 3 periodi d'imposta precedenti (6 o 7 se si rientra presso lo stesso datore o gruppo), impegno a restare fiscalmente in Italia 4 anni, requisiti di elevata qualificazione o specializzazione"
      },
      figli: {
        nome: "Impatriati con figlio minore \u2014 quota esente 60%",
        breve: "Impatriati 60%",
        quotaEsente: 0.6,
        requisito: "gli stessi requisiti del 50%, pi\xF9 il trasferimento con un figlio minore residente in Italia, oppure la nascita o adozione di un minore durante il periodo agevolato"
      }
    }
  };
  var FONTE_MEDIE = "JP Salary Outlook 2026";
  var MEDIE_RETRIBUTIVE = {
    generale: { nome: "tutti i dipendenti", frase: "dei dipendenti del settore privato", ral: 32991, anno: 2025, fonte: FONTE_MEDIE },
    qualifiche: {
      operaio: { nome: "operaio", frase: "degli operai", ral: 27909, anno: 2025, fonte: FONTE_MEDIE },
      impiegato: { nome: "impiegato", frase: "degli impiegati", ral: 34635, anno: 2025, fonte: FONTE_MEDIE },
      quadro: { nome: "quadro", frase: "dei quadri", ral: 56551, anno: 2025, fonte: FONTE_MEDIE },
      dirigente: { nome: "dirigente", frase: "dei dirigenti", ral: 106556, anno: 2025, fonte: FONTE_MEDIE }
    },
    settori: {
      finanza: { nome: "servizi finanziari e assicurativi", frase: "di chi lavora nei servizi finanziari e assicurativi", ral: 45461, anno: 2025, fonte: FONTE_MEDIE },
      ingegneria: { nome: "ingegneria e studi tecnici", frase: "di chi lavora nell'ingegneria e negli studi tecnici", ral: 44033, anno: 2025, fonte: FONTE_MEDIE },
      tlc: { nome: "telecomunicazioni", frase: "di chi lavora nelle telecomunicazioni", ral: 41914, anno: 2025, fonte: FONTE_MEDIE },
      industria: { nome: "industria e utilities", frase: "di chi lavora nell'industria e nelle utilities", ral: 34e3, anno: 2025, fonte: FONTE_MEDIE, stimato: true },
      commercio: { nome: "servizi e commercio", frase: "di chi lavora nei servizi e nel commercio", ral: 31e3, anno: 2025, fonte: FONTE_MEDIE, stimato: true },
      edilizia: { nome: "edilizia", frase: "di chi lavora nell'edilizia", ral: 3e4, anno: 2025, fonte: FONTE_MEDIE, stimato: true },
      ristorazione: { nome: "alberghi e ristorazione", frase: "di chi lavora negli alberghi e nella ristorazione", ral: 28344, anno: 2025, fonte: FONTE_MEDIE },
      persona: { nome: "servizi alla persona", frase: "di chi lavora nei servizi alla persona", ral: 28013, anno: 2025, fonte: FONTE_MEDIE },
      agricoltura: { nome: "agricoltura", frase: "di chi lavora nell'agricoltura", ral: 26640, anno: 2025, fonte: FONTE_MEDIE }
    }
  };

  // calc/utils.js
  function imposteProgressive(imponibile, scaglioni) {
    let imposta = 0;
    let precedente = 0;
    for (const s of scaglioni) {
      if (imponibile <= precedente) break;
      const quota = Math.min(imponibile, s.fino) - precedente;
      imposta += quota * s.aliquota;
      precedente = s.fino;
    }
    return imposta;
  }
  function rapportoTroncato(numeratore, denominatore) {
    const r = numeratore / denominatore;
    if (r <= 0) return 0;
    return Math.trunc(r * 1e4) / 1e4;
  }
  function risolviRegione(scelta, comune) {
    if (scelta && typeof scelta === "object") return scelta;
    if (REGIONI[scelta]) return REGIONI[scelta];
    if (typeof comune === "string" && COMUNI[comune]) {
      return REGIONI[COMUNI[comune].regione];
    }
    return REGIONI[PARAMETRI_2026.regioneDefault];
  }
  function risolviComune(scelta) {
    if (scelta && typeof scelta === "object") return scelta;
    return COMUNI[scelta] || COMUNI[PARAMETRI_2026.comuneDefault];
  }
  function risolviDatore(scelta) {
    if (scelta && typeof scelta === "object") return scelta;
    return PRESET_DATORE[scelta] || PRESET_DATORE.industriaPiccola;
  }

  // calc/tasse-dipendente.js
  function esenzioneImpatriati(imponibile, chiave) {
    const regime = IMPATRIATI_2026.regimi[chiave];
    if (!regime || imponibile <= 0) return null;
    const redditoAgevolato = Math.min(imponibile, IMPATRIATI_2026.tettoReddito);
    const eccedenza = Math.max(0, imponibile - IMPATRIATI_2026.tettoReddito);
    return {
      chiave,
      regime,
      quotaEsente: regime.quotaEsente,
      redditoAgevolato,
      eccedenzaOltreTetto: eccedenza,
      esenzione: redditoAgevolato * regime.quotaEsente,
      tettoApplicato: eccedenza > 0
    };
  }
  function detrazioneLavoroDipendente(reddito) {
    let detrazione = 0;
    if (reddito <= 15e3) {
      detrazione = 1955;
    } else if (reddito <= 28e3) {
      detrazione = 1910 + 1190 * rapportoTroncato(28e3 - reddito, 13e3);
    } else if (reddito <= 5e4) {
      detrazione = 1910 * rapportoTroncato(5e4 - reddito, 22e3);
    }
    if (reddito > 25e3 && reddito <= 35e3) {
      detrazione += 65;
    }
    return detrazione;
  }
  function bonusCuneo(reddito) {
    if (reddito > 2e4) return 0;
    let percentuale;
    if (reddito <= 8500) percentuale = 0.071;
    else if (reddito <= 15e3) percentuale = 0.053;
    else percentuale = 0.048;
    return reddito * percentuale;
  }
  function detrazioneCuneo(reddito) {
    if (reddito <= 2e4 || reddito > 4e4) return 0;
    if (reddito <= 32e3) return 1e3;
    return 1e3 * ((4e4 - reddito) / 8e3);
  }
  function trattamentoIntegrativo(reddito, irpefLorda, detrazioneLavoro) {
    if (reddito <= 15e3 && irpefLorda > detrazioneLavoro) {
      return 1200;
    }
    return 0;
  }
  function detrazioneConiuge(reddito) {
    if (reddito <= 15e3) {
      const r = rapportoTroncato(reddito, 15e3);
      if (r === 0 || r >= 1) return 0;
      return 800 - 110 * r;
    }
    if (reddito <= 4e4) {
      let d = 690;
      if (reddito > 29e3 && reddito <= 29200) d += 10;
      else if (reddito > 29200 && reddito <= 34700) d += 20;
      else if (reddito > 34700 && reddito <= 35e3) d += 30;
      else if (reddito > 35e3 && reddito <= 35100) d += 20;
      else if (reddito > 35100 && reddito <= 35200) d += 10;
      return d;
    }
    if (reddito <= 8e4) {
      return 690 * rapportoTroncato(8e4 - reddito, 4e4);
    }
    return 0;
  }
  function detrazioneFigli(reddito, numeroFigli) {
    if (numeroFigli <= 0) return 0;
    const soglia = 95e3 + 15e3 * (numeroFigli - 1);
    const r = rapportoTroncato(soglia - reddito, soglia);
    if (r === 0 || r >= 1) return 0;
    return numeroFigli * 950 * r;
  }
  function detrazioneAltriFamiliari(reddito, numeroFamiliari) {
    if (numeroFamiliari <= 0) return 0;
    const r = rapportoTroncato(8e4 - reddito, 8e4);
    if (r === 0 || r >= 1) return 0;
    return numeroFamiliari * 750 * r;
  }
  function addizionaleLocale(imponibile, ente) {
    if (imponibile <= (ente.esenzioneFino || 0)) return 0;
    if (ente.scaglioni) {
      return imposteProgressive(imponibile, ente.scaglioni);
    }
    return imponibile * (ente.aliquota || 0);
  }

  // calc/calcolo-dipendente.js
  function contributiDipendente(ral, conMassimale, vociLavoratore) {
    const p = PARAMETRI_2026;
    const baseContributivaPensionistica = conMassimale ? Math.min(ral, p.massimale) : ral;
    const ivs = baseContributivaPensionistica * p.aliquotaInps;
    const eccedenzaFascia = Math.max(0, baseContributivaPensionistica - p.primaFascia);
    const aggiuntivo = eccedenzaFascia * p.aliquotaAggiuntiva;
    const minori = (vociLavoratore || []).map((v) => ({
      nome: v.nome,
      aliquota: v.aliquota,
      info: v.info,
      importo: ral * v.aliquota
    }));
    const totaleMinori = minori.reduce((tot, v) => tot + v.importo, 0);
    return {
      baseContributiva: baseContributivaPensionistica,
      ivs,
      aggiuntivo,
      minori,
      totaleMinori,
      totale: ivs + aggiuntivo + totaleMinori,
      massimaleApplicato: conMassimale && ral > p.massimale
    };
  }
  function calcolaNetto(ral, mensilita, opzioni = {}) {
    const p = PARAMETRI_2026;
    const conMassimale = opzioni.conMassimale !== false;
    const datore = risolviDatore(opzioni.preset);
    const contributi = contributiDipendente(ral, conMassimale, datore.vociLavoratore);
    const contributiInps = contributi.totale;
    const imponibile = ral - contributiInps;
    const impatriati = esenzioneImpatriati(imponibile, opzioni.impatriati);
    const esenzioneImp = impatriati ? impatriati.esenzione : 0;
    const imponibileIrpef = imponibile - esenzioneImp;
    const irpefLorda = imposteProgressive(imponibileIrpef, p.scaglioniIrpef);
    const detrLavoro = detrazioneLavoroDipendente(imponibileIrpef);
    const detrCuneo = detrazioneCuneo(imponibile);
    const detrConiuge = opzioni.coniuge ? detrazioneConiuge(imponibileIrpef) : 0;
    const detrFigli = detrazioneFigli(imponibileIrpef, opzioni.figli || 0);
    const detrAltri = detrazioneAltriFamiliari(imponibileIrpef, opzioni.altriFamiliari || 0);
    const detrFamiliari = detrConiuge + detrFigli + detrAltri;
    const detrazioniTotali = Math.min(
      detrLavoro + detrCuneo + detrFamiliari,
      irpefLorda
    );
    const irpefNetta = irpefLorda - detrazioniTotali;
    const regione = risolviRegione(opzioni.regione, opzioni.comune);
    const comune = risolviComune(opzioni.comune);
    let addizionaleRegionale = 0;
    let addizionaleComunale = 0;
    if (irpefNetta > 0) {
      addizionaleRegionale = addizionaleLocale(imponibileIrpef, regione);
      addizionaleComunale = addizionaleLocale(imponibileIrpef, comune);
    }
    const bonus = bonusCuneo(imponibile);
    const integrativo = trattamentoIntegrativo(imponibile, irpefLorda, detrLavoro);
    const totaleTrattenute = contributiInps + irpefNetta + addizionaleRegionale + addizionaleComunale;
    const nettoAnnuo = ral - totaleTrattenute + bonus + integrativo;
    const nettoMese = nettoAnnuo / mensilita;
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
      incidenzaTrattenute: (totaleTrattenute - bonus - integrativo) / ral
    };
  }
  function confrontoImpatriati(r, opzioni = {}) {
    if (!r.impatriati) return null;
    const senza = calcolaNetto(r.ral, r.mensilita, Object.assign({}, opzioni, { impatriati: "" }));
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
      quotaNettoInPiu: guadagnoAnnuo / senza.nettoAnnuo
    };
  }

  // calc/calcolo-azienda.js
  function aliquotaDatore(preset) {
    return preset.voci.reduce((tot, v) => tot + v.aliquota, 0);
  }
  function valutaAgevolazioni(chiavi, contributiDatore, inail) {
    const valutate = (chiavi || []).filter((k) => AGEVOLAZIONI_2026[k]).map((k) => {
      const agevolazione = AGEVOLAZIONI_2026[k];
      const baseInail = agevolazione.inail ? inail : 0;
      const scontoLordo = (contributiDatore + baseInail) * agevolazione.sconto;
      const scontoTotale = agevolazione.tettoAnnuo !== null ? Math.min(scontoLordo, agevolazione.tettoAnnuo) : scontoLordo;
      const fattore = scontoLordo > 0 ? scontoTotale / scontoLordo : 0;
      return {
        chiave: k,
        agevolazione,
        scontoContributi: contributiDatore * agevolazione.sconto * fattore,
        scontoInail: baseInail * agevolazione.sconto * fattore,
        totale: scontoTotale,
        // Valutazione sul lungo termine (es. uno sconto minore che dura 36 mesi 
        // può essere meglio di uno maggiore che dura 18)
        totaleDurata: scontoTotale * (agevolazione.mesi / 12),
        tettoRaggiunto: agevolazione.tettoAnnuo !== null && scontoLordo > agevolazione.tettoAnnuo
      };
    }).sort((a, b) => b.totale - a.totale || b.totaleDurata - a.totaleDurata);
    return {
      valutate,
      migliore: valutate.length ? valutate[0] : null,
      scartate: valutate.slice(1)
    };
  }
  function calcolaCostoAzienda(ral, opzioni = {}) {
    const p = PARAMETRI_2026;
    const a = PARAMETRI_AZIENDA_2026;
    const preset = risolviDatore(opzioni.preset);
    const conMassimale = opzioni.conMassimale !== false;
    const baseIvs = conMassimale ? Math.min(ral, p.massimale) : ral;
    const voci = preset.voci.map((v) => ({
      nome: v.nome,
      aliquota: v.aliquota,
      info: v.info,
      ivs: !!v.ivs,
      base: v.ivs ? baseIvs : ral,
      importo: (v.ivs ? baseIvs : ral) * v.aliquota
    }));
    const contributiDatore = voci.reduce((tot, v) => tot + v.importo, 0);
    const tassoInail = opzioni.inail !== void 0 ? opzioni.inail : preset.inail;
    const inail = ral * tassoInail;
    const ag = valutaAgevolazioni(opzioni.agevolazioni, contributiDatore, inail);
    const scontoContributi = ag.migliore ? ag.migliore.scontoContributi : 0;
    const scontoInail = ag.migliore ? ag.migliore.scontoInail : 0;
    const sconto = scontoContributi + scontoInail;
    const tfrTotale = ral / a.divisoreTfr;
    const tfrAlFondoPensioni = ral * a.contributoTfrFondoPensioni;
    const tfrAccantonato = tfrTotale - tfrAlFondoPensioni;
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
      moltiplicatorePieno: costoPieno / ral
    };
  }

  // calc/confronti.js
  function confrontaConMedia(ral, media) {
    if (!media) return null;
    const scarto = ral - media.ral;
    return {
      media,
      scarto,
      scartoPercentuale: scarto / media.ral,
      sopra: scarto > 0
    };
  }

  // spiegazioni.js
  var SPIEGAZIONI = {
    // ----- lato dipendente -----
    ral: {
      titolo: "Retribuzione annua lorda",
      testo: "\xC8 la retribuzione annua prima di qualsiasi trattenuta, indicata nel contratto di lavoro. Non comprende il TFR, che matura a parte, n\xE9 i contributi a carico del datore di lavoro. L'intero calcolo parte da questo importo."
    },
    baseContributiva: {
      titolo: "Massimale contributivo",
      testo: "Sopra 122.295 \u20AC di retribuzione non si versano pi\xF9 contributi pensionistici. Il tetto vale solo per chi si \xE8 iscritto all'INPS dal 1\xB0 gennaio 1996 in poi. Chi ha anzianit\xE0 precedente versa su tutta la retribuzione, senza limite.",
      norma: "art. 2 comma 18 L. 335/1995 \xB7 dalla circolare INPS 6/2026"
    },
    ivs: {
      titolo: "Contributi IVS a tuo carico",
      testo: "IVS sta per Invalidit\xE0, Vecchiaia e Superstiti: \xE8 il contributo previdenziale primario che accantona la tua futura pensione. Queste somme non vanno al bilancio generale dello Stato come una tassa, ma confluiscono direttamente nel tuo montante contributivo personale presso l'INPS. L'aliquota pensionistica totale \xE8 del 33% dell'imponibile: il 9,19% viene trattenuto mese per mese in busta paga (ovvero l'importo mostrato qui), mentre il restante 23,81% \xE8 versato dal datore di lavoro.",
      norma: "aliquota IVS del Fondo pensioni lavoratori dipendenti"
    },
    aggiuntivo1: {
      titolo: "Contributo aggiuntivo dell'1%",
      testo: "\xC8 un contributo previdenziale aggiuntivo dell'1% a carico esclusivo del lavoratore. Non si applica sull'intera retribuzione, ma solo sulla parte di stipendio che supera la soglia della prima fascia pensionistica (56.224 \u20AC nel 2026). Chi ha una RAL fino a 56.224 \u20AC non paga questo contributo.",
      norma: "art. 3-ter L. 438/1992"
    },
    lavCigs: {
      titolo: "CIGS",
      testo: "Cassa Integrazione Guadagni Straordinaria: la quota a tuo carico \xE8 dello 0,30%, dovuta per le aziende con pi\xF9 di 15 dipendenti. Come tutti i contributi previdenziali, \xE8 interamente deducibile dall'imponibile fiscale.",
      norma: "D.Lgs. 148/2015, soglia dei 15 dipendenti dalla L. 234/2021"
    },
    lavFis: {
      titolo: "FIS",
      testo: "Fondo di Integrazione Salariale: la quota a tuo carico \xE8 dello 0,27%. Come tutti i contributi previdenziali, \xE8 interamente deducibile dall'imponibile fiscale.",
      norma: "art. 29 D.Lgs. 148/2015"
    },
    imponibile: {
      titolo: "Imponibile fiscale",
      testo: "\xC8 il valore effettivo su cui si calcolano le imposte (IRPEF e addizionali) e si ottiene sottraendo alla RAL i contributi previdenziali INPS a tuo carico.",
      norma: "art. 51 comma 2 lett. a) TUIR"
    },
    impatriati: {
      titolo: "Regime impatriati (rientro dei cervelli)",
      testo: "Consente a chi trasferisce la residenza fiscale in Italia dall'estero di pagare le tasse solo sul 50% del reddito (o sul 40% in presenza di un figlio minore). Essendo un'esenzione dal reddito, riduce sia l'IRPEF che le addizionali regionali e comunali. L'agevolazione vale per 5 anni su un massimo di 600.000 \u20AC di reddito annuo. I contributi INPS restano calcolati sull'intera RAL e non c'\xE8 alcun impatto sul costo aziendale. Attenzione ai redditi bassi: abbattendo l'imposta lorda si pu\xF2 perdere il trattamento integrativo, che vale 1.200 \u20AC, e in quel caso il regime fa scendere il netto invece di alzarlo.",
      norma: "art. 5 D.Lgs. 209/2023 (trasferimenti dal 2024)"
    },
    imponibileIrpef: {
      titolo: "Imponibile IRPEF agevolato",
      testo: "\xC8 il reddito effettivo su cui vengono calcolate IRPEF, detrazioni e addizionali locali dopo l'abbattimento del regime impatriati. L'imponibile INPS rimane invece quello pieno. Fanno eccezione il taglio del cuneo e il trattamento integrativo: per quelli il reddito di riferimento \xE8 quello comprensivo della quota esente, quindi il regime non fa scendere nessuno in una fascia pi\xF9 favorevole.",
      norma: "art. 5 comma 1 D.Lgs. 209/2023 \xB7 circolari AdE 4/E del 2025 e 29/E del 2020"
    },
    irpefLorda: {
      titolo: "IRPEF lorda",
      testo: "L'imposta sul reddito, calcolata per scaglioni: 23% fino a 28.000 \u20AC, 33% da 28.000 a 50.000, 43% oltre. Gli scaglioni non funzionano a gradini secchi, per esempio: se guadagni 30.000 \u20AC non paghi il 33% su tutto, ma il 23% sui primi 28.000 e il 33% solo sui 2.000 che avanzano.",
      norma: "art. 11 TUIR, aliquote modificate dalla L. 199/2025"
    },
    detrLavoro: {
      titolo: "Detrazione per lavoro dipendente",
      testo: "\xC8 uno sconto fiscale riconosciuto a tutti i lavoratori dipendenti che riduce direttamente l'IRPEF da pagare (aumentando cos\xEC il netto in busta paga). La detrazione massima \xE8 di 1.955 \u20AC per redditi fino a 15.000 \u20AC, diminuendo progressivamente all'aumentare del reddito fino ad azzerarsi a 50.000 \u20AC. Nella fascia tra 25.001 \u20AC e 35.000 \u20AC \xE8 prevista un'ulteriore integrazione fissa di 65 \u20AC.",
      norma: "art. 13 commi 1 e 1.1 TUIR"
    },
    detrCuneo: {
      titolo: "Detrazione del taglio del cuneo fiscale",
      testo: "Aumenta lo stipendio netto:Sotto i 20.000 \u20AC non \xE8 una detrazione ma una somma esentasse che si aggiunge al netto.Tra 20.000 e 32.000 \u20AC di reddito vale 1.000 \u20AC pieni, poi si riduce in modo lineare fino ad azzerarsi a 40.000 \u20AC. ",
      norma: "art. 1 commi 4-9 L. 207/2024, misura strutturale"
    },
    detrConiuge: {
      titolo: "Detrazione per il coniuge a carico",
      testo: "Spetta per il coniuge non separato con reddito proprio sotto 2.840,51 \u20AC l'anno. L'importo dipende dal tuo reddito: parte da 800 \u20AC, si assesta su 690 \u20AC nella fascia centrale e si azzera sopra gli 80.000 \u20AC. Come tutte le detrazioni, riduce l'imposta e non il reddito.",
      norma: "art. 12 comma 1 lett. a) TUIR"
    },
    detrFigli: {
      titolo: "Detrazione per i figli a carico",
      testo: "Dal 2025 spetta solo per i figli tra 21 e 30 anni; in caso di figli disabili non c'\xE8 limite d'et\xE0. Sotto i 21 anni non c'\xE8 detrazione ma assegno unico, che l'INPS versa a parte e non passa dalla busta paga. La detrazione base \xE8 di 950 \u20AC per figlio, ridotta al crescere del reddito.",
      norma: "art. 12 comma 1 lett. c) TUIR, riscritto dalla L. 207/2024"
    },
    detrAltri: {
      titolo: "Detrazione per gli ascendenti conviventi",
      testo: "Genitori o nonni a carico, ma solo se convivono stabilmente con te. La detrazione base \xE8 di 750 \u20AC per familiare, ridotta al crescere del reddito e azzerata sopra gli 80.000 \u20AC. ",
      norma: "art. 12 comma 1 lett. d) TUIR"
    },
    incapienza: {
      titolo: "Detrazioni perse per incapienza",
      testo: "Le detrazioni riducono l'imposta, ma non possono spingerla sotto zero: nessuno riceve un rimborso perch\xE9 le detrazioni superano l'IRPEF. Questa riga \xE8 la parte di sconto a cui avresti diritto e che si perde perch\xE9 l'imposta si azzera prima Capita ai redditi bassi, dove le detrazioni valgono quasi quanto l'imposta piena."
    },
    irpefNetta: {
      titolo: "IRPEF netta",
      testo: "L'imposta che paghi davvero: la lorda meno tutte le detrazioni. Il datore di lavoro la trattiene mese per mese e la versa allo Stato al posto tuo, come sostituto d'imposta. Va al bilancio dello Stato e finanzia la spesa pubblica generale."
    },
    addRegionale: {
      titolo: "Addizionale regionale",
      testo: "Un'imposta in pi\xF9 sullo stesso imponibile IRPEF, che va alla regione dove hai il domicilio fiscale e finanzia soprattutto la sanit\xE0. Ogni regione decide la propria aliquota entro limiti fissati dallo Stato, e alcune la fanno crescere per scaglioni. Tra la regione pi\xF9 cara e la pi\xF9 economica ballano pi\xF9 di mille euro l'anno su una RAL media.",
      norma: "D.Lgs. 446/1997, aliquote deliberate da ogni regione"
    },
    addComunale: {
      titolo: "Addizionale comunale",
      testo: "Un'imposta in pi\xF9 sullo stesso imponibile IRPEF, che va al comune di residenza. Ogni comune decide la propria aliquota entro limiti fissati dallo Stato, e alcuni la fanno crescere per scaglioni. Molti comuni fissano una soglia di esenzione, sotto quella soglia non paghi nulla, una volta superata inizi a pagarla.",
      norma: "D.Lgs. 360/1998, delibere comunali"
    },
    bonusCuneo: {
      titolo: "Bonus del taglio del cuneo",
      testo: "Sotto i 20.000 \u20AC di reddito il taglio del cuneo non \xE8 una detrazione ma una somma che si aggiunge al netto, e non \xE8 tassata. Vale il 7,1%, il 5,3% o il 4,8% del reddito a seconda della fascia. \xC8 un trasferimento vero e proprio: per questo a redditi bassi il netto pu\xF2 superare il lordo.",
      norma: "art. 1 commi 4-9 L. 207/2024"
    },
    trattamentoIntegrativo: {
      titolo: "Trattamento integrativo",
      testo: "I 1.200 \u20AC l'anno che tutti chiamano ancora bonus Renzi, oggi riservati a chi sta sotto i 15.000 \u20AC di reddito. \xC8 denaro erogato in busta paga, a condizione che l'IRPEF lorda superi la detrazione da lavoro dipendente. Nella fascia 15.000-28.000 \u20AC spetta solo a chi ha altre detrazioni, che in questo caso semplice non ci sono.",
      norma: "art. 1 D.L. 3/2020, convertito in L. 21/2020"
    },
    sommeAggiuntive: {
      titolo: "Somme aggiuntive",
      testo: "Rappresentano l'importo totale erogato dallo Stato in busta paga, dato dalla somma del bonus del cuneo fiscale e del trattamento integrativo. Essendo somme esentasse erogate direttamente dallo Stato, si sommano interamente allo stipendio netto. Per le retribuzioni pi\xF9 basse (all'incirca tra 9.400 \u20AC e 11.900 \u20AC) tali somme possono superare le trattenute totali, rendendo il netto annuo superiore alla RAL lorda.",
      norma: "art. 1 commi 4-9 L. 207/2024 e art. 1 D.L. 3/2020"
    },
    totaleTrattenute: {
      titolo: "Totale trattenute",
      testo: "La somma di contributi, IRPEF netta e addizionali: tutto quello che dalla RAL non arriva sul tuo conto. Vale la pena distinguere tra contributi e imposte: i contributi tornano indietro come pensione, le imposte no. Per questo la percentuale di trattenute \xE8 sempre pi\xF9 alta dell'aliquota fiscale effettiva."
    },
    // ----- lato azienda -----
    datoreIvs: {
      titolo: "IVS a carico dell'azienda",
      testo: "\xC8 la quota di contributi pensionistici a carico del datore di lavoro (pari al 23,81% della RAL) che, insieme al 9,19% trattenuto al dipendente, compone il 33% complessivo destinato alla pensione del lavoratore. Costituisce la voce pi\xF9 consistente dei contributi aziendali. Sopra la soglia del massimale contributivo di 122.295 \u20AC questo contributo non \xE8 pi\xF9 dovuto.",
      norma: "aliquota IVS del Fondo pensioni lavoratori dipendenti"
    },
    datoreMalattia: {
      titolo: "Contributo di malattia",
      testo: "\xC8 il contributo previdenziale a carico dell'azienda che finanzia l'indennit\xE0 pagata dall'INPS al lavoratore in caso di assenza per malattia."
    },
    datoreNaspi: {
      titolo: "Contributo NASpI",
      testo: "\xC8 il contributo a carico esclusivo dell'azienda che finanzia l'indennit\xE0 di disoccupazione. L'1,61% complessivo \xE8 composto dall'1,31% per la NASpI e dallo 0,30% per i fondi di formazione professionale.",
      norma: "art. 2 commi 25-28 L. 92/2012"
    },
    datoreCigo: {
      titolo: "Contributo CIGO",
      testo: "Cassa Integrazione Guadagni Ordinaria: copre le sospensioni temporanee per eventi non dipendenti dall'azienda. Si applica all'industria, con aliquote che aumentano in base al numero di dipendenti.",
      norma: "D.Lgs. 148/2015"
    },
    datoreCigs: {
      titolo: "Contributo CIGS",
      testo: "Cassa Integrazione Guadagni Straordinaria: interviene su riorganizzazioni, crisi aziendali e contratti di solidariet\xE0. L'aliquota a carico dell'azienda \xE8 dello 0,60% e si applica sopra i 15 dipendenti.",
      norma: "D.Lgs. 148/2015, come modificato dalla L. 234/2021"
    },
    datoreFis: {
      titolo: "Contributo FIS",
      testo: "Fondo di Integrazione Salariale: \xE8 la cassa integrazione per le aziende non coperte dalla CIGO, principalmente nel terziario e nei servizi. Interviene per tutelare il reddito dei lavoratori in caso di riduzione o sospensione dell'attivit\xE0. L'aliquota a carico dell'azienda \xE8 dello 0,33% fino a 5 dipendenti e dello 0,53% oltre i 5 dipendenti.",
      norma: "D.Lgs. 148/2015, come modificato dalla L. 234/2021"
    },
    datoreCuaf: {
      titolo: "Contributo ex CUAF",
      testo: "\xC8 il contributo previdenziale a carico dell'azienda destinato a finanziare le prestazioni di sostegno alla famiglia.",
      norma: "art. 120 L. 388/2000"
    },
    datoreMaternita: {
      titolo: "Contributo di maternit\xE0",
      testo: "Finanzia l'indennit\xE0 INPS per i congedi di maternit\xE0 e paternit\xE0. \xC8 una voce piccola, tra lo 0,24% e lo 0,46% a seconda del settore, e la paga interamente l'azienda."
    },
    datoreFondoGaranzia: {
      titolo: "Fondo di garanzia TFR",
      testo: "Una specie di assicurazione: se l'azienda fallisce e non riesce a pagare il TFR, ci pensa l'INPS. Costa lo 0,20% della retribuzione e la versa il datore di lavoro. Non va confuso con lo 0,50% che esce dall'accantonamento del TFR: sono due prelievi diversi.",
      norma: "art. 2 L. 297/1982"
    },
    inail: {
      titolo: "Premio INAIL",
      testo: "Assicurazione obbligatoria contro infortuni sul lavoro e malattie professionali, pagata al 100% dall'azienda. Il tasso non dipende dallo stipendio ma dal rischio della lavorazione. Il tasso pu\xF2 poi oscillare in base agli infortuni degli anni precedenti.",
      norma: "tariffe dei premi, DM 27 febbraio 2019"
    },
    tfr: {
      titolo: "Quota di TFR",
      testo: "Trattamento di Fine Rapporto: \xE8 una quota di retribuzione differita che matura ogni anno e si incassa al termine del rapporto di lavoro. La quota annua \xE8 pari al 7,41% della RAL: lo 0,50% va all'INPS come contributo pensionistico, mentre il restante 6,91% costituisce l'accantonamento effettivo per il lavoratore. ",
      norma: "art. 2120 c.c. \xB7 art. 3 L. 297/1982"
    },
    costoTotale: {
      titolo: "Costo totale",
      testo: "Quello che l'azienda mette a bilancio per tenerti: RAL pi\xF9 contributi, premio INAIL e quota di TFR. \xC8 il numero da cui parte chi decide un'assunzione, mentre il dipendente ragiona sul netto mensile. Fra i due estremi c'\xE8 tutto il resto di questa pagina."
    },
    cuneo: {
      titolo: "Cuneo fiscale e contributivo",
      testo: "La distanza tra quello che l'azienda spende e quello che arriva in tasca al dipendente. Dentro ci stanno contributi di entrambe le parti, IRPEF e addizionali. Il TFR resta fuori dal conto: \xE8 retribuzione differita, arriva al lavoratore pi\xF9 tardi, e tenerlo al denominatore farebbe sembrare il cuneo pi\xF9 leggero di quanto \xE8."
    },
    agevolazioni: {
      titolo: "Agevolazioni contributive",
      testo: "Sono incentivi previsti per ridurre i contributi a carico dell'azienda e favorire l'assunzione di specifiche categorie di lavoratori (come giovani under 30, donne e over 50). Questi sconti non riducono n\xE9 lo stipendio netto n\xE9 la RAL del dipendente, a cui viene garantito il versamento contributivo pieno ai fini pensionistici. Il risparmio va a beneficio esclusivo dell'azienda sul costo del lavoro. Le misure non sono cumulabili tra loro: in presenza di pi\xF9 requisiti, viene applicata automaticamente quella pi\xF9 conveniente sull'anno, coerentemente con le altre cifre della pagina, che sono tutte annuali. Poich\xE9 le misure hanno durate diverse (36 mesi l'under 30, 18 mesi le altre due), su tutto il periodo del beneficio pu\xF2 convenire l'altra: il calcolatore mostra entrambi i valori.",
      norma: "L. 205/2017 art. 1 c. 100 \xB7 L. 92/2012 art. 4 c. 8-11"
    }
  };

  // app.js
  var eur2 = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: "always"
  });
  var eur0 = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: "always"
  });
  var num0 = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0, useGrouping: "always" });
  var PREZZO_PIZZA = 9;
  var inPizze = (euro) => num0.format(Math.round(euro / PREZZO_PIZZA)) + " pizze";
  var $ = (id) => document.getElementById(id);
  var PASSO_RAL = 500;
  var soloCifre = (s) => s.replace(/\D/g, "");
  var valoreRal = () => Number(soloCifre($("ral").value));
  function scriviRal(v) {
    $("ral").value = v > 0 ? num0.format(v) : "";
  }
  function formattaRal() {
    const el = $("ral");
    const cifrePrima = soloCifre(el.value.slice(0, el.selectionStart)).length;
    const cifre = soloCifre(el.value);
    const testo = cifre ? num0.format(Number(cifre)) : "";
    if (testo === el.value) return;
    el.value = testo;
    let pos = 0;
    for (let viste = 0; pos < testo.length && viste < cifrePrima; pos++) {
      if (/\d/.test(testo[pos])) viste++;
    }
    el.setSelectionRange(pos, pos);
  }
  var pct = (x, dec = 1) => x.toFixed(dec).replace(".", ",") + "%";
  var pctAliq = (a) => (a * 100).toFixed(2).replace(".", ",").replace(/,?0+$/, "") + "%";
  var calcolato = false;
  var NESSUNA = "__nessuna__";
  var ALTRO = "__altro__";
  var MANUALE = "__manuale__";
  function cambiaVista(vista) {
    document.body.dataset.vista = vista;
    $("tabDipendente").setAttribute("aria-selected", String(vista === "dipendente"));
    $("tabAzienda").setAttribute("aria-selected", String(vista === "azienda"));
    adattaPannello();
  }
  $("tabDipendente").addEventListener("click", () => cambiaVista("dipendente"));
  $("tabAzienda").addEventListener("click", () => cambiaVista("azienda"));
  var LIVELLI_COMPATTO = ["1", "2", "3"];
  function adattaPannello() {
    const pannello = document.querySelector(".pannello");
    if (!pannello || pannello.querySelector("details[open]")) return;
    delete document.body.dataset.compatto;
    for (const livello of LIVELLI_COMPATTO) {
      if (pannello.scrollHeight - pannello.clientHeight <= 1) return;
      document.body.dataset.compatto = livello;
    }
  }
  addEventListener("resize", adattaPannello);
  document.querySelectorAll(".pannello details.sez").forEach((d) => {
    d.addEventListener("toggle", () => {
      if (!d.open) adattaPannello();
    });
  });
  $("comune").innerHTML = Object.entries(COMUNI).map(([k, c]) => `<option value="${k}">${c.nome}</option>`).join("") + `<option value="${ALTRO}">Altro comune\u2026</option>`;
  $("regione").innerHTML = Object.entries(REGIONI).map(([k, r]) => `<option value="${k}">${r.nome}</option>`).join("") + `<option value="${ALTRO}">Altra regione\u2026</option>`;
  $("comune").value = "milano";
  $("regione").value = "lombardia";
  $("qualifica").innerHTML = `<option value="${NESSUNA}" selected>non specificato</option>` + Object.entries(MEDIE_RETRIBUTIVE.qualifiche).map(([k, q]) => `<option value="${k}">${q.nome}</option>`).join("");
  $("settore").innerHTML = `<option value="${NESSUNA}" selected>non specificato</option>` + Object.entries(MEDIE_RETRIBUTIVE.settori).map(([k, s]) => `<option value="${k}">${s.nome}</option>`).join("");
  $("preset").innerHTML = Object.entries(PRESET_DATORE).map(([k, p]) => `<option value="${k}">${p.nome}</option>`).join("") + `<option value="${MANUALE}">Aliquota a mano\u2026</option>`;
  $("preset").value = "industriaPiccola";
  function sincronizzaResidenza() {
    const c = $("comune").value;
    if (c !== ALTRO && COMUNI[c]) $("regione").value = COMUNI[c].regione;
    $("regione").disabled = c !== ALTRO;
    $("regioneBloccata").hidden = c === ALTRO;
    $("manualeComune").hidden = c !== ALTRO;
    $("manualeRegione").hidden = $("regione").value !== ALTRO;
    $("comuneUnica").hidden = $("comuneTipo").value !== "unica";
    $("comuneScaglioni").hidden = $("comuneTipo").value !== "scaglioni";
    $("regioneUnica").hidden = $("regioneTipo").value !== "unica";
    $("regioneScaglioni").hidden = $("regioneTipo").value !== "scaglioni";
    mostraAliquote();
  }
  function scaglioniDaCampi(prefisso) {
    const v = (n) => Number($(prefisso + n).value) / 100;
    return [
      { fino: 15e3, aliquota: v(1) },
      { fino: 28e3, aliquota: v(2) },
      { fino: 5e4, aliquota: v(3) },
      { fino: Infinity, aliquota: v(4) }
    ];
  }
  function residenzaScelta() {
    const c = $("comune").value;
    const r = $("regione").value;
    let comune = c;
    if (c === ALTRO) {
      comune = { nome: "inserita a mano", esenzioneFino: Number($("comuneEsenzione").value) };
      if ($("comuneTipo").value === "scaglioni") comune.scaglioni = scaglioniDaCampi("comuneS");
      else comune.aliquota = Number($("comuneAliquota").value) / 100;
    }
    let regione = r;
    if (r === ALTRO) {
      regione = { nome: "inserita a mano" };
      if ($("regioneTipo").value === "scaglioni") regione.scaglioni = scaglioniDaCampi("regioneS");
      else regione.aliquota = Number($("regioneAliquota").value) / 100;
    }
    return { comune, regione };
  }
  function descriviEnte(ente) {
    if (ente.scaglioni) {
      let da = 0;
      return ente.scaglioni.map((s) => {
        let range;
        if (s.fino === Infinity) {
          range = "oltre " + num0.format(da) + " \u20AC";
        } else if (da === 0) {
          range = "fino a " + num0.format(s.fino) + " \u20AC";
        } else {
          range = "da " + num0.format(da) + " a " + num0.format(s.fino) + " \u20AC";
        }
        da = s.fino;
        return pctAliq(s.aliquota) + " (" + range + ")";
      }).join(" / ");
    }
    return pctAliq(ente.aliquota || 0) + " unica";
  }
  function mostraAliquote() {
    const { comune, regione } = residenzaScelta();
    const reg = risolviRegione(regione);
    const com = risolviComune(comune);
    const soglia = com.esenzioneFino || 0;
    $("aliquoteAttuali").innerHTML = "<b>" + reg.nome + "</b> " + descriviEnte(reg) + "<br><b>" + com.nome + "</b> " + descriviEnte(com) + (soglia > 0 ? ", esente fino a " + num0.format(soglia) + " \u20AC" : ", nessuna esenzione");
  }
  function impatriatiScelto() {
    const v = $("impatriati").value;
    return IMPATRIATI_2026.regimi[v] ? v : "";
  }
  function mostraImpatriati() {
    const k = impatriatiScelto();
    if (!k) {
      $("impatriatiAttuali").innerHTML = "Nessun regime: imponibile fiscale pieno.";
      return;
    }
    const r = IMPATRIATI_2026.regimi[k];
    $("impatriatiAttuali").innerHTML = "<b>" + r.breve + "</b> quota esente " + pctAliq(r.quotaEsente) + " dell'imponibile &nbsp;\xB7&nbsp; tetto " + eur0.format(IMPATRIATI_2026.tettoReddito) + " l'anno &nbsp;\xB7&nbsp; " + IMPATRIATI_2026.anni + ` periodi d'imposta &nbsp;\xB7&nbsp; <span class="nota-riga">contributi INPS pieni, costo azienda invariato</span>`;
  }
  var AGEVOLAZIONI_CAMPI = {
    agUnder30: "under30",
    agDonna: "donna",
    agOver50: "over50"
  };
  var AGEVOLAZIONI_ESCLUSIVE = ["agUnder30", "agOver50"];
  function sincronizzaAgevolazioni(cambiato) {
    if (AGEVOLAZIONI_ESCLUSIVE.includes(cambiato) && $(cambiato).checked) {
      AGEVOLAZIONI_ESCLUSIVE.filter((id) => id !== cambiato).forEach((id) => {
        $(id).checked = false;
      });
    }
    AGEVOLAZIONI_ESCLUSIVE.forEach((id) => {
      const altra = AGEVOLAZIONI_ESCLUSIVE.find((x) => x !== id);
      $(id).disabled = $(altra).checked;
    });
    mostraAgevolazioni();
  }
  function agevolazioniScelte() {
    return Object.entries(AGEVOLAZIONI_CAMPI).filter(([id]) => $(id).checked).map(([, chiave]) => chiave);
  }
  function datoreScelto() {
    const k = $("preset").value;
    const inail = Number($("inail").value) / 100;
    const agevolazioni = agevolazioniScelte();
    if (k === MANUALE) {
      return {
        preset: {
          nome: "aliquota inserita a mano",
          inail,
          voci: [{
            nome: "Contributi a carico azienda",
            aliquota: Number($("datoreAliquota").value) / 100,
            info: "datoreIvs"
          }]
        },
        inail,
        agevolazioni
      };
    }
    return { preset: k, inail, agevolazioni };
  }
  function mostraAgevolazioni() {
    const scelte = agevolazioniScelte();
    if (!scelte.length) {
      $("agevolazioniAttuali").innerHTML = "Nessuna agevolazione: contributi pieni.";
      return;
    }
    $("agevolazioniAttuali").innerHTML = scelte.map((k) => {
      const ag = AGEVOLAZIONI_2026[k];
      return "<b>" + ag.breve + "</b> \u2212" + pctAliq(ag.sconto) + (ag.tettoAnnuo ? ", max " + eur0.format(ag.tettoAnnuo) + " l'anno" : "") + (ag.inail ? ", INAIL incluso" : "") + ", " + ag.mesi + " mesi";
    }).join(" &nbsp;\xB7&nbsp; ");
  }
  function sincronizzaDatore(cambiatoPreset) {
    const k = $("preset").value;
    $("manualeDatore").hidden = k !== MANUALE;
    if (cambiatoPreset && k !== MANUALE) {
      $("inail").value = (PRESET_DATORE[k].inail * 100).toFixed(2).replace(/\.?0+$/, "");
    }
    mostraAliquoteDatore();
  }
  function mostraAliquoteDatore() {
    const scelta = datoreScelto();
    const preset = risolviDatore(scelta.preset);
    const totale = aliquotaDatore(preset);
    $("aliquoteDatore").innerHTML = "<b>" + preset.nome + "</b> " + pctAliq(totale) + " di contributi" + (preset.nota ? ' <span class="nota-riga">(' + preset.nota + ")</span>" : "") + " &nbsp;\xB7&nbsp; <b>INAIL</b> " + pctAliq(scelta.inail) + " &nbsp;\xB7&nbsp; <b>TFR</b> 7,41%";
    const minori = preset.vociLavoratore || [];
    const somma = minori.reduce((tot, v) => tot + v.aliquota, 0);
    $("aliquoteLavoratore").innerHTML = "<b>Quota a tuo carico</b> " + pctAliq(0.0919 + somma) + ' <span class="nota-riga">(9,19% di IVS' + (minori.length ? " + " + minori.map((v) => pctAliq(v.aliquota) + " di " + v.nome.split(" \u2014")[0]).join(" + ") : ", nessuna quota ripartita in questo inquadramento") + ")</span>";
  }
  var schedeAperte = /* @__PURE__ */ new Set();
  var sezioniChiuse = /* @__PURE__ */ new Set();
  document.addEventListener("click", (e) => {
    const info = e.target.closest(".info");
    if (info) {
      const chiave = info.dataset.info;
      if (schedeAperte.has(chiave)) schedeAperte.delete(chiave);
      else schedeAperte.add(chiave);
      applicaStato();
      return;
    }
    const sezione = e.target.closest(".toggle-sez");
    if (sezione) {
      const chiave = sezione.dataset.sez;
      if (sezioniChiuse.has(chiave)) sezioniChiuse.delete(chiave);
      else sezioniChiuse.add(chiave);
      applicaStato();
      return;
    }
    const tutte = e.target.closest(".azione-testa");
    if (tutte) {
      const chiavi = chiaviSezioni(tutte.dataset.tavola);
      const giaChiuse = chiavi.length > 0 && chiavi.every((k) => sezioniChiuse.has(k));
      chiavi.forEach((k) => giaChiuse ? sezioniChiuse.delete(k) : sezioniChiuse.add(k));
      applicaStato();
    }
  });
  function chiaviSezioni(idTavola) {
    return Array.from(document.querySelectorAll("#" + idTavola + " .toggle-sez")).map((b) => b.dataset.sez);
  }
  function applicaStato() {
    document.querySelectorAll(".info").forEach((b) => {
      b.setAttribute("aria-expanded", String(schedeAperte.has(b.dataset.info)));
    });
    document.querySelectorAll(".toggle-sez").forEach((b) => {
      b.setAttribute("aria-expanded", String(!sezioniChiuse.has(b.dataset.sez)));
    });
    document.querySelectorAll("tbody tr[data-sez]").forEach((tr) => {
      const chiusa = sezioniChiuse.has(tr.dataset.sez);
      tr.hidden = tr.classList.contains("scheda") ? chiusa || !schedeAperte.has(tr.dataset.scheda) : chiusa;
    });
    document.querySelectorAll("tr.scheda:not([data-sez])").forEach((tr) => {
      tr.hidden = !schedeAperte.has(tr.dataset.scheda);
    });
    document.querySelectorAll(".azione-testa").forEach((b) => {
      const chiavi = chiaviSezioni(b.dataset.tavola);
      const giaChiuse = chiavi.length > 0 && chiavi.every((k) => sezioniChiuse.has(k));
      b.textContent = giaChiuse ? "Espandi tutto" : "Comprimi tutto";
    });
  }
  function bottoneInfo(chiave) {
    if (!chiave || !SPIEGAZIONI[chiave]) return "";
    return '<button type="button" class="info" data-info="' + chiave + `" aria-expanded="false" aria-label="Che cos'\xE8 questa voce">?</button>`;
  }
  function rigaScheda(chiave, sezione) {
    const s = SPIEGAZIONI[chiave];
    if (!s) return "";
    return '<tr class="scheda" data-scheda="' + chiave + '"' + (sezione ? ' data-sez="' + sezione + '"' : "") + ' hidden><td colspan="2"><div class="scheda-box"><div class="t">' + s.titolo + "</div><p>" + s.testo + "</p>" + (s.norma ? '<p class="norma">' + s.norma + "</p>" : "") + "</div></td></tr>";
  }
  function chiaveSezione(idTavola, nome) {
    return idTavola + ":" + nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  function tabella(idTavola) {
    const righe = [];
    let corrente = null;
    const marca = () => corrente ? ' data-sez="' + corrente + '"' : "";
    return {
      sezione(nome, riepilogo, cls, apribile = true) {
        corrente = apribile ? chiaveSezione(idTavola, nome) : null;
        const testa = apribile ? '<button type="button" class="toggle-sez" data-sez="' + corrente + '" aria-expanded="true">' + nome + "</button>" : '<span class="nome-sez">' + nome + "</span>";
        righe.push('<tr class="sezione"><td>' + testa + '</td><td class="num ' + (cls || "") + '">' + (riepilogo || "") + "</td></tr>");
      },
      riga(nome, valore, cls, nota, info) {
        righe.push(
          "<tr" + marca() + "><td>" + bottoneInfo(info) + nome + (nota ? ' <span class="nota-riga">' + nota + "</span>" : "") + '</td><td class="num ' + (cls || "") + '">' + valore + "</td></tr>" + rigaScheda(info, corrente)
        );
      },
      totale(nome, valore, nota) {
        righe.push('<tr class="totale"' + marca() + "><td>" + nome + (nota ? ' <span class="nota-riga">' + nota + "</span>" : "") + '</td><td class="num">' + valore + "</td></tr>");
      },
      html() {
        return righe.join("");
      }
    };
  }
  $("form").addEventListener("submit", (e) => {
    e.preventDefault();
    calcolato = true;
    document.body.dataset.calcolato = "";
    aggiorna();
    const colonna = document.querySelector(".colonna-risultati");
    if (colonna && $("risultati").style.display !== "none") {
      colonna.classList.remove("risultati-updated");
      void colonna.offsetWidth;
      colonna.classList.add("risultati-updated");
      const impilato = window.matchMedia("(max-width: 1100px)").matches;
      if (impilato) {
        colonna.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else if ($("errore").style.display === "block") {
      $("ral").focus();
      $("errore").classList.remove("risultati-updated");
      void $("errore").offsetWidth;
      $("errore").classList.add("risultati-updated");
    }
  });
  $("ral").addEventListener("input", () => {
    formattaRal();
    if (calcolato) aggiorna();
  });
  $("ral").addEventListener("keydown", (e) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const passo = e.key === "ArrowUp" ? PASSO_RAL : -PASSO_RAL;
    scriviRal(Math.max(0, Math.round(valoreRal() / PASSO_RAL) * PASSO_RAL + passo));
    if (calcolato) aggiorna();
  });
  ["mensilita", "coniuge", "figli", "altri", "valutaPizze", "qualifica", "settore"].forEach((id) => {
    $(id).addEventListener("change", () => {
      if (calcolato) aggiorna();
    });
  });
  $("impatriati").addEventListener("change", () => {
    mostraImpatriati();
    if (calcolato) aggiorna();
  });
  ["comune", "regione", "comuneTipo", "regioneTipo"].forEach((id) => {
    $(id).addEventListener("change", () => {
      sincronizzaResidenza();
      if (calcolato) aggiorna();
    });
  });
  [
    "comuneAliquota",
    "comuneEsenzione",
    "regioneAliquota",
    "comuneS1",
    "comuneS2",
    "comuneS3",
    "comuneS4",
    "regioneS1",
    "regioneS2",
    "regioneS3",
    "regioneS4"
  ].forEach((id) => {
    $(id).addEventListener("input", () => {
      mostraAliquote();
      if (calcolato) aggiorna();
    });
  });
  $("preset").addEventListener("change", () => {
    sincronizzaDatore(true);
    if (calcolato) aggiorna();
  });
  ["inail", "datoreAliquota"].forEach((id) => {
    $(id).addEventListener("input", () => {
      mostraAliquoteDatore();
      if (calcolato) aggiorna();
    });
  });
  Object.keys(AGEVOLAZIONI_CAMPI).forEach((id) => {
    $(id).addEventListener("change", () => {
      sincronizzaAgevolazioni(id);
      if (calcolato) aggiorna();
    });
  });
  sincronizzaResidenza();
  sincronizzaDatore(false);
  sincronizzaAgevolazioni();
  mostraImpatriati();
  adattaPannello();
  function aggiorna() {
    const ral = valoreRal();
    const mensilita = Number($("mensilita").value);
    if (!ral || ral < 1e3 || ral > 9999999999) {
      $("errore").style.display = "block";
      $("risultati").style.display = "none";
      $("attesa").hidden = false;
      return;
    }
    $("errore").style.display = "none";
    const scelta = datoreScelto();
    const opzioni = Object.assign({
      coniuge: $("coniuge").checked,
      figli: Number($("figli").value),
      altriFamiliari: Number($("altri").value),
      impatriati: impatriatiScelto(),
      preset: scelta.preset
      // conMassimale resta al default: iscritto INPS dal 1996 in poi.
    }, residenzaScelta());
    const r = calcolaNetto(ral, mensilita, opzioni);
    const imp = confrontoImpatriati(r, opzioni);
    const a = calcolaCostoAzienda(ral, scelta);
    intestazione(r, mensilita);
    guadagnoImpatriati(r, imp, mensilita);
    confronto(r);
    barra(r);
    dettaglio(r, mensilita);
    intestazioneAzienda(a, r);
    scontoAzienda(a);
    barraAzienda(a, r);
    dettaglioAzienda(a, r);
    applicaStato();
    $("attesa").hidden = true;
    $("risultati").style.display = "block";
  }
  function pizzeAttive() {
    const pizze = $("valutaPizze").checked;
    $("etEuro").classList.toggle("attiva", !pizze);
    $("etPizze").classList.toggle("attiva", pizze);
    return pizze;
  }
  function intestazione(r, mensilita) {
    const pizze = pizzeAttive();
    $("outMese").textContent = pizze ? inPizze(r.nettoMese) : eur2.format(r.nettoMese);
    $("outMensilita").textContent = pizze ? "su " + mensilita + " mensilit\xE0, a " + PREZZO_PIZZA + " \u20AC l'una" : "su " + mensilita + " mensilit\xE0";
    $("outAnno").textContent = pizze ? inPizze(r.nettoAnnuo) : eur2.format(r.nettoAnnuo);
    $("outIncidenza").textContent = "trattenute totali: " + pct(r.incidenzaTrattenute * 100) + " della RAL, imposte e contributi";
    const imposte = r.irpefNetta + r.addizionaleRegionale + r.addizionaleComunale;
    $("outAliquota").textContent = pct(imposte / r.ral * 100);
  }
  function guadagnoImpatriati(r, imp, mensilita) {
    if (!imp) {
      $("bloccoImpatriati").hidden = true;
      return;
    }
    $("bloccoImpatriati").hidden = false;
    $("impatriatiNome").textContent = r.impatriati.regime.nome;
    $("impatriatiConfronto").innerHTML = 'Netto annuo <span class="barrato">' + eur0.format(imp.nettoSenza) + "</span> <b>" + eur0.format(imp.nettoCon) + "</b>";
    if (imp.guadagnoAnnuo <= 0.5) {
      $("bloccoImpatriati").classList.add("in-perdita");
      $("impatriatiCifra").textContent = imp.guadagnoAnnuo < -0.5 ? "\u2212 " + eur0.format(-imp.guadagnoAnnuo) : eur0.format(0);
      $("impatriatiNota").innerHTML = imp.guadagnoAnnuo < -0.5 ? "A questa RAL il regime <b>riduce lo stipendio netto</b> anzich\xE9 aumentarlo. Abbattendo l'imponibile fiscale, l'IRPEF lorda diventa troppo bassa per coprire la detrazione da lavoro: si perde cos\xEC il <b>Trattamento Integrativo di 1.200 \u20AC/anno</b> (ex Bonus Renzi), il cui valore supera il piccolo risparmio IRPEF ottenuto. Poich\xE9 l'agevolazione \xE8 facoltativa, <b>in questa fascia conviene non applicarla</b>." : "A questa RAL il regime <b>non produce alcun beneficio sul netto</b>: le detrazioni da lavoro dipendente azzerano gi\xE0 l'IRPEF dovuta, quindi l'abbattimento dell'imponibile non genera un risparmio fiscale effettivo.";
      return;
    }
    $("bloccoImpatriati").classList.remove("in-perdita");
    $("impatriatiCifra").textContent = "+ " + eur0.format(imp.guadagnoAnnuo);
    $("impatriatiNota").innerHTML = "<b>+" + eur2.format(imp.guadagnoMese) + " al mese</b> su " + mensilita + " mensilit\xE0. Imposte da " + eur0.format(imp.imposteSenza) + " a " + eur0.format(imp.imposteCon) + ", mentre i contributi INPS restano gli stessi. Il regime dura <b>" + IMPATRIATI_2026.anni + " periodi d'imposta</b>: a RAL invariata vale " + eur0.format(imp.guadagnoDurata) + " in tutto. Per l'azienda non cambia nulla, il costo del lavoro resta quello di prima.";
  }
  function confronto(r) {
    const scelte = [
      confrontaConMedia(r.ral, MEDIE_RETRIBUTIVE.qualifiche[$("qualifica").value]),
      confrontaConMedia(r.ral, MEDIE_RETRIBUTIVE.settori[$("settore").value])
    ].filter(Boolean);
    if (!scelte.length) {
      $("confronto").innerHTML = "";
      $("bloccoConfronto").hidden = true;
      return;
    }
    $("bloccoConfronto").hidden = false;
    const blocchi = scelte.map((c) => {
      const m = c.media;
      const massimo = Math.max(r.ral, m.ral);
      const barra2 = (etichetta, valore, tua) => '<div class="barra-confronto' + (tua ? " tua" : "") + '"><span>' + etichetta + '</span><span class="traccia"><span class="riempi" style="width:' + (valore / massimo * 100).toFixed(1) + '%"></span></span><b>' + eur0.format(valore) + "</b></div>";
      return '<div class="confronto"><p class="titolo">La tua RAL \xE8 <span class="scarto ' + (c.sopra ? "sopra" : "sotto") + '">' + pct(Math.abs(c.scartoPercentuale) * 100) + " " + (c.sopra ? "sopra" : "sotto") + "</span> la media " + m.frase + '.</p><div class="barre-confronto">' + barra2("la tua RAL", r.ral, true) + barra2("la media", m.ral, false) + '</div><p class="fonte">Media ' + (m.stimato ? "indicativa, " : "") + eur0.format(m.ral) + " \u2014 " + m.fonte + ", dati " + m.anno + ". \xC8 una media su tutte le anzianit\xE0 e tutta Italia: da sola non dice se il tuo stipendio \xE8 giusto, dice solo dove cade rispetto agli altri." + (m.stimato ? " Questo valore la fonte lo pubblica arrotondato, quindi il confronto \xE8 approssimativo." : "") + "</p></div>";
    });
    $("confronto").innerHTML = blocchi.join("");
  }
  function barra(r) {
    const somme = r.bonusCuneo + r.trattamentoIntegrativo;
    const voci = [
      { nome: "Netto in busta", valore: r.nettoAnnuo - somme, colore: "#0a7a3d" },
      { nome: "Contributi INPS", valore: r.contributiInps, colore: "#cc1f12" },
      { nome: "IRPEF netta", valore: r.irpefNetta, colore: "#e0584a" },
      {
        nome: "Addizionali locali",
        valore: r.addizionaleRegionale + r.addizionaleComunale,
        colore: "#f2b0a8"
      }
    ].filter((v) => v.valore > 5e-3);
    $("barra").innerHTML = voci.map(
      (v) => '<span style="width:' + v.valore / r.ral * 100 + "%;background:" + v.colore + '" title="' + v.nome + '"></span>'
    ).join("");
    $("legenda").innerHTML = voci.map(
      (v) => '<div><i class="swatch" style="background:' + v.colore + '"></i>' + v.nome + " <b>" + eur2.format(v.valore) + '</b> <span class="q">(' + pct(v.valore / r.ral * 100) + ")</span></div>"
    ).join("") + (somme > 0 ? '<div><i class="swatch" style="background:#4fa877"></i>Somme aggiuntive fuori dalla RAL <b>+' + eur2.format(somme) + "</b></div>" : "");
  }
  function dettaglio(r, mensilita) {
    const t = tabella("dettaglio");
    const addizionali = r.addizionaleRegionale + r.addizionaleComunale;
    const aggiuntive = r.bonusCuneo + r.trattamentoIntegrativo;
    t.sezione("Dal lordo all'imponibile", eur2.format(r.imponibileIrpef));
    t.riga("Retribuzione annua lorda", eur2.format(r.ral), "", "", "ral");
    if (r.massimaleApplicato) {
      t.riga(
        "Base contributiva",
        eur2.format(r.baseContributiva),
        "",
        "(massimale 122.295 \u20AC: sopra non si versa pi\xF9 IVS)",
        "baseContributiva"
      );
    }
    t.riga(
      "Contributi IVS a carico dipendente (9,19%)",
      "\u2212 " + eur2.format(r.contributiIvs),
      "neg",
      "",
      "ivs"
    );
    if (r.contributiAggiuntivo > 0) {
      t.riga(
        "Contributo aggiuntivo 1%",
        "\u2212 " + eur2.format(r.contributiAggiuntivo),
        "neg",
        "(sulla parte oltre 56.224 \u20AC)",
        "aggiuntivo1"
      );
    }
    (r.contributiMinori || []).forEach((v) => {
      t.riga(
        v.nome,
        "\u2212 " + eur2.format(v.importo),
        "neg",
        "(" + pctAliq(v.aliquota) + " della RAL)",
        v.info
      );
    });
    t.riga("Imponibile fiscale", eur2.format(r.imponibile), "", "", "imponibile");
    if (r.impatriati) {
      const imp = r.impatriati;
      let nota = "(" + pctAliq(imp.quotaEsente) + " non concorre a formare il reddito)";
      if (imp.tettoApplicato) {
        nota = "(" + pctAliq(imp.quotaEsente) + " dei primi " + num0.format(IMPATRIATI_2026.tettoReddito) + " \u20AC: la parte oltre il tetto resta tassata)";
      }
      t.riga(
        "Quota esente regime impatriati",
        "\u2212 " + eur2.format(r.esenzioneImpatriati),
        "pos",
        nota,
        "impatriati"
      );
      t.riga(
        "Imponibile IRPEF agevolato",
        eur2.format(r.imponibileIrpef),
        "",
        "(\xE8 questo il reddito su cui si calcolano imposta, detrazioni e addizionali)",
        "imponibileIrpef"
      );
    }
    t.sezione("IRPEF", "\u2212 " + eur2.format(r.irpefNetta), "neg");
    t.riga("IRPEF lorda (scaglioni 23 / 33 / 43%)", eur2.format(r.irpefLorda), "", "", "irpefLorda");
    t.riga("Detrazione lavoro dipendente", "\u2212 " + eur2.format(r.detrazioneLavoro), "pos", "", "detrLavoro");
    if (r.detrazioneCuneo > 0) {
      t.riga("Detrazione taglio cuneo fiscale", "\u2212 " + eur2.format(r.detrazioneCuneo), "pos", "", "detrCuneo");
    }
    if (r.detrazioneConiuge > 0) {
      t.riga("Detrazione coniuge a carico", "\u2212 " + eur2.format(r.detrazioneConiuge), "pos", "", "detrConiuge");
    }
    if (r.detrazioneFigli > 0) {
      t.riga(
        "Detrazione figli a carico",
        "\u2212 " + eur2.format(r.detrazioneFigli),
        "pos",
        "(21-30 anni)",
        "detrFigli"
      );
    }
    if (r.detrazioneAltriFamiliari > 0) {
      t.riga(
        "Detrazione ascendenti conviventi",
        "\u2212 " + eur2.format(r.detrazioneAltriFamiliari),
        "pos",
        "",
        "detrAltri"
      );
    }
    const teoriche = r.detrazioneLavoro + r.detrazioneCuneo + r.detrazioneFamiliari;
    if (teoriche - r.detrazioniApplicate > 5e-3) {
      t.riga(
        "Detrazioni perse per incapienza",
        eur2.format(teoriche - r.detrazioniApplicate),
        "",
        "(l'IRPEF non scende sotto zero)",
        "incapienza"
      );
    }
    t.riga("IRPEF netta", "\u2212 " + eur2.format(r.irpefNetta), "neg", "", "irpefNetta");
    t.sezione(
      "Addizionali locali",
      addizionali > 0 ? "\u2212 " + eur2.format(addizionali) : eur2.format(0),
      addizionali > 0 ? "neg" : ""
    );
    t.riga(
      "Addizionale regionale " + r.regione.nome,
      "\u2212 " + eur2.format(r.addizionaleRegionale),
      "neg",
      "(" + descriviEnte(r.regione) + ")",
      "addRegionale"
    );
    const soglia = r.comune.esenzioneFino || 0;
    let notaComunale = "(" + descriviEnte(r.comune) + ")";
    if (soglia > 0 && r.imponibileIrpef <= soglia) {
      notaComunale += " \u2014 esente fino a " + num0.format(soglia) + " \u20AC di imponibile";
    } else if (soglia > 0 && r.imponibileIrpef > soglia && r.imponibileIrpef < soglia * 1.02) {
      notaComunale += " \u2014 soglia appena superata: sotto " + num0.format(soglia) + " \u20AC si paga zero, non si paga sull'eccedenza";
    }
    t.riga(
      "Addizionale comunale " + r.comune.nome,
      r.addizionaleComunale > 0 ? "\u2212 " + eur2.format(r.addizionaleComunale) : eur2.format(0),
      r.addizionaleComunale > 0 ? "neg" : "",
      notaComunale,
      "addComunale"
    );
    if (aggiuntive > 0) {
      t.sezione("Somme aggiuntive", "+ " + eur2.format(aggiuntive), "pos");
      if (r.bonusCuneo > 0) {
        t.riga("Bonus taglio cuneo (esentasse)", "+ " + eur2.format(r.bonusCuneo), "pos", "", "bonusCuneo");
      }
      if (r.trattamentoIntegrativo > 0) {
        t.riga(
          "Trattamento integrativo",
          "+ " + eur2.format(r.trattamentoIntegrativo),
          "pos",
          "",
          "trattamentoIntegrativo"
        );
      }
    }
    t.sezione("Risultato", "", "", false);
    t.riga("Totale trattenute", "\u2212 " + eur2.format(r.totaleTrattenute), "neg", "", "totaleTrattenute");
    if (aggiuntive > 0) {
      t.riga(
        "Somme aggiuntive",
        "+ " + eur2.format(aggiuntive),
        "pos",
        "(bonus cuneo e trattamento integrativo, dettagliati sopra)",
        "sommeAggiuntive"
      );
    }
    const nettoSopraLordo = r.nettoAnnuo > r.ral;
    t.totale(
      "Netto annuo",
      eur2.format(r.nettoAnnuo),
      nettoSopraLordo ? "(pi\xF9 alto della RAL: le somme aggiuntive superano le trattenute)" : ""
    );
    t.totale("Netto mensile (" + mensilita + " mensilit\xE0)", eur2.format(r.nettoMese));
    $("dettaglio").innerHTML = t.html();
  }
  function nettoFinanziatoDallAzienda(r) {
    return r.nettoAnnuo - r.bonusCuneo - r.trattamentoIntegrativo;
  }
  function intestazioneAzienda(a, r) {
    const pizze = pizzeAttive();
    $("outCosto").textContent = pizze ? inPizze(a.costoTotale) : eur2.format(a.costoTotale);
    $("outCostoMese").textContent = pizze ? inPizze(a.costoMensile) + " al mese, a " + PREZZO_PIZZA + " \u20AC l'una" : eur2.format(a.costoMensile) + " al mese, su 12 mesi";
    $("outRicarico").textContent = "+" + pct((a.moltiplicatore - 1) * 100);
    $("outMoltiplicatore").textContent = "ogni euro di RAL ne costa " + a.moltiplicatore.toFixed(2).replace(".", ",");
    const quota = nettoFinanziatoDallAzienda(r) / a.costoTotale;
    $("outQuotaNetto").textContent = eur0.format(quota * 100);
  }
  function scontoAzienda(a) {
    if (!a.agevolazione) {
      $("bloccoSconto").hidden = true;
      return;
    }
    $("bloccoSconto").hidden = false;
    const ag = a.agevolazione.agevolazione;
    $("scontoNome").textContent = ag.nome;
    $("scontoCifra").textContent = "\u2212 " + eur0.format(a.sconto);
    $("scontoConfronto").innerHTML = 'Costo annuo <span class="barrato">' + eur0.format(a.costoPieno) + "</span> <b>" + eur0.format(a.costoTotale) + "</b>";
    const durata = "La misura dura <b>" + ag.mesi + " mesi</b> e vale " + eur0.format(a.agevolazione.totaleDurata) + " in tutto.";
    if (!a.agevolazioniScartate.length) {
      $("scontoCriterio").innerHTML = durata;
      return;
    }
    const meglioSullaDurata = a.agevolazioniScartate.filter((s) => s.totaleDurata > a.agevolazione.totaleDurata);
    $("scontoCriterio").innerHTML = "Le misure non si cumulano: \xE8 applicata <b>quella che fa risparmiare di pi\xF9 nell'anno</b>. " + durata + (meglioSullaDurata.length ? " Su tutta la durata converrebbe invece " + meglioSullaDurata.map(
      (s) => s.agevolazione.breve + " (" + eur0.format(s.totale) + " l'anno, ma " + eur0.format(s.totaleDurata) + " su " + s.agevolazione.mesi + " mesi)"
    ).join(", ") + "." : "");
  }
  function barraAzienda(a, r) {
    const netto = nettoFinanziatoDallAzienda(r);
    const voci = [
      { nome: "Netto in busta al dipendente", valore: netto, colore: "#0a7a3d" },
      { nome: "Contributi a carico dipendente", valore: r.contributiInps, colore: "#e0584a" },
      {
        nome: "IRPEF e addizionali",
        valore: r.irpefNetta + r.addizionaleRegionale + r.addizionaleComunale,
        colore: "#f2b0a8"
      },
      // Al netto dell'agevolazione: la barra somma a quello che l'azienda
      // spende davvero, non a quello che spenderebbe senza sconto.
      {
        nome: "Contributi a carico azienda" + (a.sconto > 5e-3 ? ", agevolazione dedotta" : ""),
        valore: a.contributiDatoreNetti,
        colore: "#cc1f12"
      },
      { nome: "INAIL", valore: a.inailNetto, colore: "#8f1409" },
      { nome: "TFR, retribuzione differita", valore: a.tfrTotale, colore: "#b31d12" }
    ].filter((v) => v.valore > 5e-3);
    $("barraAzienda").innerHTML = voci.map(
      (v) => '<span style="width:' + v.valore / a.costoTotale * 100 + "%;background:" + v.colore + '" title="' + v.nome + '"></span>'
    ).join("");
    $("legendaAzienda").innerHTML = voci.map(
      (v) => '<div><i class="swatch" style="background:' + v.colore + '"></i>' + v.nome + " <b>" + eur2.format(v.valore) + '</b> <span class="q">(' + pct(v.valore / a.costoTotale * 100) + ")</span></div>"
    ).join("");
  }
  function dettaglioAzienda(a, r) {
    const t = tabella("dettaglioAzienda");
    t.sezione("Retribuzione", eur2.format(a.ral));
    t.riga("Retribuzione annua lorda", eur2.format(a.ral), "", "", "ral");
    t.sezione(
      "Contributi a carico dell'azienda",
      "+ " + eur2.format(a.contributiDatore),
      "neg"
    );
    a.voci.forEach((v) => {
      t.riga(
        v.nome,
        "+ " + eur2.format(v.importo),
        "neg",
        "(" + pctAliq(v.aliquota) + ")",
        v.info
      );
    });
    if (a.massimaleApplicato) {
      t.riga(
        "Massimale contributivo",
        eur2.format(PARAMETRI_2026.massimale),
        "",
        "(la quota IVS si ferma qui, le altre voci no)",
        "baseContributiva"
      );
    }
    t.riga(
      "Totale contributi",
      "+ " + eur2.format(a.contributiDatore),
      "neg",
      "(" + pctAliq(a.aliquotaDatore) + " della RAL)"
    );
    t.sezione("Assicurazione obbligatoria", "+ " + eur2.format(a.inail), "neg");
    t.riga(
      "Premio INAIL",
      "+ " + eur2.format(a.inail),
      "neg",
      "(" + pctAliq(a.tassoInail) + ")",
      "inail"
    );
    if (a.agevolazione) {
      const ag = a.agevolazione.agevolazione;
      t.sezione("Agevolazione contributiva", "\u2212 " + eur0.format(a.sconto), "pos");
      t.riga(
        ag.nome,
        "",
        "",
        "(" + pctAliq(ag.sconto) + (ag.tettoAnnuo ? ", max " + eur0.format(ag.tettoAnnuo) + " l'anno" : "") + ", " + ag.mesi + " mesi, vale " + eur0.format(a.agevolazione.totaleDurata) + " sull'intera durata)",
        "agevolazioni"
      );
      t.riga(
        "Sconto sui contributi INPS",
        "\u2212 " + eur0.format(a.scontoContributi),
        "pos",
        a.agevolazione.tettoRaggiunto ? "(limitato dal tetto annuo)" : ""
      );
      t.riga(
        "Sconto sul premio INAIL",
        a.scontoInail > 5e-3 ? "\u2212 " + eur0.format(a.scontoInail) : eur0.format(0),
        a.scontoInail > 5e-3 ? "pos" : "",
        ag.inail ? "" : "(questa misura non riduce l'INAIL)"
      );
      a.agevolazioniScartate.forEach((s) => {
        t.riga(
          "Scartata: " + s.agevolazione.breve,
          eur0.format(s.totale),
          "",
          "(" + eur0.format(s.totaleDurata) + " su " + s.agevolazione.mesi + " mesi: non si cumulano, vale quella che sconta di pi\xF9 sull'anno)"
        );
      });
    }
    t.sezione("Retribuzione differita", "+ " + eur2.format(a.tfrTotale), "neg");
    t.riga(
      "Quota di TFR maturata nell'anno",
      "+ " + eur2.format(a.tfrTotale),
      "neg",
      "(RAL / 13,5)",
      "tfr"
    );
    t.riga("di cui accantonato per il lavoratore", eur2.format(a.tfrAccantonato), "", "(6,91%)");
    t.riga("di cui versato all'INPS", eur2.format(a.tfrAlFondoPensioni), "", "(0,50%)");
    t.sezione("Risultato", "", "", false);
    if (a.sconto > 5e-3) {
      t.riga(
        "Costo senza agevolazione",
        eur2.format(a.costoPieno),
        "",
        "(ogni euro di RAL ne costerebbe " + a.moltiplicatorePieno.toFixed(2).replace(".", ",") + ")"
      );
    }
    t.riga("Costo totale annuo", eur2.format(a.costoTotale), "", "", "costoTotale");
    t.totale("Costo mensile su 12 mesi", eur2.format(a.costoMensile));
    const netto = nettoFinanziatoDallAzienda(r);
    t.riga(
      "Netto in busta pagato dall'azienda",
      eur2.format(netto),
      "pos",
      "(" + pct(netto / a.costoTotale * 100) + " del costo)"
    );
    const somme = r.bonusCuneo + r.trattamentoIntegrativo;
    if (somme > 5e-3) {
      t.riga(
        "Somme aggiunte dallo Stato in busta",
        "+ " + eur2.format(somme),
        "pos",
        "(fuori dal costo aziendale: il dipendente incassa " + eur2.format(r.nettoAnnuo) + ")"
      );
    }
    const baseCuneo = a.costoTotale - a.tfrTotale;
    t.riga(
      "Cuneo fiscale e contributivo",
      eur2.format(baseCuneo - netto),
      "neg",
      "(" + pct((baseCuneo - netto) / baseCuneo * 100) + " del costo, TFR escluso da entrambi i lati)",
      "cuneo"
    );
    $("dettaglioAzienda").innerHTML = t.html();
  }
})();
