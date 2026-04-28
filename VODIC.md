# Domači Proračun — Vodič za objavo aplikacije

## Kaj bomo naredili

Tvoja proračunska aplikacija bo šla iz Claudeovega okna na pravi spletni naslov (URL), ki ga lahko odpreš na telefonu, tablici ali računalniku — kadarkoli. Brezplačno.

**Končni rezultat:** `https://domaci-proracun.vercel.app` (ali ime, ki ga izbereš)

---

## Pred začetkom — kaj potrebuješ

- Računalnik (Windows, Mac ali Linux)
- Internet povezavo
- 30–45 minut časa
- Nobene predhodne izkušnje s programiranjem

---

## KORAK 1: Namesti Node.js (5 min)

Node.js je program, ki poganja tvojo aplikacijo. Brez njega ne deluje.

### Windows / Mac:
1. Odpri brskalnik in pojdi na: **https://nodejs.org**
2. Klikni na zeleni gumb **"LTS"** (leva stran) — to je stabilna verzija
3. Prenesi in odpri datoteko
4. Klikni "Next" / "Continue" skozi celoten namestitveni čarovnik (ne spreminjaj ničesar)
5. Ko se namestitev konča, **zapri in ponovno odpri terminal**

### Kako odpreš terminal:
- **Windows:** pritisni `Windows tipka`, napiši `cmd`, pritisni Enter
- **Mac:** pritisni `Cmd + Space`, napiši `Terminal`, pritisni Enter

### Preveri, da je nameščeno:
V terminal napiši in pritisni Enter:
```
node --version
```
Če vidiš številko (npr. `v20.15.0`), je OK. Če dobiš napako, ponovno namesti Node.js.

---

## KORAK 2: Namesti VS Code (5 min)

VS Code je program za urejanje kode. Kot Word, samo za programerje.

1. Pojdi na: **https://code.visualstudio.com**
2. Prenesi in namesti (klikaj "Next" skozi vse)
3. Odpri VS Code

---

## KORAK 3: Razpakiraj projektne datoteke (2 min)

Skupaj s tem vodičem si prejel datoteko **`domaci-proracun.zip`**.

1. Najdi ZIP datoteko v mapi s prenosi
2. Z desnim klikom izberi **"Razširi vse"** (Windows) ali dvojni klik (Mac)
3. Premakni mapo `domaci-proracun` na namizje ali kam želiš

### Odpri projekt v VS Code:
1. Odpri VS Code
2. Klikni **File → Open Folder**
3. Izberi mapo `domaci-proracun`
4. Klikni "Open"

Levo bi moral videti datoteke: `package.json`, `index.html`, `src/`, `vite.config.js`

---

## KORAK 4: Namesti odvisnosti (2 min)

Tvoja aplikacija potrebuje knjižnice (kot dodatki za telefon). Nameščamo jih enkrat.

### Odpri terminal v VS Code:
Pritisni **Ctrl + `** (tipka nad Tab) ali klikni **Terminal → New Terminal** v meniju zgoraj.

V terminalu napiši in pritisni Enter:
```
npm install
```

Počakaj 30–60 sekund. Videl boš tekst, ki drsi po zaslonu. Ko se ustavi in vidiš `added X packages`, je končano. Če vidiš kakšna "warn" opozorila, jih ignoriraj — to je normalno.

---

## KORAK 5: Zaženi lokalno (1 min)

Najprej bomo preverili, da aplikacija deluje na tvojem računalniku.

V terminalu napiši:
```
npm run dev
```

Videl boš nekaj takega:
```
  VITE v5.4.0  ready in 300 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.5:5173/
```

**Odpri brskalnik in pojdi na:** `http://localhost:5173/`

Tvoja proračunska aplikacija bi se morala prikazati! Klikaj po zavihkih, vnašaj številke — vse deluje lokalno na tvojem računalniku.

**Za zaustavitev:** pritisni `Ctrl + C` v terminalu.

---

## KORAK 6: Ustvari GitHub račun (3 min)

GitHub je kot oblak za kodo. Vercel (hosting) potrebuje GitHub za objavo.

1. Pojdi na: **https://github.com**
2. Klikni **Sign up**
3. Vnesi email, geslo, uporabniško ime
4. Potrdi email

---

## KORAK 7: Naloži kodo na GitHub (5 min)

### Namesti Git (če ga nimaš):
- **Windows:** Prenesi iz https://git-scm.com/download/win in namesti (vse privzete nastavitve)
- **Mac:** Napiši `git --version` v terminal — če te vpraša za namestitev, potrdi

### V VS Code terminalu napiši te ukaze enega za drugim:

```
git init
```
(To ustvari Git "skladišče" v tvoji mapi)

```
git add .
```
(To označi vse datoteke za nalaganje)

```
git commit -m "Prva verzija proračunske aplikacije"
```
(To shrani trenutno stanje kode)

