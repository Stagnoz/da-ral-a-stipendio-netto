/*
 * Logica della pagina: legge la form, chiama calc.js, scrive i risultati.
 * Nessun calcolo fiscale sta qui dentro: quelli stanno tutti nei file della cartella calc/,
 * che girano anche in Node e sono verificati da test.js.
 */
import { 
  calcolaNetto, calcolaCostoAzienda, aliquotaDatore, risolviDatore, 
  confrontaConMedia, PRESET_DATORE, AGEVOLAZIONI_2026, MEDIE_RETRIBUTIVE, 
  COMUNI, REGIONI, risolviRegione, risolviComune, PARAMETRI_2026 
} from './calc/index.js';
import { SPIEGAZIONI } from './spiegazioni.js';


const eur2 = new Intl.NumberFormat('it-IT', {
  style: 'currency', currency: 'EUR',
  minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always'
});
const eur0 = new Intl.NumberFormat('it-IT', {
  style: 'currency', currency: 'EUR',
  minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: 'always'
});
const num0 = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0, useGrouping: 'always' });

// Unita' di misura alternativa: serve a dare una scala a una cifra che
// da sola resta astratta. L'interruttore e' uno solo e vale per tutti e
// due i lati; converte le tile in cima, il resto della pagina sta in euro.
const PREZZO_PIZZA = 9;
const inPizze = (euro) => num0.format(Math.round(euro / PREZZO_PIZZA)) + ' pizze';

const $ = (id) => document.getElementById(id);

// -------------------------------------------------------------
// Il campo RAL. E' testo, quindi il valore va letto togliendo i punti e
// riscritto mettendoli: in cambio "35.000" e "3.500" restano distinti a
// colpo d'occhio anche mentre li si digita.
// -------------------------------------------------------------
const PASSO_RAL = 500;
const soloCifre = (s) => s.replace(/\D/g, '');
const valoreRal = () => Number(soloCifre($('ral').value));

function scriviRal(v) {
  $('ral').value = v > 0 ? num0.format(v) : '';
}

// Rimette il punto a ogni tasto premuto. Il cursore va riportato dove
// stava contando le cifre e non i caratteri: un punto che compare a
// sinistra sposta tutto di uno, e senza questo si finirebbe a scrivere
// in fondo al campo a ogni migliaio.
function formattaRal() {
  const el = $('ral');
  const cifrePrima = soloCifre(el.value.slice(0, el.selectionStart)).length;
  const cifre = soloCifre(el.value);
  const testo = cifre ? num0.format(Number(cifre)) : '';
  if (testo === el.value) return;
  el.value = testo;
  let pos = 0;
  for (let viste = 0; pos < testo.length && viste < cifrePrima; pos++) {
    if (/\d/.test(testo[pos])) viste++;
  }
  el.setSelectionRange(pos, pos);
}
const pct = (x, dec = 1) => x.toFixed(dec).replace('.', ',') + '%';
// "1,23" invece di "1.23", senza zeri inutili in coda
const pctAliq = (a) => (a * 100).toFixed(2).replace('.', ',').replace(/,?0+$/, '') + '%';

let calcolato = false;
const NESSUNA = '__nessuna__';
const ALTRO = '__altro__';
const MANUALE = '__manuale__';

// -------------------------------------------------------------
// Tab: cambia solo il punto di vista, non gli input gia' inseriti.
// La RAL resta quella, cambia chi la guarda.
// -------------------------------------------------------------
function cambiaVista(vista) {
  document.body.dataset.vista = vista;
  $('tabDipendente').setAttribute('aria-selected', String(vista === 'dipendente'));
  $('tabAzienda').setAttribute('aria-selected', String(vista === 'azienda'));
}
$('tabDipendente').addEventListener('click', () => cambiaVista('dipendente'));
$('tabAzienda').addEventListener('click', () => cambiaVista('azienda'));

// -------------------------------------------------------------
// Menu costruiti dalle tabelle di calc.js: i dati stanno in un posto
// solo e la pagina non li ricopia.
// -------------------------------------------------------------
$('comune').innerHTML =
  Object.entries(COMUNI).map(([k, c]) => `<option value="${k}">${c.nome}</option>`).join('') +
  `<option value="${ALTRO}">Altro comune…</option>`;
$('regione').innerHTML =
  Object.entries(REGIONI).map(([k, r]) => `<option value="${k}">${r.nome}</option>`).join('') +
  `<option value="${ALTRO}">Altra regione…</option>`;
$('comune').value = 'milano';
$('regione').value = 'lombardia';

$('qualifica').innerHTML =
  `<option value="${NESSUNA}" selected>non specificato</option>` +
  Object.entries(MEDIE_RETRIBUTIVE.qualifiche)
    .map(([k, q]) => `<option value="${k}">${q.nome}</option>`).join('');
$('settore').innerHTML =
  `<option value="${NESSUNA}" selected>non specificato</option>` +
  Object.entries(MEDIE_RETRIBUTIVE.settori)
    .map(([k, s]) => `<option value="${k}">${s.nome}</option>`).join('');

$('preset').innerHTML =
  Object.entries(PRESET_DATORE)
    .map(([k, p]) => `<option value="${k}">${p.nome}</option>`).join('') +
  `<option value="${MANUALE}">Aliquota a mano…</option>`;
$('preset').value = 'industriaPiccola';

