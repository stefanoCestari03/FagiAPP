# 🏗️ Fagitana Cantieri – App Web

Applicazione web per la gestione quotidiana dei cantieri della **Cooperativa Edile Fagitana**.

---

## 🚀 GUIDA AL DEPLOY COMPLETA

### 1. PREREQUISITI
- Account [Supabase](https://supabase.com) (gratuito)
- Account [Vercel](https://vercel.com) (gratuito)
- Account [GitHub](https://github.com) (gratuito)
- Node.js 18+ installato sul tuo computer

---

## 📦 PARTE 1 – SUPABASE (Database)

### Step 1.1 – Crea il progetto
1. Vai su **supabase.com** → "New Project"
2. Nome progetto: `fagitana-cantieri`
3. Scegli password sicura per il DB
4. Regione: **West EU (Ireland)** (più vicina all'Italia)
5. Aspetta ~2 minuti che si crei

### Step 1.2 – Crea le tabelle (SQL)
1. Nel pannello Supabase → **SQL Editor** → "New Query"
2. Copia tutto il contenuto del file `src/lib/supabase.js` (dal commento in poi)
3. Incollalo e clicca **Run**
4. ✅ Vedrai 6 tabelle create + 7 operai inseriti

### Step 1.3 – Crea gli utenti (login)
1. **Authentication** → **Users** → "Invite user"
2. Inserisci l'email di ogni operaio che deve accedere
3. Oppure: **Authentication** → **Settings** → abilita "Email confirmations: OFF" per test rapidi

### Step 1.4 – Ottieni le chiavi API
1. **Settings** → **API**
2. Copia:
   - **Project URL** → es: `https://abcdefgh.supabase.co`
   - **anon public key** → stringa lunga che inizia con `eyJ...`

---

## 📁 PARTE 2 – SETUP LOCALE

```bash
# Entra nella cartella del progetto
cd fagitana-app

# Copia il file di configurazione
cp .env.example .env

# Apri .env e inserisci le tue chiavi Supabase:
# REACT_APP_SUPABASE_URL=https://tuocodice.supabase.co
# REACT_APP_SUPABASE_ANON_KEY=eyJ...

# Installa le dipendenze
npm install

# Avvia in locale (per testare)
npm start
# → apri http://localhost:3000
```

---

## ☁️ PARTE 3 – DEPLOY SU VERCEL

### Step 3.1 – Pubblica su GitHub
```bash
# Nella cartella fagitana-app:
git init
git add .
git commit -m "Fagitana Cantieri – versione iniziale"

# Crea un repository su github.com (chiamalo "fagitana-cantieri")
# Poi collega e pusha:
git remote add origin https://github.com/TUO-USERNAME/fagitana-cantieri.git
git branch -M main
git push -u origin main
```

### Step 3.2 – Connetti a Vercel
1. Vai su **vercel.com** → "Add New Project"
2. Clicca **"Import Git Repository"**
3. Seleziona il repo `fagitana-cantieri`
4. Framework Preset: **Create React App** (si riconosce da solo)

### Step 3.3 – Aggiungi le variabili d'ambiente
In Vercel, prima di fare Deploy:
- **Environment Variables** → aggiungi:
  - `REACT_APP_SUPABASE_URL` = `https://tuocodice.supabase.co`
  - `REACT_APP_SUPABASE_ANON_KEY` = `eyJ...`

### Step 3.4 – Deploy!
- Clicca **Deploy**
- Aspetta ~2 minuti
- ✅ La tua app è online su: `https://fagitana-cantieri.vercel.app`

### Step 3.5 – Dominio personalizzato (opzionale)
1. Acquista dominio es. `fagitana-cantieri.it` da Aruba o Namecheap
2. In Vercel → **Domains** → aggiungi il tuo dominio
3. Segui le istruzioni per impostare il DNS presso il tuo registrar
4. HTTPS viene configurato automaticamente da Vercel

### Aggiornamenti futuri
Ogni volta che modifichi il codice e fai `git push`, Vercel ri-deploya automaticamente in ~2 minuti. Zero configurazione.

---

## 📱 PARTE 4 – L'APP SUGLI SMARTPHONE (SENZA APP STORE)

### Metodo immediato: PWA (Progressive Web App)

L'app è già configurata come PWA. Gli operai possono **installarla sul telefono come se fosse un'app nativa**, senza passare per App Store o Play Store.

#### Su Android (Chrome):
1. Apri l'app nel browser Chrome
2. Compare automaticamente un banner "Aggiungi a schermata Home"
3. Oppure: Menu Chrome (3 puntini) → **"Aggiungi a schermata Home"**
4. L'app appare come icona sul desktop del telefono ✅
5. Si apre a schermo intero, senza barra del browser

#### Su iPhone (Safari):
1. Apri l'app in Safari
2. Tocca il pulsante **Condividi** (quadrato con freccia su)
3. Scorri e tocca **"Aggiungi a schermata Home"**
4. Dai un nome ("Fagitana") e tocca "Aggiungi" ✅
5. L'app appare come icona e si apre a schermo intero

**Vantaggi PWA:**
- ✅ Funziona anche con connessione scarsa
- ✅ Si installa in 10 secondi
- ✅ Aggiornamenti automatici (basta aggiornare il codice)
- ✅ Zero costi di pubblicazione
- ✅ Perfetta per uso aziendale interno

---

## 📲 PARTE 5 – PUBBLICAZIONE NEGLI APP STORE (Fase futura)

Quando vuoi una vera app nativa negli store, ci sono due strade:

### Opzione A: Capacitor (consigliata, ~1-2 settimane di lavoro)

Capacitor è uno strumento che "impacchetta" la tua app React esistente in un'app nativa iOS e Android, senza riscrivere nulla.

```bash
# Installa Capacitor nel progetto
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android

npx cap init "Fagitana Cantieri" "it.fagitana.cantieri"

# Build dell'app React
npm run build

# Aggiungi le piattaforme
npx cap add ios
npx cap add android

# Sincronizza
npx cap sync

# Apri in Xcode (per iOS) o Android Studio (per Android)
npx cap open ios
npx cap open android
```

Poi dall'IDE si fa il build finale e si pubblica negli store.

### Opzione B: React Native (più potente, più lavoro)

Riscrivere l'app in React Native dà più controllo sulle funzionalità native (notifiche push, fotocamera, GPS). Richiede 4-8 settimane di lavoro in più. Consigliato solo se servono funzionalità native avanzate.

---

### Requisiti per pubblicare nell'App Store (iOS)

| Cosa serve | Dettagli | Costo |
|---|---|---|
| Account Apple Developer | developer.apple.com | €99/anno |
| Mac con Xcode | Per compilare l'app iOS | – |
| Revisione Apple | 1-7 giorni di attesa | – |
| Icone app (vari formati) | 1024×1024px + varianti | – |
| Screenshot per store | 6.5" e 5.5" iPhone | – |

### Requisiti per pubblicare su Play Store (Android)

| Cosa serve | Dettagli | Costo |
|---|---|---|
| Account Google Play | play.google.com/console | €25 una tantum |
| Firma APK/AAB | Generata con Android Studio | – |
| Revisione Google | 1-3 giorni | – |
| Icone e screenshot | Come iOS | – |

---

## 🗂️ STRUTTURA DEL PROGETTO

```
fagitana-app/
├── public/
│   ├── index.html          ← HTML base con meta PWA
│   └── manifest.json       ← Configurazione PWA (icona, colori, nome)
├── src/
│   ├── App.js              ← Router principale
│   ├── index.js            ← Entry point React
│   ├── index.css           ← Tutti gli stili (design Fagitana)
│   ├── context/
│   │   └── AuthContext.js  ← Gestione login/logout
│   ├── lib/
│   │   └── supabase.js     ← Client DB + schema SQL (nei commenti)
│   ├── components/
│   │   └── Layout.js       ← Sidebar + topbar + navigazione
│   └── pages/
│       ├── Login.js        ← Pagina di accesso
│       ├── Dashboard.js    ← Homepage con statistiche
│       ├── Calendario.js   ← Calendario interattivo mensile
│       ├── NuovaGiornata.js← Form registrazione giornaliera
│       └── Cantieri.js     ← Gestione cantieri
├── .env.example            ← Template variabili d'ambiente
├── vercel.json             ← Configurazione routing Vercel
└── package.json            ← Dipendenze npm
```

---

## 🔒 SICUREZZA

- **Autenticazione**: gestita da Supabase Auth (email + password)
- **Row Level Security**: ogni tabella accetta solo richieste da utenti autenticati
- **Chiavi API**: solo la chiave `anon` è nel frontend (è sicuro, le policy RLS proteggono i dati)
- **HTTPS**: attivo automaticamente su Vercel e Supabase

---

## 🛠️ AGGIUNGERE FUNZIONALITÀ IN FUTURO

Il codice è strutturato per permettere aggiunte facili:

1. **Nuova schermata** → crea `src/pages/NuovaSchermata.js` + aggiungi route in `App.js` + voce in `Layout.js`
2. **Nuova tabella DB** → aggiungi SQL in Supabase, poi usa `supabase.from('nuova_tabella')` nelle pagine
3. **Export PDF** → installa `jspdf` e leggi i dati da Supabase → genera PDF
4. **Riepilogo ore** → query `presenze` raggruppate per operaio e periodo

---

## 📞 SUPPORTO

Per problemi tecnici:
- **Supabase docs**: docs.supabase.com
- **Vercel docs**: vercel.com/docs
- **React docs**: react.dev
- **Capacitor docs**: capacitorjs.com

---

*Cooperativa Edile Fagitana – Baselga di Pinè (TN)*