### Sedaj ustvari repozitorij na GitHub:
1. Pojdi na **https://github.com/new**
2. Ime repozitorija: `domaci-proracun`
3. Pusti "Public" izbrano
4. NE klikaj nobenih checkbox-ov (README, .gitignore, license)
5. Klikni **Create repository**

GitHub ti bo pokazal ukaze. Napiši v terminal (zamenjaj `TVOJE-IME` s tvojim GitHub uporabniškim imenom):

```
git remote add origin https://github.com/TVOJE-IME/domaci-proracun.git
git branch -M main
git push -u origin main
```

Vpraša te za GitHub prijavo — vnesi uporabniško ime in geslo (ali token).

Ko vidiš besedilo brez napak, je koda na GitHubu!

---

## KORAK 8: Objavi na Vercel — BREZPLAČNO (5 min)

Vercel je storitev, ki vzame tvojo kodo iz GitHuba in jo naredi dostopno na internetu. Brezplačna za osebne projekte.

1. Pojdi na: **https://vercel.com**
2. Klikni **Sign Up**
3. Izberi **Continue with GitHub**
4. Dovoli Vercelu dostop do tvojega GitHub računa

### Objavi projekt:
1. Po prijavi klikni **"Add New..." → Project**
2. Videl boš seznam tvojih GitHub repozitorijev
3. Poišči **`domaci-proracun`** in klikni **Import**
4. Na naslednji strani NE SPREMINJAJ NIČESAR — Vercel avtomatsko zazna, da je Vite + React
5. Klikni **Deploy**

Počakaj 1–2 minuti. Videl boš animacijo gradnje.

Ko se konča, vidiš **"Congratulations!"** in povezavo do tvoje aplikacije:

**`https://domaci-proracun.vercel.app`**

Klikni nanjo. Tvoja aplikacija je ŽIVA na internetu! 🎉

---

## KORAK 9: Odpri na telefonu

1. Odpri brskalnik na telefonu
2. Vnesi URL: `https://domaci-proracun.vercel.app`
3. Na iPhonu: klikni gumb za deljenje → "Dodaj na začetni zaslon"
4. Na Androidu: klikni tri pike → "Dodaj na začetni zaslon"

Sedaj imaš ikono na telefonu, ki deluje kot prava aplikacija!

---

## Kako posodobiš aplikacijo v prihodnje

Ko želiš spremeniti karkoli (dodati funkcijo, popraviti napako):

1. Spremeni kodo v VS Code
2. V terminalu napiši:
```
git add .
git commit -m "Opis spremembe"
git push
```
3. Vercel AVTOMATSKO zazna spremembo in objavi novo verzijo v 1–2 minutah
4. Ni potrebno nič drugega — samo `git push` in počakaš

---

## Povzetek orodij

| Orodje | Kaj počne | Cena |
|--------|-----------|------|
| Node.js | Poganja JavaScript na tvojem računalniku | Brezplačno |
| VS Code | Urejevalnik kode | Brezplačno |
| Git | Sledenje spremembam kode | Brezplačno |
| GitHub | Shranjevanje kode v oblaku | Brezplačno |
| Vercel | Gostovanje aplikacije na internetu | Brezplačno (osebni projekti) |

**Skupni strošek: €0**

---

## Pogosta vprašanja

**V: Kaj če dobim napako pri `npm install`?**
O: Zapri terminal, ponovno odpri in poskusi znova. Če ne deluje, preveri, da imaš nameščen Node.js (`node --version`).

**V: Kaj če Vercel ne zazna mojega projekta?**
O: Preveri, da je `package.json` v korenski mapi (ne v podmapi).

**V: Ali so moji podatki varni?**
O: Trenutno se podatki shranjujejo v brskalniku (localStorage). To pomeni:
- Podatki ostanejo na tvojem napravi
- Če izbrišeš podatke brskalnika, se izgubijo
- Različne naprave ne delijo podatkov
Za varnostno kopijo izvozi podatke redno.

**V: Ali lahko dodam geslo za celotno aplikacijo?**
O: V naslednji fazi lahko dodamo avtentikacijo (prijavo).

**V: Koliko obiskovalcev podpira brezplačni Vercel?**
O: Do 100 GB prenosa mesečno — več kot dovolj za družinsko uporabo.

---

## Kaj si se naučil

Po tem postopku sedaj znaš:
- ✅ Namestiti razvojno okolje (Node.js, VS Code)
- ✅ Zagnati React aplikacijo lokalno
- ✅ Uporabljati Git za sledenje spremembam
- ✅ Naložiti kodo na GitHub
- ✅ Objaviti aplikacijo na Vercel
- ✅ Posodobiti aplikacijo z enim ukazom

**Te veščine so enake za VSE spletne aplikacije — ne samo za to proračunsko.** Naslednjič boš isti postopek izvedel v 10 minutah.