// -------------------------------------------------------------
// Residenza
// -------------------------------------------------------------
function sincronizzaResidenza() {
  const c = $('comune').value;
  // Un comune sta in una regione sola. Scelto un capoluogo, la regione
  // e' determinata e il menu si blocca: l'addizionale regionale segue
  // lo stesso domicilio fiscale di quella comunale, non puo' divergere.
  // Resta libero solo con "Altro comune", dove il comune non lo sappiamo.
  if (c !== ALTRO && COMUNI[c]) $('regione').value = COMUNI[c].regione;
  $('regione').disabled = c !== ALTRO;
  $('regioneBloccata').hidden = c === ALTRO;

  $('manualeComune').hidden = c !== ALTRO;
  $('manualeRegione').hidden = $('regione').value !== ALTRO;
  $('comuneUnica').hidden = $('comuneTipo').value !== 'unica';
  $('comuneScaglioni').hidden = $('comuneTipo').value !== 'scaglioni';
  $('regioneUnica').hidden = $('regioneTipo').value !== 'unica';
  $('regioneScaglioni').hidden = $('regioneTipo').value !== 'scaglioni';
  mostraAliquote();
}

// Le quattro fasce dei campi manuali sono allineate a quelle IRPEF.
function scaglioniDaCampi(prefisso) {
  const v = (n) => Number($(prefisso + n).value) / 100;
  return [
    { fino: 15000, aliquota: v(1) },
    { fino: 28000, aliquota: v(2) },
    { fino: 50000, aliquota: v(3) },
    { fino: Infinity, aliquota: v(4) },
  ];
}

function residenzaScelta() {
  const c = $('comune').value;
  const r = $('regione').value;

  let comune = c;
  if (c === ALTRO) {
    comune = { nome: 'inserita a mano', esenzioneFino: Number($('comuneEsenzione').value) };
    if ($('comuneTipo').value === 'scaglioni') comune.scaglioni = scaglioniDaCampi('comuneS');
    else comune.aliquota = Number($('comuneAliquota').value) / 100;
  }

  let regione = r;
  if (r === ALTRO) {
    regione = { nome: 'inserita a mano' };
    if ($('regioneTipo').value === 'scaglioni') regione.scaglioni = scaglioniDaCampi('regioneS');
    else regione.aliquota = Number($('regioneAliquota').value) / 100;
  }

  return { comune, regione };
}

// Riga di riepilogo sotto i due menu: rende visibile quali aliquote
// sono in uso senza dover premere Calcola.
function descriviEnte(ente) {
  if (ente.scaglioni) {
    let da = 0;
    return ente.scaglioni.map((s) => {
      let range;
      if (s.fino === Infinity) {
        range = 'oltre ' + num0.format(da) + ' €';
      } else if (da === 0) {
        range = 'fino a ' + num0.format(s.fino) + ' €';
      } else {
        range = 'da ' + num0.format(da) + ' a ' + num0.format(s.fino) + ' €';
      }
      da = s.fino;
      return pctAliq(s.aliquota) + ' (' + range + ')';
    }).join(' / ');
  }
  return pctAliq(ente.aliquota || 0) + ' unica';
}

function mostraAliquote() {
  const { comune, regione } = residenzaScelta();
  const reg = risolviRegione(regione);
  const com = risolviComune(comune);
  const soglia = com.esenzioneFino || 0;
  $('aliquoteAttuali').innerHTML =
    '<b>' + reg.nome + '</b> ' + descriviEnte(reg) +
    '<br><b>' + com.nome + '</b> ' + descriviEnte(com) +
    (soglia > 0 ? ', esente fino a ' + num0.format(soglia) + ' €' : ', nessuna esenzione');
}

// -------------------------------------------------------------
// Inquadramento dell'azienda
// -------------------------------------------------------------
// Le tre caselle del profilo. La mappa tiene insieme id del campo e
// chiave della tabella: aggiungerne una quarta e' una riga sola.
const AGEVOLAZIONI_CAMPI = {
  agUnder30: 'under30',
  agDonna: 'donna',
  agOver50: 'over50',
};

// Under 30 e over 50 non possono valere sulla stessa persona: nessuno ha
// meno di 30 anni e piu' di 50. Spuntandone una l'altra si spegne e si
// disabilita, invece di lasciar comporre un profilo impossibile.
// "Donna" invece convive con entrambe: una donna di 28 anni ha davvero i
// requisiti di due misure, ed e' il caso che il motore deve risolvere.
const AGEVOLAZIONI_ESCLUSIVE = ['agUnder30', 'agOver50'];

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
  return Object.entries(AGEVOLAZIONI_CAMPI)
    .filter(([id]) => $(id).checked)
    .map(([, chiave]) => chiave);
}

function datoreScelto() {
  const k = $('preset').value;
  const inail = Number($('inail').value) / 100;
  const agevolazioni = agevolazioniScelte();
  if (k === MANUALE) {
    return {
      preset: {
        nome: 'aliquota inserita a mano',
        inail,
        voci: [{
          nome: 'Contributi a carico azienda',
          aliquota: Number($('datoreAliquota').value) / 100,
          info: 'datoreIvs',
        }],
      },
      inail,
      agevolazioni,
    };
  }
  return { preset: k, inail, agevolazioni };
}

// Riepilogo sotto le caselle: dice cosa danno le misure spuntate senza
// aspettare il calcolo. Quale delle tre vince dipende dalla RAL, e
// quello lo dice il riquadro verde nei risultati.
function mostraAgevolazioni() {
  const scelte = agevolazioniScelte();
  if (!scelte.length) {
    $('agevolazioniAttuali').innerHTML =
      'Nessuna agevolazione: contributi pieni.';
    return;
  }
  $('agevolazioniAttuali').innerHTML = scelte.map((k) => {
    const ag = AGEVOLAZIONI_2026[k];
    return '<b>' + ag.breve + '</b> −' + pctAliq(ag.sconto) +
      (ag.tettoAnnuo ? ', max ' + eur0.format(ag.tettoAnnuo) + ' l\'anno' : '') +
      (ag.inail ? ', INAIL incluso' : '') +
      ', ' + ag.mesi + ' mesi';
  }).join(' &nbsp;·&nbsp; ');
}

