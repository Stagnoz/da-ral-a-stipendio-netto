/*
 * Test del motore di calcolo: `node test.js`.
 *
 * Due livelli:
 *  1. casi calcolati a mano, passaggio per passaggio, con tolleranza 1 euro
 *  2. invarianti su tutto il range 5.000 - 120.000
 */

import {
  calcolaNetto,
  detrazioneLavoroDipendente,
  bonusCuneo,
  detrazioneCuneo,
  rapportoTroncato,
  contributiDipendente,
  detrazioneConiuge,
  detrazioneFigli,
  detrazioneAltriFamiliari,
  calcolaCostoAzienda,
  aliquotaDatore,
  confrontaConMedia,
  PRESET_DATORE,
  AGEVOLAZIONI_2026,
  MEDIE_RETRIBUTIVE,
  COMUNI,
  REGIONI,
} from './calc/index.js';
import { SPIEGAZIONI } from './spiegazioni.js';

let falliti = 0;

// I casi calcolati a mano isolano l'aliquota base del lavoratore, il
// 9,19% di IVS: l'inquadramento senza quote ripartite e' l'industria
// fino a 15 dipendenti, dove non ci sono ne' CIGS ne' FIS. Le quote
// ripartite hanno un blocco tutto loro piu' sotto, e le due quadrature
// col lato azienda restano sul preset di default, che dev'essere lo
// stesso per i due lati.
const nettoBase = (ral, mensilita, opzioni) =>
  calcolaNetto(ral, mensilita, Object.assign({ preset: 'industriaPiccola' }, opzioni));

// Specularmente, i conti del lato azienda scritti a mano sono quelli del
// terziario: il preset va nominato, perche' il default della pagina e'
// diventato l'industria fino a 15 dipendenti.
const costoTerz = (ral, opzioni) =>
  calcolaCostoAzienda(ral, Object.assign({ preset: 'terziario' }, opzioni));

function vicino(nome, atteso, ottenuto, tolleranza = 1) {
  const ok = Math.abs(atteso - ottenuto) <= tolleranza;
  if (!ok) {
    falliti++;
    console.log(`  FAIL ${nome}: atteso ${atteso.toFixed(2)}, ottenuto ${ottenuto.toFixed(2)}`);
  } else {
    console.log(`  ok   ${nome}: ${ottenuto.toFixed(2)}`);
  }
}

function verifica(nome, condizione, dettaglio) {
  if (!condizione) {
    falliti++;
    console.log(`  FAIL ${nome}${dettaglio ? ' — ' + dettaglio : ''}`);
  }
}

// ---------------------------------------------------------------
// Caso 1: RAL 30.000, 13 mensilita' (dentro il range della JD)
// ---------------------------------------------------------------
console.log('\nRAL 30.000, 13 mensilita');
{
  const r = nettoBase(30000, 13);
  // INPS: 30.000 x 9,19% = 2.757
  vicino('contributi INPS', 2757, r.contributiInps);
  // Imponibile: 27.243
  vicino('imponibile', 27243, r.imponibile);
  // IRPEF lorda: 27.243 x 23% = 6.265,89 (tutto nel primo scaglione)
  vicino('IRPEF lorda', 6265.89, r.irpefLorda);
  // Detrazione: rapporto (28.000-27.243)/13.000 = 0,058230... che il
  // comma 6 tronca a 0,0582. Quindi 1.910 + 1.190 x 0,0582 = 1.979,258
  // + 65 (fascia 25-35k) = 2.044,258
  vicino('detrazione lavoro', 2044.258, r.detrazioneLavoro, 0.0005);
  // Cuneo: fascia 20-32k -> detrazione 1.000
  vicino('detrazione cuneo', 1000, r.detrazioneCuneo);
  // IRPEF netta: 6.265,89 - 2.044,258 - 1.000 = 3.221,63
  vicino('IRPEF netta', 3221.63, r.irpefNetta);
  // Regionale: 15.000 x 1,23% + 12.243 x 1,58% = 184,50 + 193,44 = 377,94
  vicino('addizionale regionale', 377.94, r.addizionaleRegionale);
  // Comunale: 27.243 > 23.000 -> 27.243 x 0,8% = 217,94
  vicino('addizionale comunale', 217.94, r.addizionaleComunale);
  // Netto: 30.000 - 2.757 - 3.221,63 - 377,94 - 217,94 = 23.425,48
  vicino('netto annuo', 23425.48, r.nettoAnnuo);
  vicino('netto mese', 23425.48 / 13, r.nettoMese);
}

