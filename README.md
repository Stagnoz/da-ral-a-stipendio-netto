# Calcolatore da RAL a Netto e Costo Azienda (2026)

Proiezione dettagliata della retribuzione netta in busta paga e del costo totale sostenuto dall'azienda a partire dalla Retribuzione Annua Lorda (RAL), applicando la normativa fiscale e contributiva italiana aggiornata al **2026**.

---

## Come funziona il calcolatore

Il calcolatore esegue una simulazione completa del cuneo fiscale e contributivo calcolando contemporaneamente due prospettive distinte a partire dallo stesso stipendio lordo (RAL):

1. **Lato dipendente (Retribuzione Netta)**:
   - **Contributi previdenziali INPS**: calcolo dell'aliquota a carico del lavoratore (9,19% IVS base + eventuali quote di FIS/CIGS in base all'inquadramento aziendale), applicando l'aliquota aggiuntiva dell'1% oltre il soffitto contributivo e il massimale per i nuovi iscritti dal 1996.
   - **Imponibile fiscale**: ottenuto detraendo i contributi INPS dalla RAL.
   - **IRPEF lorda**: calcolata sugli scaglioni di reddito vigenti.
   - **Detrazioni IRPEF**: applicazione della detrazione per lavoro dipendente, detrazione cuneo fiscale e maggiorazione per i redditi compresi tra 25.000 € e 35.000 €.
   - **Somme aggiuntive / Bonus cuneo**: calcolo del bonus erogato in busta paga per le fasce di reddito aventi diritto e trattamento integrativo.
   - **Addizionali locali**: calcolo delle addizionali regionali e comunali basate sulla residenza selezionata, tenendo conto di aliquote a scaglioni, aliquote uniche e soglie di esenzione.
   - **Detrazioni per carichi di famiglia**: sconti IRPEF applicabili in presenza di coniuge a carico, figli o altri familiari conviventi.
   - **Regime impatriati (rientro dei cervelli)**: abbattimento del 50% dell'imponibile fiscale, che sale al 60% in presenza di un figlio minore, entro il tetto di 600.000 € di reddito annuo. La quota agevolata non concorre a formare il reddito, quindi riduce IRPEF, detrazioni e addizionali locali; i contributi previdenziali restano invece dovuti sull'intera RAL. Fanno eccezione il taglio del cuneo e il trattamento integrativo, che per circolare guardano il reddito comprensivo della quota esente: a redditi bassi il regime può quindi far perdere il trattamento integrativo e abbassare il netto, e il calcolatore lo segnala.

2. **Lato azienda (Costo Totale del Lavoro)**:
   - **Contributi a carico del datore**: contributi previdenziali ed assistenziali INPS calcolati sul lordo in base all'inquadramento settoriale (Industria fino a 15 dipendenti, Industria oltre 50 dipendenti, Terziario, o aliquota personalizzata).
   - **Premio INAIL**: assicurazione obbligatoria contro infortuni parametrata al rischio aziendale.
   - **Quota di TFR (Trattamento di Fine Rapporto)**: accantonamento annuo (7,41% della RAL), suddiviso tra retribuzione differita accantonata e versamento al Fondo Pensioni/Tesorerie INPS.
   - **Agevolazioni contributive**: applicazione e confronto automatico delle principali misure di sgravio (es. Under 30, Donne, Over 50).

---

## Funzionalità principali

- **Doppia vista alternabile (Punto di vista)**:
  - **Lato dipendente**: focus su netto mensile (12, 13 o 14 mensilità), netto annuo, dettaglio trattenute e detrazioni.
  - **Lato azienda**: focus su costo totale annuo, incidenza percentuale sopra la RAL, spesa mensile e ripartizione delle voci di costo.
- **Ripartizione grafica della spesa**:
  - Barre visive che mostrano dove vanno a finire i soldi (stipendio netto, imposte, contributi, TFR, INAIL).
- **Personalizzazione parametri**:
  - Selezione della regione e del comune di residenza con calcolo automatico delle addizionali locali.
  - Configurazione dei familiari a carico (coniuge, figli, altri familiari).
  - Selezione del regime impatriati (quota esente al 50% o al 60% con figlio minore), con riquadro che mostra quanto vale il regime in euro: netto con e senza, guadagno mensile e sull'intero quinquennio.
  - Selezione dell'inquadramento aziendale e del tasso INAIL.
  - Selezione delle agevolazioni contributive applicabili al datore di lavoro.
- **Dettaglio numerico voce per voce**:
  - Tabelle espandibili con la spiegazione normativa di ciascun prelievo o detrazione.

---

## Struttura dei file

```
.
├── index.html              # Interfaccia grafica principale dell'applicazione web
├── fonti.html              # Pagina di documentazione dettagliata su fonti normative e formule
├── app.js                  # Logica di orchestrazione dell'interfaccia utente e gestione eventi
├── spiegazioni.js          # Testi esplicativi e note normative per ciascuna voce di calcolo
├── bundle.js               # Bundle JS unico compilato pronto per l'esecuzione del browser
├── package.json            # Configurazione di progetto, script di build e dipendenze
├── test.js                 # Suite di test unitari e di verifica dei casi limite
└── calc/                   # Motore di calcolo fiscale e contributivo (moduli ES)
    ├── index.js            # Punto di ingresso unico per le funzioni e costanti di calcolo
    ├── calcolo-dipendente.js# Calcolo del netto annuo/mensile, IRPEF e trattenute lavoratore
    ├── calcolo-azienda.js   # Calcolo del costo aziendale totale, contributi datore e TFR
    ├── tasse-dipendente.js  # Gestione di addizionali locali, detrazioni lavoro e bonus cuneo
    ├── confronti.js        # Calcolo del confronto con le medie retributive nazionali
    ├── costanti.js         # Costanti normative (scaglioni IRPEF, aliquote INPS, comuni, ecc.)
    └── utils.js            # Funzioni helper per arrotondamenti e formattazione numerica
```