function sincronizzaDatore(cambiatoPreset) {
  const k = $('preset').value;
  $('manualeDatore').hidden = k !== MANUALE;
  // Il tasso INAIL segue il settore solo quando e' il settore a
  // cambiare: dopo, chi lo ha scritto a mano se lo tiene.
  if (cambiatoPreset && k !== MANUALE) {
    $('inail').value = (PRESET_DATORE[k].inail * 100).toFixed(2).replace(/\.?0+$/, '');
  }
  mostraAliquoteDatore();
}

function mostraAliquoteDatore() {
  const scelta = datoreScelto();
  const preset = risolviDatore(scelta.preset);
  const totale = aliquotaDatore(preset);
  $('aliquoteDatore').innerHTML =
    '<b>' + preset.nome + '</b> ' + pctAliq(totale) + ' di contributi' +
    (preset.nota ? ' <span class="nota-riga">(' + preset.nota + ')</span>' : '') +
    ' &nbsp;·&nbsp; <b>INAIL</b> ' + pctAliq(scelta.inail) +
    ' &nbsp;·&nbsp; <b>TFR</b> 7,41%';

  // Lo stesso preset visto dall'altro lato: quanto di quelle casse esce
  // dalla busta del lavoratore. Senza questa riga il menu, sul tab del
  // dipendente, sembrerebbe non toccare niente.
  const minori = preset.vociLavoratore || [];
  const somma = minori.reduce((tot, v) => tot + v.aliquota, 0);
  $('aliquoteLavoratore').innerHTML =
    '<b>Quota a tuo carico</b> ' + pctAliq(0.0919 + somma) +
    ' <span class="nota-riga">(9,19% di IVS' +
    (minori.length
      ? ' + ' + minori.map((v) => pctAliq(v.aliquota) + ' di ' +
          v.nome.split(' —')[0]).join(' + ')
      : ', nessuna quota ripartita in questo inquadramento') +
    ')</span>';
}

// -------------------------------------------------------------
// Due cose si aprono e si chiudono nella tabella: le schede di una
// voce e le sezioni intere. Lo stato di entrambe sopravvive al
// ridisegno, altrimenti ogni modifica alla RAL rimetterebbe tutto
// come all'inizio mentre si sta leggendo.
// -------------------------------------------------------------
const schedeAperte = new Set();
const sezioniChiuse = new Set();

document.addEventListener('click', (e) => {
  const info = e.target.closest('.info');
  if (info) {
    const chiave = info.dataset.info;
    if (schedeAperte.has(chiave)) schedeAperte.delete(chiave);
    else schedeAperte.add(chiave);
    applicaStato();
    return;
  }

  const sezione = e.target.closest('.toggle-sez');
  if (sezione) {
    const chiave = sezione.dataset.sez;
    if (sezioniChiuse.has(chiave)) sezioniChiuse.delete(chiave);
    else sezioniChiuse.add(chiave);
    applicaStato();
    return;
  }

  // "Comprimi tutto" e' un interruttore solo: se sono gia' tutte
  // chiuse riapre, cosi' non serve un secondo comando.
  const tutte = e.target.closest('.azione-testa');
  if (tutte) {
    const chiavi = chiaviSezioni(tutte.dataset.tavola);
    const giaChiuse = chiavi.length > 0 && chiavi.every((k) => sezioniChiuse.has(k));
    chiavi.forEach((k) => (giaChiuse ? sezioniChiuse.delete(k) : sezioniChiuse.add(k)));
    applicaStato();
  }
});

function chiaviSezioni(idTavola) {
  return Array.from(document.querySelectorAll('#' + idTavola + ' .toggle-sez'))
    .map((b) => b.dataset.sez);
}

function applicaStato() {
  document.querySelectorAll('.info').forEach((b) => {
    b.setAttribute('aria-expanded', String(schedeAperte.has(b.dataset.info)));
  });
  document.querySelectorAll('.toggle-sez').forEach((b) => {
    b.setAttribute('aria-expanded', String(!sezioniChiuse.has(b.dataset.sez)));
  });

  // Una scheda si vede solo se e' aperta lei e se la sezione che la
  // contiene non e' chiusa: le due condizioni sono indipendenti.
  document.querySelectorAll('tbody tr[data-sez]').forEach((tr) => {
    const chiusa = sezioniChiuse.has(tr.dataset.sez);
    tr.hidden = tr.classList.contains('scheda')
      ? chiusa || !schedeAperte.has(tr.dataset.scheda)
      : chiusa;
  });
  document.querySelectorAll('tr.scheda:not([data-sez])').forEach((tr) => {
    tr.hidden = !schedeAperte.has(tr.dataset.scheda);
  });

  document.querySelectorAll('.azione-testa').forEach((b) => {
    const chiavi = chiaviSezioni(b.dataset.tavola);
    const giaChiuse = chiavi.length > 0 && chiavi.every((k) => sezioniChiuse.has(k));
    b.textContent = giaChiuse ? 'Espandi tutto' : 'Comprimi tutto';
  });
}

// Il bottone e la riga che si apre. La chiave e' la stessa in
// spiegazioni.js: se manca il testo, il bottone non compare.
function bottoneInfo(chiave) {
  if (!chiave || !SPIEGAZIONI[chiave]) return '';
  return '<button type="button" class="info" data-info="' + chiave +
         '" aria-expanded="false" aria-label="Che cos\'è questa voce">?</button>';
}

function rigaScheda(chiave, sezione) {
  const s = SPIEGAZIONI[chiave];
  if (!s) return '';
  return '<tr class="scheda" data-scheda="' + chiave + '"' +
         (sezione ? ' data-sez="' + sezione + '"' : '') + ' hidden><td colspan="2">' +
         '<div class="scheda-box"><div class="t">' + s.titolo + '</div>' +
         '<p>' + s.testo + '</p>' +
         (s.norma ? '<p class="norma">' + s.norma + '</p>' : '') +
         '</div></td></tr>';
}

