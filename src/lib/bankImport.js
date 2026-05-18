// Merchant keyword → subcategory ID
export const DEFAULT_MAP = {
  // Živila
  'mercator': 'groc', 'spar': 'groc', 'hofer': 'groc', 'lidl': 'groc',
  'tuš': 'groc', 'tus ': 'groc', 'albert': 'groc', 'billa': 'groc',
  'eurospin': 'groc', 'penny': 'groc', 'jager': 'groc', 'konzum': 'groc',
  'reve': 'groc', 'fresh market': 'groc',
  // Gorivo
  'petrol': 'fuel', 'omv': 'fuel', 'mol ': 'fuel', 'bp ': 'fuel',
  'shell': 'fuel', 'optimus': 'fuel', 'energol': 'fuel',
  // Hrana/dostava
  'wolt': 'eatOut', 'glovo': 'eatOut', 'bolt food': 'eatOut',
  'dostavimo': 'eatOut', 'mcdonald': 'eatOut', 'burger king': 'eatOut',
  'subway': 'eatOut', 'kfc': 'eatOut', 'dominos': 'eatOut', 'pizza': 'eatOut',
  // Streaming
  'netflix': 'stream', 'spotify': 'stream', 'youtube': 'stream',
  'disney': 'stream', 'hbo': 'stream', 'amazon prime': 'stream',
  'apple.com/bill': 'stream', 'crunchyroll': 'stream', 'deezer': 'stream',
  // Telekomunikacije
  'telekom': 'internet', 'a1': 'internet', 'telemach': 'internet', 't-2': 'internet',
  // Lekarna / Drogerija
  'lekarna': 'pharm', 'dm ': 'drug', 'dm-drogeri': 'drug', 'muller': 'drug',
  'rossmann': 'drug', 'notino': 'drug',
  // Oblačila / Obutev
  'h&m': 'clothes', 'hm.com': 'clothes', 'zara': 'clothes', 'primark': 'clothes',
  'about you': 'clothes', 'mohito': 'clothes', 'stradivarius': 'clothes',
  'c&a': 'clothes', 'deichmann': 'shoes', 'shoes': 'shoes',
  // Dom / Elektronika
  'ikea': 'equip', 'jysk': 'equip', 'elektro': 'equip', 'big bang': 'equip',
  'mimovrste': 'equip', 'harvey norman': 'equip', 'mediamarkt': 'equip',
  // Amazon/splet
  'amazon': 'hobbies',
  // Parkirišče
  'parkomat': 'parking', 'avp': 'parking', 'dars': 'parking', 'parkman': 'parking',
  // Zavarovanje
  'triglav': 'carIns', 'generali': 'carIns', 'adriatic': 'carIns', 'zavaroval': 'carIns',
  // Fitnes / Sport
  'fitnes': 'members', 'fitness': 'members', 'decathlon': 'hobbies',
  'intersport': 'hobbies', 'sportmax': 'hobbies',
  // Frizerstvo / Lepota
  'frizerst': 'hair', 'salon': 'hair', 'depil': 'depil', 'beautiq': 'depil',
  // Knjige / Izobraževanje
  'knjig': 'books', 'modrijan': 'books', 'mladinska': 'books', 'biblos': 'books',
  // Darila
  'cvetic': 'bday', 'cvetlic': 'bday', 'darilo': 'bday',
  // Programska oprema
  'adobe': 'sw', 'microsoft': 'sw', 'google one': 'sw', 'dropbox': 'sw',
};

const NOISE = new Set([
  'nakup', 'dvig', 'pos', 'plačilo', 'nakazilo', 'prenos', 'transakcija',
  'banka', 'card', 'payment', 'purchase', 'debit', 'kredit', 'ref', 'id',
  'eur', 'slo', 'si', 'kartica', 'trajnik', 'stalni', 'nalog', 'račun',
  'tuj', 'pri', 'zakup', 'polog', 'posel', 'gotovina', 'atm',
]);

export function extractKeyword(desc) {
  const lower = desc.toLowerCase();
  const tokens = lower.split(/[\s,/\-*0-9.]+/).filter(t => t.length > 2 && !NOISE.has(t));
  return tokens.sort((a, b) => b.length - a.length)[0] || '';
}

export function suggestCategory(desc, learnedMap = {}) {
  const lower = desc.toLowerCase();
  let best = '';
  let bestCat = null;
  // Learned map takes priority, then default
  for (const [k, v] of Object.entries({ ...DEFAULT_MAP, ...learnedMap })) {
    if (lower.includes(k) && k.length > best.length) {
      best = k;
      bestCat = learnedMap[k] || v;
    }
  }
  return bestCat;
}