// ---------------------------------------------------------------
// Caso 2: RAL 60.000, 14 mensilita' (attraversa tutti gli scaglioni)
// ---------------------------------------------------------------
console.log('\nRAL 60.000, 14 mensilita');
{
  const r = nettoBase(60000, 14);
  // INPS: 5.514 di IVS piu' l'1% sulla parte oltre 56.224, cioe'
  // 3.776 x 1% = 37,76. Totale 5.551,76 -> imponibile 54.448,24
  vicino('contributo aggiuntivo 1%', 37.76, r.contributiAggiuntivo, 0.01);
  vicino('imponibile', 54448.24, r.imponibile, 0.01);
  // IRPEF lorda: 28.000x23% + 22.000x33% + 4.448,24x43%
  //            = 6.440 + 7.260 + 1.912,74 = 15.612,74
  vicino('IRPEF lorda', 15612.74, r.irpefLorda);
  // Reddito oltre 50k: nessuna detrazione lavoro, nessun cuneo
  vicino('detrazione lavoro', 0, r.detrazioneLavoro);
  vicino('detrazione cuneo', 0, r.detrazioneCuneo);
  // Regionale: 184,50 + 205,40 + 378,40 + 4.486x1,73% = 845,91
  vicino('addizionale regionale', 845.91, r.addizionaleRegionale);
  // Comunale: 54.486 x 0,8% = 435,89
  vicino('addizionale comunale', 435.89, r.addizionaleComunale);
}

// ---------------------------------------------------------------
// Caso 3: RAL 12.000 (no tax area, bonus cuneo)
// ---------------------------------------------------------------
console.log('\nRAL 12.000, 13 mensilita');
{
  const r = nettoBase(12000, 13);
  // Imponibile: 12.000 - 1.102,80 = 10.897,20
  vicino('imponibile', 10897.2, r.imponibile);
  // IRPEF lorda 2.506,36 > detrazione 1.955 -> IRPEF netta 551,36...
  // ma il trattamento integrativo spetta (reddito <= 15k, capienza ok)
  vicino('trattamento integrativo', 1200, r.trattamentoIntegrativo);
  // Bonus cuneo: fascia 8.500-15.000 -> 10.897,20 x 5,3% = 577,55
  vicino('bonus cuneo', 577.55, r.bonusCuneo);
  // Le addizionali sono dovute (IRPEF netta > 0), Milano esente (< 23k)
  vicino('addizionale comunale', 0, r.addizionaleComunale);
}

// ---------------------------------------------------------------
// Invarianti su tutto il range
// ---------------------------------------------------------------
console.log('\nInvarianti 5.000 - 120.000 (passo 500)');
{
  for (let ral = 5000; ral <= 120000; ral += 500) {
    const r = nettoBase(ral, 13);
    verifica(`IRPEF non negativa a RAL ${ral}`, r.irpefNetta >= 0);
    verifica(`netto positivo a RAL ${ral}`, r.nettoAnnuo > 0);
    // Il netto puo' superare la RAL a redditi bassi: trattamento
    // integrativo e bonus cuneo sono trasferimenti, non sconti su
    // trattenute. L'invariante vero e': senza quelle somme, netto < RAL.
    verifica(
      `netto (senza somme aggiuntive) < RAL a RAL ${ral}`,
      r.nettoAnnuo - r.bonusCuneo - r.trattamentoIntegrativo < ral
    );
    verifica(
      `quadratura a RAL ${ral}`,
      Math.abs(
        r.ral - r.contributiInps - r.irpefNetta - r.addizionaleRegionale -
        r.addizionaleComunale + r.bonusCuneo + r.trattamentoIntegrativo -
        r.nettoAnnuo
      ) < 0.01
    );
  }
}

// ---------------------------------------------------------------
// Le tre soglie secche.
//
// Il netto NON e' monotono: ci sono tre punti in cui un euro di RAL in
// piu' fa scendere il netto. Sono tutti e tre nella norma, non nel
// codice, e vanno cercati con passo di un euro: a passo 500 spariscono
// e il prototipo sembra piu' liscio di quanto sia.
// Il test li fissa. Se ne compare una quarta, o se una di queste si
// sposta, e' cambiato qualcosa nel motore.
// ---------------------------------------------------------------
console.log('\nSoglie secche (scansione a passo 1 euro)');
{
  const attese = [
    { ral: 16519, salto: 129.39,
      causa: 'imponibile oltre 15.000: finiscono trattamento integrativo e bonus cuneo pieno' },
    { ral: 25328, salto: 183.44,
      causa: 'imponibile oltre 23.000: scatta l\'addizionale comunale di Milano su tutto' },
    { ral: 38543, salto: 64.72,
      causa: 'imponibile oltre 35.000: sparisce la maggiorazione di 65 € (art. 13 c. 1.1)' },
  ];

  const trovate = [];
  let prec = null;
  for (let ral = 5000; ral <= 130000; ral += 1) {
    const netto = nettoBase(ral, 12).nettoAnnuo;
    if (prec !== null && netto < prec - 0.005) {
      trovate.push({ ral, salto: prec - netto });
    }
    prec = netto;
  }

  verifica(`esattamente ${attese.length} soglie secche`,
    trovate.length === attese.length,
    `trovate ${trovate.length}: ${trovate.map((t) => t.ral).join(', ')}`);

  attese.forEach((a, i) => {
    const t = trovate[i];
    if (!t) { falliti++; console.log(`  FAIL soglia mancante a RAL ${a.ral}`); return; }
    vicino(`soglia a RAL ${a.ral}`, a.ral, t.ral, 0);
    vicino(`  salto di netto`, a.salto, t.salto, 0.01);
    console.log(`       ${a.causa}`);
  });
}