// La chiave di una sezione deve reggere al ridisegno, quindi viene dal
// nome e non da un contatore: aggiungere una riga non sposta lo stato.
function chiaveSezione(idTavola, nome) {
  return idTavola + ':' + nome.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Costruttore di tabella condiviso dai due lati. Ogni sezione porta il
// proprio totale sulla stessa riga del titolo: chiusa, resta leggibile
// quanto pesa senza tenere aperte venti righe.
function tabella(idTavola) {
  const righe = [];
  let corrente = null;
  const marca = () => (corrente ? ' data-sez="' + corrente + '"' : '');

  return {
    sezione(nome, riepilogo, cls, apribile = true) {
      corrente = apribile ? chiaveSezione(idTavola, nome) : null;
      const testa = apribile
        ? '<button type="button" class="toggle-sez" data-sez="' + corrente +
          '" aria-expanded="true">' + nome + '</button>'
        : '<span class="nome-sez">' + nome + '</span>';
      righe.push('<tr class="sezione"><td>' + testa + '</td>' +
                 '<td class="num ' + (cls || '') + '">' + (riepilogo || '') + '</td></tr>');
    },
    riga(nome, valore, cls, nota, info) {
      righe.push(
        '<tr' + marca() + '><td>' + bottoneInfo(info) + nome +
        (nota ? ' <span class="nota-riga">' + nota + '</span>' : '') +
        '</td><td class="num ' + (cls || '') + '">' + valore + '</td></tr>' +
        rigaScheda(info, corrente)
      );
    },
    totale(nome, valore, nota) {
      righe.push('<tr class="totale"' + marca() + '><td>' + nome +
                 (nota ? ' <span class="nota-riga">' + nota + '</span>' : '') +
                 '</td><td class="num">' + valore + '</td></tr>');
    },
    html() { return righe.join(''); },
  };
}

// -------------------------------------------------------------
// Il risultato compare al primo "Calcola". Da quel momento in poi
// si aggiorna da solo a ogni modifica, senza far ripremere il tasto.
// -------------------------------------------------------------
$('form').addEventListener('submit', (e) => {
  e.preventDefault();
  calcolato = true;
  document.body.dataset.calcolato = '';
  aggiorna();

  const colonna = document.querySelector('.colonna-risultati');
  if (colonna && $('risultati').style.display !== 'none') {
    colonna.classList.remove('risultati-updated');
    void colonna.offsetWidth;
    colonna.classList.add('risultati-updated');

    const impilato = window.matchMedia('(max-width: 1100px)').matches;
    if (impilato) {
      colonna.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } else if ($('errore').style.display === 'block') {
    $('ral').focus();
    $('errore').classList.remove('risultati-updated');
    void $('errore').offsetWidth;
    $('errore').classList.add('risultati-updated');
  }
});
$('ral').addEventListener('input', () => {
  formattaRal();
  if (calcolato) aggiorna();
});
// Le frecce su/giu' le dava l'input number, che qui non c'e' piu': stesso
// passo di prima, 500 euro, arrotondando al multiplo piu' vicino.
$('ral').addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
  e.preventDefault();
  const passo = e.key === 'ArrowUp' ? PASSO_RAL : -PASSO_RAL;
  scriviRal(Math.max(0, Math.round(valoreRal() / PASSO_RAL) * PASSO_RAL + passo));
  if (calcolato) aggiorna();
});
['mensilita', 'coniuge', 'figli', 'altri', 'valutaPizze', 'qualifica', 'settore'].forEach((id) => {
  $(id).addEventListener('change', () => { if (calcolato) aggiorna(); });
});
['comune', 'regione', 'comuneTipo', 'regioneTipo'].forEach((id) => {
  $(id).addEventListener('change', () => {
    sincronizzaResidenza();
    if (calcolato) aggiorna();
  });
});
['comuneAliquota', 'comuneEsenzione', 'regioneAliquota',
 'comuneS1', 'comuneS2', 'comuneS3', 'comuneS4',
 'regioneS1', 'regioneS2', 'regioneS3', 'regioneS4'].forEach((id) => {
  $(id).addEventListener('input', () => {
    mostraAliquote();
    if (calcolato) aggiorna();
  });
});
$('preset').addEventListener('change', () => {
  sincronizzaDatore(true);
  if (calcolato) aggiorna();
});
['inail', 'datoreAliquota'].forEach((id) => {
  $(id).addEventListener('input', () => {
    mostraAliquoteDatore();
    if (calcolato) aggiorna();
  });
});
Object.keys(AGEVOLAZIONI_CAMPI).forEach((id) => {
  $(id).addEventListener('change', () => {
    sincronizzaAgevolazioni(id);
    if (calcolato) aggiorna();
  });
});

sincronizzaResidenza();
sincronizzaDatore(false);
sincronizzaAgevolazioni();

// -------------------------------------------------------------
// Render
// -------------------------------------------------------------
function aggiorna() {
  const ral = valoreRal();
  const mensilita = Number($('mensilita').value);

  if (!ral || ral < 1000 || ral > 9999999999) {
    $('errore').style.display = 'block';
    $('risultati').style.display = 'none';
    $('attesa').hidden = false;
    return;
  }
  $('errore').style.display = 'none';

  // Un preset solo per i due lati: l'inquadramento decide sia le voci
  // del datore sia le quote ripartite che il lavoratore versa (CIGS,
  // FIS). Con l'aliquota inserita a mano il lavoratore resta al 9,19%:
  // di quel numero non si sa come sia composto.
  const scelta = datoreScelto();

  const r = calcolaNetto(ral, mensilita, Object.assign({
    coniuge: $('coniuge').checked,
    figli: Number($('figli').value),
    altriFamiliari: Number($('altri').value),
    preset: scelta.preset,
    // conMassimale resta al default: iscritto INPS dal 1996 in poi.
  }, residenzaScelta()));

  const a = calcolaCostoAzienda(ral, scelta);

  intestazione(r, mensilita);
  confronto(r);
  barra(r);
  dettaglio(r, mensilita);

  intestazioneAzienda(a, r);
  scontoAzienda(a);
  barraAzienda(a, r);
  dettaglioAzienda(a, r);

  applicaStato();
  $('attesa').hidden = true;
  $('risultati').style.display = 'block';
}

