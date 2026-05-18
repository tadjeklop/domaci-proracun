// Pure domain helpers — formatting, month/year init, totals, localStorage I/O.

import { AS, CATS, HELP } from "./constants.js";

export function fmt(n){return new Intl.NumberFormat("sl-SI",{style:"currency",currency:"EUR",minimumFractionDigits:0,maximumFractionDigits:0}).format(n||0)}
export function fN(n){return new Intl.NumberFormat("sl-SI",{minimumFractionDigits:0,maximumFractionDigits:0}).format(n||0)}
export function pc(a,b){return b===0?0:Math.round((a/b)*100)}
export function initM(){const s={};AS.forEach(sub=>{s[sub.id]={plan:sub.dp,actual:0,transactions:[],comment:""}});return{subs:s,income:{Kristina:{},Tadej:{}},customIncome:[],unexpectedItems:[],closed:false}}
export function initY(){const y={};for(let i=0;i<12;i++)y[i]=initM();return y}
export function ld(k,fb){try{const s=localStorage.getItem(k);return s?JSON.parse(s):fb}catch{return fb}}
export function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
export function cT(md,cat,f){return cat.subs.reduce((s,sub)=>s+(md?.subs?.[sub.id]?.[f]||0),0)}
export function fxT(md,f){return CATS.filter(c=>c.tp==="fixed").reduce((s,c)=>s+cT(md,c,f),0)}
export function vrT(md,f){return CATS.filter(c=>c.tp==="var").reduce((s,c)=>s+cT(md,c,f),0)}
export function iT(md){let t=0;Object.values(md?.income?.Kristina||{}).forEach(v=>t+=(v||0));Object.values(md?.income?.Tadej||{}).forEach(v=>t+=(v||0));(md?.customIncome||[]).forEach(ci=>t+=(ci.amount||0));return t}
export function pctDiff(plan,actual){if(!plan)return"N/A";const d=pc(actual,plan);return d+"%"}
export function uxtT(md){return(md?.unexpectedItems||[]).reduce((s,it)=>s+(it.amount||0),0)}
export function simTooltip(metric,closedCount,yrInc,yrExp,yrUxt,yrSav,tInc,tAc,tUxt,simManual,baseInc,baseExp,baseSav,simG,simI,simE,year,sY){
  const closedCountInfo=closedCount>0?` (${closedCount} zaključenih mesecev)`:"";
  if(metric==="Prihodki"){
    const source=simManual.income!=null?"ročni vnos":closedCount>0?`povprečje zaključenih mesecev: ${fmt(yrInc/closedCount)}/mesec${closedCountInfo}`:`privzetka: ${fmt(tInc||3600)}/mesec`;
    const growth=simG!==0?` z rastjo ${simG}%/leto`:"";
    return `Izračun: ${source} × ${Math.pow(1+simG/100,year).toFixed(2)} (rast) × 12 mesecev = ${fmt(baseInc*Math.pow(1+simG/100,year)*12)}${growth}`;
  }else if(metric==="Odhodki"){
    const base=closedCount>0?yrExp+yrUxt:tAc+(tUxt||0);
    const perMonth=closedCount>0?`${fmt((yrExp+yrUxt)/closedCount)}/mesec${closedCountInfo}`:`${fmt(tAc||3100)}/mesec`;
    const source=simManual.expense!=null?"ročni vnos":closedCount>0?`povprečje zaključenih mesecev: ${perMonth}`:`privzetka: ${perMonth}`;
    const growth=simI!==0?` z inflacijo ${simI}%/leto`:"";
    return `Izračun: ${source} × ${Math.pow(1+simI/100,year).toFixed(2)} (inflacija) × 12 mesecev = ${fmt(baseExp*Math.pow(1+simI/100,year)*12)}${growth}`;
  }else if(metric==="Prihranki"){
    return `Skupni prihranki: seštevek letnih varčevanj (${fmt(baseSav)}/mesec × 12). Če so dodatne naložbe (${simE}€), je vključeno v vsako leto.`;
  }else if(metric==="Razlika"){
    return `Letni tok gotovine: Prihodki - Odhodki. Pozitivna = presežek, negativna = primanjkljaj. Uporablja se za izračun finančnega zdravja.`;
  }
  return "Izračun ni dostopen";
}
export const hp=k=>({className:"dp-help","data-help":HELP[k]||k,tabIndex:0});