// Continuita' delle detrazioni intorno alle soglie
console.log('\nRaccordi alle soglie');
vicino('detrazione a 15.000 (da sotto)', 1955, detrazioneLavoroDipendente(15000));
vicino('detrazione a 15.001 (da sopra)', 1910 + 1190 * (12999 / 13000), detrazioneLavoroDipendente(15001), 2);
vicino('detrazione a 28.000', 1910 + 65, detrazioneLavoroDipendente(28000), 1);
vicino('cuneo a 32.000', 1000, detrazioneCuneo(32000));
vicino('cuneo a 40.000', 0, detrazioneCuneo(40000));
vicino('bonus a 20.000', 960, bonusCuneo(20000));

// ---------------------------------------------------------------
// Art. 13 c. 6: il rapporto del decalage si assume nelle prime
// quattro cifre decimali. Tolleranza stretta: e' il punto del test.
// ---------------------------------------------------------------
console.log('\nTroncamento del rapporto (art. 13 c. 6)');
vicino('rapporto 0,41525 -> 0,4152', 0.4152,
  rapportoTroncato(50000 - 40864.5, 22000), 1e-9);
vicino('rapporto negativo -> 0', 0,
  rapportoTroncato(50000 - 55000, 22000), 1e-9);
// RAL 45.000: imponibile 40.864,50, rapporto 0,41525 -> 0,4152
// 1.910 x 0,4152 = 793,032 (senza troncamento sarebbe 793,1275)
vicino('detrazione a 40.864,50', 793.032,
  detrazioneLavoroDipendente(40864.5), 0.0005);

// ---------------------------------------------------------------
// Soglie contributive: prima fascia 56.224 e massimale 122.295
// ---------------------------------------------------------------
console.log('\nSoglie contributive 2026');
{
  // Sotto la prima fascia il conto e' il 9,19% liscio
  vicino('30.000, nessuna soglia toccata', 2757, contributiDipendente(30000, true).totale, 0.01);
  vicino('56.224, esattamente sulla soglia', 0,
    contributiDipendente(56224, true).aggiuntivo, 0.01);
  // Sopra la prima fascia: 1% sulla sola eccedenza
  vicino('100.000, contributo aggiuntivo', 437.76,
    contributiDipendente(100000, true).aggiuntivo, 0.01);

  // Massimale: sopra 122.295 i contributi si congelano
  const a = contributiDipendente(122295, true);
  const b = contributiDipendente(300000, true);
  vicino('contributi congelati al massimale', a.totale, b.totale, 0.01);
  verifica('il massimale risulta applicato a 300.000', b.massimaleApplicato);
  verifica('il massimale non risulta applicato a 100.000',
    !contributiDipendente(100000, true).massimaleApplicato);

  // Chi e' iscritto prima del 1996 non ha tetto: paga su tutta la RAL
  const pre = contributiDipendente(300000, false);
  vicino('senza massimale a 300.000', 30007.76, pre.totale, 0.01);
  verifica('senza massimale si paga di piu', pre.totale > b.totale);

  // Il massimale fa salire il netto: meno contributi, piu' imponibile,
  // ma l'aliquota marginale IRPEF e' 43%, quindi il saldo resta positivo
  const conM = nettoBase(300000, 12);
  const senzaM = nettoBase(300000, 12, { conMassimale: false });
  verifica('col massimale il netto e piu alto', conM.nettoAnnuo > senzaM.nettoAnnuo,
    `${senzaM.nettoAnnuo.toFixed(2)} -> ${conM.nettoAnnuo.toFixed(2)}`);

  // Sotto le soglie i due regimi coincidono
  vicino('a 30.000 i due regimi coincidono', nettoBase(30000, 13).nettoAnnuo,
    nettoBase(30000, 13, { conMassimale: false }).nettoAnnuo, 0.01);
}

