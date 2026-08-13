/*
 * Testi delle schede che si aprono accanto a ogni voce del calcolo.
 *
 * Stanno qui e non nell'HTML per un motivo pratico: sono la parte che
 * si riscrive piu' spesso, e tenerli separati evita di rimettere le
 * mani nel markup ogni volta che cambia una frase.
 *
 * Ogni scheda risponde sempre alle stesse tre domande: cos'e', chi la
 * paga, dove finiscono i soldi. La riga `norma` e' l'articolo che la
 * istituisce, cosi' chi vuole controllare sa dove guardare.
 */

export const SPIEGAZIONI = {
  // ----- lato dipendente -----

  ral: {
    titolo: 'Retribuzione annua lorda',
    testo: 'È la retribuzione annua prima di qualsiasi trattenuta, indicata nel contratto di lavoro. ' +
      'Non comprende il TFR, che matura a parte, né i contributi a carico del datore di lavoro. ' +
      'L\'intero calcolo parte da questo importo.',
  },

  baseContributiva: {
    titolo: 'Massimale contributivo',
    testo: 'Sopra 122.295 € di retribuzione non si versano più contributi pensionistici. ' +
      'Il tetto vale solo per chi si è iscritto all\'INPS dal 1° gennaio 1996 in poi. ' +
      'Chi ha anzianità precedente versa su tutta la retribuzione, senza limite.',
    norma: 'art. 2 comma 18 L. 335/1995 · dalla circolare INPS 6/2026',
  },

  ivs: {
    titolo: 'Contributi IVS a tuo carico',
    testo: 'IVS sta per Invalidità, Vecchiaia e Superstiti: è il contributo previdenziale primario che accantona la tua futura pensione. ' +
      'Queste somme non vanno al bilancio generale dello Stato come una tassa, ma confluiscono direttamente nel tuo montante contributivo personale presso l\'INPS. ' +
      'L\'aliquota pensionistica totale è del 33% dell\'imponibile: il 9,19% viene trattenuto mese per mese in busta paga (ovvero l\'importo mostrato qui), mentre il restante 23,81% è versato dal datore di lavoro.',
    norma: 'aliquota IVS del Fondo pensioni lavoratori dipendenti',
  },

  aggiuntivo1: {
    titolo: 'Contributo aggiuntivo dell\'1%',
    testo: 'È un contributo previdenziale aggiuntivo dell\'1% a carico esclusivo del lavoratore. ' +
      'Non si applica sull\'intera retribuzione, ma solo sulla parte di stipendio che supera la soglia della prima fascia pensionistica (56.224 € nel 2026). ' +
      'Chi ha una RAL fino a 56.224 € non paga questo contributo.',
    norma: 'art. 3-ter L. 438/1992',
  },

  lavCigs: {
    titolo: 'CIGS',
    testo: 'Cassa Integrazione Guadagni Straordinaria: la quota a tuo carico è dello 0,30%, dovuta per le aziende con più di 15 dipendenti. ' +
      'Come tutti i contributi previdenziali, è interamente deducibile dall\'imponibile fiscale.',
    norma: 'D.Lgs. 148/2015, soglia dei 15 dipendenti dalla L. 234/2021',
  },

  lavFis: {
    titolo: 'FIS',
    testo: 'Fondo di Integrazione Salariale: la quota a tuo carico è dello 0,27%. ' +
      'Come tutti i contributi previdenziali, è interamente deducibile dall\'imponibile fiscale.',
    norma: 'art. 29 D.Lgs. 148/2015',
  },

  imponibile: {
    titolo: 'Imponibile fiscale',
    testo: 'È il valore effettivo su cui si calcolano le imposte (IRPEF e addizionali) e si ottiene sottraendo alla RAL i contributi previdenziali INPS a tuo carico.',
    norma: 'art. 51 comma 2 lett. a) TUIR',
  },

  impatriati: {
    titolo: 'Regime impatriati (rientro dei cervelli)',
    testo: 'Consente a chi trasferisce la residenza fiscale in Italia dall\'estero di pagare le tasse solo sul 50% del reddito (o sul 40% in presenza di un figlio minore). ' +
      'Essendo un\'esenzione dal reddito, riduce sia l\'IRPEF che le addizionali regionali e comunali. ' +
      'L\'agevolazione vale per 5 anni su un massimo di 600.000 € di reddito annuo. ' +
      'I contributi INPS restano calcolati sull\'intera RAL e non c\'è alcun impatto sul costo aziendale. ' +
      'Attenzione ai redditi bassi: abbattendo l\'imposta lorda si può perdere il trattamento integrativo, che vale 1.200 €, e in quel caso il regime fa scendere il netto invece di alzarlo.',
    norma: 'art. 5 D.Lgs. 209/2023 (trasferimenti dal 2024)',
  },

  imponibileIrpef: {
    titolo: 'Imponibile IRPEF agevolato',
    testo: 'È il reddito effettivo su cui vengono calcolate IRPEF, detrazioni e addizionali locali dopo l\'abbattimento del regime impatriati. ' +
      'L\'imponibile INPS rimane invece quello pieno. ' +
      'Fanno eccezione il taglio del cuneo e il trattamento integrativo: per quelli il reddito di riferimento è quello comprensivo della quota esente, quindi il regime non fa scendere nessuno in una fascia più favorevole.',
    norma: 'art. 5 comma 1 D.Lgs. 209/2023 · circolari AdE 4/E del 2025 e 29/E del 2020',
  },

  irpefLorda: {
    titolo: 'IRPEF lorda',
    testo: 'L\'imposta sul reddito, calcolata per scaglioni: 23% fino a 28.000 €, 33% da 28.000 a 50.000, 43% oltre. ' +
      'Gli scaglioni non funzionano a gradini secchi, per esempio: se guadagni 30.000 € non paghi il 33% su tutto, ' +
      'ma il 23% sui primi 28.000 e il 33% solo sui 2.000 che avanzano.',
    norma: 'art. 11 TUIR, aliquote modificate dalla L. 199/2025',
  },

  detrLavoro: {
    titolo: 'Detrazione per lavoro dipendente',
    testo: 'È uno sconto fiscale riconosciuto a tutti i lavoratori dipendenti che riduce direttamente l\'IRPEF da pagare (aumentando così il netto in busta paga). ' +
      'La detrazione massima è di 1.955 € per redditi fino a 15.000 €, diminuendo progressivamente all\'aumentare del reddito fino ad azzerarsi a 50.000 €. ' +
      'Nella fascia tra 25.001 € e 35.000 € è prevista un\'ulteriore integrazione fissa di 65 €.',
    norma: 'art. 13 commi 1 e 1.1 TUIR',
  },

  detrCuneo: {
    titolo: 'Detrazione del taglio del cuneo fiscale',
    testo: 'Aumenta lo stipendio netto:' +
      'Sotto i 20.000 € non è una detrazione ma una somma esentasse che si aggiunge al netto.' +
      'Tra 20.000 e 32.000 € di reddito vale 1.000 € pieni, poi si riduce in modo lineare fino ad azzerarsi a 40.000 €. ',
    norma: 'art. 1 commi 4-9 L. 207/2024, misura strutturale',
  },

  detrConiuge: {
    titolo: 'Detrazione per il coniuge a carico',
    testo: 'Spetta per il coniuge non separato con reddito proprio sotto 2.840,51 € l\'anno. ' +
      'L\'importo dipende dal tuo reddito: parte da 800 €, si assesta su 690 € nella fascia centrale e si azzera sopra gli 80.000 €. ' +
      'Come tutte le detrazioni, riduce l\'imposta e non il reddito.',
    norma: 'art. 12 comma 1 lett. a) TUIR',
  },

  detrFigli: {
    titolo: 'Detrazione per i figli a carico',
    testo: 'Dal 2025 spetta solo per i figli tra 21 e 30 anni; in caso di figli disabili non c\'è limite d\'età. ' +
      'Sotto i 21 anni non c\'è detrazione ma assegno unico, che l\'INPS versa a parte e non passa dalla busta paga. ' +
      'La detrazione base è di 950 € per figlio, ridotta al crescere del reddito.',
    norma: 'art. 12 comma 1 lett. c) TUIR, riscritto dalla L. 207/2024',
  },

  detrAltri: {
    titolo: 'Detrazione per gli ascendenti conviventi',
    testo: 'Genitori o nonni a carico, ma solo se convivono stabilmente con te. ' +
      'La detrazione base è di 750 € per familiare, ridotta al crescere del reddito e azzerata sopra gli 80.000 €. ',
    norma: 'art. 12 comma 1 lett. d) TUIR',
  },

  incapienza: {
    titolo: 'Detrazioni perse per incapienza',
    testo: 'Le detrazioni riducono l\'imposta, ma non possono spingerla sotto zero: nessuno riceve un rimborso perché le detrazioni superano l\'IRPEF. ' +
      'Questa riga è la parte di sconto a cui avresti diritto e che si perde perché l\'imposta si azzera prima ' +
      'Capita ai redditi bassi, dove le detrazioni valgono quasi quanto l\'imposta piena.',
  },

  irpefNetta: {
    titolo: 'IRPEF netta',
    testo: 'L\'imposta che paghi davvero: la lorda meno tutte le detrazioni. ' +
      'Il datore di lavoro la trattiene mese per mese e la versa allo Stato al posto tuo, come sostituto d\'imposta. ' +
      'Va al bilancio dello Stato e finanzia la spesa pubblica generale.',
  },

  addRegionale: {
    titolo: 'Addizionale regionale',
    testo: 'Un\'imposta in più sullo stesso imponibile IRPEF, che va alla regione dove hai il domicilio fiscale e finanzia soprattutto la sanità. ' +
      'Ogni regione decide la propria aliquota entro limiti fissati dallo Stato, e alcune la fanno crescere per scaglioni. ' +
      'Tra la regione più cara e la più economica ballano più di mille euro l\'anno su una RAL media.',
    norma: 'D.Lgs. 446/1997, aliquote deliberate da ogni regione',
  },

  addComunale: {
    titolo: 'Addizionale comunale',
    testo: 'Un\'imposta in più sullo stesso imponibile IRPEF, che va al comune di residenza. ' +
      'Ogni comune decide la propria aliquota entro limiti fissati dallo Stato, e alcuni la fanno crescere per scaglioni. ' +
      'Molti comuni fissano una soglia di esenzione, sotto quella soglia non paghi nulla, una volta superata inizi a pagarla.',
    norma: 'D.Lgs. 360/1998, delibere comunali',
  },

  bonusCuneo: {
    titolo: 'Bonus del taglio del cuneo',
    testo: 'Sotto i 20.000 € di reddito il taglio del cuneo non è una detrazione ma una somma che si aggiunge al netto, e non è tassata. ' +
      'Vale il 7,1%, il 5,3% o il 4,8% del reddito a seconda della fascia. ' +
      'È un trasferimento vero e proprio: per questo a redditi bassi il netto può superare il lordo.',
    norma: 'art. 1 commi 4-9 L. 207/2024',
  },

  trattamentoIntegrativo: {
    titolo: 'Trattamento integrativo',
    testo: 'I 1.200 € l\'anno che tutti chiamano ancora bonus Renzi, oggi riservati a chi sta sotto i 15.000 € di reddito. ' +
      'È denaro erogato in busta paga, a condizione che l\'IRPEF lorda superi la detrazione da lavoro dipendente. ' +
      'Nella fascia 15.000-28.000 € spetta solo a chi ha altre detrazioni, che in questo caso semplice non ci sono.',
    norma: 'art. 1 D.L. 3/2020, convertito in L. 21/2020',
  },

  sommeAggiuntive: {
    titolo: 'Somme aggiuntive',
    testo: 'Rappresentano l\'importo totale erogato dallo Stato in busta paga, dato dalla somma del bonus del cuneo fiscale e del trattamento integrativo. ' +
      'Essendo somme esentasse erogate direttamente dallo Stato, si sommano interamente allo stipendio netto. ' +
      'Per le retribuzioni più basse (all\'incirca tra 9.400 € e 11.900 €) tali somme possono superare le trattenute totali, rendendo il netto annuo superiore alla RAL lorda.',
    norma: 'art. 1 commi 4-9 L. 207/2024 e art. 1 D.L. 3/2020',
  },

  totaleTrattenute: {
    titolo: 'Totale trattenute',
    testo: 'La somma di contributi, IRPEF netta e addizionali: tutto quello che dalla RAL non arriva sul tuo conto. ' +
      'Vale la pena distinguere tra contributi e imposte: i contributi tornano indietro come pensione, le imposte no. ' +
      'Per questo la percentuale di trattenute è sempre più alta dell\'aliquota fiscale effettiva.',
  },

  // ----- lato azienda -----

  datoreIvs: {
    titolo: 'IVS a carico dell\'azienda',
    testo: 'È la quota di contributi pensionistici a carico del datore di lavoro (pari al 23,81% della RAL) che, insieme al 9,19% trattenuto al dipendente, compone il 33% complessivo destinato alla pensione del lavoratore. ' +
      'Costituisce la voce più consistente dei contributi aziendali. ' +
      'Sopra la soglia del massimale contributivo di 122.295 € questo contributo non è più dovuto.',
    norma: 'aliquota IVS del Fondo pensioni lavoratori dipendenti',
  },

  datoreMalattia: {
    titolo: 'Contributo di malattia',
    testo: 'È il contributo previdenziale a carico dell\'azienda che finanzia l\'indennità pagata dall\'INPS al lavoratore in caso di assenza per malattia.',
  },

  datoreNaspi: {
    titolo: 'Contributo NASpI',
    testo: 'È il contributo a carico esclusivo dell\'azienda che finanzia l\'indennità di disoccupazione. L\'1,61% complessivo è composto dall\'1,31% per la NASpI e dallo 0,30% per i fondi di formazione professionale.',
    norma: 'art. 2 commi 25-28 L. 92/2012',
  },

  datoreCigo: {
    titolo: 'Contributo CIGO',
    testo: 'Cassa Integrazione Guadagni Ordinaria: copre le sospensioni temporanee per eventi non dipendenti dall\'azienda. Si applica all\'industria, con aliquote che aumentano in base al numero di dipendenti.',
    norma: 'D.Lgs. 148/2015',
  },

  datoreCigs: {
    titolo: 'Contributo CIGS',
    testo: 'Cassa Integrazione Guadagni Straordinaria: interviene su riorganizzazioni, crisi aziendali e contratti di solidarietà. L\'aliquota a carico dell\'azienda è dello 0,60% e si applica sopra i 15 dipendenti.',
    norma: 'D.Lgs. 148/2015, come modificato dalla L. 234/2021',
  },

  datoreFis: {
    titolo: 'Contributo FIS',
    testo: 'Fondo di Integrazione Salariale: è la cassa integrazione per le aziende non coperte dalla CIGO, principalmente nel terziario e nei servizi. ' +
      'Interviene per tutelare il reddito dei lavoratori in caso di riduzione o sospensione dell\'attività. ' +
      'L\'aliquota a carico dell\'azienda è dello 0,33% fino a 5 dipendenti e dello 0,53% oltre i 5 dipendenti.',
    norma: 'D.Lgs. 148/2015, come modificato dalla L. 234/2021',
  },

  datoreCuaf: {
    titolo: 'Contributo ex CUAF',
    testo: 'È il contributo previdenziale a carico dell\'azienda destinato a finanziare le prestazioni di sostegno alla famiglia.',
    norma: 'art. 120 L. 388/2000',
  },

  datoreMaternita: {
    titolo: 'Contributo di maternità',
    testo: 'Finanzia l\'indennità INPS per i congedi di maternità e paternità. ' +
      'È una voce piccola, tra lo 0,24% e lo 0,46% a seconda del settore, e la paga interamente l\'azienda.',
  },

  datoreFondoGaranzia: {
    titolo: 'Fondo di garanzia TFR',
    testo: 'Una specie di assicurazione: se l\'azienda fallisce e non riesce a pagare il TFR, ci pensa l\'INPS. ' +
      'Costa lo 0,20% della retribuzione e la versa il datore di lavoro. ' +
      'Non va confuso con lo 0,50% che esce dall\'accantonamento del TFR: sono due prelievi diversi.',
    norma: 'art. 2 L. 297/1982',
  },

  inail: {
    titolo: 'Premio INAIL',
    testo: 'Assicurazione obbligatoria contro infortuni sul lavoro e malattie professionali, pagata al 100% dall\'azienda. ' +
      'Il tasso non dipende dallo stipendio ma dal rischio della lavorazione. ' +
      'Il tasso può poi oscillare in base agli infortuni degli anni precedenti.',
    norma: 'tariffe dei premi, DM 27 febbraio 2019',
  },

  tfr: {
    titolo: 'Quota di TFR',
    testo: 'Trattamento di Fine Rapporto: è una quota di retribuzione differita che matura ogni anno e si incassa al termine del rapporto di lavoro. ' +
      'La quota annua è pari al 7,41% della RAL: lo 0,50% va all\'INPS come contributo pensionistico, mentre il restante 6,91% costituisce l\'accantonamento effettivo per il lavoratore. ',

    norma: 'art. 2120 c.c. · art. 3 L. 297/1982',
  },

  costoTotale: {
    titolo: 'Costo totale',
    testo: 'Quello che l\'azienda mette a bilancio per tenerti: RAL più contributi, premio INAIL e quota di TFR. ' +
      'È il numero da cui parte chi decide un\'assunzione, mentre il dipendente ragiona sul netto mensile. ' +
      'Fra i due estremi c\'è tutto il resto di questa pagina.',
  },

  cuneo: {
    titolo: 'Cuneo fiscale e contributivo',
    testo: 'La distanza tra quello che l\'azienda spende e quello che arriva in tasca al dipendente. ' +
      'Dentro ci stanno contributi di entrambe le parti, IRPEF e addizionali. ' +
      'Il TFR resta fuori dal conto: è retribuzione differita, arriva al lavoratore più tardi, ' +
      'e tenerlo al denominatore farebbe sembrare il cuneo più leggero di quanto è.',
  },

  agevolazioni: {
    titolo: 'Agevolazioni contributive',
    testo: 'Sono incentivi previsti per ridurre i contributi a carico dell\'azienda e favorire l\'assunzione di specifiche categorie di lavoratori (come giovani under 30, donne e over 50). ' +
      'Questi sconti non riducono né lo stipendio netto né la RAL del dipendente, a cui viene garantito il versamento contributivo pieno ai fini pensionistici. ' +
      'Il risparmio va a beneficio esclusivo dell\'azienda sul costo del lavoro. Le misure non sono cumulabili tra loro: in presenza di più requisiti, viene applicata automaticamente quella più conveniente sull\'anno, ' +
      'coerentemente con le altre cifre della pagina, che sono tutte annuali. Poiché le misure hanno durate diverse (36 mesi l\'under 30, 18 mesi le altre due), su tutto il periodo del beneficio può convenire l\'altra: il calcolatore mostra entrambi i valori.',
    norma: 'L. 205/2017 art. 1 c. 100 · L. 92/2012 art. 4 c. 8-11',
  },
};