// Un solo interruttore per i due lati: qui si legge lo stato e si
// accende l'etichetta giusta, le due intestazioni poi lo usano.
function pizzeAttive() {
  const pizze = $('valutaPizze').checked;
  $('etEuro').classList.toggle('attiva', !pizze);
  $('etPizze').classList.toggle('attiva', pizze);
  return pizze;
}

function intestazione(r, mensilita) {
  const pizze = pizzeAttive();

  $('outMese').textContent = pizze ? inPizze(r.nettoMese) : eur2.format(r.nettoMese);
  $('outMensilita').textContent = pizze
    ? 'su ' + mensilita + ' mensilità, a ' + PREZZO_PIZZA + ' € l\'una'
    : 'su ' + mensilita + ' mensilità';
  $('outAnno').textContent = pizze ? inPizze(r.nettoAnnuo) : eur2.format(r.nettoAnnuo);
  $('outIncidenza').textContent =
    'trattenute totali: ' + pct(r.incidenzaTrattenute * 100) +
    ' della RAL, imposte e contributi';

  // Aliquota effettiva: imposte sul reddito (IRPEF netta + addizionali)
  // rapportate alla RAL, la stessa base del carico effettivo qui sopra.
  const imposte = r.irpefNetta + r.addizionaleRegionale + r.addizionaleComunale;
  $('outAliquota').textContent = pct((imposte / r.ral) * 100);
}

// -------------------------------------------------------------
// Confronto con le medie. Due confronti separati, mai incrociati:
// la media degli impiegati di un settore non e' un dato pubblico e
// moltiplicare le due medie darebbe un numero inventato.
// -------------------------------------------------------------
function confronto(r) {
  const scelte = [
    confrontaConMedia(r.ral, MEDIE_RETRIBUTIVE.qualifiche[$('qualifica').value]),
    confrontaConMedia(r.ral, MEDIE_RETRIBUTIVE.settori[$('settore').value]),
  ].filter(Boolean);

  // Senza inquadramento e senza settore non c'e' niente da confrontare:
  // sparisce il blocco intero, titolo compreso.
  if (!scelte.length) {
    $('confronto').innerHTML = '';
    $('bloccoConfronto').hidden = true;
    return;
  }
  $('bloccoConfronto').hidden = false;

  const blocchi = scelte.map((c) => {
    const m = c.media;
    const massimo = Math.max(r.ral, m.ral);
    const barra = (etichetta, valore, tua) =>
      '<div class="barra-confronto' + (tua ? ' tua' : '') + '"><span>' + etichetta + '</span>' +
      '<span class="traccia"><span class="riempi" style="width:' +
      ((valore / massimo) * 100).toFixed(1) + '%"></span></span>' +
      '<b>' + eur0.format(valore) + '</b></div>';

    return '<div class="confronto">' +
      '<p class="titolo">La tua RAL è <span class="scarto ' +
      (c.sopra ? 'sopra' : 'sotto') + '">' +
      pct(Math.abs(c.scartoPercentuale) * 100) + ' ' + (c.sopra ? 'sopra' : 'sotto') +
      '</span> la media ' + m.frase + '.</p>' +
      '<div class="barre-confronto">' +
      barra('la tua RAL', r.ral, true) +
      barra('la media', m.ral, false) +
      '</div>' +
      '<p class="fonte">Media ' + (m.stimato ? 'indicativa, ' : '') +
      eur0.format(m.ral) + ' — ' + m.fonte + ', dati ' + m.anno + '. ' +
      'È una media su tutte le anzianità e tutta Italia: da sola non dice se il tuo stipendio è giusto, ' +
      'dice solo dove cade rispetto agli altri.' +
      (m.stimato ? ' Questo valore la fonte lo pubblica arrotondato, quindi il confronto è approssimativo.' : '') +
      '</p></div>';
  });

  $('confronto').innerHTML = blocchi.join('');
}

function barra(r) {
  const somme = r.bonusCuneo + r.trattamentoIntegrativo;
  // Le somme aggiuntive non sono una fetta della RAL: si sommano dopo.
  // Le tolgo dal netto per far quadrare la barra sui 100% della RAL.
  // Verde cio' che resta in busta, rosso cio' che esce. Le tre voci in
  // uscita usano tre gradazioni: sono adiacenti nella barra e con un
  // rosso solo diventerebbero un blocco unico.
  const voci = [
    { nome: 'Netto in busta', valore: r.nettoAnnuo - somme, colore: '#0a7a3d' },
    { nome: 'Contributi INPS', valore: r.contributiInps, colore: '#cc1f12' },
    { nome: 'IRPEF netta', valore: r.irpefNetta, colore: '#e0584a' },
    { nome: 'Addizionali locali',
      valore: r.addizionaleRegionale + r.addizionaleComunale, colore: '#f2b0a8' },
  ].filter((v) => v.valore > 0.005);

  $('barra').innerHTML = voci.map((v) =>
    '<span style="width:' + ((v.valore / r.ral) * 100) + '%;background:' + v.colore +
    '" title="' + v.nome + '"></span>'
  ).join('');

  $('legenda').innerHTML = voci.map((v) =>
    '<div><i class="swatch" style="background:' + v.colore + '"></i>' + v.nome +
    ' <b>' + eur2.format(v.valore) + '</b> <span class="q">(' +
    pct((v.valore / r.ral) * 100) + ')</span></div>'
  ).join('') + (somme > 0
    ? '<div><i class="swatch" style="background:#4fa877"></i>' +
      'Somme aggiuntive fuori dalla RAL <b>+' + eur2.format(somme) + '</b></div>'
    : '');
}