// ---------------------------------------------------------------
// Quote ripartite: CIGS e FIS non le paga solo l'azienda.
// L'inquadramento decide quanto ne esce dalla busta del lavoratore,
// quindi il preset e' lo stesso che governa il lato datore.
// ---------------------------------------------------------------
console.log('\nQuote di CIGS e FIS a carico del lavoratore');
{
  const ral = 35000;

  // Terziario sopra i 15: entrambe le casse, 9,19 + 0,30 + 0,27 = 9,76%
  const terz = calcolaNetto(ral, 12, { preset: 'terziario' });
  vicino('terziario, aliquota lavoratore', 0.0976, terz.aliquotaLavoratore, 0.00001);
  verifica('terziario, due quote ripartite', terz.contributiMinori.length === 2);
  vicino('terziario, quota CIGS', ral * 0.003,
    terz.contributiMinori.find((v) => v.info === 'lavCigs').importo, 0.01);
  vicino('terziario, quota FIS', ral * 0.0027,
    terz.contributiMinori.find((v) => v.info === 'lavFis').importo, 0.01);

  // Industria fino a 15: niente CIGS (sotto soglia) e niente FIS (c'e'
  // la CIGO, che paga solo il datore). Resta il 9,19% liscio.
  const piccola = calcolaNetto(ral, 12, { preset: 'industriaPiccola' });
  vicino('industria piccola, aliquota lavoratore', 0.0919, piccola.aliquotaLavoratore, 0.00001);
  verifica('industria piccola, nessuna quota ripartita',
    piccola.contributiMinori.length === 0);
  vicino('industria piccola, contributi = 9,19% liscio', ral * 0.0919,
    piccola.contributiInps, 0.01);

  // Industria oltre 50: c'e' la CIGS ma non il FIS
  const grande = calcolaNetto(ral, 12, { preset: 'industriaGrande' });
  vicino('industria grande, aliquota lavoratore', 0.0949, grande.aliquotaLavoratore, 0.00001);
  verifica('industria grande, solo la CIGS', grande.contributiMinori.length === 1);

  // Le quote sono deducibili come l'IVS: l'imponibile scende di tutto
  // il contributo, non della sola quota pensionistica.
  vicino('le quote abbassano l\'imponibile', ral - terz.contributiInps, terz.imponibile, 0.01);
  verifica('col terziario il netto e piu basso che con l\'industria piccola',
    terz.nettoAnnuo < piccola.nettoAnnuo,
    `${terz.nettoAnnuo.toFixed(2)} < ${piccola.nettoAnnuo.toFixed(2)}`);

  // Le due facce della stessa cassa devono sommare all'aliquota
  // complessiva pubblicata: CIGS 0,90%, FIS 0,80%.
  const somma = (preset, chiaveDatore, infoLav) => {
    const p = PRESET_DATORE[preset];
    const dat = p.voci.find((v) => v.info === chiaveDatore);
    const lav = p.vociLavoratore.find((v) => v.info === infoLav);
    return dat.aliquota + lav.aliquota;
  };
  vicino('CIGS: datore + lavoratore = 0,90%', 0.009,
    somma('terziario', 'datoreCigs', 'lavCigs'), 0.00001);
  vicino('FIS: datore + lavoratore = 0,80%', 0.008,
    somma('terziario', 'datoreFis', 'lavFis'), 0.00001);

  // Il massimale copre la sola quota pensionistica: le casse minori si
  // versano su tutta la retribuzione, come sul lato azienda.
  const alta = calcolaNetto(150000, 12, { preset: 'terziario' });
  vicino('sopra il massimale la CIGS resta sulla RAL piena', 150000 * 0.003,
    alta.contributiMinori.find((v) => v.info === 'lavCigs').importo, 0.01);
  vicino('sopra il massimale l\'IVS si ferma al tetto', 122295 * 0.0919,
    alta.contributiIvs, 0.01);

  // Aliquota inserita a mano: non si sa come sia composta, quindi il
  // lavoratore resta al 9,19% invece di ereditare quote inventate.
  const mano = calcolaNetto(ral, 12, {
    preset: { nome: 'a mano', voci: [{ nome: 'tutto', aliquota: 0.3 }] },
  });
  vicino('preset manuale, lavoratore al 9,19%', 0.0919, mano.aliquotaLavoratore, 0.00001);
}

