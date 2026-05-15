import React, { useState, useRef } from 'react';
import { parseCSV, suggestCategory, extractKeyword } from '../lib/bankImport.js';

const C = { bl: '#2563eb', gn: '#059669', rd: '#dc2626', mt: '#888', tx: '#1a1a2e', bd: '#e8e6e1', fn: '#f5f5f0' };
const sI = { height: 36, fontSize: 14, border: '1px solid #ddd', borderRadius: 4, padding: '0 8px', outline: 'none', boxSizing: 'border-box' };
const sS = { height: 36, fontSize: 14, border: '1px solid #ddd', borderRadius: 4, padding: '0 8px', background: '#fff', outline: 'none', boxSizing: 'border-box' };
const sB = (p) => ({ height: 34, fontSize: 14, fontWeight: 600, border: p ? 'none' : '1px solid #ddd', borderRadius: 4, padding: '0 14px', background: p ? C.bl : '#fff', color: p ? '#fff' : '#333', cursor: 'pointer' });

function fmt(n) { return new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0); }

export default function BankImport({ allSubs, mo, yr, onImport, onClose }) {
  const [rows, setRows] = useState(null);
  const [catSel, setCatSel] = useState({});    // idx → subId
  const [include, setInclude] = useState({});  // idx → bool
  const [remember, setRemember] = useState({}); // idx → bool
  const [err, setErr] = useState('');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();

  const learnedMap = () => JSON.parse(localStorage.getItem('dp_bankmap') || '{}');

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseCSV(ev.target.result);
        if (!parsed.length) { setErr('Ni prebranih vrstic. Preveri format (CSV, ločilo ;/,/tab).'); return; }
        const lm = learnedMap();
        const initCat = {};
        const initInc = {};
        parsed.forEach((r, i) => {
          initInc[i] = !r.isIncome;
          if (!r.isIncome) initCat[i] = suggestCategory(r.desc, lm) || '';
        });
        setRows(parsed);
        setCatSel(initCat);
        setInclude(initInc);
        setRemember({});
        setErr('');
      } catch (ex) {
        setErr('Napaka pri branju: ' + ex.message);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const doImport = () => {
    const toImport = rows.filter((_, i) => include[i] && catSel[i]);
    if (!toImport.length) { setErr('Ni označenih vrstic z izbrano kategorijo.'); return; }

    // Save learned mappings
    const lm = learnedMap();
    rows.forEach((r, i) => {
      if (remember[i] && catSel[i]) {
        const kw = extractKeyword(r.desc);
        if (kw) lm[kw] = catSel[i];
      }
    });
    localStorage.setItem('dp_bankmap', JSON.stringify(lm));

    setImporting(true);
    const items = rows
      .map((r, i) => ({ ...r, subId: catSel[i], idx: i }))
      .filter(r => include[r.idx] && r.subId);
    onImport(items);
  };

  const totalAmt = rows ? rows.filter((_, i) => include[i] && catSel[i]).reduce((s, r, _i) => {
    const i = rows.indexOf(r);
    return include[i] && catSel[i] ? s + Math.abs(r.amount) : s;
  }, 0) : 0;

  const selectedCount = rows ? rows.filter((_, i) => include[i] && catSel[i]).length : 0;

  return (
    <div style={{ background: '#f0f7ff', border: '1px dashed #93c5fd', borderRadius: 8, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.bl }}>📥 Uvoz bančnega izpiska (CSV)</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, color: C.mt, cursor: 'pointer' }}>✕</button>
      </div>

      {!rows && (
        <div>
          <div style={{ fontSize: 13, color: C.mt, marginBottom: 8 }}>
            Podprte banke: <strong>Sparkasse, NLB, NKBM</strong> in vse banke z izvozom CSV.
            Ločilo: ; ali , ali tab • Decimale: 1.234,56 ali 1234.56
          </div>
          <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} style={{ fontSize: 14 }} />
          {err && <div style={{ color: C.rd, fontSize: 14, marginTop: 6 }}>{err}</div>}
        </div>
      )}

      {rows && (
        <div>
          <div style={{ fontSize: 13, color: C.mt, marginBottom: 8 }}>
            Prebrano <strong>{rows.length}</strong> vrstic.
            Označeno za uvoz: <strong style={{ color: C.bl }}>{selectedCount}</strong> ({fmt(totalAmt)})
          </div>

          {/* Sticky header table */}
          <div style={{ maxHeight: 380, overflowY: 'auto', border: '1px solid #ddd', borderRadius: 6, background: '#fff' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f8f7f4', zIndex: 1 }}>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ width: 30, padding: '6px 4px', textAlign: 'center', color: C.mt }}>✓</th>
                  <th style={{ width: 70, padding: '6px 4px', textAlign: 'left', color: C.mt }}>Datum</th>
                  <th style={{ padding: '6px 4px', textAlign: 'left', color: C.mt }}>Opis</th>
                  <th style={{ width: 80, padding: '6px 4px', textAlign: 'right', color: C.mt }}>Znesek</th>
                  <th style={{ width: 160, padding: '6px 4px', textAlign: 'left', color: C.mt }}>Kategorija</th>
                  <th style={{ width: 60, padding: '6px 4px', textAlign: 'center', color: C.mt }}>Zapomni</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const isInc = r.isIncome;
                  const rowStyle = {
                    background: isInc ? '#f0fdf4' : include[i] ? '#fff' : '#f9fafb',
                    opacity: isInc ? 0.6 : 1,
                    borderBottom: '1px solid #f0f0f0',
                  };
                  return (
                    <tr key={i} style={rowStyle}>
                      <td style={{ padding: '4px', textAlign: 'center' }}>
                        <input type="checkbox" checked={!!include[i]} disabled={isInc}
                          onChange={e => setInclude(p => ({ ...p, [i]: e.target.checked }))} />
                      </td>
                      <td style={{ padding: '4px 6px', color: C.mt, whiteSpace: 'nowrap' }}>
                        {r.date ? r.date.split('-').reverse().join('.').slice(0, 5) : '—'}
                      </td>
                      <td style={{ padding: '4px 6px', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={r.desc}>
                        {r.desc}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 600, color: isInc ? C.gn : C.rd, whiteSpace: 'nowrap' }}>
                        {isInc ? '+' : ''}{fmt(r.amount)}
                      </td>
                      <td style={{ padding: '4px 6px' }}>
                        {!isInc && (
                          <select value={catSel[i] || ''} onChange={e => setCatSel(p => ({ ...p, [i]: e.target.value }))}
                            style={{ ...sS, width: '100%', height: 28, fontSize: 13 }}>
                            <option value="">— izberi —</option>
                            {allSubs.map(s => <option key={s.id} value={s.id}>{s.nm.substring(0, 28)}</option>)}
                          </select>
                        )}
                        {isInc && <span style={{ fontSize: 12, color: C.gn }}>Prihodek (preskočen)</span>}
                      </td>
                      <td style={{ padding: '4px', textAlign: 'center' }}>
                        {!isInc && (
                          <input type="checkbox" checked={!!remember[i]}
                            onChange={e => setRemember(p => ({ ...p, [i]: e.target.checked }))} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center' }}>
            <button style={sB(true)} onClick={doImport} disabled={importing || selectedCount === 0}>
              {importing ? 'Uvažam…' : `Uvozi ${selectedCount} vnosov (${fmt(totalAmt)})`}
            </button>
            <button style={sB(false)} onClick={() => { setRows(null); if (fileRef.current) fileRef.current.value = ''; }}>
              ← Nova datoteka
            </button>
            <button style={sB(false)} onClick={onClose}>Zapri</button>
          </div>

          {err && <div style={{ color: C.rd, fontSize: 14, marginTop: 6 }}>{err}</div>}

          <div style={{ fontSize: 12, color: C.mt, marginTop: 8 }}>
            💡 <strong>Zapomni</strong>: shrani, katera kategorija ustreza opisu — naslednjič bo predlagana samodejno.
            Dohodkovne vrstice so samodejno preskočene.
          </div>
        </div>
      )}
    </div>
  );
}