function dettaglio(r, mensilita) {
  const t = tabella('dettaglio');
  const addizionali = r.addizionaleRegionale + r.addizionaleComunale;
  const aggiuntive = r.bonusCuneo + r.trattamentoIntegrativo;

  t.sezione("Dal lordo all'imponibile", eur2.format(r.imponibile));
  t.riga('Retribuzione annua lorda', eur2.format(r.ral), '', '', 'ral');
  if (r.massimaleApplicato) {
    t.riga('Base contributiva', eur2.format(r.baseContributiva), '',
           '(massimale 122.295 €: sopra non si versa più IVS)', 'baseContributiva');
  }
  t.riga('Contributi IVS a carico dipendente (9,19%)',
         '− ' + eur2.format(r.contributiIvs), 'neg', '', 'ivs');
  if (r.contributiAggiuntivo > 0) {
    t.riga('Contributo aggiuntivo 1%', '− ' + eur2.format(r.contributiAggiuntivo), 'neg',
           '(sulla parte oltre 56.224 €)', 'aggiuntivo1');
  }
  // CIGS e FIS hanno una quota a carico del lavoratore: dipende
  // dall'inquadramento dell'azienda, quindi compare solo dove esiste.
  (r.contributiMinori || []).forEach((v) => {
    t.riga(v.nome, '− ' + eur2.format(v.importo), 'neg',
           '(' + pctAliq(v.aliquota) + ' della RAL)', v.info);
  });
  t.riga('Imponibile fiscale', eur2.format(r.imponibile), '', '', 'imponibile');

  t.sezione('IRPEF', '− ' + eur2.format(r.irpefNetta), 'neg');
  t.riga('IRPEF lorda (scaglioni 23 / 33 / 43%)', eur2.format(r.irpefLorda), '', '', 'irpefLorda');
  t.riga('Detrazione lavoro dipendente', '− ' + eur2.format(r.detrazioneLavoro), 'pos', '', 'detrLavoro');
  if (r.detrazioneCuneo > 0) {
    t.riga('Detrazione taglio cuneo fiscale', '− ' + eur2.format(r.detrazioneCuneo), 'pos', '', 'detrCuneo');
  }
  if (r.detrazioneConiuge > 0) {
    t.riga('Detrazione coniuge a carico', '− ' + eur2.format(r.detrazioneConiuge), 'pos', '', 'detrConiuge');
  }
  if (r.detrazioneFigli > 0) {
    t.riga('Detrazione figli a carico', '− ' + eur2.format(r.detrazioneFigli), 'pos',
           '(21-30 anni)', 'detrFigli');
  }
  if (r.detrazioneAltriFamiliari > 0) {
    t.riga('Detrazione ascendenti conviventi',
           '− ' + eur2.format(r.detrazioneAltriFamiliari), 'pos', '', 'detrAltri');
  }
  const teoriche = r.detrazioneLavoro + r.detrazioneCuneo + r.detrazioneFamiliari;
  if (teoriche - r.detrazioniApplicate > 0.005) {
    // Non e' ne' una trattenuta ne' uno sconto: e' uno sconto che non
    // hai potuto usare. Resta in nero, con la nota che lo spiega.
    t.riga('Detrazioni perse per incapienza', eur2.format(teoriche - r.detrazioniApplicate),
           '', "(l'IRPEF non scende sotto zero)", 'incapienza');
  }
  t.riga('IRPEF netta', '− ' + eur2.format(r.irpefNetta), 'neg', '', 'irpefNetta');

  t.sezione('Addizionali locali',
            addizionali > 0 ? '− ' + eur2.format(addizionali) : eur2.format(0),
            addizionali > 0 ? 'neg' : '');
  t.riga('Addizionale regionale ' + r.regione.nome,
         '− ' + eur2.format(r.addizionaleRegionale), 'neg',
         '(' + descriviEnte(r.regione) + ')', 'addRegionale');

  // La soglia di esenzione comunale non e' una franchigia: superata, si
  // paga sull'intero imponibile e non sull'eccedenza. Il risultato e' uno
  // scalino secco, che qui va detto invece che subito.
  const soglia = r.comune.esenzioneFino || 0;
  let notaComunale = '(' + descriviEnte(r.comune) + ')';
  if (soglia > 0 && r.imponibile <= soglia) {
    notaComunale += ' — esente fino a ' + num0.format(soglia) + ' € di imponibile';
  } else if (soglia > 0 && r.imponibile > soglia && r.imponibile < soglia * 1.02) {
    notaComunale += ' — soglia appena superata: sotto ' + num0.format(soglia) +
                    ' € si paga zero, non si paga sull\'eccedenza';
  }
  t.riga('Addizionale comunale ' + r.comune.nome,
         r.addizionaleComunale > 0 ? '− ' + eur2.format(r.addizionaleComunale) : eur2.format(0),
         r.addizionaleComunale > 0 ? 'neg' : '',
         notaComunale, 'addComunale');

  if (aggiuntive > 0) {
    t.sezione('Somme aggiuntive', '+ ' + eur2.format(aggiuntive), 'pos');
    if (r.bonusCuneo > 0) {
      t.riga('Bonus taglio cuneo (esentasse)', '+ ' + eur2.format(r.bonusCuneo), 'pos', '', 'bonusCuneo');
    }
    if (r.trattamentoIntegrativo > 0) {
      t.riga('Trattamento integrativo', '+ ' + eur2.format(r.trattamentoIntegrativo), 'pos', '',
             'trattamentoIntegrativo');
    }
  }

  t.sezione('Risultato', '', '', false);
  t.riga('Totale trattenute', '− ' + eur2.format(r.totaleTrattenute), 'neg', '', 'totaleTrattenute');
  // Le somme aggiuntive tornano anche qui, sotto le trattenute. Sopra
  // stanno nel punto in cui maturano, ma il blocco del risultato deve
  // quadrare da solo: RAL meno trattenute piu' somme fa il netto. Senza
  // questa riga, a redditi bassi il conto sembra sbagliato.
  if (aggiuntive > 0) {
    t.riga('Somme aggiuntive', '+ ' + eur2.format(aggiuntive), 'pos',
           '(bonus cuneo e trattamento integrativo, dettagliati sopra)', 'sommeAggiuntive');
  }
  // Sotto i 10-11 mila euro di RAL le somme aggiuntive superano le
  // trattenute e il netto esce piu' alto del lordo. E' giusto, ma senza
  // una riga che lo dica passa per errore del calcolatore.
  const nettoSopraLordo = r.nettoAnnuo > r.ral;
  t.totale('Netto annuo', eur2.format(r.nettoAnnuo),
           nettoSopraLordo ? '(più alto della RAL: le somme aggiuntive superano le trattenute)' : '');
  t.totale('Netto mensile (' + mensilita + ' mensilità)', eur2.format(r.nettoMese));

  $('dettaglio').innerHTML = t.html();
}