// ---------------------------------------------------------------
// Residenza: addizionali regionali e comunali
// ---------------------------------------------------------------
console.log('\nResidenza: regioni e comuni');
{
  // Il default resta Milano-Lombardia: chi non sceglie nulla ottiene
  // lo stesso risultato di prima che la residenza fosse un input.
  const def = nettoBase(30000, 13);
  const esplicito = nettoBase(30000, 13, { comune: 'milano', regione: 'lombardia' });
  vicino('default = Milano/Lombardia', def.nettoAnnuo, esplicito.nettoAnnuo, 0.01);

  // Aliquota unica: Veneto, 1,23% su tutto l'imponibile
  const vr = nettoBase(30000, 13, { regione: 'veneto', comune: 'verona' });
  vicino('regionale Veneto (unica 1,23%)', 27243 * 0.0123, vr.addizionaleRegionale, 0.01);

  // Aliquota comunale a scaglioni: Torino, imponibile 27.243 tutto
  // dentro il primo scaglione allo 0,80%
  const to = nettoBase(30000, 13, { comune: 'torino' });
  vicino('comunale Torino (a scaglioni)', 27243 * 0.008, to.addizionaleComunale, 0.01);
  // Passando solo il comune, la regione si deduce da lui: chi sceglie
  // Torino non puo' finire in Lombardia.
  verifica('la regione si deduce dal comune',
    to.regione.nome === 'Piemonte', `ottenuto ${to.regione.nome}`);
  vicino('regionale Piemonte dedotta', 503.78, to.addizionaleRegionale, 0.01);
  Object.keys(COMUNI).forEach((k) => {
    const r = nettoBase(30000, 13, { comune: k });
    verifica(`coppia coerente per ${COMUNI[k].nome}`,
      r.regione.nome === REGIONI[COMUNI[k].regione].nome);
  });

  // Soglia di esenzione alta: Firenze esenta fino a 25.000 di imponibile
  const fiSotto = nettoBase(27000, 13, { comune: 'firenze', regione: 'toscana' });
  verifica('Firenze esente sotto i 25.000 di imponibile',
    fiSotto.addizionaleComunale === 0,
    `imponibile ${fiSotto.imponibile.toFixed(2)}`);
  const fiSopra = nettoBase(30000, 13, { comune: 'firenze', regione: 'toscana' });
  vicino('Firenze sopra soglia (0,2%)', 27243 * 0.002, fiSopra.addizionaleComunale, 0.01);

  // Palermo non ha soglia: si paga da subito
  const pa = nettoBase(14000, 13, { comune: 'palermo', regione: 'sicilia' });
  verifica('Palermo senza soglia paga anche a reddito basso',
    pa.addizionaleComunale > 0);

  // Inserimento manuale: aliquota unica e soglia scelte dall'utente
  const man = nettoBase(30000, 13, {
    regione: { nome: 'x', aliquota: 0.0173 },
    comune: { nome: 'y', aliquota: 0.005, esenzioneFino: 0 },
  });
  vicino('regionale manuale 1,73%', 27243 * 0.0173, man.addizionaleRegionale, 0.01);
  vicino('comunale manuale 0,5%', 27243 * 0.005, man.addizionaleComunale, 0.01);

  // Inserimento manuale a scaglioni: e' il caso normale per le regioni,
  // che quasi tutte hanno aliquote progressive e non una piatta.
  const manScagl = nettoBase(30000, 13, {
    regione: { nome: 'x', scaglioni: [
      { fino: 15000, aliquota: 0.02 },
      { fino: 28000, aliquota: 0.025 },
      { fino: 50000, aliquota: 0.03 },
      { fino: Infinity, aliquota: 0.0333 },
    ] },
    comune: { nome: 'y', esenzioneFino: 10000, scaglioni: [
      { fino: 15000, aliquota: 0.005 },
      { fino: 28000, aliquota: 0.006 },
      { fino: 50000, aliquota: 0.007 },
      { fino: Infinity, aliquota: 0.008 },
    ] },
  });
  vicino('regionale manuale a scaglioni', 15000 * 0.02 + 12243 * 0.025,
    manScagl.addizionaleRegionale, 0.01);
  vicino('comunale manuale a scaglioni', 15000 * 0.005 + 12243 * 0.006,
    manScagl.addizionaleComunale, 0.01);

  // Chiave inesistente: si ricade sul default invece di rompersi
  const fallback = nettoBase(30000, 13, { regione: 'atlantide', comune: 'atlantide' });
  vicino('chiave sconosciuta -> default', def.nettoAnnuo, fallback.nettoAnnuo, 0.01);

  // Nessuna addizionale se l'IRPEF netta e' zero, in tutte le citta'
  Object.keys(COMUNI).forEach((k) => {
    const r = nettoBase(9000, 13, { comune: k, regione: COMUNI[k].regione });
    verifica(`nessuna addizionale senza capienza a ${COMUNI[k].nome}`,
      r.irpefNetta > 0 || (r.addizionaleComunale === 0 && r.addizionaleRegionale === 0));
  });
}

// ---------------------------------------------------------------
// Carichi di famiglia (art. 12 TUIR)
// ---------------------------------------------------------------
console.log('\nDetrazioni per carichi di famiglia');
{
  // Coniuge: 800 - 110 x (10.000/15.000 troncato a 0,6666) = 726,67
  vicino('coniuge a 10.000', 726.67, detrazioneConiuge(10000), 0.01);
  // Fascia piatta, fuori dagli scalini di maggiorazione
  vicino('coniuge a 27.243', 690, detrazioneConiuge(27243), 0.01);
  // Scalino piu' alto: 690 + 30
  vicino('coniuge a 34.800', 720, detrazioneConiuge(34800), 0.01);
  // Decalage finale: 690 x ((80.000-60.000)/40.000) = 345
  vicino('coniuge a 60.000', 345, detrazioneConiuge(60000), 0.01);
  vicino('coniuge a 85.000', 0, detrazioneConiuge(85000), 0.01);

  // Figli 21-30: rapporto (95.000-40.864,50)/95.000 = 0,569847 -> 0,5698
  vicino('un figlio a 40.864,50', 541.31, detrazioneFigli(40864.5, 1), 0.01);
  // Due figli: la soglia sale a 110.000 e la detrazione vale per entrambi
  vicino('due figli a 40.864,50', 1194.15, detrazioneFigli(40864.5, 2), 0.01);
  vicino('zero figli', 0, detrazioneFigli(40864.5, 0), 0.01);
  vicino('un figlio sopra soglia', 0, detrazioneFigli(120000, 1), 0.01);

  // Ascendente convivente: 750 x ((80.000-40.864,50)/80.000 -> 0,4891)
  vicino('un ascendente a 40.864,50', 366.83,
    detrazioneAltriFamiliari(40864.5, 1), 0.01);

  // I carichi di famiglia non possono peggiorare il netto
  const senza = nettoBase(45000, 14);
  const con = nettoBase(45000, 14, { coniuge: true, figli: 2 });
  verifica('i carichi di famiglia alzano il netto',
    con.nettoAnnuo > senza.nettoAnnuo,
    `${senza.nettoAnnuo.toFixed(2)} -> ${con.nettoAnnuo.toFixed(2)}`);
  vicino('netto con coniuge e 2 figli', 31903.34, con.nettoAnnuo, 0.01);

  // Capienza: a reddito basso le detrazioni si fermano all'IRPEF lorda
  const basso = nettoBase(14000, 13, { coniuge: true, figli: 3 });
  verifica('nessuna IRPEF negativa con molti carichi', basso.irpefNetta >= 0);
  verifica('detrazioni limitate alla lorda',
    basso.detrazioniApplicate <= basso.irpefLorda + 1e-9);
}

