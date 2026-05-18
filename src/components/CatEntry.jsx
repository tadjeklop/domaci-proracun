// Category entry table — plan / actual / diff per subcategory, with an
// expandable per-subcategory transaction breakdown and behaviour tags.

import React from "react";
import { C, sC, sI, sS, sB, metricGrid, compactMoney } from "../lib/styles.js";
import { fmt, fN, pc } from "../lib/helpers.js";
import { BEHAVIOR_TAGS } from "../lib/constants.js";

export default function CatEntry({cats,title,md,subVis,subRename,expandBreakdown,txnInput,toggleSubVis,setExpandBreakdown,setTxnInput,addTransaction,removeTransaction,updateTransactionComment,uSub,subAlerts,dayFrac}){
  const sN=(s)=>(subRename&&subRename[s.id])||s.nm;
  return<div><div style={{fontSize:18,fontWeight:800,color:C.tx,marginBottom:6,marginTop:6}}>{title}</div><div style={{...sC,overflowX:"auto",padding:16}}>
  <div style={{...metricGrid,fontSize:18,color:C.mt,fontWeight:700,padding:"0 0 6px",borderBottom:`1px solid ${C.bd}`,minWidth:560}}><span>Postavka</span><span style={{textAlign:"right"}}>Plan</span><span style={{textAlign:"right"}}>Izvedba</span><span style={{textAlign:"right"}}>Razl.€</span><span style={{textAlign:"right"}}>%</span></div>
  {cats.map(cat=>{
    const visSubs=cat.subs.filter(sub=>subVis[sub.id]!==true);
    const catActual=visSubs.reduce((s,sub)=>s+(md.subs?.[sub.id]?.actual||0),0);
    const catPlan=visSubs.reduce((s,sub)=>s+(md.subs?.[sub.id]?.plan||0),0);
    return<React.Fragment key={cat.id}>
    <div style={{fontSize:19,fontWeight:800,color:C.tx,padding:"7px 0 3px",marginTop:2,paddingLeft:0}}>{cat.nm}</div>
    {visSubs.map(sub=>{const d=md.subs?.[sub.id]||{plan:0,actual:0,transactions:[],comment:""};const diff=d.plan-d.actual;const pct=d.plan?pc(d.actual,d.plan)+"%":"—";const isExp=expandBreakdown[sub.id];const txnAmt=(txnInput[sub.id]&&typeof txnInput[sub.id]==='object')?txnInput[sub.id].amt:(txnInput[sub.id]||"");const txnCmt=(txnInput[sub.id]&&typeof txnInput[sub.id]==='object')?txnInput[sub.id].cmt:"";const txnPers=(txnInput[sub.id]&&typeof txnInput[sub.id]==='object')?txnInput[sub.id].person||"":"";
      const alertThresh=subAlerts&&subAlerts[sub.id];const alertPct=alertThresh>0?alertThresh:80;const isAlerted=alertThresh>0&&d.plan>0&&d.actual>=d.plan*alertThresh/100;
      const velProj=dayFrac>0.05&&d.actual>0?Math.round(d.actual/dayFrac):null;const velOver=velProj!==null&&d.plan>0&&velProj>d.plan;
      return<React.Fragment key={sub.id}><div style={{...metricGrid,fontSize:17,alignItems:"center",padding:"4px 0 4px 12px",borderBottom:`1px solid ${C.fn}`,background:isAlerted?"#fff7ed":undefined,minWidth:560}}>
        <div style={{display:"flex",alignItems:"center",gap:4,fontSize:17}}>
          <span>{sN(sub)}</span>
          {isAlerted&&<span title={`Opozorilo: ${alertThresh}% plana`} style={{fontSize:12,background:d.actual>d.plan?"#fee2e2":"#fff7ed",color:d.actual>d.plan?C.rd:C.or,borderRadius:4,padding:"0 3px",fontWeight:700,flexShrink:0}}>{d.actual>d.plan?"🔴":"🟡"}</span>}
          <button type="button" onClick={()=>toggleSubVis(sub.id)} style={{background:"none",border:"none",cursor:"pointer",padding:0,fontSize:18,color:C.mt,flexShrink:0}}>👁</button>
        </div>
        <span style={{...compactMoney("#789"),fontSize:17,textAlign:"right"}}>{d.plan?fN(d.plan):"—"}</span>
        <button type="button" onClick={(e)=>{e.preventDefault();setExpandBreakdown(p=>({...p,[sub.id]:!isExp}))}} style={{background:"none",border:`1px solid ${C.bd}`,borderRadius:7,padding:"2px 6px",fontSize:15,color:C.tx,cursor:"pointer",textAlign:"right",minWidth:84,height:30,whiteSpace:"nowrap",fontVariantNumeric:"tabular-nums"}}>{fN(d.actual||0)}€ {isExp?"▲":"▼"}</button>
        <span style={{...compactMoney(d.plan?(diff>=0?C.gn:C.rd):C.mt),fontSize:14,textAlign:"right"}}>{d.plan?(diff>=0?"+":"")+fN(diff):"—"}</span>
        <span style={{...compactMoney(d.plan?(pc(d.actual,d.plan)>90?C.rd:C.gn):C.mt),fontSize:14,textAlign:"right"}}>{pct}</span>
      </div>
      {velProj!==null&&<div style={{fontSize:11,color:velOver?C.rd:"#666",padding:"1px 10px 1px 22px",borderBottom:`1px solid ${C.fn}`,background:velOver?"#fff5f5":"#f9fafb"}}>⚡ Napoved: <strong>{fmt(velProj)}</strong>{velOver?` (prekoračitev za ${fmt(velProj-d.plan)})`:` / plan ${fmt(d.plan)}`}</div>}
      {isExp&&<div style={{padding:"12px 10px",background:"#f9fafb",marginLeft:"10px",borderLeft:`3px solid ${C.bl}`,borderRadius:"0 4px 4px 0",marginTop:2,marginBottom:6}}><div style={{fontSize:13,fontWeight:600,marginBottom:8,color:C.tx}}>Razčlenitev - {sN(sub)}</div><div style={{marginBottom:10}}>
        {(d.transactions||[]).map((t,idx)=>{const txnId=t.id||idx;const amt=t.amt||t;const cmt=t.comment||"";const isImp=typeof t==='object'&&t.imported;const pers=typeof t==='object'?t.person||"":"";return<div key={txnId} style={{display:"grid",gridTemplateColumns:"90px 1fr 28px auto",gap:8,alignItems:"center",fontSize:14,padding:"6px 8px",background:isImp?"#eff6ff":"#fff",borderRadius:4,marginBottom:4,border:`1px solid ${isImp?"#bfdbfe":C.bd}`,borderLeft:isImp?`3px solid ${C.bl}`:`1px solid ${C.bd}`}}>
          <span style={{fontWeight:600,color:C.tx}}>{isImp&&<span title="Uvoz iz Excel" style={{fontSize:13,marginRight:3}}>📥</span>}{fN(amt)}€</span>
          <input style={{...sI,height:28,fontSize:13,padding:"4px 8px",background:isImp?"#fff":undefined}} defaultValue={cmt} onBlur={e=>updateTransactionComment&&updateTransactionComment(sub.id,txnId,e.target.value)} placeholder="Komentar (npr. trgovina, datum)"/>
          <span title={pers||"Skupaj"} style={{fontSize:11,fontWeight:700,width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:pers==="Tadej"?"#dbeafe":pers==="Kristina"?"#fce7f3":"#f3f4f6",color:pers==="Tadej"?C.bl:pers==="Kristina"?"#be185d":"#999",flexShrink:0}}>{pers?pers[0]:"?"}</span>
          <button type="button" onClick={(e)=>{e.preventDefault();e.stopPropagation();if(isImp&&!confirm("Izbriši uvoženi vnos? To bo tudi spremenilo izvedbo."))return;removeTransaction(sub.id,txnId)}} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",padding:"2px 6px",fontSize:14,fontWeight:600}}>✕</button>
          {(()=>{const tags=(cmt||'').match(/#\w+/g)||[];if(!tags.length)return null;return<div style={{gridColumn:"1/-1",display:"flex",gap:3,flexWrap:"wrap",marginTop:-2}}>{tags.map(t=><span key={t} style={{fontSize:10,padding:"1px 5px",borderRadius:8,background:"#dbeafe",color:C.bl,fontWeight:600}}>{t.slice(1)}</span>)}</div>;})()}
          <div style={{gridColumn:"1/-1",display:"flex",gap:4,flexWrap:"wrap",marginTop:2}}>
            {BEHAVIOR_TAGS.map(([tag,label])=>{
              const active=(cmt||'').toLowerCase().includes(`#${tag}`);
              return<button key={tag} type="button" onClick={()=>{const base=(cmt||'').replace(new RegExp(`\\s*#${tag}\\b`,'i'),'').trim();updateTransactionComment&&updateTransactionComment(sub.id,txnId,active?base:`${base} #${tag}`.trim())}} style={{height:22,fontSize:11,padding:"0 7px",borderRadius:12,border:`1px solid ${active?C.bl:C.bd}`,background:active?"#dbeafe":C.cd,color:active?C.bl:C.mt,cursor:"pointer",fontWeight:700}}>{label}</button>;
            })}
          </div>
        </div>})}
        {(d.transactions||[]).length===0&&<div style={{fontSize:13,color:C.mt,padding:"8px",textAlign:"center",background:"#fff",borderRadius:4,border:`1px dashed ${C.bd}`,fontStyle:"italic"}}>Še nobene transakcije</div>}
      </div><div style={{display:"grid",gridTemplateColumns:"100px 104px minmax(220px,1fr) auto",gap:8,marginBottom:6,alignItems:"center"}}>
        <input id={`txn-${sub.id}`} type="number" placeholder="Znesek (€)" onChange={(e)=>setTxnInput(p=>({...p,[sub.id]:{amt:e.target.value,cmt:txnCmt,person:txnPers}}))} value={txnAmt} onKeyPress={(e)=>{if(e.key==="Enter"){e.preventDefault();e.stopPropagation();const val=parseFloat(txnAmt);if(val>0){addTransaction(sub.id,txnAmt,txnCmt,txnPers);setTxnInput(p=>({...p,[sub.id]:""}))}return false}}} style={{...sI,height:36,fontSize:14,padding:"6px 8px"}}/>
        <select style={{...sS,height:36,fontSize:13}} value={txnPers} onChange={e=>setTxnInput(p=>({...p,[sub.id]:{amt:txnAmt,cmt:txnCmt,person:e.target.value}}))}>
          <option value="">Skupaj</option><option value="Tadej">Tadej</option><option value="Kristina">Kristina</option>
        </select>
        <input type="text" placeholder="Komentar (neobvezno)" onChange={(e)=>setTxnInput(p=>({...p,[sub.id]:{amt:txnAmt,cmt:e.target.value,person:txnPers}}))} value={txnCmt} onKeyPress={(e)=>{if(e.key==="Enter"){e.preventDefault();e.stopPropagation();const val=parseFloat(txnAmt);if(val>0){addTransaction(sub.id,txnAmt,txnCmt,txnPers);setTxnInput(p=>({...p,[sub.id]:""}))}return false}}} style={{...sI,height:36,fontSize:14,padding:"6px 10px"}}/>
        <button type="button" onClick={(e)=>{e.preventDefault();e.stopPropagation();const val=parseFloat(txnAmt);if(val>0){addTransaction(sub.id,txnAmt,txnCmt,txnPers);setTxnInput(p=>({...p,[sub.id]:""}))}return false}} style={{...sB(true),padding:"6px 14px",height:36,fontSize:14,fontWeight:600}}>Dodaj</button>
      </div><div style={{textAlign:"right",fontSize:12,fontWeight:600,color:C.tx,padding:"4px 0"}}>Skupaj: <span style={{fontSize:16,color:C.bl}}>{fN(d.actual||0)}€</span></div></div>}</React.Fragment>})}
    {visSubs.length>1&&catPlan>0&&<div style={{...metricGrid,fontSize:15,alignItems:"center",padding:"5px 0 5px 12px",background:"#f0f7ff",borderBottom:`1px solid ${C.bd}`,fontWeight:700,color:"#334",minWidth:560}}>
      <span style={{color:C.bl}}>Skupaj {cat.nm}</span>
      <span style={{color:"#999",textAlign:"right"}}>{fN(catPlan)}</span>
      <span style={{textAlign:"right",color:catActual>catPlan?C.rd:C.gn}}>{fN(catActual)}</span>
      <span style={{textAlign:"right",fontSize:11,color:catPlan?(catPlan-catActual>=0?C.gn:C.rd):C.mt}}>{catPlan?(catPlan-catActual>=0?"+":"")+fN(catPlan-catActual):"—"}</span>
      <span style={{textAlign:"right",fontSize:11,color:catActual>catPlan?C.rd:C.gn}}>{catPlan?pc(catActual,catPlan)+"%":"—"}</span>
    </div>}
  </React.Fragment>})}
  </div></div>
}