// -------------------------------------------------------------
// Lato azienda
// -------------------------------------------------------------

// Quanto della spesa aziendale diventa stipendio in busta. Le somme
// aggiuntive (bonus cuneo, trattamento integrativo) restano fuori: le
// paga lo Stato tramite la busta paga, non l'azienda.
function nettoFinanziatoDallAzienda(r) {
  return r.nettoAnnuo - r.bonusCuneo - r.trattamentoIntegrativo;
}

function intestazioneAzienda(a, r) {
  const pizze = pizzeAttive();

  $('outCosto').textContent = pizze ? inPizze(a.costoTotale) : eur2.format(a.costoTotale);
  $('outCostoMese').textContent = pizze
    ? inPizze(a.costoMensile) + ' al mese, a ' + PREZZO_PIZZA + ' € l\'una'
    : eur2.format(a.costoMensile) + ' al mese, su 12 mesi';

  $('outRicarico').textContent = '+' + pct((a.moltiplicatore - 1) * 100);
  $('outMoltiplicatore').textContent =
    'ogni euro di RAL ne costa ' + a.moltiplicatore.toFixed(2).replace('.', ',');

  const quota = nettoFinanziatoDallAzienda(r) / a.costoTotale;
  $('outQuotaNetto').textContent = eur0.format(quota * 100);
}

// Il riquadro verde sopra la barra. Quale misura, quanto si risparmia,
// quanto resta da pagare, e con che criterio e' stata scelta. Il tetto e
// il dettaglio voce per voce stanno nella tabella sotto.
// Cifre arrotondate all'euro: sono stime su un anno intero, i centesimi
// darebbero una precisione che il calcolo non ha.
function scontoAzienda(a) {
  if (!a.agevolazione) {
    $('bloccoSconto').hidden = true;
    return;
  }
  $('bloccoSconto').hidden = false;

  const ag = a.agevolazione.agevolazione;
  $('scontoNome').textContent = ag.nome;
  $('scontoCifra').textContent = '− ' + eur0.format(a.sconto);
  $('scontoConfronto').innerHTML =
    'Costo annuo <span class="barrato">' + eur0.format(a.costoPieno) + '</span> ' +
    '<b>' + eur0.format(a.costoTotale) + '</b>';

  // La durata va detta sempre: lo sconto e' annuo, la misura no.
  const durata = 'La misura dura <b>' + ag.mesi + ' mesi</b> e vale ' +
    eur0.format(a.agevolazione.totaleDurata) + ' in tutto.';

  if (!a.agevolazioniScartate.length) {
    $('scontoCriterio').innerHTML = durata;
    return;
  }

  // Con piu' misure spuntate il criterio va scritto, non lasciato
  // dedurre: qui si sceglie sull'anno, e sull'intera durata la
  // graduatoria puo' ribaltarsi.
  const meglioSullaDurata = a.agevolazioniScartate
    .filter((s) => s.totaleDurata > a.agevolazione.totaleDurata);

  $('scontoCriterio').innerHTML =
    'Le misure non si cumulano: è applicata <b>quella che fa risparmiare ' +
    'di più nell\'anno</b>. ' + durata +
    (meglioSullaDurata.length
      ? ' Su tutta la durata converrebbe invece ' +
        meglioSullaDurata.map((s) =>
          s.agevolazione.breve + ' (' + eur0.format(s.totale) + ' l\'anno, ma ' +
          eur0.format(s.totaleDurata) + ' su ' + s.agevolazione.mesi + ' mesi)'
        ).join(', ') + '.'
      : '');
}

function barraAzienda(a, r) {
  const netto = nettoFinanziatoDallAzienda(r);
  // Le fette sommano al costo totale, non alla RAL: qui il 100% e'
  // quello che esce dal conto corrente dell'azienda.
  const voci = [
    { nome: 'Netto in busta al dipendente', valore: netto, colore: '#0a7a3d' },
    { nome: 'Contributi a carico dipendente', valore: r.contributiInps, colore: '#e0584a' },
    { nome: 'IRPEF e addizionali',
      valore: r.irpefNetta + r.addizionaleRegionale + r.addizionaleComunale, colore: '#f2b0a8' },
    // Al netto dell'agevolazione: la barra somma a quello che l'azienda
    // spende davvero, non a quello che spenderebbe senza sconto.
    { nome: 'Contributi a carico azienda' + (a.sconto > 0.005 ? ', agevolazione dedotta' : ''),
      valore: a.contributiDatoreNetti, colore: '#cc1f12' },
    { nome: 'INAIL', valore: a.inailNetto, colore: '#8f1409' },
    { nome: 'TFR, retribuzione differita', valore: a.tfrTotale, colore: '#b31d12' },
  ].filter((v) => v.valore > 0.005);

  $('barraAzienda').innerHTML = voci.map((v) =>
    '<span style="width:' + ((v.valore / a.costoTotale) * 100) + '%;background:' + v.colore +
    '" title="' + v.nome + '"></span>'
  ).join('');

  $('legendaAzienda').innerHTML = voci.map((v) =>
    '<div><i class="swatch" style="background:' + v.colore + '"></i>' + v.nome +
    ' <b>' + eur2.format(v.valore) + '</b> <span class="q">(' +
    pct((v.valore / a.costoTotale) * 100) + ')</span></div>'
  ).join('');
}