// ---------------------------------------------------------------
// Costo azienda
// ---------------------------------------------------------------
console.log('\nCosto azienda, RAL 30.000, terziario');
{
  const a = costoTerz(30000);
  // Contributi: 30,11% x 30.000 = 9.033
  vicino('contributi a carico azienda', 9033, a.contributiDatore, 0.01);
  vicino('aliquota datore', 0.3011, a.aliquotaDatore, 0.00001);
  // INAIL: 0,4% x 30.000 = 120
  vicino('premio INAIL', 120, a.inail, 0.01);
  // TFR: 30.000 / 13,5 = 2.222,22, di cui 150 all'INPS
  vicino('quota TFR', 2222.22, a.tfrTotale, 0.01);
  vicino('TFR accantonato', 2072.22, a.tfrAccantonato, 0.01);
  vicino('TFR al fondo pensioni', 150, a.tfrAlFondoPensioni, 0.01);
  // Totale: 30.000 + 9.033 + 120 + 2.222,22
  vicino('costo totale', 41375.22, a.costoTotale, 0.01);
  vicino('costo mensile', 41375.22 / 12, a.costoMensile, 0.01);
  vicino('moltiplicatore', 1.3792, a.moltiplicatore, 0.0001);
  // Senza agevolazioni il costo pieno coincide col costo totale.
  vicino('costo pieno senza agevolazioni', a.costoTotale, a.costoPieno, 0.001);
  verifica('nessuna agevolazione di default', a.agevolazione === null);

  // Le voci devono sommare al totale dei contributi: se una tabella
  // cambia, questo test la segue senza doverlo riscrivere.
  const somma = a.voci.reduce((t, v) => t + v.importo, 0);
  vicino('le voci sommano ai contributi', a.contributiDatore, somma, 0.001);
}

console.log('\nCosto azienda, i tre preset');
{
  // I due preset industria riproducono la tabella contributiva INPS:
  // impiegati, 28,46% fino a 15 dipendenti e 29,36% oltre 50.
  vicino('industria fino a 15 dip.', 0.2846,
    aliquotaDatore(PRESET_DATORE.industriaPiccola), 0.00001);
  vicino('industria oltre 50 dip.', 0.2936,
    aliquotaDatore(PRESET_DATORE.industriaGrande), 0.00001);
  // Terziario: 28,98% di voci INPS piu' lo 0,53% del FIS e lo 0,60%
  // della CIGS, che sopra i 15 dipendenti si pagano tutti e due.
  vicino('terziario', 0.3011,
    aliquotaDatore(PRESET_DATORE.terziario), 0.00001);
  const senzaAmmortizzatori = PRESET_DATORE.terziario.voci
    .filter((v) => !/FIS|CIGS/.test(v.nome))
    .reduce((t, v) => t + v.aliquota, 0);
  vicino('terziario senza FIS e CIGS', 0.2898, senzaAmmortizzatori, 0.00001);

  // Ogni preset ha la quota IVS al 23,81%: e' la parte che non cambia
  // mai, ed e' l'unica a cui si applica il massimale.
  Object.entries(PRESET_DATORE).forEach(([nome, p]) => {
    const ivs = p.voci.filter((v) => v.ivs);
    verifica(`${nome}: una sola voce IVS`, ivs.length === 1);
    verifica(`${nome}: IVS al 23,81%`, Math.abs(ivs[0].aliquota - 0.2381) < 1e-9);
    p.voci.forEach((v) => {
      verifica(`${nome}: la voce "${v.nome}" ha una scheda`,
        v.info !== undefined && SPIEGAZIONI[v.info] !== undefined, v.info);
    });
  });
}