function detectDelimiter(line) {
  const counts = { ';': 0, ',': 0, '\t': 0 };
  for (const c of line) if (c in counts) counts[c]++;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function parseAmount(s) {
  if (!s && s !== 0) return 0;
  const str = String(s).trim().replace(/\s/g, '');
  if (!str) return 0;
  // EU: 1.234,56
  if (/\d{1,3}(\.\d{3})+,\d{1,2}$/.test(str))
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
  // EU: 1234,56
  if (/^\-?\d+,\d{1,2}$/.test(str))
    return parseFloat(str.replace(',', '.')) || 0;
  // US: 1,234.56
  if (/\d{1,3}(,\d{3})+\.\d{1,2}$/.test(str))
    return parseFloat(str.replace(/,/g, '')) || 0;
  return parseFloat(str.replace(/,/g, '')) || 0;
}

function parseDate(s) {
  if (!s) return null;
  const str = s.trim();
  const m1 = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m1) return `${m1[3]}-${m1[2].padStart(2, '0')}-${m1[1].padStart(2, '0')}`;
  const m2 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m2) return `${m2[3]}-${m2[2].padStart(2, '0')}-${m2[1].padStart(2, '0')}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  return null;
}

function splitLine(line, delim) {
  const res = [];
  let cur = '';
  let inQ = false;
  for (const c of line) {
    if (c === '"') { inQ = !inQ; continue; }
    if (c === delim && !inQ) { res.push(cur.trim()); cur = ''; }
    else cur += c;
  }
  res.push(cur.trim());
  return res;
}

function detectColumns(headers) {
  const h = headers.map(s => s.toLowerCase().replace(/"/g, '').trim());
  const find = (kws) => h.findIndex(col => kws.some(k => col.includes(k)));
  return {
    date:   find(['datum', 'date', 'val.datum', 'booking']),
    desc:   find(['opis', 'naziv', 'partner', 'namen', 'description', 'details', 'transakcija', 'besedilo', 'payee', 'merchant', 'name', 'memo']),
    debit:  find(['breme', 'debet', 'debit', 'odhodek', 'znesek breme', 'outflow', 'out (']),
    credit: find(['dobro', 'kredit', 'credit', 'prihodek', 'dobropis', 'inflow', 'in (']),
    amount: find(['znesek', 'amount', 'vsota', 'znesek eur', 'znesek transakcije', 'vrednost']),
  };
}

// Parse natural language expense like "75€ pri Mercatorju za živila"
export function parseNL(text, learnedMap = {}) {
  const t = text.trim();
  // Extract amount: 75, 75€, €75, 75,50€, 75.50
  const amtMatch = t.match(/(?:^|[\s,])(\d+[.,]\d{1,2}|\d+)\s*€?/);
  const amt = amtMatch ? parseFloat(amtMatch[1].replace(',', '.')) : null;
  // Category suggestion using full text
  const subId = suggestCategory(t, learnedMap);
  // Description: strip leading amount tokens
  const desc = t.replace(/^\d+[.,]?\d*\s*€?\s*/,'').replace(/€\s*\d+[.,]?\d*/,'').trim();
  return { amt, subId, desc: desc || t };
}

export function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const delim = detectDelimiter(lines[0]);
  const headers = splitLine(lines[0], delim);
  const cols = detectColumns(headers);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i], delim);
    if (cells.length < 2) continue;

    const dateRaw = cols.date >= 0 ? cells[cols.date] : '';
    const desc = (cols.desc >= 0 ? cells[cols.desc] : cells.slice(0, 3).join(' ')).trim();
    if (!desc) continue;

    let amount = 0;
    if (cols.debit >= 0 && cells[cols.debit]?.trim()) {
      amount = -Math.abs(parseAmount(cells[cols.debit]));
    } else if (cols.credit >= 0 && cols.debit >= 0 && cells[cols.credit]?.trim()) {
      amount = Math.abs(parseAmount(cells[cols.credit]));
    } else if (cols.amount >= 0) {
      amount = parseAmount(cells[cols.amount]);
    }

    if (amount === 0) continue;

    const date = parseDate(dateRaw);
    const moIdx = date ? parseInt(date.split('-')[1]) - 1 : -1;

    rows.push({ date: date || dateRaw, mo: moIdx, desc, amount, isIncome: amount > 0 });
  }

  return rows;
}
