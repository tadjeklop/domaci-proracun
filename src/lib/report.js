// Monthly report — builds a printable HTML page and opens it in a new window.
// Formatting helpers are passed in so this stays free of app-state imports.

export function printMonthlyReport({monthName,yr,cats,md,tInc,tAc,subRename,fmt,fN,pc,cT}){
  const rows=cats.map(cat=>{
    const plan=cT(md,cat,'plan');const actual=cT(md,cat,'actual');const diff=actual-plan;const pct=plan?pc(actual,plan):null;
    const subs=cat.subs.map(sub=>{const d=md.subs?.[sub.id]||{plan:0,actual:0};return`<tr><td style="padding:3px 8px 3px 24px;font-size:13px;color:#555">${(subRename?.[sub.id]||sub.nm).substring(0,35)}</td><td style="text-align:right;padding:3px 8px;font-size:13px">${d.plan?fN(d.plan):'—'}</td><td style="text-align:right;padding:3px 8px;font-size:13px;font-weight:600">${d.actual?fN(d.actual):'—'}</td><td style="text-align:right;padding:3px 8px;font-size:13px;color:${d.plan&&d.actual>d.plan?'#dc2626':'#16a34a'}">${d.plan?(diff>=0?'+':'')+fN(d.actual-d.plan):'—'}</td></tr>`}).join('');
    return`<tr style="background:#f8f7f4"><td style="padding:4px 8px;font-weight:700;font-size:14px">${cat.nm}</td><td style="text-align:right;padding:4px 8px;font-size:14px">${plan?fN(plan):'—'}</td><td style="text-align:right;padding:4px 8px;font-size:14px;font-weight:700">${actual?fN(actual):'—'}</td><td style="text-align:right;padding:4px 8px;font-size:14px;color:${plan&&actual>plan?'#dc2626':'#16a34a'}">${plan?(actual-plan>=0?'+':'')+fN(actual-plan):'—'}</td></tr>${subs}`;
  }).join('');
  const diff=tInc-tAc;
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Domači proračun — ${monthName} ${yr}</title><style>body{font-family:'Segoe UI',sans-serif;color:#1a1a2e;margin:0;padding:24px}h1{font-size:22px;margin:0 0 4px}h2{font-size:15px;margin:12px 0 4px;color:#2563eb;border-bottom:1px solid #e2e8f0;padding-bottom:2px}table{width:100%;border-collapse:collapse;margin-bottom:8px}th{text-align:left;padding:4px 8px;font-size:12px;color:#888;border-bottom:2px solid #e2e8f0}tr:last-child td{border-bottom:none}td{border-bottom:1px solid #f1f5f9}.kpi{display:inline-block;margin-right:24px;margin-bottom:8px}.kpi-label{font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#888}.kpi-val{font-size:24px;font-weight:800}@media print{body{padding:12px}button{display:none}}</style></head><body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
    <div><h1>Domači proračun</h1><div style="font-size:14px;color:#888">${monthName} ${yr}</div></div>
    <button onclick="window.print()" style="padding:8px 16px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px">Natisni / Shrani PDF</button>
  </div>
  <div style="margin-bottom:16px;padding:12px;background:#f8f7f4;border-radius:8px">
    <div class="kpi"><div class="kpi-label">Prihodki</div><div class="kpi-val" style="color:#16a34a">${fmt(tInc)}</div></div>
    <div class="kpi"><div class="kpi-label">Odhodki</div><div class="kpi-val" style="color:#dc2626">${fmt(tAc)}</div></div>
    <div class="kpi"><div class="kpi-label">Razlika</div><div class="kpi-val" style="color:${diff>=0?'#16a34a':'#dc2626'}">${diff>=0?'+':''}${fmt(diff)}</div></div>
  </div>
  <h2>Stroški po kategorijah</h2>
  <table><thead><tr><th>Postavka</th><th style="text-align:right">Plan</th><th style="text-align:right">Izvedba</th><th style="text-align:right">Razlika</th></tr></thead><tbody>${rows}</tbody></table>
  <div style="font-size:11px;color:#888;margin-top:16px;border-top:1px solid #e2e8f0;padding-top:8px">Generirano: ${new Date().toLocaleString('sl-SI')} • Domači proračun</div>
  </body></html>`;
  const w=window.open('','_blank');if(w){w.document.write(html);w.document.close()}
}