console.log('\nAgevolazioni contributive');
{
  // RAL 30.000, terziario: contributi 9.033, INAIL 120.
  const under30 = costoTerz(30000, { agevolazioni: ['under30'] });
  // Il 50% varrebbe 4.516,50, ma il tetto lo ferma a 3.000.
  vicino('under 30: sconto al tetto', 3000, under30.sconto, 0.01);
  verifica('under 30: tetto segnalato', under30.agevolazione.tettoRaggiunto);
  vicino('under 30: INAIL intero', 120, under30.inailNetto, 0.01);
  vicino('under 30: costo scontato', 41375.22 - 3000, under30.costoTotale, 0.01);
  vicino('under 30: costo pieno invariato', 41375.22, under30.costoPieno, 0.01);

  // Sotto il tetto comanda la percentuale: a 15.000 il 50% dei
  // contributi (4.516,50 x 0,5) sta sotto i 3.000.
  const piccolo = costoTerz(15000, { agevolazioni: ['under30'] });
  vicino('under 30 su RAL bassa: 50% pieno', 2258.25, piccolo.sconto, 0.01);
  verifica('under 30 su RAL bassa: tetto non raggiunto',
    !piccolo.agevolazione.tettoRaggiunto);

  // Le misure della legge Fornero non hanno tetto e riducono anche
  // l'INAIL: (9.033 + 120) x 50% = 4.576,50.
  const donna = costoTerz(30000, { agevolazioni: ['donna'] });
  vicino('donna: sconto totale', 4576.5, donna.sconto, 0.01);
  vicino('donna: quota sui contributi', 4516.5, donna.scontoContributi, 0.01);
  vicino('donna: quota sull\'INAIL', 60, donna.scontoInail, 0.01);
  const over50 = costoTerz(30000, { agevolazioni: ['over50'] });
  vicino('over 50: stesso sconto della misura donne', donna.sconto, over50.sconto, 0.01);

  // Spuntandone due si applica una sola misura, e la scelta si fa
  // sull'anno: 4.576,50 battono i 3.000 del tetto under 30, anche se
  // sull'intera durata sarebbe il contrario (6.864,75 contro 9.000).
  const doppia = costoTerz(30000, { agevolazioni: ['under30', 'donna'] });
  verifica('due misure: ne resta una sola', doppia.agevolazioniScartate.length === 1);
  verifica('due misure: vince quella che sconta di piu sull\'anno',
    doppia.agevolazione.chiave === 'donna', doppia.agevolazione.chiave);
  vicino('due misure: sconto annuo di quella scelta', 4576.5, doppia.sconto, 0.01);
  vicino('donna sulla durata', 6864.75, doppia.agevolazione.totaleDurata, 0.01);
  vicino('under 30 sulla durata', 9000, doppia.agevolazioniScartate[0].totaleDurata, 0.01);

  // A parita' di sconto annuo vince la durata piu' lunga. Con INAIL a
  // zero le due misure valgono lo stesso sull'anno (meta' dei contributi
  // e nient'altro, sotto il tetto), e passa l'under 30 coi suoi 36 mesi.
  const pari = costoTerz(15000, { agevolazioni: ['under30', 'donna'], inail: 0 });
  vicino('parita sull\'anno: stesso sconto', 2258.25, pari.sconto, 0.01);
  verifica('parita sull\'anno: vince la durata piu lunga',
    pari.agevolazione.chiave === 'under30', pari.agevolazione.chiave);

  // Chiavi inesistenti ignorate, nessuna agevolazione = nessuno sconto.
  const nulla = costoTerz(30000, { agevolazioni: ['inventata'] });
  verifica('chiave sconosciuta ignorata', nulla.agevolazione === null);
  vicino('chiave sconosciuta: nessuno sconto', 0, nulla.sconto, 0.001);

  // Ogni misura ha la sua scheda e i campi che la pagina si aspetta.
  Object.entries(AGEVOLAZIONI_2026).forEach(([k, ag]) => {
    verifica(`${k}: ha nome, requisito e norma`, !!ag.nome && !!ag.requisito && !!ag.norma);
    verifica(`${k}: durata positiva`, ag.mesi > 0);
    verifica(`${k}: sconto tra 0 e 1`, ag.sconto > 0 && ag.sconto <= 1);
  });

  // Lo sconto morde solo sulla parte contributiva: RAL, TFR e voci
  // lorde restano quelle di prima. Se un giorno finisse per toccare il
  // TFR o la retribuzione, il calcolo sarebbe sbagliato e questo lo dice.
  const pieno = costoTerz(30000);
  vicino('la RAL non cambia', pieno.ral, donna.ral, 0.001);
  vicino('il TFR non cambia', pieno.tfrTotale, donna.tfrTotale, 0.001);
  vicino('i contributi lordi non cambiano',
    pieno.contributiDatore, donna.contributiDatore, 0.001);
  vicino('lo sconto e la differenza tra costo pieno e scontato',
    donna.costoPieno - donna.costoTotale, donna.sconto, 0.001);

  // Quadratura con lo sconto attivo: le fette della barra usano i
  // valori netti e devono sommare al costo scontato.
  for (const ral of [15000, 30000, 60000]) {
    const r = calcolaNetto(ral, 12);
    const a = calcolaCostoAzienda(ral, { agevolazioni: ['under30', 'over50'] });
    const netto = r.nettoAnnuo - r.bonusCuneo - r.trattamentoIntegrativo;
    const somma = netto + r.contributiInps + r.irpefNetta +
      r.addizionaleRegionale + r.addizionaleComunale +
      a.contributiDatoreNetti + a.inailNetto + a.tfrTotale;
    vicino(`quadratura con sconto a ${ral}`, a.costoTotale, somma, 0.001);
  }
}