function dettaglioAzienda(a, r) {
  const t = tabella('dettaglioAzienda');

  t.sezione('Retribuzione', eur2.format(a.ral));
  t.riga('Retribuzione annua lorda', eur2.format(a.ral), '', '', 'ral');

  t.sezione('Contributi a carico dell\'azienda',
            '+ ' + eur2.format(a.contributiDatore), 'neg');
  a.voci.forEach((v) => {
    t.riga(v.nome, '+ ' + eur2.format(v.importo), 'neg',
           '(' + pctAliq(v.aliquota) + ')', v.info);
  });
  if (a.massimaleApplicato) {
    t.riga('Massimale contributivo', eur2.format(PARAMETRI_2026.massimale), '',
           '(la quota IVS si ferma qui, le altre voci no)', 'baseContributiva');
  }
  t.riga('Totale contributi', '+ ' + eur2.format(a.contributiDatore), 'neg',
         '(' + pctAliq(a.aliquotaDatore) + ' della RAL)');

  t.sezione('Assicurazione obbligatoria', '+ ' + eur2.format(a.inail), 'neg');
  t.riga('Premio INAIL', '+ ' + eur2.format(a.inail), 'neg',
         '(' + pctAliq(a.tassoInail) + ')', 'inail');

  // L'unica sezione in meno di tutta la tabella: e' il solo caso in cui
  // una riga toglie invece di aggiungere.
  if (a.agevolazione) {
    const ag = a.agevolazione.agevolazione;
    t.sezione('Agevolazione contributiva', '− ' + eur0.format(a.sconto), 'pos');
    t.riga(ag.nome, '', '',
           '(' + pctAliq(ag.sconto) +
           (ag.tettoAnnuo ? ', max ' + eur0.format(ag.tettoAnnuo) + ' l\'anno' : '') +
           ', ' + ag.mesi + ' mesi, vale ' + eur0.format(a.agevolazione.totaleDurata) +
           ' sull\'intera durata)', 'agevolazioni');
    t.riga('Sconto sui contributi INPS', '− ' + eur0.format(a.scontoContributi), 'pos',
           a.agevolazione.tettoRaggiunto ? '(limitato dal tetto annuo)' : '');
    t.riga('Sconto sul premio INAIL',
           a.scontoInail > 0.005 ? '− ' + eur0.format(a.scontoInail) : eur0.format(0),
           a.scontoInail > 0.005 ? 'pos' : '',
           ag.inail ? '' : '(questa misura non riduce l\'INAIL)');
    a.agevolazioniScartate.forEach((s) => {
      t.riga('Scartata: ' + s.agevolazione.breve, eur0.format(s.totale), '',
             '(' + eur0.format(s.totaleDurata) + ' su ' + s.agevolazione.mesi +
             ' mesi: non si cumulano, vale quella che sconta di più sull\'anno)');
    });
  }

  t.sezione('Retribuzione differita', '+ ' + eur2.format(a.tfrTotale), 'neg');
  t.riga('Quota di TFR maturata nell\'anno', '+ ' + eur2.format(a.tfrTotale), 'neg',
         '(RAL / 13,5)', 'tfr');
  t.riga('di cui accantonato per il lavoratore', eur2.format(a.tfrAccantonato), '', '(6,91%)');
  t.riga('di cui versato all\'INPS', eur2.format(a.tfrAlFondoPensioni), '', '(0,50%)');

  t.sezione('Risultato', '', '', false);
  if (a.sconto > 0.005) {
    t.riga('Costo senza agevolazione', eur2.format(a.costoPieno), '',
           '(ogni euro di RAL ne costerebbe ' +
           a.moltiplicatorePieno.toFixed(2).replace('.', ',') + ')');
  }
  t.riga('Costo totale annuo', eur2.format(a.costoTotale), '', '', 'costoTotale');
  t.totale('Costo mensile su 12 mesi', eur2.format(a.costoMensile));

  const netto = nettoFinanziatoDallAzienda(r);
  t.riga('Netto in busta pagato dall\'azienda', eur2.format(netto), 'pos',
         '(' + pct((netto / a.costoTotale) * 100) + ' del costo)');

  // A redditi bassi una parte del netto non la paga l'azienda: bonus
  // cuneo e trattamento integrativo transitano dalla busta ma li mette
  // lo Stato. Senza questa riga il totale del dipendente non tornerebbe.
  const somme = r.bonusCuneo + r.trattamentoIntegrativo;
  if (somme > 0.005) {
    t.riga('Somme aggiunte dallo Stato in busta', '+ ' + eur2.format(somme), 'pos',
           '(fuori dal costo aziendale: il dipendente incassa ' +
           eur2.format(r.nettoAnnuo) + ')');
  }
  // Il cuneo si misura sulla retribuzione corrente: il TFR esce da
  // entrambi i lati del rapporto, perche' al lavoratore arriva comunque,
  // solo piu' tardi. Tenerlo al denominatore gonfierebbe la base e
  // farebbe sembrare il cuneo piu' leggero di quanto e'.
  const baseCuneo = a.costoTotale - a.tfrTotale;
  t.riga('Cuneo fiscale e contributivo',
         eur2.format(baseCuneo - netto), 'neg',
         '(' + pct(((baseCuneo - netto) / baseCuneo) * 100) +
         ' del costo, TFR escluso da entrambi i lati)', 'cuneo');

  $('dettaglioAzienda').innerHTML = t.html();
}