console.log('\nCosto azienda, massimale e monotonia');
{
  // Sopra il massimale la quota IVS si ferma, le altre voci no.
  const sopra = calcolaCostoAzienda(150000);
  verifica('massimale segnalato sopra 122.295', sopra.massimaleApplicato);
  const ivs = sopra.voci.find((v) => v.ivs);
  vicino('IVS calcolata sul massimale', 122295 * 0.2381, ivs.importo, 0.01);
  const malattia = sopra.voci.find((v) => !v.ivs);
  vicino('le altre voci restano sulla RAL piena',
    150000 * malattia.aliquota, malattia.importo, 0.01);

  // Senza massimale si paga di piu': e' il regime di chi ha anzianita'
  // contributiva precedente al 1996.
  const senzaTetto = calcolaCostoAzienda(150000, { conMassimale: false });
  verifica('senza massimale il costo e piu alto',
    senzaTetto.costoTotale > sopra.costoTotale);

  // Il costo cresce sempre al crescere della RAL, e sta sempre sopra
  // la RAL stessa.
  let precedente = 0;
  for (let ral = 5000; ral <= 200000; ral += 500) {
    const a = calcolaCostoAzienda(ral);
    verifica(`costo crescente a ${ral}`, a.costoTotale > precedente);
    verifica(`costo sopra la RAL a ${ral}`, a.costoTotale > ral);
    precedente = a.costoTotale;
  }
}

console.log('\nQuadratura tra i due lati');
{
  // La barra del lato azienda somma al costo totale. Le somme
  // aggiuntive restano fuori: le paga lo Stato, non l'azienda.
  for (const ral of [12000, 30000, 60000, 130000]) {
    const r = calcolaNetto(ral, 12);
    const a = calcolaCostoAzienda(ral);
    const netto = r.nettoAnnuo - r.bonusCuneo - r.trattamentoIntegrativo;
    const somma = netto + r.contributiInps + r.irpefNetta +
      r.addizionaleRegionale + r.addizionaleComunale +
      a.contributiDatore + a.inail + a.tfrTotale;
    vicino(`quadratura a ${ral}`, a.costoTotale, somma, 0.001);
  }
}

console.log('\nMedie retributive');
{
  const impiegato = MEDIE_RETRIBUTIVE.qualifiche.impiegato;
  const c = confrontaConMedia(40000, impiegato);
  verifica('sopra la media degli impiegati', c.sopra);
  vicino('scarto in euro', 40000 - impiegato.ral, c.scarto, 0.01);
  vicino('scarto in percentuale',
    (40000 - impiegato.ral) / impiegato.ral, c.scartoPercentuale, 0.0001);

  const sotto = confrontaConMedia(20000, impiegato);
  verifica('sotto la media degli impiegati', !sotto.sopra);

  // Nessuna media scelta: la pagina non deve mostrare niente, quindi
  // la funzione deve restituire null e non un confronto vuoto.
  verifica('nessuna media selezionata', confrontaConMedia(30000, undefined) === null);

  // Ogni media dichiara fonte e anno: senza quelli il numero non e'
  // difendibile e non deve finire in pagina.
  const tutte = [MEDIE_RETRIBUTIVE.generale]
    .concat(Object.values(MEDIE_RETRIBUTIVE.qualifiche))
    .concat(Object.values(MEDIE_RETRIBUTIVE.settori));
  tutte.forEach((m) => {
    verifica(`la media "${m.nome}" dichiara la fonte`, !!m.fonte && !!m.anno);
    verifica(`la media "${m.nome}" ha la frase per l'insight`, !!m.frase);
    verifica(`la media "${m.nome}" ha un valore plausibile`, m.ral > 10000 && m.ral < 200000);
  });
}

console.log('\nSchede informative');
{
  // Ogni scheda ha titolo e testo: una chiave senza testo lascerebbe
  // in pagina un bottone che si apre sul vuoto.
  Object.entries(SPIEGAZIONI).forEach(([chiave, s]) => {
    verifica(`la scheda "${chiave}" ha un titolo`, !!s.titolo);
    verifica(`la scheda "${chiave}" ha un testo lungo abbastanza`,
      !!s.testo && s.testo.length > 80);
  });
}

console.log(falliti === 0 ? '\nTutti i test passano.' : `\n${falliti} TEST FALLITI`);
process.exit(falliti === 0 ? 0 : 1);
