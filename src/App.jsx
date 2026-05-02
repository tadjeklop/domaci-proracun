import React, { useState, useEffect, useRef, Component } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend, AreaChart, Area } from "recharts";
import * as XLSX from 'xlsx';

// ===== ERROR BOUNDARY =====
class EB extends Component{constructor(p){super(p);this.state={e:null}}static getDerivedStateFromError(e){return{e}}render(){if(this.state.e)return<div style={{padding:'2rem',textAlign:'center'}}><h2>Napaka</h2><p>{this.state.e?.message}</p><button onClick={()=>{this.setState({e:null});window.location.reload()}} style={aBtn}>Ponovno naloži</button></div>;return this.props.children}}

// ===== AUTH =====
function sHash(s){let h=0;for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h=h&h}return Math.abs(h).toString(36)+s.length.toString(36)}
async function hPwd(p,salt){if(typeof crypto!=='undefined'&&crypto.subtle){const d=new TextEncoder().encode(salt+p);const b=await crypto.subtle.digest('SHA-256',d);return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')}return sHash(salt+p+salt)}

// ===== CONSTANTS =====
const MF=["Januar","Februar","Marec","April","Maj","Junij","Julij","Avgust","September","Oktober","November","December"];
const MS=["Jan","Feb","Mar","Apr","Maj","Jun","Jul","Avg","Sep","Okt","Nov","Dec"];
const CL=["#2563eb","#0d9488","#d97706","#dc2626","#7c3aed","#059669","#e11d48","#0284c7","#ca8a04","#6366f1","#be185d","#15803d","#ea580c","#4f46e5","#0891b2","#a21caf","#65a30d"];
const CATS=[
  {id:"housing",nm:"Stanovanjski stroški",tp:"fixed",subs:[{id:"rent",nm:"Najemnina ali obrok hipotekarnega kredita",dp:710},{id:"utilities",nm:"Položnice (elektrika, voda, ogrevanje, smeti)",dp:250},{id:"admin",nm:"Stroški upravnika",dp:0},{id:"internet",nm:"Internet, TV in telefonija (paket)",dp:70},{id:"propIns",nm:"Zavarovanje nepremičnine",dp:0}]},
  {id:"transport_fix",nm:"Prevoz (fiksni)",tp:"fixed",subs:[{id:"carLoan",nm:"Obrok za avtomobilski kredit/leasing",dp:0},{id:"carIns",nm:"Avtomobilsko zavarovanje",dp:0}]},
  {id:"children_fix",nm:"Otroški stroški (fiksni)",tp:"fixed",subs:[{id:"kinder",nm:"Vrtčevski prispevki",dp:640}]},
  {id:"debts",nm:"Dolgovi",tp:"fixed",subs:[{id:"consL",nm:"Obroki za potrošniške kredite",dp:0}]},
  {id:"savings_inv",nm:"Varčevanje in naložbe",tp:"fixed",subs:[{id:"vacSav",nm:"Varčevanje za dopust (9x)",dp:300},{id:"etf",nm:"Mesečno ETF",dp:200},{id:"tradeRep",nm:"Mesečno Trade Republic",dp:700}]},
  {id:"food",nm:"Hrana",tp:"var",subs:[{id:"groc",nm:"Nakup živil",dp:650},{id:"eatOut",nm:"Restavracije/kavarne/dostava",dp:0},{id:"snacks",nm:"Malice in prigrizki na poti",dp:20}]},
  {id:"transport_var",nm:"Prevoz (variabilni)",tp:"var",subs:[{id:"fuel",nm:"Gorivo",dp:60},{id:"parking",nm:"Parkirnine, cestnine",dp:5},{id:"carMnt",nm:"Vzdrževanje avtomobila",dp:0},{id:"taxi",nm:"Taxi, ride sharing",dp:5}]},
  {id:"clothing",nm:"Oblačila in osebna nega",tp:"var",subs:[{id:"clothes",nm:"Nakup oblačil",dp:50},{id:"shoes",nm:"Nakup obutve",dp:50},{id:"hair",nm:"Frizerske storitve",dp:50},{id:"depil",nm:"Depilacija",dp:0},{id:"drug",nm:"Drogerija",dp:50}]},
  {id:"fun",nm:"Zabava in prosti čas",tp:"var",subs:[{id:"hobbies",nm:"Hobiji",dp:0},{id:"trips",nm:"Izleti, potovanja",dp:0},{id:"cinema",nm:"Kino, koncerti, dogodki",dp:0},{id:"social",nm:"Druženje",dp:20}]},
  {id:"health",nm:"Zdravje",tp:"var",subs:[{id:"pharm",nm:"Lekarna",dp:0},{id:"massage",nm:"Masaža / terapija",dp:0},{id:"suppl",nm:"Dodatki k prehrani",dp:0},{id:"dental",nm:"Zobozdravstvene storitve",dp:0}]},
  {id:"edu",nm:"Izobraževanje",tp:"var",subs:[{id:"books",nm:"Knjige",dp:0},{id:"courses",nm:"Tečaji, delavnice",dp:250}]},
  {id:"subscr",nm:"Naročnine in članarine",tp:"var",subs:[{id:"stream",nm:"Streaming (Netflix, Spotify)",dp:0},{id:"members",nm:"Članarine (fitnes, košarka)",dp:110},{id:"sw",nm:"Programska oprema",dp:23}]},
  {id:"gifts",nm:"Darila in donacije",tp:"var",subs:[{id:"bday",nm:"Darila za praznike",dp:0},{id:"donate",nm:"Donacije",dp:0}]},
  {id:"household",nm:"Gospodinjstvo in dom",tp:"var",subs:[{id:"repairs",nm:"Popravila in vzdrževanje",dp:0},{id:"equip",nm:"Oprema za dom",dp:0}]},
  {id:"vacation",nm:"Dopust",tp:"var",subs:[{id:"travel",nm:"Potovanja",dp:0}]},
  {id:"children_var",nm:"Otroški stroški (var.)",tp:"var",subs:[{id:"kidStuff",nm:"Igrače, oblačila, plenice",dp:0},{id:"kidOth",nm:"Drugo",dp:0}]},
  {id:"unexpected",nm:"Nepredvideni stroški",tp:"var",subs:[]},
];
const IT=["Plača","Nagrada","Regres","Božičnica","Otroški dodatek","Porodniška","Refund"];
const KU=["Amazon","HM","About You","Sports Direct","Mohito","Notino","Stradivarius","Grand Hotel Bernardin","Best Secret","Equa","Lelosi","DDStepOnline","Fever vstopnice"];
const AS=CATS.flatMap(c=>c.subs);

// ===== HELPERS =====
function fmt(n){return new Intl.NumberFormat("sl-SI",{style:"currency",currency:"EUR",minimumFractionDigits:0,maximumFractionDigits:0}).format(n||0)}
function fN(n){return new Intl.NumberFormat("sl-SI",{minimumFractionDigits:0,maximumFractionDigits:0}).format(n||0)}
function pc(a,b){return b===0?0:Math.round((a/b)*100)}
function initM(){const s={};AS.forEach(sub=>{s[sub.id]={plan:sub.dp,actual:0,transactions:[],comment:""}});return{subs:s,income:{Kristina:{},Tadej:{}},customIncome:[],unexpectedItems:[],closed:false}}
function initY(){const y={};for(let i=0;i<12;i++)y[i]=initM();return y}
function ld(k,fb){try{const s=localStorage.getItem(k);return s?JSON.parse(s):fb}catch{return fb}}
function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
function cT(md,cat,f){return cat.subs.reduce((s,sub)=>s+(md?.subs?.[sub.id]?.[f]||0),0)}
function fxT(md,f){return CATS.filter(c=>c.tp==="fixed").reduce((s,c)=>s+cT(md,c,f),0)}
function vrT(md,f){return CATS.filter(c=>c.tp==="var").reduce((s,c)=>s+cT(md,c,f),0)}
function iT(md){let t=0;Object.values(md?.income?.Kristina||{}).forEach(v=>t+=(v||0));Object.values(md?.income?.Tadej||{}).forEach(v=>t+=(v||0));(md?.customIncome||[]).forEach(ci=>t+=(ci.amount||0));return t}
function pctDiff(plan,actual){if(!plan)return"N/A";const d=pc(actual,plan);return d+"%"}
function uxtT(md){return(md?.unexpectedItems||[]).reduce((s,it)=>s+(it.amount||0),0)}
function simTooltip(metric,closedCount,yrInc,yrExp,yrUxt,yrSav,tInc,tAc,tUxt,simManual,baseInc,baseExp,baseSav,simG,simI,simE,year,sY){
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

// ===== STYLES =====
const C={bg:"#f8f7f4",cd:"#fff",bd:"#e8e6e1",mt:"#888",fn:"#f5f5f0",gn:"#059669",rd:"#dc2626",bl:"#2563eb",pu:"#7c3aed",or:"#d97706",tx:"#1a1a2e",sb:"#555"};
const sC={background:C.cd,borderRadius:8,border:`1px solid ${C.bd}`,padding:12,marginBottom:8};
const sM={background:"#fafaf8",borderRadius:6,padding:"10px 12px",border:"1px solid #eee",marginBottom:3};
const sI={height:42,fontSize:16,border:"1px solid #ddd",borderRadius:4,padding:"0 10px",outline:"none",boxSizing:"border-box"};
const sS={height:42,fontSize:16,border:"1px solid #ddd",borderRadius:4,padding:"0 8px",background:"#fff",outline:"none",boxSizing:"border-box"};
const sB=p=>({height:42,fontSize:16,fontWeight:600,border:p?"none":"1px solid #ddd",borderRadius:4,padding:"0 14px",background:p?C.bl:"#fff",color:p?"#fff":"#333",cursor:"pointer"});
const sT=(b,f)=>({fontSize:17,padding:"3px 8px",borderRadius:8,fontWeight:600,background:b,color:f,display:"inline-block"});
const aBtn={padding:'12px 20px',background:'#2563eb',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontSize:16,fontWeight:600};
const aInp={width:'100%',height:48,fontSize:16,border:'1px solid #ddd',borderRadius:6,padding:'0 14px',outline:'none',boxSizing:'border-box',marginBottom:10};
const aPg={minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f8f7f4',fontFamily:"'Segoe UI',system-ui,sans-serif"};
const aCd={background:'#fff',borderRadius:16,padding:'2.5rem',width:380,boxShadow:'0 2px 24px rgba(0,0,0,0.06)',border:'1px solid #e8e6e1'};

function PSlider({label,value,onChange,min,max,step=1,unit=""}){return<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{fontSize:17,color:C.mt,minWidth:140}}>{label}</span><input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))} style={{flex:1}}/><input type="number" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value)||0)} style={{...sI,width:60,height:26,fontSize:17,textAlign:"right"}}/>{unit&&<span style={{fontSize:16,color:C.mt,minWidth:12}}>{unit}</span>}</div>}
function AddCI({onAdd}){const[l,sL]=useState('');const[a,sA]=useState('');const[p,sP]=useState('Kristina');const[c,sCC]=useState('');return<div style={{display:"flex",gap:4,marginTop:6,alignItems:"center",flexWrap:"wrap"}}><input style={{...sI,flex:1,minWidth:80,height:26,fontSize:17}} value={l} onChange={e=>sL(e.target.value)} placeholder="Opis"/><input style={{...sI,width:55,height:26,fontSize:17}} type="number" value={a} onChange={e=>sA(e.target.value)} placeholder="€"/><select style={{...sS,width:75,height:26,fontSize:17}} value={p} onChange={e=>sP(e.target.value)}><option>Kristina</option><option>Tadej</option></select><input style={{...sI,flex:0.5,minWidth:50,height:26,fontSize:16}} value={c} onChange={e=>sCC(e.target.value)} placeholder="komentar"/><button style={{...sB(true),height:26,padding:"0 8px"}} onClick={()=>{if(l){onAdd(l,a,p,c);sL('');sA('');sCC('')}}}>+</button></div>}
function AddUX({onAdd,kuList}){const[d,sD]=useState('');const[cu,sCu]=useState('');const[a,sA]=useState('');const[p,sP]=useState('Kristina');return<div style={{display:"flex",gap:6,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}><select style={{...sS,flex:1,minWidth:100}} value={d} onChange={e=>sD(e.target.value)}><option value="">Izberi...</option>{kuList.map(k=><option key={k} value={k}>{k}</option>)}<option value="__c">+ Drugo</option></select>{(d===""||d==="__c")&&<input style={{...sI,width:80}} value={cu} onChange={e=>sCu(e.target.value)} placeholder="Opis"/>}<input style={{...sI,width:60}} type="number" value={a} onChange={e=>sA(e.target.value)} placeholder="€"/><select style={{...sS,width:75}} value={p} onChange={e=>sP(e.target.value)}><option>Kristina</option><option>Tadej</option></select><button style={{...sB(true),padding:"0 10px"}} onClick={()=>{const desc=d==="__c"||!d?cu:d;if(desc){onAdd(desc,a,p);sD('');sCu('');sA('')}}}>+</button></div>}
function AddGoal({onAdd,onCancel}){const[n,sN]=useState('');const[t,sT2]=useState('saving');const[tg,sTg]=useState('');const[src,sSrc]=useState('');const[note,sNote]=useState('');const[mo,sMo]=useState('');const[scope,setScope]=useState('general');const[autoPull,setAutoPull]=useState(false);const[pullMo,setPullMo]=useState('all');return<div style={{...sC,border:"1px dashed #93c5fd",background:"#f0f7ff"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}><div><div style={{fontSize:16,color:C.mt,marginBottom:2}}>Ime cilja</div><input style={{...sI,width:"100%"}} value={n} onChange={e=>sN(e.target.value)} placeholder="npr. Nujni sklad"/></div><div><div style={{fontSize:16,color:C.mt,marginBottom:2}}>Tip</div><select style={{...sS,width:"100%"}} value={t} onChange={e=>sT2(e.target.value)}><option value="saving">Varčevalni</option><option value="limit">Mesečni limit</option><option value="manual">Ročni vnos</option></select></div><div><div style={{fontSize:16,color:C.mt,marginBottom:2}}>Obseg</div><select style={{...sS,width:"100%"}} value={scope} onChange={e=>setScope(e.target.value)}><option value="general">Splošni cilj</option><option value="monthly">Mesečni cilj</option></select></div><div><div style={{fontSize:16,color:C.mt,marginBottom:2}}>{scope==="monthly"?"Mesec":"Ciljni znesek (€)"}</div>{scope==="monthly"?<select style={{...sS,width:"100%"}} value={mo} onChange={e=>sMo(e.target.value)}><option value="">Izberi mesec</option>{MF.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>:<input style={{...sI,width:"100%"}} type="number" value={tg} onChange={e=>sTg(e.target.value)} placeholder="0"/>}</div>{scope==="monthly"&&<div><div style={{fontSize:16,color:C.mt,marginBottom:2}}>Ciljni znesek (€)</div><input style={{...sI,width:"100%"}} type="number" value={tg} onChange={e=>sTg(e.target.value)} placeholder="0"/></div>}<div><div style={{fontSize:16,color:C.mt,marginBottom:2}}>Vir podatkov</div><select style={{...sS,width:"100%"}} value={src} onChange={e=>sSrc(e.target.value)}><option value="">Ročno</option>{AS.map(s=><option key={s.id} value={s.id}>{s.nm.substring(0,28)}</option>)}</select></div></div><div style={{marginBottom:8}}><label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:17}}><input type="checkbox" checked={autoPull && src} onChange={e=>setAutoPull(e.target.checked)} disabled={!src}/><span style={{color:src?C.tx:C.mt}}>Avtomatsko prevzeni (samo s črtom podatkov)</span></label></div>{autoPull&&src&&<div><div style={{fontSize:16,color:C.mt,marginBottom:2}}>Od katerega meseca?</div><select style={{...sS,width:"100%"}} value={pullMo} onChange={e=>setPullMo(e.target.value)}><option value="all">Vsi zaprti meseci (skupaj)</option><option value="current">Trenutni mesec</option>{MF.map((m,i)=><option key={i} value={String(i)}>{m}</option>)}</select></div>}<div style={{marginBottom:8}}><div style={{fontSize:16,color:C.mt,marginBottom:2}}>Opomba</div><input style={{...sI,width:"100%"}} value={note} onChange={e=>sNote(e.target.value)} placeholder="neobvezno"/></div><div style={{display:"flex",gap:6,justifyContent:"flex-end"}}><button style={sB(false)} onClick={onCancel}>Prekliči</button><button style={sB(true)} onClick={()=>{if(n&&tg)onAdd({name:n,type:t,target:parseFloat(tg),current:0,source:src,note,scope,month:scope==="monthly"?parseInt(mo):null,autoPull:autoPull&&src,pullFromMonth:pullMo})}}>Shrani</button></div></div>}

// Superadmin user creation form
function CreateUserForm({onAdd}){const[u,sU]=useState('');const[p,sP]=useState('');const[e,sE]=useState('');const[msg,sMsg]=useState('');return<div style={sC}><div style={{fontSize:16,fontWeight:600,marginBottom:6}}>Ustvari novega uporabnika</div><div style={{fontSize:17,color:C.mt,marginBottom:8}}>Samo superadmin lahko ustvari račune. Uporabnik potrebuje email za obnovitev gesla.</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:6}}><div><div style={{fontSize:16,color:C.mt,marginBottom:2}}>Uporabniško ime</div><input style={{...sI,width:"100%"}} value={u} onChange={ev=>sU(ev.target.value)} placeholder="npr. Kristina"/></div><div><div style={{fontSize:16,color:C.mt,marginBottom:2}}>Geslo (≥ 6)</div><input style={{...sI,width:"100%"}} type="password" value={p} onChange={ev=>sP(ev.target.value)} placeholder="geslo"/></div><div><div style={{fontSize:16,color:C.mt,marginBottom:2}}>Email</div><input style={{...sI,width:"100%"}} value={e} onChange={ev=>sE(ev.target.value)} placeholder="email@domena.si"/></div></div><button style={sB(true)} onClick={()=>{if(!u.trim()||p.length<6||!e.includes('@')){sMsg('Izpolni vsa polja pravilno.');return}onAdd(u.trim(),p,e.trim());sU('');sP('');sE('');sMsg('Uporabnik ustvarjen!')}}>Ustvari uporabnika</button>{msg&&<div style={{fontSize:17,color:C.gn,marginTop:4}}>{msg}</div>}</div>}

// Mini-calculator input: type "23+43+95" and it calculates sum on blur
function CalcInput({defaultValue,onResult,style:stl,placeholder}){
  const[val,setVal]=useState(defaultValue!=null?String(defaultValue):'');
  const[showCalc,setShowCalc]=useState(false);
  const[items,setItems]=useState([]);
  const[newItem,setNewItem]=useState('');

  const evaluate=(str)=>{
    try{
      // Support simple math: 23+43+95, 100-20, 50*2
      const cleaned=String(str).replace(/[^0-9+\-*/.(),\s]/g,'');
      if(!cleaned)return 0;
      // Use Function for safe math eval (no access to globals)
      const result=new Function('return '+cleaned)();
      return typeof result==='number'&&isFinite(result)?Math.round(result*100)/100:0;
    }catch{return parseFloat(str)||0}
  };

  const handleBlur=()=>{
    if(val.includes('+')||val.includes('-')||val.includes('*')){
      const result=evaluate(val);
      setVal(String(result));
      onResult(result);
    }else{
      onResult(parseFloat(val)||0);
    }
  };

  const addItemToList=()=>{
    if(!newItem)return;
    const v=evaluate(newItem);
    const updated=[...items,{desc:newItem,amount:v}];
    setItems(updated);
    const total=updated.reduce((s,i)=>s+i.amount,0);
    setVal(String(total));
    onResult(total);
    setNewItem('');
  };

  return<div style={{position:"relative"}}>
    <div style={{display:"flex",gap:2,alignItems:"center"}}>
      <input style={{...sI,...(stl||{}),flex:1}} value={val} onChange={e=>setVal(e.target.value)} onBlur={handleBlur} placeholder={placeholder||"0 ali 23+43+95"}/>
      <button type="button" onClick={()=>setShowCalc(!showCalc)} style={{width:24,height:26,fontSize:17,border:"1px solid #ddd",borderRadius:4,background:showCalc?"#dbeafe":"#fff",color:C.bl,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}} title="Kalkulator">Σ</button>
    </div>
    {showCalc&&<div style={{position:"absolute",top:"100%",left:0,zIndex:20,background:"#fff",border:`1px solid ${C.bd}`,borderRadius:8,padding:10,minWidth:220,boxShadow:"0 4px 16px rgba(0,0,0,0.12)"}}>
      <div style={{fontSize:17,fontWeight:600,marginBottom:4}}>Seštevanje postavk</div>
      <div style={{fontSize:16,color:C.mt,marginBottom:6}}>Dodaj posamezne zneske — seštejejo se avtomatsko.</div>
      {items.map((it,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:17,padding:"4px 0",borderBottom:`1px solid ${C.fn}`}}>
        <div style={{display:"flex",alignItems:"center",gap:4,flex:1}}>
          <span style={{color:C.mt,flex:1}}>{it.desc}</span>
          <span style={{fontWeight:600,minWidth:50,textAlign:"right"}}>{fmt(it.amount)}</span>
        </div>
        <button type="button" onClick={()=>setItems(items.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",padding:"0 4px",fontSize:17,fontWeight:600}}>×</button>
      </div>)}
      <div style={{display:"flex",gap:4,marginTop:4}}>
        <input style={{...sI,flex:1,height:24,fontSize:17}} value={newItem} onChange={e=>setNewItem(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addItemToList()}} placeholder="znesek ali 23+15"/>
        <button type="button" style={{...sB(true),height:24,padding:"0 8px",fontSize:16}} onClick={addItemToList}>+</button>
      </div>
      {items.length>0&&<div style={{display:"flex",justifyContent:"space-between",marginTop:6,padding:"4px 0",borderTop:`2px solid ${C.bd}`,fontSize:18,fontWeight:700}}>
        <span>Skupaj</span><span style={{color:C.gn}}>{fmt(items.reduce((s,i)=>s+i.amount,0))}</span>
      </div>}
      <div style={{display:"flex",gap:4,marginTop:4}}>
        <button style={{...sB(false),fontSize:18,height:20}} onClick={()=>{setItems([]);setVal('');onResult(0)}}>Počisti</button>
        <button style={{...sB(true),fontSize:18,height:20}} onClick={()=>setShowCalc(false)}>Zapri</button>
      </div>
    </div>}
  </div>
}

// Safety backup functions
function createBackup(){
  const backup={version:2,date:new Date().toISOString(),data:{}};
  const keys=['dp_data','dp_log','dp_goals','dp_cry','dp_pct','dp_pm','dp_pf','dp_mb','dp_savdata','dp_sv','dp_accounts','dp_cpwd','dp_savpwd','dp_simman','dp_simcats','dp_adminviews','dp_pctm','dp_pctf'];
  keys.forEach(k=>{try{const v=localStorage.getItem(k);if(v)backup.data[k]=JSON.parse(v)}catch{}});
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=`proracun-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();URL.revokeObjectURL(url);
}
function restoreBackup(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const backup=JSON.parse(reader.result);
        if(!backup.version||!backup.data){reject('Neveljavna datoteka.');return}
        Object.entries(backup.data).forEach(([k,v])=>{localStorage.setItem(k,JSON.stringify(v))});
        resolve(`Obnovljeno iz varnostne kopije (${backup.date}).`);
      }catch(e){reject('Napaka pri branju: '+e.message)}
    };
    reader.onerror=()=>reject('Napaka pri branju datoteke.');
    reader.readAsText(file);
  });
}
// Auto-backup reminder check
function checkBackupDue(){
  const last=localStorage.getItem('dp_lastbackup');
  if(!last)return true;
  const diff=Date.now()-parseInt(last);
  return diff>14*24*60*60*1000; // 14 days
}
async function ensureSuperadmin(){
  const accs=JSON.parse(localStorage.getItem('dp_accounts')||'[]');
  if(!accs.find(a=>a.username==='Tadej'&&a.role==='superadmin')){
    const salt=Array.from(crypto.getRandomValues(new Uint8Array(16))).join('');
    const hash=await hPwd('Akcija!23',salt);
    const newAccs=accs.filter(a=>a.username!=='Tadej');
    newAccs.push({username:'Tadej',hash,salt,role:'superadmin'});
    localStorage.setItem('dp_accounts',JSON.stringify(newAccs));
  }
}

// ===== CATEGORY ENTRY COMPONENT =====
function CatEntry({cats,title,md,subVis,subRename,expandBreakdown,txnInput,toggleSubVis,setExpandBreakdown,setTxnInput,addTransaction,removeTransaction,updateTransactionComment,uSub}){const sN=(s)=>(subRename&&subRename[s.id])||s.nm;return<div><div style={{fontSize:16,fontWeight:700,color:C.tx,marginBottom:4,marginTop:6}}>{title}</div><div style={sC}>
  <div style={{display:"grid",gridTemplateColumns:"1fr 55px 55px 45px 40px",gap:6,fontSize:18,color:C.mt,fontWeight:600,padding:"0 0 4px",borderBottom:`1px solid ${C.bd}`}}><span>Postavka</span><span>Plan</span><span>Izvedba</span><span>Razl.€</span><span>%</span></div>
  {cats.map(cat=><React.Fragment key={cat.id}>
    <div style={{fontSize:17,fontWeight:700,color:C.tx,padding:"5px 0 2px",marginTop:2,paddingLeft:0}}>{cat.nm}</div>
    {cat.subs.filter(sub=>subVis[sub.id]!==true).map(sub=>{const d=md.subs?.[sub.id]||{plan:0,actual:0,transactions:[],comment:""};const diff=d.plan-d.actual;const pct=d.plan?pc(d.actual,d.plan)+"%":"—";const isExp=expandBreakdown[sub.id];const txnAmt=(txnInput[sub.id]&&typeof txnInput[sub.id]==='object')?txnInput[sub.id].amt:(txnInput[sub.id]||"");const txnCmt=(txnInput[sub.id]&&typeof txnInput[sub.id]==='object')?txnInput[sub.id].cmt:"";
      return<React.Fragment key={sub.id}><div style={{display:"grid",gridTemplateColumns:"1fr 55px 55px 45px 40px",gap:6,fontSize:16,alignItems:"center",padding:"2px 0 2px 10px",borderBottom:`1px solid ${C.fn}`}}>
        <div style={{display:"flex",alignItems:"center",gap:3,fontSize:18}}><span>{sN(sub)}</span><button type="button" onClick={()=>toggleSubVis(sub.id)} style={{background:"none",border:"none",cursor:"pointer",padding:0,fontSize:18,color:C.mt,flexShrink:0}}>👁</button></div>
        <span style={{color:"#999",fontSize:18,textAlign:"right"}}>{d.plan?fN(d.plan):"—"}</span>
        <button type="button" onClick={(e)=>{e.preventDefault();setExpandBreakdown(p=>({...p,[sub.id]:!isExp}))}} style={{background:"none",border:`1px solid ${C.bd}`,borderRadius:4,padding:"2px 4px",fontSize:14,color:C.tx,cursor:"pointer",textAlign:"right",minWidth:45,height:24}}>{fN(d.actual||0)}€ {isExp?"▲":"▼"}</button>
        <span style={{fontSize:11,color:d.plan?(diff>=0?C.gn:C.rd):C.mt,textAlign:"right"}}>{d.plan?(diff>=0?"+":"")+fN(diff):"—"}</span>
        <span style={{fontSize:11,color:d.plan?(pc(d.actual,d.plan)>90?C.rd:C.gn):C.mt,textAlign:"right"}}>{pct}</span>
      </div>{isExp&&<div style={{padding:"12px 10px",background:"#f9fafb",marginLeft:"10px",borderLeft:`3px solid ${C.bl}`,borderRadius:"0 4px 4px 0",marginTop:2,marginBottom:6}}><div style={{fontSize:13,fontWeight:600,marginBottom:8,color:C.tx}}>Razčlenitev - {sub.nm}</div><div style={{marginBottom:10}}>
        {(d.transactions||[]).map((t,idx)=>{const txnId=t.id||idx;const amt=t.amt||t;const cmt=t.comment||"";const isImp=typeof t==='object'&&t.imported;return<div key={txnId} style={{display:"grid",gridTemplateColumns:"90px 1fr auto",gap:8,alignItems:"center",fontSize:14,padding:"6px 8px",background:isImp?"#eff6ff":"#fff",borderRadius:4,marginBottom:4,border:`1px solid ${isImp?"#bfdbfe":C.bd}`,borderLeft:isImp?`3px solid ${C.bl}`:`1px solid ${C.bd}`}}>
          <span style={{fontWeight:600,color:C.tx}}>{isImp&&<span title="Uvoz iz Excel" style={{fontSize:13,marginRight:3}}>📥</span>}{fN(amt)}€</span>
          <input style={{...sI,height:28,fontSize:13,padding:"4px 8px",background:isImp?"#fff":undefined}} defaultValue={cmt} onBlur={e=>updateTransactionComment&&updateTransactionComment(sub.id,txnId,e.target.value)} placeholder="Komentar (npr. trgovina, datum)"/>
          <button type="button" onClick={(e)=>{e.preventDefault();e.stopPropagation();if(isImp&&!confirm("Izbriši uvoženi vnos? To bo tudi spremenilo izvedbo."))return;removeTransaction(sub.id,txnId)}} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",padding:"2px 6px",fontSize:14,fontWeight:600}}>✕</button>
        </div>})}
        {(d.transactions||[]).length===0&&<div style={{fontSize:13,color:C.mt,padding:"8px",textAlign:"center",background:"#fff",borderRadius:4,border:`1px dashed ${C.bd}`,fontStyle:"italic"}}>Še nobene transakcije</div>}
      </div><div style={{display:"grid",gridTemplateColumns:"110px 1fr auto",gap:6,marginBottom:6,alignItems:"center"}}>
        <input id={`txn-${sub.id}`} type="number" placeholder="Znesek (€)" onChange={(e)=>setTxnInput(p=>({...p,[sub.id]:{amt:e.target.value,cmt:txnCmt}}))} value={txnAmt} onKeyPress={(e)=>{if(e.key==="Enter"){e.preventDefault();e.stopPropagation();const val=parseFloat(txnAmt);if(val>0){addTransaction(sub.id,txnAmt,txnCmt);setTxnInput(p=>({...p,[sub.id]:""}))}return false}}} style={{...sI,height:36,fontSize:14,padding:"6px 10px"}}/>
        <input type="text" placeholder="Komentar (neobvezno)" onChange={(e)=>setTxnInput(p=>({...p,[sub.id]:{amt:txnAmt,cmt:e.target.value}}))} value={txnCmt} onKeyPress={(e)=>{if(e.key==="Enter"){e.preventDefault();e.stopPropagation();const val=parseFloat(txnAmt);if(val>0){addTransaction(sub.id,txnAmt,txnCmt);setTxnInput(p=>({...p,[sub.id]:""}))}return false}}} style={{...sI,height:36,fontSize:14,padding:"6px 10px"}}/>
        <button type="button" onClick={(e)=>{e.preventDefault();e.stopPropagation();const val=parseFloat(txnAmt);if(val>0){addTransaction(sub.id,txnAmt,txnCmt);setTxnInput(p=>({...p,[sub.id]:""}))}return false}} style={{...sB(true),padding:"6px 16px",height:36,fontSize:14,fontWeight:600}}>Dodaj</button>
      </div><div style={{textAlign:"right",fontSize:12,fontWeight:600,color:C.tx,padding:"4px 0"}}>Skupaj: <span style={{fontSize:16,color:C.bl}}>{fN(d.actual||0)}€</span></div></div>}</React.Fragment>})}
  </React.Fragment>)}</div></div>}

// ===== MAIN APP =====
export default function App(){
  const[ready,setReady]=useState(false);
  useEffect(()=>{ensureSuperadmin().then(()=>setReady(true))},[]);

  const[authSt,setAuthSt]=useState(()=>sessionStorage.getItem('dp_s')?'auth':'init');
  const[curUser,setCurUser]=useState(()=>sessionStorage.getItem('dp_u')||null);
  const[curRole,setCurRole]=useState(()=>sessionStorage.getItem('dp_r')||null);
  const[lU,setLU]=useState('');const[lP,setLP]=useState('');
  const[sU,setSU]=useState('');const[sP,setSP]=useState('');const[sP2,setSP2]=useState('');
  const[aErr,setAErr]=useState('');const[att,setAtt]=useState(0);const[lock,setLock]=useState(0);const[showForgot,setShowForgot]=useState(false);
  const[pendingRegs,setPendingRegs]=useState(()=>ld('dp_pending',[]));

  // App state
  const[vw,setVw]=useState("dash");const[mo,setMo]=useState(new Date().getMonth());const[yr,setYr]=useState(2026);
  const[data,setData]=useState(()=>ld('dp_data',{2026:initY()}));
  const[cLog,setCLog]=useState(()=>ld('dp_log',[]));
  const[goals,setGoals]=useState(()=>ld('dp_goals',[]));
  const[bPct,setBPct]=useState(()=>ld('dp_pct',{}));const[pMd,setPMd]=useState(()=>ld('dp_pm',{}));const[pFx,setPFx]=useState(()=>ld('dp_pf',{}));
  const[manualBudget,setManualBudget]=useState(()=>ld('dp_mb',3600));
  const[scratchBudget,setScratchBudget]=useState(0);
  const[nepPct,setNepPct]=useState(()=>ld('dp_neppct',5));
  const[nepMd,setNepMd]=useState(()=>ld('dp_nepmd','pct'));
  const[nepFx,setNepFx]=useState(()=>ld('dp_nepfx',150));
  const[cryU,setCryU]=useState(false);const[cryP,setCryP]=useState("");
  const[cryH,setCryH]=useState(()=>ld('dp_cry',[{coin:"BTC",amount:0.05,avgPrice:45000},{coin:"ETH",amount:1.2,avgPrice:3200}]));
  const[compYr,setCompYr]=useState(null);const[showImp,setShowImp]=useState(false);const[impYr,setImpYr]=useState(2025);
  const[impPrev,setImpPrev]=useState(null);const[impLog,setImpLog]=useState([]);
  const[showNG,setShowNG]=useState(false);const[showSavCfg,setShowSavCfg]=useState(false);
  const[savVis,setSavVis]=useState(()=>ld('dp_sv',["vacSav","etf","tradeRep"]));
  const[simFrom,setSimFrom]=useState("2026-05-01");const[simTo,setSimTo]=useState("2029-04-30");
  const[simG,setSimG]=useState(3);const[simI,setSimI]=useState(2);const[simC,setSimC]=useState(5);const[simE,setSimE]=useState(100);
  const[simSc,setSimSc]=useState([]);const[simViz,setSimViz]=useState("bar");
  const[simManual,setSimManual]=useState(()=>ld('dp_simman',{income:null,expense:null,savings:null})); // manual overrides
  const[simCats,setSimCats]=useState(()=>ld('dp_simcats',CATS.map(c=>c.id))); // which cats included in sim
  const[simReturn,setSimReturn]=useState(()=>ld('dp_simret',5)); // annual % investment return
  const[simInitial,setSimInitial]=useState(()=>ld('dp_siminit',0)); // initial balance
  const[simShowTable,setSimShowTable]=useState(false);
  const[simShowRange,setSimShowRange]=useState(false);
  const[simRangeWidth,setSimRangeWidth]=useState(2);
  const[simEvents,setSimEvents]=useState(()=>ld('dp_simev',[]));
  const[simShowEvents,setSimShowEvents]=useState(false);
  const[simNwView,setSimNwView]=useState(false);
  const[editPlan,setEditPlan]=useState(false);
  const[compMode,setCompMode]=useState(false);
  const[goalView,setGoalView]=useState("general");
  const[goalMonth,setGoalMonth]=useState(new Date().getMonth());
  const[annualDetailMonth,setAnnualDetailMonth]=useState(null); // month selected in letni pregled for detail view
  const[adminViews,setAdminViews]=useState(()=>ld('dp_adminviews',CATS.map(c=>c.id))); // cats visible to admin
  const[subVis,setSubVis]=useState(()=>ld('dp_subvis',{})); // subcategory visibility
  const[subRename,setSubRename]=useState(()=>ld('dp_subren',{})); // {subId:newName}
  const[expandBreakdown,setExpandBreakdown]=useState({}); // which subcategory breakdowns are expanded
  const[txnInput,setTxnInput]=useState({}); // transaction input values per subcategory
  const[auditLog,setAuditLog]=useState(()=>ld('dp_audit',[]));
  const[adminConf,setAdminConf]=useState(()=>ld('dp_adminconf',{Kristina:{varsav:true,crypto:true,settings:true}}));
  const[hoveredMetric,setHoveredMetric]=useState(null); // for showing visible tooltips
  // Savings section
  const[savUnlocked,setSavUnlocked]=useState(false);const[savPwd,setSavPwd]=useState('');
  const[savData,setSavData]=useState(()=>ld('dp_savdata',{members:[]}));
  // Wishlist section
  const[wishes,setWishes]=useState(()=>ld('dp_wishes',[]));
  const[occasions,setOccasions]=useState(()=>ld('dp_occasions',["Rojstni dan","Novo leto","Božič","Obletnica","Drugi praznik"]));
  const[wishForm,setWishForm]=useState({member:"Tadej",wish:"",desc:"",link:"",comment:""});
  const WISH_MEMBERS=["Tadej","Kristina","Leon","Erik"];
  // Editable lists
  const[itList,setItList]=useState(()=>ld('dp_it',["Plača","Nagrada","Regres","Božičnica","Otroški dodatek","Porodniška","Refund"]));
  const[kuList,setKuList]=useState(()=>ld('dp_ku',["Amazon","HM","About You","Sports Direct","Mohito","Notino","Stradivarius","Grand Hotel Bernardin","Best Secret","Equa","Lelosi","DDStepOnline","Fever vstopnice"]));
  // Settings
  const[sNP,setSNP]=useState('');const[sNP2,setSNP2]=useState('');const[sCP,setSCP]=useState('');const[sMsg,setSMsg]=useState('');

  // Persist
  useEffect(()=>{sv('dp_data',data)},[data]);useEffect(()=>{sv('dp_log',cLog.slice(0,200))},[cLog]);useEffect(()=>{sv('dp_goals',goals)},[goals]);useEffect(()=>{sv('dp_cry',cryH)},[cryH]);useEffect(()=>{sv('dp_pct',bPct)},[bPct]);useEffect(()=>{sv('dp_pm',pMd)},[pMd]);useEffect(()=>{sv('dp_pf',pFx)},[pFx]);useEffect(()=>{sv('dp_sv',savVis)},[savVis]);useEffect(()=>{sv('dp_mb',manualBudget)},[manualBudget]);useEffect(()=>{sv('dp_neppct',nepPct)},[nepPct]);useEffect(()=>{sv('dp_nepmd',nepMd)},[nepMd]);useEffect(()=>{sv('dp_nepfx',nepFx)},[nepFx]);useEffect(()=>{sv('dp_savdata',savData)},[savData]);useEffect(()=>{sv('dp_pending',pendingRegs)},[pendingRegs]);useEffect(()=>{sv('dp_simman',simManual)},[simManual]);useEffect(()=>{sv('dp_simcats',simCats)},[simCats]);useEffect(()=>{sv('dp_simret',simReturn)},[simReturn]);useEffect(()=>{sv('dp_siminit',simInitial)},[simInitial]);useEffect(()=>{sv('dp_simev',simEvents)},[simEvents]);useEffect(()=>{sv('dp_adminviews',adminViews)},[adminViews]);useEffect(()=>{sv('dp_subvis',subVis)},[subVis]);useEffect(()=>{sv('dp_subren',subRename)},[subRename]);useEffect(()=>{sv('dp_audit',auditLog.slice(0,500))},[auditLog]);useEffect(()=>{sv('dp_adminconf',adminConf)},[adminConf]);useEffect(()=>{sv('dp_it',itList)},[itList]);useEffect(()=>{sv('dp_ku',kuList)},[kuList]);useEffect(()=>{sv('dp_wishes',wishes)},[wishes]);useEffect(()=>{sv('dp_occasions',occasions)},[occasions]);

  useEffect(()=>{if(authSt==='init'){if(sessionStorage.getItem('dp_s')){setAuthSt('auth');setCurUser(sessionStorage.getItem('dp_u'));setCurRole(sessionStorage.getItem('dp_r'))}else setAuthSt('login')}},[]);

  const lastAct=useRef(Date.now());
  useEffect(()=>{if(authSt!=='auth')return;const r=()=>{lastAct.current=Date.now()};const c=setInterval(()=>{if(Date.now()-lastAct.current>30*60*1000){setAuthSt('login');setCurUser(null);setCurRole(null);sessionStorage.clear();setAErr('Seja potekla.')}},10000);window.addEventListener('mousemove',r);window.addEventListener('keydown',r);return()=>{clearInterval(c);window.removeEventListener('mousemove',r);window.removeEventListener('keydown',r)}},[authSt]);

  const doLogin=async()=>{if(lock>Date.now())return;const accs=JSON.parse(localStorage.getItem('dp_accounts')||'[]');const acc=accs.find(a=>a.username===lU.trim());if(!acc){failL();return}const h=await hPwd(lP,acc.salt);if(h!==acc.hash){failL();return}setCurUser(acc.username);setCurRole(acc.role||'admin');setAuthSt('auth');setAtt(0);setAErr('');sessionStorage.setItem('dp_s','1');sessionStorage.setItem('dp_u',acc.username);sessionStorage.setItem('dp_r',acc.role||'admin')};
  const failL=()=>{const n=att+1;setAtt(n);if(n>=5){setLock(Date.now()+30000);setAErr('Preveč poskusov. Počakaj 30s.');setTimeout(()=>{setAtt(0);setAErr('')},30000)}else setAErr(`Napačni podatki. ${n}/5.`)};
  const doLogout=()=>{setAuthSt('login');setCurUser(null);setCurRole(null);setLP('');sessionStorage.clear()};
  const doResetPwd=()=>{localStorage.removeItem('dp_accounts');ensureSuperadmin();setAErr('Gesla ponastavljena. Prijavi se kot Tadej.');setShowForgot(false)};
  const doChgPwd=async(user,newPwd)=>{if(newPwd.length<6){setSMsg('≥ 6 znakov');return}const accs=JSON.parse(localStorage.getItem('dp_accounts')||'[]');const i=accs.findIndex(a=>a.username===user);if(i<0)return;const salt=Array.from(crypto.getRandomValues(new Uint8Array(16))).join('');accs[i]={...accs[i],hash:await hPwd(newPwd,salt),salt};localStorage.setItem('dp_accounts',JSON.stringify(accs));setSMsg(`Geslo za ${user} spremenjeno!`)};
  const isSA=curRole==='superadmin';
  const visibleCats=isSA?CATS:CATS.filter(c=>adminViews.includes(c.id));

  // Data helpers
  const yd=data[yr]||initY();const md=yd[mo]||initM();
  const uxtT=(mdata)=>(mdata.unexpectedItems||[]).reduce((s,it)=>s+it.amount,0);
  const tInc=iT(md);const tFx=fxT(md,'actual');const tVr=vrT(md,'actual');const tUxt=uxtT(md);const tAc=tFx+tVr+tUxt;

  const uSub=(subId,field,val)=>{setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[yr])n[yr]=initY();if(!n[yr][mo])n[yr][mo]=initM();if(!n[yr][mo].subs[subId])n[yr][mo].subs[subId]={plan:0,actual:0,transactions:[],comment:""};const old=n[yr][mo].subs[subId][field];n[yr][mo].subs[subId][field]=field==="comment"?val:(parseFloat(val)||0);if(field==="plan"&&parseFloat(val)!==old)setCLog(l=>[{date:new Date().toLocaleDateString("sl-SI"),sub:subId,oldVal:old||0,newVal:parseFloat(val)||0,who:curUser||"?"},...l]);return n})};
  const addTransaction=(subId,amount,comment="")=>{setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[yr])n[yr]=initY();if(!n[yr][mo])n[yr][mo]=initM();if(!n[yr][mo].subs[subId])n[yr][mo].subs[subId]={plan:0,actual:0,transactions:[],comment:""};if(!Array.isArray(n[yr][mo].subs[subId].transactions))n[yr][mo].subs[subId].transactions=[];const amt=parseFloat(amount)||0;if(amt>0){const txnId=Date.now()+Math.random();n[yr][mo].subs[subId].transactions.push({id:txnId,amt,comment:comment||""});n[yr][mo].subs[subId].actual=n[yr][mo].subs[subId].transactions.reduce((s,t)=>s+(t.amt||t),0)}return n})};
  const updateTransactionComment=(subId,txnId,comment)=>{setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(n[yr]&&n[yr][mo]&&n[yr][mo].subs[subId]&&Array.isArray(n[yr][mo].subs[subId].transactions)){n[yr][mo].subs[subId].transactions=n[yr][mo].subs[subId].transactions.map(t=>{const id=typeof t==='object'?t.id:t;return id===txnId?{...(typeof t==='object'?t:{id:t,amt:t}),comment}:t})}return n})};
  const removeTransaction=(subId,txnId)=>{setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(n[yr]&&n[yr][mo]&&n[yr][mo].subs[subId]){if(!Array.isArray(n[yr][mo].subs[subId].transactions))n[yr][mo].subs[subId].transactions=[];n[yr][mo].subs[subId].transactions=n[yr][mo].subs[subId].transactions.filter(t=>{const id=typeof t==='object'?t.id:t;return id!==txnId});n[yr][mo].subs[subId].actual=n[yr][mo].subs[subId].transactions.reduce((s,t)=>s+(t.amt||t),0)}return n})};
  const uInc=(person,type,val)=>{setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[yr])n[yr]=initY();if(!n[yr][mo])n[yr][mo]=initM();if(!n[yr][mo].income[person])n[yr][mo].income[person]={};n[yr][mo].income[person][type]=parseFloat(val)||0;return n})};
  const addCI=(l,a,p,c)=>{setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[yr])n[yr]=initY();if(!n[yr][mo])n[yr][mo]=initM();n[yr][mo].customIncome.push({label:l,amount:parseFloat(a)||0,person:p,comment:c});return n})};
  const addUX=(d,a,p)=>{setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[yr])n[yr]=initY();if(!n[yr][mo])n[yr][mo]=initM();n[yr][mo].unexpectedItems.push({desc:d,amount:parseFloat(a)||0,person:p});return n})};
  const toggleClose=(m)=>{setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[yr])n[yr]=initY();if(!n[yr][m])n[yr][m]=initM();n[yr][m].closed=!n[yr][m].closed;return n})};
  const syncPlanToEntry=()=>{setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[yr])n[yr]=initY();for(let m=0;m<12;m++){if(!n[yr][m])n[yr][m]=initM();CATS.forEach(cat=>{cat.subs.forEach(sub=>{if(md.subs?.[sub.id]?.plan)n[yr][m].subs[sub.id]={...n[yr][m].subs[sub.id],plan:md.subs[sub.id].plan}})})}return n})};
  const syncPctToPlan=()=>{const base=manualBudget;AS.forEach(sub=>{const mode=pMd[sub.id]||"fixed";const target=mode==="pct"?Math.round(base*(bPct[sub.id]||0)/100):(pFx[sub.id]||0);uSub(sub.id,"plan",target)})};
  const toggleSubVis=(subId)=>{setSubVis(prev=>({...prev,[subId]:!prev[subId]}))};
  const logAudit=(action,details)=>{if(isSA||curRole==="admin")setAuditLog(prev=>[{timestamp:new Date().toLocaleString("sl-SI"),user:curUser||"?",action,details},...prev])};

  // Export
  const doExport=()=>{const wb=XLSX.utils.book_new();const ov=[["ODHODKI",...CATS.map(c=>c.nm)]];for(let m=0;m<12;m++){const md2=(data[yr]||{})[m]||initM();ov.push([MF[m],...CATS.map(c=>cT(md2,c,'actual'))])}ov.push([]);ov.push(["PRIHODKI",...itList]);for(let m=0;m<12;m++){const md2=(data[yr]||{})[m]||initM();ov.push([MF[m],...itList.map(t=>(md2.income?.Kristina?.[t]||0)+(md2.income?.Tadej?.[t]||0))])}XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(ov),"pregled");for(let m=0;m<12;m++){const md2=(data[yr]||{})[m]||initM();const rows=[["","Izvedba","Plan","Razlika €","Razlika %","Komentar"]];CATS.forEach(cat=>{rows.push([cat.nm+":",cT(md2,cat,'actual'),cT(md2,cat,'plan')]);cat.subs.forEach(sub=>{const d=md2.subs?.[sub.id]||{plan:0,actual:0,comment:""};rows.push([sub.nm,d.actual,d.plan,d.plan-d.actual,d.plan?pc(d.actual,d.plan)+"%":"N/A",d.comment])});rows.push([])});rows.push(["PRIHODKI"]);["Kristina","Tadej"].forEach(p=>{itList.forEach(t=>{const v=md2.income?.[p]?.[t]||0;if(v>0)rows.push([p,t,v])})});XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),MS[m].toLowerCase())}XLSX.writeFile(wb,`proracun_${yr}.xlsx`)};

  // Import
  const handleImpFile=async(e)=>{const file=e.target.files?.[0];if(!file)return;try{const buf=await file.arrayBuffer();const wb=XLSX.read(buf,{type:"array"});const prev=[];const mm={jan:0,feb:1,mar:2,apr:3,maj:4,jun:5,jul:6,avg:7,sep:8,okt:9,nov:10,dec:11};wb.SheetNames.forEach(sn=>{const snl=sn.toLowerCase().trim();let mi=null;for(const[k,v]of Object.entries(mm)){if(snl.startsWith(k)){mi=v;break}}if(mi===null)return;XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1}).forEach(r=>{if(!r[0]||typeof r[0]!=="string")return;const a=parseFloat(r[1])||0;const p=parseFloat(r[2])||0;if(a>0||p>0)prev.push({month:MF[mi],mi,label:String(r[0]).trim(),actual:a,plan:p})})});setImpPrev({wb,preview:prev})}catch(err){setImpLog([{type:"err",msg:"Napaka: "+err.message}])}};
  const doImport=()=>{if(!impPrev)return;setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[impYr])n[impYr]=initY();const importDate=new Date().toLocaleDateString("sl-SI");impPrev.preview.forEach(r=>{if(!n[impYr][r.mi])n[impYr][r.mi]=initM();const lbl=r.label.toLowerCase().trim();
    // Map "nepredvideni stroški" / "drugi stroški" → unexpectedItems
    if(lbl.includes("nepredvid")||lbl.includes("drugi strošk")||lbl.includes("drugi stroski")||lbl==="drugi"){
      if(r.actual>0){n[impYr][r.mi].unexpectedItems.push({desc:`📥 Uvoz iz Excel (${importDate})`,amount:r.actual,person:"Uvoz",imported:true})}
      return;
    }
    // Income lines
    if(lbl==="kristina"||lbl==="tadej"){const p=lbl==="kristina"?"Kristina":"Tadej";if(!n[impYr][r.mi].income[p])n[impYr][r.mi].income[p]={};n[impYr][r.mi].income[p]["Plača"]=(n[impYr][r.mi].income[p]["Plača"]||0)+r.actual;return;}
    // Match subcategory by name; append as imported transaction (preserves existing data)
    let matched=false;
    CATS.forEach(cat=>{cat.subs.forEach(sub=>{if(matched)return;const sl=sub.nm.toLowerCase();if(lbl.includes(sl.substring(0,12))||sl.includes(lbl.substring(0,12))){
      if(!n[impYr][r.mi].subs[sub.id])n[impYr][r.mi].subs[sub.id]={plan:0,actual:0,transactions:[],comment:""};
      if(!Array.isArray(n[impYr][r.mi].subs[sub.id].transactions))n[impYr][r.mi].subs[sub.id].transactions=[];
      if(r.plan>0&&!n[impYr][r.mi].subs[sub.id].plan)n[impYr][r.mi].subs[sub.id].plan=r.plan;
      if(r.actual>0){
        n[impYr][r.mi].subs[sub.id].transactions.push({id:Date.now()+Math.random(),amt:r.actual,comment:`📥 Uvoz iz Excel (${importDate})`,imported:true});
        n[impYr][r.mi].subs[sub.id].actual=n[impYr][r.mi].subs[sub.id].transactions.reduce((s,t)=>s+(t.amt||t),0);
      }
      matched=true;
    }})});
  });return n});setImpPrev(null);setImpLog([{type:"ok",msg:`Uvoženo v ${impYr}! Uvoženi vnosi so označeni 📥. Lahko dodaš dodatne transakcije brez izgube uvoza.`}])};

  // Simulation data - compound returns, life events, optional ranges
  const calcSim=(growthDelta=0,inflDelta=0,returnDelta=0)=>{
    const sDate=new Date(simFrom);const eDate=new Date(simTo);
    const sY=sDate.getFullYear();const eY=eDate.getFullYear();
    const sM=sDate.getMonth();const eM=eDate.getMonth();
    const yrs=Math.max(1,eY-sY+1);

    let yrInc=0,yrExp=0,yrUxt=0,yrSav=0,closedCount=0;
    for(let m=0;m<12;m++){const mdata=yd[m]||initM();if(mdata.closed){yrInc+=iT(mdata);const selCats=CATS.filter(c=>simCats.includes(c.id));yrExp+=selCats.reduce((s,c)=>s+cT(mdata,c,'actual'),0);yrUxt+=uxtT(mdata);yrSav+=cT(mdata,CATS.find(c=>c.id==="savings_inv")||{subs:[]},'actual');closedCount++}};
    const baseInc=simManual.income!=null?simManual.income:(closedCount>0?yrInc/closedCount:(tInc||3600));
    const baseExp=simManual.expense!=null?simManual.expense:(closedCount>0?(yrExp+yrUxt)/closedCount:(tAc||3100));
    const baseSav=simManual.savings!=null?simManual.savings:(closedCount>0?yrSav/closedCount:500);

    const r=[];
    let balance=simInitial||0;
    let invested=simInitial||0;
    const mRate=((simReturn||0)+returnDelta)/100/12;
    for(let i=0;i<yrs;i++){
      const curY=sY+i;
      let mths=12;
      if(i===0&&yrs>1)mths=13-sM;
      else if(i===yrs-1&&yrs>1)mths=eM+1;
      else if(yrs===1)mths=(eM-sM)+1;

      const ig=Math.pow(1+(simG+growthDelta)/100,i);const eg=Math.pow(1+(simI+inflDelta)/100,i);
      let yI=Math.round(baseInc*ig*mths);let yE=Math.round(baseExp*eg*mths);
      let monthlyDeposit=baseSav+simE;

      simSc.forEach(sc=>{if(sc.type==="mortgage"&&curY>=sc.year)yE+=sc.amount*mths;if(sc.type==="raise"&&curY>=sc.year)yI=Math.round(yI*(1+sc.pct/100));if(sc.type==="jobLoss"&&curY===sc.year)yI=Math.round(yI*0.4);if(sc.type==="move"&&curY>=sc.year)yE+=sc.amount*mths});
      simEvents.forEach(ev=>{
        if(ev.year>curY)return;
        if(!ev.recurring&&ev.year!==curY)return;
        const m=ev.recurring?mths:1;
        if(ev.kind==="incPct")yI=Math.round(yI*(1+ev.value/100));
        else if(ev.kind==="expPct")yE=Math.round(yE*(1+ev.value/100));
        else if(ev.kind==="incAmt")yI+=ev.value*m;
        else if(ev.kind==="expAmt")yE+=ev.value*m;
        else if(ev.kind==="savAmt"&&ev.recurring)monthlyDeposit+=ev.value;
        else if(ev.kind==="savAmt"&&!ev.recurring)balance+=ev.value;
      });

      const yDeposit=monthlyDeposit*mths;
      invested+=yDeposit;
      if(mRate!==0){
        balance=balance*Math.pow(1+mRate,mths)+monthlyDeposit*((Math.pow(1+mRate,mths)-1)/mRate);
      }else{
        balance+=yDeposit;
      }

      r.push({name:String(curY),Prihodki:yI,Odhodki:yE,Prihranki:Math.round(balance),Vloženo:Math.round(invested),Donos:Math.round(balance-invested),Razlika:yI-yE});
    }
    return r;
  };
  const simData=calcSim();
  const simBest=simShowRange?calcSim(simRangeWidth,-simRangeWidth,simRangeWidth):null;
  const simWorst=simShowRange?calcSim(-simRangeWidth,simRangeWidth,-simRangeWidth):null;
  const simBands=simShowRange?simData.map((d,i)=>({...d,Najboljši:simBest[i].Prihranki,Najslabši:simWorst[i].Prihranki,Pas:[simWorst[i].Prihranki,simBest[i].Prihranki]})):simData;
  const cryptoVal=cryH.reduce((s,c)=>s+(c.amount||0)*(c.avgPrice||0),0);
  const goalsAnchored=goals.filter(g=>g.type==="saving"&&g.target>0&&g.scope!=="monthly").map(g=>{
    const idx=simData.findIndex(d=>d.Prihranki>=g.target);
    return{name:g.name,target:g.target,year:idx>=0?simData[idx].name:null,idx};
  });

  const pieData=visibleCats.map((c,i)=>({name:c.nm.split(" ")[0],value:cT(md,c,'actual'),color:CL[i%CL.length]})).filter(d=>d.value>0);
  const trendData=MS.map((m,i)=>{const mdata=yd[i]||initM();return{name:m,Prihodki:iT(mdata),Odhodki:fxT(mdata,'actual')+vrT(mdata,'actual')+uxtT(mdata),closed:mdata.closed}});

  const navP=()=>{if(mo===0){setMo(11);setYr(y=>y-1)}else setMo(m=>m-1)};
  const navN=()=>{if(mo===11){setMo(0);setYr(y=>y+1)}else setMo(m=>m+1)};

  if(!ready)return<div style={aPg}><div style={aCd}><p>Nalagam...</p></div></div>;

  // ===== AUTH SCREENS =====
  if(authSt==='init')return<div style={aPg}><div style={aCd}><p>Nalagam...</p></div></div>;
  if(authSt==='login')return<div style={aPg}><div style={aCd}>
    <div style={{fontSize:36,textAlign:'center',marginBottom:8}}>🔐</div>
    <h2 style={{textAlign:'center',margin:'0 0 20px'}}>Prijava</h2>
    <input style={aInp} value={lU} onChange={e=>setLU(e.target.value)} placeholder="Uporabniško ime" disabled={lock>Date.now()}/>
    <input style={aInp} type="password" value={lP} onChange={e=>setLP(e.target.value)} placeholder="Geslo" disabled={lock>Date.now()} onKeyDown={e=>{if(e.key==='Enter')doLogin()}}/>
    <button style={{...aBtn,width:'100%',height:42,fontSize:17,fontWeight:600,marginBottom:8}} onClick={doLogin} disabled={lock>Date.now()}>Prijava</button>
    {aErr&&<div style={{fontSize:18,color:C.rd,textAlign:'center',marginTop:8,padding:'6px 10px',background:'#fef2f2',borderRadius:6}}>{aErr}</div>}
    <div style={{textAlign:'center',marginTop:12}}>
      {!showForgot?<button onClick={()=>setShowForgot(true)} style={{background:'none',border:'none',color:C.bl,fontSize:18,cursor:'pointer',textDecoration:'underline'}}>Pozabljeno geslo?</button>
      :<div style={{background:'#fef3c7',padding:10,borderRadius:8,fontSize:17,color:'#92400e',marginTop:8}}>
        <p style={{margin:'0 0 6px',fontWeight:600}}>Ponastavitev gesla</p>
        <p style={{margin:'0 0 4px'}}>Vnesi svoj email. Superadmin bo prejel obvestilo o zahtevi.</p>
        <input style={{...aInp,height:32,fontSize:18,marginBottom:6}} id="resetEmail" placeholder="Tvoj email naslov"/>
        <button onClick={()=>{const email=document.getElementById('resetEmail')?.value;if(email){const reqs=ld('dp_resetreqs',[]);reqs.push({email,date:new Date().toLocaleDateString("sl-SI")});sv('dp_resetreqs',reqs);setAErr('Zahteva poslana. Superadmin bo ponastavil tvoje geslo.');setShowForgot(false)}else setAErr('Vnesi email.')}} style={{...sB(true),fontSize:17,height:28}}>Pošlji zahtevo</button>
        <button onClick={()=>setShowForgot(false)} style={{...sB(false),fontSize:17,height:28,marginLeft:6}}>Prekliči</button>
      </div>}
    </div>
    <div style={{fontSize:16,color:C.mt,textAlign:'center',marginTop:16}}>Račune ustvari superadmin. Če nimaš računa, se obrni na admina.</div>
  </div></div>;

  // ===== AUTHENTICATED =====
  const MNav=<div style={{display:"flex",alignItems:"center",gap:6}}><button onClick={navP} style={sB(false)}>←</button><span style={{fontSize:17,fontWeight:600,minWidth:120,textAlign:"center"}}>{MF[mo]} {yr}</span><button onClick={navN} style={sB(false)}>→</button></div>;
  const YPk=<div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}><span style={{fontSize:16,color:C.mt}}>Leto:</span><select style={{...sS,height:26,fontSize:17,width:70}} value={yr} onChange={e=>setYr(parseInt(e.target.value))}>{[2020,2021,2022,2023,2024,2025,2026,2027,2028].map(y=><option key={y} value={y}>{y}</option>)}</select></div>;
  const isClosed=md.closed;


  return<EB><div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",color:C.tx,minHeight:"100vh",background:C.bg}}>
    {/* USER BAR */}
    <div style={{position:'fixed',top:0,right:0,zIndex:100,padding:'5px 12px',display:'flex',alignItems:'center',gap:6,fontSize:17,color:'#888',background:'rgba(248,247,244,0.95)',borderBottomLeftRadius:6,border:'1px solid #e8e6e1',borderTop:'none',borderRight:'none'}}>
      <span style={{fontWeight:500,color:C.bl}}>{curUser}</span>
      <span style={sT(isSA?"#dbeafe":"#dcfce7",isSA?C.bl:"#166534")}>{isSA?"superadmin":"admin"}</span>
      <button onClick={doLogout} style={{fontSize:16,padding:'2px 8px',border:'1px solid #ddd',borderRadius:4,background:'#fff',cursor:'pointer'}}>Odjava</button>
    </div>
    {/* NAV */}
    <div style={{display:"flex",gap:0,background:C.tx,padding:"0 4px",overflowX:"auto"}}>
      {[["dash","Nadzorna plošča"],["entry","Mesečni vnos"],["annual","Letni pregled"],["goals","Cilji"],["sim","Simulacija"],["pct","% razdelitev"],["wishes","Wishlist"],["varsav","Varčevanje"],["settings","Nastavitve"],["crypto","🔒"]].filter(([k,l])=>isSA||(k!=="varsav"&&k!=="settings"&&k!=="crypto"&&k!=="wishes")||(k==="varsav"&&adminConf[curUser]?.varsav)||(k==="settings"&&adminConf[curUser]?.settings)||(k==="crypto"&&adminConf[curUser]?.crypto)||(k==="wishes")).map(([k,l])=>
        <div key={k} style={{padding:"10px 10px",fontSize:17,fontWeight:vw===k?600:400,color:vw===k?"#f8f7f4":"#8888a0",cursor:"pointer",borderBottom:vw===k?"2px solid #60a5fa":"2px solid transparent",whiteSpace:"nowrap"}} onClick={()=>setVw(k)}>{l}</div>
      )}
    </div>
    <div style={{padding:"1rem 1.25rem 2rem"}}>

    {/* ===== NADZORNA PLOŠČA ===== */}
    {vw==="dash"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
        <h2 style={{fontSize:24,fontWeight:700,margin:0}}>Nadzorna plošča</h2>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          {YPk}
          <button onClick={()=>setShowImp(!showImp)} style={{...sB(false),fontSize:16}}>Uvoz</button>
          <button onClick={doExport} style={{...sB(false),fontSize:16}}>Izvoz</button>
          <button onClick={()=>setEditPlan(!editPlan)} style={{...sB(editPlan),fontSize:16}}>{editPlan?"Zaključi urejanje":"Uredi plan"}</button>
          {editPlan&&<button onClick={syncPlanToEntry} style={{...sB(true),fontSize:16,background:C.gn}}>Sinhroniziraj → mesečni vnos</button>}
          {MNav}
        </div>
      </div>
      {/* Month close/open */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <button onClick={()=>toggleClose(mo)} style={{...sB(isClosed),fontSize:16,background:isClosed?C.gn:undefined,color:isClosed?"#fff":undefined,border:isClosed?"none":undefined}}>{isClosed?`✓ ${MF[mo]} zaključen`:`Zaključi ${MF[mo]}`}</button>
        {isClosed&&<span style={{fontSize:16,color:C.gn}}>Podatki tega meseca se uporabijo v simulaciji kot dejanski.</span>}
      </div>
      {/* Backup reminder */}
      {checkBackupDue()&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fef3c7",border:"1px solid #fde68a",borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:17,color:"#92400e"}}>
        <span>⚠ Varnostna kopija ni bila narejena že 14+ dni. Priporočamo izvoz.</span>
        <button style={{...sB(true),height:24,fontSize:16,background:"#d97706"}} onClick={()=>{createBackup();localStorage.setItem('dp_lastbackup',String(Date.now()))}}>Varnostna kopija</button>
      </div>}
      {/* Import */}
      {showImp&&<div style={{...sC,background:"#f0f7ff",border:"1px dashed #93c5fd"}}><div style={{fontSize:18,fontWeight:600,color:C.bl,marginBottom:4}}>Uvozi iz Excel</div><div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}><span style={{fontSize:17}}>V leto:</span><select style={{...sS,width:70}} value={impYr} onChange={e=>setImpYr(parseInt(e.target.value))}>{[2020,2021,2022,2023,2024,2025,2026,2027,2028].map(y=><option key={y} value={y}>{y}</option>)}</select><input type="file" accept=".xlsx,.xls" onChange={handleImpFile} style={{fontSize:18}}/></div>{impPrev&&<div style={{border:"1px solid #e8e6e1",borderRadius:6,padding:8,background:"#fff",maxHeight:160,overflowY:"auto",marginBottom:8}}><div style={{fontSize:17,fontWeight:600,marginBottom:4}}>Predogled ({impPrev.preview.length} vnosov → {impYr}):</div><table style={{width:"100%",fontSize:16,borderCollapse:"collapse"}}><thead><tr><th style={{textAlign:"left",padding:2}}>Mesec</th><th style={{textAlign:"left",padding:2}}>Postavka</th><th style={{textAlign:"right",padding:2}}>Izvedba</th></tr></thead><tbody>{impPrev.preview.slice(0,20).map((r,i)=><tr key={i}><td style={{padding:2}}>{r.month}</td><td style={{padding:2}}>{r.label.substring(0,25)}</td><td style={{textAlign:"right",padding:2}}>{fmt(r.actual)}</td></tr>)}</tbody></table><div style={{display:"flex",gap:6,marginTop:6}}><button style={sB(true)} onClick={doImport}>Potrdi uvoz</button><button style={sB(false)} onClick={()=>setImpPrev(null)}>Prekliči</button></div></div>}{impLog.map((l,i)=><div key={i} style={{fontSize:17,color:l.type==="ok"?C.gn:C.rd}}>{l.msg}</div>)}</div>}

      {/* Top metrics */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        {/* Left: Prihodki */}
        <div style={{...sC,borderLeft:`4px solid ${C.gn}`}}><div style={{fontSize:11,color:C.mt,textTransform:"uppercase",letterSpacing:0.5,marginBottom:1}}>Prihodki</div><div style={{fontSize:28,fontWeight:700,color:C.gn}}>{fmt(tInc)}</div></div>
        {/* Right: Odhodki total */}
        <div style={{...sC,borderLeft:`4px solid ${C.rd}`}}><div style={{fontSize:11,color:C.mt,textTransform:"uppercase",letterSpacing:0.5,marginBottom:1}}>Odhodki skupaj</div><div style={{fontSize:28,fontWeight:700,color:C.rd}}>{fmt(tAc)}</div></div>
      </div>

      {/* Metrics split - Left: Fiksni, Right: Variabilni */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        {/* Left Half: Fiksni stroški */}
        <div>
          <div style={{fontSize:16,fontWeight:700,color:C.tx,marginBottom:4}}>Fiksni stroški</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            <div style={{...sC,borderLeft:`4px solid #d97706`}}><div style={{fontSize:11,color:C.mt,textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>Planirano</div><div style={{fontSize:20,fontWeight:700}}>{fmt(CATS.filter(c=>c.tp==="fixed").reduce((s,c)=>s+cT(md,c,'plan'),0))}</div></div>
            <div style={{...sC,borderLeft:`4px solid #d97706`}}><div style={{fontSize:11,color:C.mt,textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>Izvedeno</div><div style={{fontSize:20,fontWeight:700}}>{fmt(tFx)}</div></div>
          </div>
        </div>

        {/* Right Half: Variabilni stroški */}
        <div>
          <div style={{fontSize:16,fontWeight:700,color:C.tx,marginBottom:4}}>Variabilni stroški</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            <div style={{...sC,borderLeft:`4px solid #0891b2`}}><div style={{fontSize:11,color:C.mt,textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>Planirano</div><div style={{fontSize:20,fontWeight:700}}>{fmt(CATS.filter(c=>c.tp==="var").reduce((s,c)=>s+cT(md,c,'plan'),0))}</div></div>
            <div style={{...sC,borderLeft:`4px solid #0891b2`}}><div style={{fontSize:11,color:C.mt,textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>Izvedeno</div><div style={{fontSize:20,fontWeight:700}}>{fmt(tVr)}</div></div>
          </div>
        </div>
      </div>

      {/* Bottom metrics: Razlika & Varčevanje */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        {/* Razlika */}
        <div style={{...sC,borderLeft:`4px solid ${tInc-tAc>=0?C.gn:C.rd}`}}><div style={{fontSize:11,color:C.mt,textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>Razlika (Prihodki - Odhodki)</div><div style={{fontSize:24,fontWeight:700,color:tInc-tAc>=0?C.gn:C.rd}}>{tInc-tAc>=0?"+":""}{fmt(tInc-tAc)}</div></div>
        {/* Savings */}
        <div style={{...sC,borderLeft:`4px solid ${C.bl}`,position:"relative"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}><span style={{fontSize:11,color:C.mt,textTransform:"uppercase",letterSpacing:0.5}}>Varčevanje</span><span onClick={()=>setShowSavCfg(!showSavCfg)} style={{...sT("#dbeafe",C.bl),fontSize:14,cursor:"pointer",padding:"1px 5px"}}>⚙</span></div><div style={{fontSize:24,fontWeight:700,color:C.bl}}>{fmt(savVis.reduce((s,id)=>s+(md.subs?.[id]?.actual||0),0))}</div>{showSavCfg&&<div style={{position:"absolute",top:"100%",right:0,zIndex:20,background:"#fff",border:`1px solid ${C.bd}`,borderRadius:6,padding:8,minWidth:180,boxShadow:"0 2px 8px rgba(0,0,0,0.1)"}}>{CATS.find(c=>c.id==="savings_inv").subs.map(s=><label key={s.id} style={{display:"flex",alignItems:"center",gap:4,fontSize:16,padding:"2px 0",cursor:"pointer"}}><input type="checkbox" checked={savVis.includes(s.id)} onChange={e=>{if(e.target.checked)setSavVis(v=>[...v,s.id]);else setSavVis(v=>v.filter(x=>x!==s.id))}}/>{s.nm.substring(0,20)}</label>)}<button onClick={()=>setShowSavCfg(false)} style={{...sB(true),height:20,fontSize:18,marginTop:3,width:"100%"}}>OK</button></div>}</div>
      </div>

      {/* Plan by category - SIDE-BY-SIDE FIXED + VARIABLE */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:8}}>
        {/* LEFT: Fiksni stroški */}
        <div>
          <div style={{fontSize:16,fontWeight:700,color:C.tx,marginBottom:3}}>Fiksni stroški</div>
          <div style={sC}>{visibleCats.filter(c=>c.tp==="fixed").map(cat=>{const pT2=cT(md,cat,'plan');const aT2=cT(md,cat,'actual');const p2=pc(aT2,pT2);return<React.Fragment key={cat.id}><div style={{display:"flex",alignItems:"center",gap:4,padding:"3px 0",borderBottom:`1px solid ${C.fn}`,fontSize:14}}><span style={{flex:1,fontWeight:600}}>{cat.nm}</span>{editPlan&&<input style={{...sI,width:55,height:22,fontSize:14}} defaultValue={pT2||""} onBlur={e=>{const v=parseFloat(e.target.value)||0;if(cat.subs.length===1)uSub(cat.subs[0].id,"plan",v);else{const total=cat.subs.reduce((s,sub)=>s+sub.dp,0);cat.subs.forEach(sub=>{uSub(sub.id,"plan",total>0?Math.round(v*sub.dp/total):Math.round(v/cat.subs.length))})}}} placeholder="€"/>}<span style={{color:"#999",minWidth:45,textAlign:"right",fontSize:14}}>{fmt(pT2)}</span><span style={{minWidth:45,textAlign:"right",fontSize:14,fontWeight:600}}>{fmt(aT2)}</span><span style={{minWidth:32,textAlign:"right",fontWeight:600,fontSize:13,color:pT2?(p2>90?C.rd:p2>70?C.or:C.gn):C.mt}}>{pT2?p2+"%":"—"}</span></div>
            {cat.subs.filter(sub=>subVis[sub.id]!==true).map(sub=>{const sd=md.subs?.[sub.id]||{plan:0,actual:0};const sp=pc(sd.actual,sd.plan);return<div key={sub.id} style={{display:"flex",alignItems:"center",gap:4,padding:"2px 0 2px 12px",borderBottom:`1px solid ${C.fn}`,fontSize:13,color:"#666"}}><span style={{flex:1}}>{sub.nm}</span>{editPlan?<input style={{...sI,width:50,height:20,fontSize:13}} defaultValue={sd.plan||""} onBlur={e=>uSub(sub.id,"plan",e.target.value)} placeholder="€"/>:<span style={{color:"#999",minWidth:40,textAlign:"right"}}>{sd.plan?fN(sd.plan):"—"}</span>}<span style={{minWidth:40,textAlign:"right",fontWeight:500}}>{sd.actual?fN(sd.actual):"—"}</span><span style={{minWidth:28,textAlign:"right",fontSize:12,color:sd.plan?(sp>90?C.rd:sp>70?C.or:C.gn):C.mt}}>{sd.plan?sp+"%":"—"}</span></div>})}
          </React.Fragment>})}</div>
        </div>
        {/* RIGHT: Variabilni stroški */}
        <div>
          <div style={{fontSize:16,fontWeight:700,color:C.tx,marginBottom:3}}>Variabilni stroški</div>
          <div style={sC}>{visibleCats.filter(c=>c.tp==="var").map(cat=>{const pT2=cT(md,cat,'plan');const aT2=cT(md,cat,'actual');const p2=pc(aT2,pT2);return<React.Fragment key={cat.id}><div style={{display:"flex",alignItems:"center",gap:4,padding:"3px 0",borderBottom:`1px solid ${C.fn}`,fontSize:14}}><span style={{flex:1,fontWeight:600}}>{cat.nm}</span>{editPlan&&<input style={{...sI,width:55,height:22,fontSize:14}} defaultValue={pT2||""} onBlur={e=>{const v=parseFloat(e.target.value)||0;if(cat.subs.length===1)uSub(cat.subs[0].id,"plan",v);else if(cat.subs.length===0)return;else{const total=cat.subs.reduce((s,sub)=>s+sub.dp,0);cat.subs.forEach(sub=>{uSub(sub.id,"plan",total>0?Math.round(v*sub.dp/total):Math.round(v/cat.subs.length))})}}} placeholder="€"/>}<span style={{color:"#999",minWidth:45,textAlign:"right",fontSize:14}}>{fmt(pT2)}</span><span style={{minWidth:45,textAlign:"right",fontSize:14,fontWeight:600}}>{fmt(aT2)}</span><span style={{minWidth:32,textAlign:"right",fontWeight:600,fontSize:13,color:pT2?(p2>90?C.rd:p2>70?C.or:C.gn):C.mt}}>{pT2?p2+"%":"—"}</span></div>
            {cat.subs.filter(sub=>subVis[sub.id]!==true).map(sub=>{const sd=md.subs?.[sub.id]||{plan:0,actual:0};const sp=pc(sd.actual,sd.plan);return<div key={sub.id} style={{display:"flex",alignItems:"center",gap:4,padding:"2px 0 2px 12px",borderBottom:`1px solid ${C.fn}`,fontSize:13,color:"#666"}}><span style={{flex:1}}>{sub.nm}</span>{editPlan?<input style={{...sI,width:50,height:20,fontSize:13}} defaultValue={sd.plan||""} onBlur={e=>uSub(sub.id,"plan",e.target.value)} placeholder="€"/>:<span style={{color:"#999",minWidth:40,textAlign:"right"}}>{sd.plan?fN(sd.plan):"—"}</span>}<span style={{minWidth:40,textAlign:"right",fontWeight:500}}>{sd.actual?fN(sd.actual):"—"}</span><span style={{minWidth:28,textAlign:"right",fontSize:12,color:sd.plan?(sp>90?C.rd:sp>70?C.or:C.gn):C.mt}}>{sd.plan?sp+"%":"—"}</span></div>})}
          </React.Fragment>})}</div>
        </div>
      </div>

      {/* Charts */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:4}}>
        <div style={sC}><div style={{fontSize:17,fontWeight:600,color:C.sb,marginBottom:4}}>Razdelitev</div>{pieData.length>0?<div style={{display:"flex",alignItems:"center",gap:8}}><ResponsiveContainer width={100} height={100}><PieChart><Pie data={pieData} innerRadius={24} outerRadius={45} dataKey="value" stroke="none">{pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie></PieChart></ResponsiveContainer><div style={{fontSize:18,color:"#666"}}>{pieData.slice(0,5).map((d,i)=><div key={i} style={{marginBottom:2}}><span style={{display:"inline-block",width:7,height:7,borderRadius:1,background:d.color,marginRight:2}}/>{d.name} {pc(d.value,tAc)}%</div>)}</div></div>:<div style={{fontSize:16,color:"#999",textAlign:"center",padding:12}}>Vnesi podatke</div>}</div>
        <div style={sC}><div style={{fontSize:17,fontWeight:600,color:C.sb,marginBottom:4}}>Trend {yr}</div><ResponsiveContainer width="100%" height={100}><BarChart data={trendData} barGap={0}><XAxis dataKey="name" tick={{fontSize:11}} axisLine={false} tickLine={false}/><YAxis hide/><Tooltip formatter={v=>fmt(v)} contentStyle={{fontSize:16}}/><Bar dataKey="Prihodki" fill={C.gn} radius={[2,2,0,0]} barSize={5}/><Bar dataKey="Odhodki" fill={C.rd} radius={[2,2,0,0]} barSize={5} opacity={0.6}/></BarChart></ResponsiveContainer></div>
      </div>
    </div>}

    {/* ===== MESEČNI VNOS ===== */}
    {vw==="entry"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
        <h2 style={{fontSize:24,fontWeight:700,margin:0}}>Mesečni vnos</h2>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>{YPk}{MNav}<button onClick={()=>toggleClose(mo)} style={{...sB(isClosed),fontSize:16,background:isClosed?C.gn:undefined,color:isClosed?"#fff":undefined,border:isClosed?"none":undefined}}>{isClosed?"✓ Zaključen":"Zaključi mesec"}</button></div>
      </div>
      {isClosed&&<div style={{background:"#dcfce7",border:"1px solid #86efac",borderRadius:8,padding:"6px 12px",marginBottom:10,fontSize:17,color:"#166534"}}>Ta mesec je zaključen. Odpri ga z gumbom zgoraj za urejanje.</div>}
      <div style={{fontSize:16,fontWeight:600,color:C.sb,marginBottom:8}}>Prihodki</div>
      <div style={sC}>{["Kristina","Tadej"].map(person=><div key={person} style={{marginBottom:8}}><div style={{fontSize:18,fontWeight:600,color:C.bl,marginBottom:4}}>{person}</div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>{itList.map(t=><div key={`${person}-${t}`}><div style={{fontSize:18,color:"#999"}}>{t}</div><input style={{...sI,height:26,fontSize:17,width:"100%"}} defaultValue={md.income?.[person]?.[t]||""} onBlur={e=>uInc(person,t,e.target.value)} placeholder="0"/></div>)}</div></div>)}<div style={{borderTop:`1px solid ${C.bd}`,paddingTop:8}}><div style={{fontSize:17,fontWeight:600,color:C.sb,marginBottom:4}}>Dodatni prihodki</div>{(md.customIncome||[]).map((ci,i)=><div key={i} style={{fontSize:17,padding:"2px 0"}}>{ci.label} — {ci.person} — {fmt(ci.amount)}</div>)}<AddCI onAdd={addCI}/></div></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,alignItems:"start"}}>
        <CatEntry cats={visibleCats.filter(c=>c.tp==="fixed")} title="Fiksni stroški" md={md} subVis={subVis} subRename={subRename} expandBreakdown={expandBreakdown} txnInput={txnInput} toggleSubVis={toggleSubVis} setExpandBreakdown={setExpandBreakdown} setTxnInput={setTxnInput} addTransaction={addTransaction} removeTransaction={removeTransaction} updateTransactionComment={updateTransactionComment} uSub={uSub}/>
        <CatEntry cats={visibleCats.filter(c=>c.tp==="var"&&c.id!=="unexpected")} title="Variabilni stroški" md={md} subVis={subVis} subRename={subRename} expandBreakdown={expandBreakdown} txnInput={txnInput} toggleSubVis={toggleSubVis} setExpandBreakdown={setExpandBreakdown} setTxnInput={setTxnInput} addTransaction={addTransaction} removeTransaction={removeTransaction} updateTransactionComment={updateTransactionComment} uSub={uSub}/>
      </div>
      {AS.some(s=>subVis[s.id]===true)&&<div style={sC}><div style={{fontSize:18,fontWeight:600,color:C.tx,marginBottom:8}}>Skriti elementi 👁‍🗨</div>{AS.filter(s=>subVis[s.id]===true).map(sub=><div key={sub.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.fn}`,fontSize:17}}><span>{sub.nm}</span><button type="button" onClick={()=>toggleSubVis(sub.id)} style={{background:"none",border:"none",color:C.gn,cursor:"pointer",fontWeight:600}}>Pokaži</button></div>)}</div>}
      <div style={{fontSize:16,fontWeight:600,color:C.sb,marginBottom:8}}>Nepredvideni stroški</div>
      <div style={sC}><AddUX onAdd={addUX} kuList={kuList}/>{(md.unexpectedItems||[]).map((it,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:17,padding:"6px 0",borderBottom:`1px solid ${C.fn}`}}><span>{it.desc} — {fmt(it.amount)} ({it.person})</span><button type="button" onClick={()=>setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[yr])n[yr]=initY();if(!n[yr][mo])n[yr][mo]=initM();n[yr][mo].unexpectedItems=n[yr][mo].unexpectedItems.filter((_,j)=>j!==i);return n})} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:16}}>✕</button></div>)}</div>
      <div style={{fontSize:16,fontWeight:600,color:C.sb,marginBottom:8}}>Hitro dodaj cilj</div>
      {showNG?<AddGoal onAdd={g=>{setGoals(p=>[...p,{id:Date.now(),...g}]);setShowNG(false)}} onCancel={()=>setShowNG(false)}/>:<button style={{...sB(false),fontSize:17}} onClick={()=>setShowNG(true)}>+ Nov cilj</button>}
    </div>}

    {/* ===== LETNI PREGLED ===== */}
    {vw==="annual"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:6}}>
        <h2 style={{fontSize:24,fontWeight:700,margin:0}}>Letni pregled</h2>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>{YPk}<button onClick={()=>setCompMode(!compMode)} style={sB(compMode)}>{compMode?"Zapri primerjavo":"Primerjaj"}</button>{compMode&&<select style={{...sS,height:26,fontSize:17,width:70}} value={compYr||""} onChange={e=>setCompYr(e.target.value?parseInt(e.target.value):null)}><option value="">Izberi leto</option>{[2020,2021,2022,2023,2024,2025,2026,2027].filter(y=>y!==yr).map(y=><option key={y} value={y}>{y}</option>)}</select>}</div>
      </div>
      {/* Closed months indicator - clickable */}
      <div style={{display:"flex",gap:4,marginBottom:10}}>{MS.map((m,i)=>{const mdata=yd[i]||initM();return<button key={i} onClick={()=>setAnnualDetailMonth(annualDetailMonth===i?null:i)} type="button" style={{flex:1,textAlign:"center",fontSize:18,padding:"3px 0",borderRadius:4,background:annualDetailMonth===i?"#93c5fd":mdata.closed?"#dcfce7":"#f5f5f0",color:annualDetailMonth===i?C.bl:mdata.closed?"#166534":"#999",border:"none",cursor:"pointer",fontWeight:mdata.closed||annualDetailMonth===i?600:400}}>{m}</button>})}</div>
      {annualDetailMonth!==null&&<div style={{...sC,background:"#f0f7ff",border:`2px solid ${C.bl}`,marginBottom:8,padding:10}}>
        <div style={{fontSize:18,fontWeight:700,color:C.tx,marginBottom:6}}>Mesečni pregled: {MF[annualDetailMonth]} — {((md)=>{const fxA=fxT(md,'actual');const vrA=vrT(md,'actual');const uxA=uxtT(md);return `F: ${fmt(fxA)} | V: ${fmt(vrA)}${uxA>0?` | N: ${fmt(uxA)}`:""}  =  ${fmt(fxA+vrA+uxA)}`})(yd[annualDetailMonth]||initM())}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 80px 80px 75px 50px",gap:5,fontSize:18,color:C.mt,fontWeight:600,padding:"0 0 3px",borderBottom:`1px solid ${C.bd}`}}>
          <span>Postavka</span><span>Plan</span><span>Izvedba</span><span>Razl.</span><span>%</span>
        </div>
        {visibleCats.map(cat=>{const pT=cT(yd[annualDetailMonth]||initM(),cat,'plan');const aT=cT(yd[annualDetailMonth]||initM(),cat,'actual');const catDev=pT>0&&aT>0?Math.abs((aT-pT)/pT*100):null;const catColor=catDev===null?C.sb:catDev<=5?C.gn:catDev<=10?"#d97706":C.rd;return<div key={cat.id}><div style={{fontSize:17,fontWeight:700,color:C.tx,padding:"3px 0 1px",marginTop:1}}>{cat.nm}</div>{cat.subs.filter(sub=>subVis[sub.id]!==true).map(sub=>{const d=yd[annualDetailMonth]?.subs?.[sub.id]||{plan:0,actual:0};const diff=d.plan-d.actual;const dev=d.plan>0&&d.actual>0?Math.abs((d.actual-d.plan)/d.plan*100):null;const cellColor=dev===null?(d.actual>0?"#333":C.mt):dev<=5?C.gn:dev<=10?"#d97706":C.rd;const pct=d.plan?pc(d.actual,d.plan)+"%":"—";return<div key={sub.id} style={{display:"grid",gridTemplateColumns:"1fr 80px 80px 75px 50px",gap:5,fontSize:16,alignItems:"center",padding:"1px 0 1px 10px",borderBottom:`1px solid #f5f5f5`}}><span style={{fontSize:18}}>{sub.nm}</span><span style={{color:"#999",fontSize:16,textAlign:"right"}}>{d.plan?fmt(d.plan):"—"}</span><span style={{fontWeight:600,fontSize:16,textAlign:"right",color:cellColor}}>{d.actual?fmt(d.actual):"—"}</span><span style={{fontSize:14,color:d.plan?(diff>=0?C.gn:C.rd):C.mt,textAlign:"right"}}>{d.plan?(diff>=0?"+":"")+fmt(diff):"—"}</span><span style={{fontSize:14,color:cellColor,textAlign:"right",fontWeight:600}}>{pct}</span></div>})}<div style={{display:"grid",gridTemplateColumns:"1fr 80px 80px 75px 50px",gap:5,fontSize:16,alignItems:"center",padding:"1px 0 1px 10px",borderTop:`1px solid ${C.bd}`,fontWeight:700,color:catColor,background:"#f9fafb"}}><span style={{fontSize:16}}>{cat.nm}</span><span style={{textAlign:"right"}}>{pT>0?fmt(pT):"—"}</span><span style={{textAlign:"right"}}>{aT>0?fmt(aT):"—"}</span><span style={{textAlign:"right"}}>{pT?(aT-pT>=0?"+":"")+fmt(aT-pT):"—"}</span><span style={{textAlign:"right"}}>{pT?pc(aT,pT)+"%":"—"}</span></div></div>})}
      </div>}

      {(()=>{const devColor=(actual,plan)=>{if(!plan||!actual)return"#333";const dev=Math.abs((actual-plan)/plan*100);return dev<=5?C.gn:dev<=10?"#d97706":C.rd};return null})()}
      {[{tp:"fixed",nm:"Fiksni stroški"},{tp:"var",nm:"Variabilni stroški"}].map(type=><div key={type.tp}><div style={{fontSize:16,fontWeight:700,color:C.tx,marginBottom:3,marginTop:type.tp==="var"?4:0}}>{type.nm}</div><div style={{...sC,overflowX:"auto",padding:8}}><table style={{width:"100%",fontSize:14,borderCollapse:"collapse"}}><thead><tr style={{color:C.mt,borderBottom:`2px solid ${C.bd}`}}><th style={{textAlign:"left",padding:"6px 10px",minWidth:"180px",fontSize:14}}>Postavka</th>{MS.map(m=><th key={m} style={{textAlign:"right",padding:"6px 6px",cursor:"pointer",fontWeight:600,fontSize:14,minWidth:"68px"}} onClick={()=>{setMo(MS.indexOf(m));setVw("entry")}}>{m}</th>)}<th style={{textAlign:"right",padding:"2px 4px",fontWeight:700,fontSize:14}}>Σ</th></tr></thead><tbody>{visibleCats.filter(c=>c.tp===type.tp).map(cat=><React.Fragment key={cat.id}><tr style={{background:"#f9fafb",borderTop:`1px solid ${C.fn}`}}><td colSpan={14} style={{padding:"6px 8px",fontSize:14,fontWeight:700,color:C.tx}}>{cat.nm}</td></tr>{cat.subs.filter(sub=>subVis[sub.id]!==true).map(sub=>{let tot=0,totPlan=0;return<tr key={sub.id}><td style={{padding:"4px 8px 4px 12px",fontSize:14,color:"#888",minWidth:"280px",whiteSpace:"normal"}}>{sub.nm}</td>{Array.from({length:12},(_,i)=>{const mdata=yd[i]||initM();const v=mdata.subs?.[sub.id]?.actual||0;const p=mdata.subs?.[sub.id]?.plan||0;tot+=v;totPlan+=p;const dev=p>0&&v>0?Math.abs((v-p)/p*100):null;const color=dev===null?(v>0?"#333":"#ddd"):dev<=5?C.gn:dev<=10?"#d97706":C.rd;return<td key={i} style={{textAlign:"right",padding:"4px 6px",color,fontWeight:dev!==null?600:400,fontSize:14,minWidth:"68px"}}>{v>0?fmt(v):"—"}</td>})}<td style={{textAlign:"right",padding:"4px 8px",fontWeight:700,fontSize:14,color:totPlan>0&&tot>0?(Math.abs((tot-totPlan)/totPlan*100)<=5?C.gn:Math.abs((tot-totPlan)/totPlan*100)<=10?"#d97706":C.rd):"#333"}}>{tot>0?fmt(tot):"—"}</td></tr>})}</React.Fragment>)}<tr style={{background:"#e8f5e9",borderTop:`2px solid ${C.bd}`,fontWeight:700,fontSize:15}}><td style={{padding:"6px 8px",color:C.gn}}>{type.nm.includes("Fiksni")?"Skupaj fiksni stroški":"Skupaj variabilni stroški"}</td>{Array.from({length:12},(_,i)=>{const mdata=yd[i]||initM();const tot=visibleCats.filter(c=>c.tp===type.tp).reduce((s,cat)=>s+cat.subs.filter(sub=>subVis[sub.id]!==true).reduce((ss,sub)=>ss+(mdata.subs?.[sub.id]?.actual||0),0),0);const totP=visibleCats.filter(c=>c.tp===type.tp).reduce((s,cat)=>s+cat.subs.filter(sub=>subVis[sub.id]!==true).reduce((ss,sub)=>ss+(mdata.subs?.[sub.id]?.plan||0),0),0);const dev=totP>0&&tot>0?Math.abs((tot-totP)/totP*100):null;const color=dev===null?C.gn:dev<=5?C.gn:dev<=10?"#d97706":C.rd;return<td key={i} style={{textAlign:"right",padding:"6px 6px",color,minWidth:"68px"}}>{tot>0?fmt(tot):"—"}</td>})}<td style={{textAlign:"right",padding:"6px 8px",color:C.gn}}>{(() => {let total=0; for(let i=0;i<12;i++){const mdata=yd[i]||initM(); const m=visibleCats.filter(c=>c.tp===type.tp).reduce((s,cat)=>s+cat.subs.filter(sub=>subVis[sub.id]!==true).reduce((ss,sub)=>ss+(mdata.subs?.[sub.id]?.actual||0),0),0); total+=m;} return total>0?fmt(total):"—"})()}</td></tr></tbody></table></div></div>)}

      <div style={{fontSize:16,fontWeight:700,color:C.tx,marginBottom:3,marginTop:4}}>Nepredvideni stroški</div>
      <div style={{...sC,overflowX:"auto",padding:8}}><table style={{width:"100%",fontSize:14,borderCollapse:"collapse"}}><thead><tr style={{color:C.mt,borderBottom:`2px solid ${C.bd}`}}><th style={{textAlign:"left",padding:"6px 10px",fontSize:14}}>Nepredvideni</th>{MS.map(m=><th key={m} style={{textAlign:"right",padding:"6px 6px",cursor:"pointer",fontWeight:600,fontSize:14,minWidth:"68px"}} onClick={()=>{setMo(MS.indexOf(m));setVw("entry")}}>{m}</th>)}<th style={{textAlign:"right",padding:"2px 4px",fontWeight:700,fontSize:14}}>Σ</th></tr></thead><tbody><tr style={{borderTop:`1px solid ${C.fn}`}}><td style={{padding:"6px 8px",fontWeight:600,fontSize:14}}>Stroški</td>{Array.from({length:12},(_,i)=>{const mdata=yd[i]||initM();const v=uxtT(mdata);return<td key={i} style={{textAlign:"right",padding:"4px 6px",color:v>0?C.rd:"#ddd",fontSize:14,minWidth:"68px",fontWeight:v>0?600:400}}>{v>0?fmt(v):"—"}</td>})}<td style={{textAlign:"right",padding:"4px 8px",fontWeight:700,fontSize:14}}>{(() => {let t=0; for(let i=0;i<12;i++)t+=uxtT(yd[i]||initM()); return t>0?fmt(t):"—"})()}</td></tr></tbody></table></div>

      {compMode&&compYr&&<div style={{...sC,background:"#fefce8",border:"1px solid #fde68a",marginTop:4}}><div style={{fontSize:18,fontWeight:600,marginBottom:3}}>Primerjava {yr} vs {compYr}</div><table style={{width:"100%",fontSize:18,borderCollapse:"collapse"}}><thead><tr style={{color:C.mt,borderBottom:`1px solid #fde68a`}}><th style={{textAlign:"left",padding:"2px 4px",minWidth:"140px",fontSize:11}}>Kategorija</th><th style={{textAlign:"right",padding:"2px 4px",fontSize:11}}>{yr}</th><th style={{textAlign:"right",padding:"2px 4px",fontSize:11}}>{compYr}</th><th style={{textAlign:"right",padding:"2px 4px",fontSize:11}}>±</th></tr></thead><tbody>{CATS.map(cat=>{let t1=0,t2=0;for(let m=0;m<12;m++){t1+=cT(yd[m]||initM(),cat,'actual');t2+=cT((data[compYr]||initY())[m]||initM(),cat,'actual')}const diff=t1-t2;return<tr key={cat.id} style={{borderTop:`1px solid #f5e6d3`}}><td style={{padding:"1px 4px",fontSize:18}}>{cat.nm}</td><td style={{textAlign:"right",padding:"1px 4px",fontSize:18}}>{fmt(t1)}</td><td style={{textAlign:"right",padding:"1px 4px",color:C.mt,fontSize:18}}>{fmt(t2)}</td><td style={{textAlign:"right",padding:"1px 4px",fontWeight:600,fontSize:18,color:diff>0?C.rd:diff<0?C.gn:C.mt}}>{diff>0?"+":""}{fmt(diff)}</td></tr>})}</tbody></table></div>}

      <div style={sC}><ResponsiveContainer width="100%" height={160}><LineChart data={trendData}><XAxis dataKey="name" tick={{fontSize:16}} axisLine={false}/><YAxis tick={{fontSize:16}} axisLine={false}/><Tooltip formatter={v=>fmt(v)} contentStyle={{fontSize:17}}/><Legend wrapperStyle={{fontSize:16}}/><Line type="monotone" dataKey="Prihodki" stroke={C.gn} strokeWidth={2} dot={{r:3}}/><Line type="monotone" dataKey="Odhodki" stroke={C.rd} strokeWidth={2} dot={{r:3}}/></LineChart></ResponsiveContainer></div>
    </div>}

    {/* ===== CILJI ===== */}
    {vw==="goals"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <h2 style={{fontSize:24,fontWeight:700,margin:0}}>Proračunski cilji</h2>
        <div style={{display:"flex",gap:6}}><button style={sB(goalView==="general")} onClick={()=>setGoalView("general")}>Splošni cilji</button><button style={sB(goalView==="monthly")} onClick={()=>setGoalView("monthly")}>Mesečni cilji</button><button style={{...sB(true),background:C.gn}} onClick={()=>setShowNG(!showNG)}>+ Nov cilj</button></div>
      </div>
      {goalView==="monthly"&&<div style={{marginBottom:10}}><span style={{fontSize:17,color:C.mt}}>Mesec: </span><select style={{...sS,height:26,fontSize:17,width:120}} value={goalMonth} onChange={e=>setGoalMonth(parseInt(e.target.value))}>{MF.map((m,i)=><option key={i} value={i}>{m}</option>)}</select></div>}
      {showNG&&<AddGoal onAdd={g=>{setGoals(p=>[...p,{id:Date.now(),...g}]);setShowNG(false)}} onCancel={()=>setShowNG(false)}/>}
      {goals.filter(g=>goalView==="general"?(g.scope!=="monthly"):(g.scope==="monthly"&&g.month===goalMonth)).map(g=>{const getAutoPullValue=()=>{if(!g.autoPull||!g.source)return g.current||0;let total=0;const sub=AS.find(s=>s.id===g.source);if(!sub)return g.current||0;if(g.pullFromMonth==="all"){for(let i=0;i<12;i++){const md2=yd[i]||initM();if(md2.closed)total+=md2.subs?.[g.source]?.actual||0}}else if(g.pullFromMonth==="current"){total=md.subs?.[g.source]?.actual||0}else{const mi=parseInt(g.pullFromMonth);const md2=yd[mi]||initM();total=md2.subs?.[g.source]?.actual||0}return total};const currentVal=getAutoPullValue();const p=g.target>0?pc(currentVal,g.target):0;return<div key={g.id} style={sC}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <span style={{fontSize:16,fontWeight:700}}>{g.name}</span>
          <div style={{display:"flex",gap:4,alignItems:"center"}}><span style={sT(g.type==="saving"?"#dbeafe":"#fef3c7",g.type==="saving"?C.bl:"#92400e")}>{g.type}</span>{g.month!=null&&<span style={sT("#f0f7ff",C.bl)}>{MF[g.month]}</span>}{g.autoPull&&<span style={sT("#dcfce7","#166534")}>🔗</span>}<button onClick={()=>setGoals(prev=>prev.filter(x=>x.id!==g.id))} style={{fontSize:16,color:C.rd,background:"none",border:"none",cursor:"pointer"}}>✕</button></div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
          <span style={{fontSize:16,color:C.mt}}>Trenutno:</span>
          {g.autoPull?<span style={{fontSize:16,fontWeight:600,width:90,color:C.bl}}>{fmt(currentVal)}</span>:<input style={{...sI,width:90,height:30,fontSize:16,fontWeight:600}} defaultValue={g.current||0} onBlur={e=>setGoals(prev=>prev.map(x=>x.id===g.id?{...x,current:parseFloat(e.target.value)||0}:x))}/>}
          <span style={{fontSize:16,fontWeight:700}}>/ {fmt(g.target)}</span>
          {g.source&&<span style={{fontSize:16,color:C.bl}}>← {AS.find(s=>s.id===g.source)?.nm||g.source}</span>}
        </div>
        <div style={{height:6,borderRadius:3,background:"#eee",overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(p,100)}%`,borderRadius:3,background:p>90&&g.type==="limit"?C.rd:C.bl}}/></div>
        <div style={{fontSize:17,color:C.mt,marginTop:4}}>{p}% {g.note&&`— ${g.note}`}</div>
      </div>})}
      {goals.filter(g=>goalView==="general"?(g.scope!=="monthly"):(g.scope==="monthly"&&g.month===goalMonth)).length===0&&<div style={{fontSize:18,color:C.mt,textAlign:"center",padding:20}}>Ni ciljev za ta pogled. Dodaj novega z gumbom zgoraj.</div>}
    </div>}

    {/* ===== SIMULACIJA ===== */}
    {vw==="sim"&&<div>
      <h2 style={{fontSize:24,fontWeight:700,margin:"0 0 8px"}}>Finančna simulacija</h2>
      {/* Time period selector - MOVED TO TOP */}
      <div style={sC}><div style={{fontSize:16,fontWeight:600,color:C.sb,marginBottom:8}}>Časovni okvir</div><div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}><span style={{fontSize:17,color:C.mt}}>Od:</span><input type="date" style={{...sI,width:130}} value={simFrom} onChange={e=>setSimFrom(e.target.value)}/><span style={{fontSize:17,color:C.mt}}>Do:</span><input type="date" style={{...sI,width:130}} value={simTo} onChange={e=>setSimTo(e.target.value)}/></div><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{[["1 leto","2027-04-30"],["3 leta","2029-04-30"],["5 let","2031-04-30"],["10 let","2036-04-30"]].map(([l,d])=><button key={l} style={sB(simTo===d)} onClick={()=>setSimTo(d)}>{l}</button>)}</div></div>

      {/* Big headline numbers */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
        <div style={{...sM,textAlign:"center"}}><div style={{fontSize:16,color:C.mt,textTransform:"uppercase"}}>Prihodki ({simData.length>0?simData[simData.length-1].name:""})</div><div style={{fontSize:36,fontWeight:800,color:C.gn}}>{simData.length>0?fmt(simData[simData.length-1].Prihodki):"—"}</div></div>
        <div style={{...sM,textAlign:"center"}}><div style={{fontSize:16,color:C.mt,textTransform:"uppercase"}}>Odhodki ({simData.length>0?simData[simData.length-1].name:""})</div><div style={{fontSize:36,fontWeight:800,color:C.rd}}>{simData.length>0?fmt(simData[simData.length-1].Odhodki):"—"}</div></div>
        <div style={{...sM,textAlign:"center"}}><div style={{fontSize:16,color:C.mt,textTransform:"uppercase"}}>Kumulativni prihranki</div><div style={{fontSize:36,fontWeight:800,color:C.bl}}>{simData.length>0?fmt(simData[simData.length-1].Prihranki):"—"}</div></div>
      </div>
      {/* Data source info */}
      <div style={{...sC,background:"#f9fafb",fontSize:17,color:C.mt}}>
        <strong>Podatki za simulacijo:</strong> {Object.values(yd).filter(m=>m.closed).length} zaključenih mesecev (dejanski podatki) + {12-Object.values(yd).filter(m=>m.closed).length} odprtih (ocena). Povprečni mesečni prihodek: {fmt(tInc||3600)}, povprečni odhodek: {fmt(tAc||3100)}.
      </div>

      {/* Manual overrides */}
      <div style={sC}><div style={{fontSize:16,fontWeight:600,color:C.sb,marginBottom:8}}>Ročni vnos podatkov <span style={sT("#fef3c7","#92400e")}>prevlada nad avtomatskimi</span></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          <div><div style={{fontSize:16,color:C.mt,marginBottom:2}}>Mesečni prihodki (€)</div><input type="number" style={{...sI,width:"100%"}} defaultValue={simManual.income??""} onBlur={e=>setSimManual(p=>({...p,income:e.target.value?parseFloat(e.target.value):null}))} placeholder={`Avto: ${fN(tInc||3600)}`}/></div>
          <div><div style={{fontSize:16,color:C.mt,marginBottom:2}}>Mesečni odhodki (€)</div><input type="number" style={{...sI,width:"100%"}} defaultValue={simManual.expense??""} onBlur={e=>setSimManual(p=>({...p,expense:e.target.value?parseFloat(e.target.value):null}))} placeholder={`Avto: ${fN(tAc||3100)}`}/></div>
          <div><div style={{fontSize:16,color:C.mt,marginBottom:2}}>Mesečno varčevanje (€)</div><input type="number" style={{...sI,width:"100%"}} defaultValue={simManual.savings??""} onBlur={e=>setSimManual(p=>({...p,savings:e.target.value?parseFloat(e.target.value):null}))} placeholder="Avto: 500"/></div>
        </div>
        <div style={{fontSize:16,color:C.mt,marginTop:4}}>Pusti prazno za avtomatski izračun iz zaključenih mesecev.</div>
      </div>

      {/* Category selector for simulation */}
      <div style={sC}><div style={{fontSize:16,fontWeight:600,color:C.sb,marginBottom:8}}>Kategorije vključene v simulacijo</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4}}>
          {CATS.map(cat=><label key={cat.id} style={{display:"flex",alignItems:"center",gap:4,fontSize:17,padding:"2px 0",cursor:"pointer"}}>
            <input type="checkbox" checked={simCats.includes(cat.id)} onChange={e=>{if(e.target.checked)setSimCats(s=>[...s,cat.id]);else setSimCats(s=>s.filter(x=>x!==cat.id))}}/>
            {cat.nm.substring(0,20)}
          </label>)}
        </div>
        <div style={{display:"flex",gap:6,marginTop:6}}><button style={{...sB(false),fontSize:16,height:24}} onClick={()=>setSimCats(CATS.map(c=>c.id))}>Izberi vse</button><button style={{...sB(false),fontSize:16,height:24}} onClick={()=>setSimCats([])}>Počisti</button></div>
      </div>

      <div style={sC}><div style={{fontSize:16,fontWeight:600,color:C.sb,marginBottom:8}}>Predpostavke</div><PSlider label="Rast plač (%/leto)" value={simG} onChange={setSimG} min={-15} max={15} unit="%"/><PSlider label="Inflacija (%/leto)" value={simI} onChange={setSimI} min={-10} max={10} unit="%"/><PSlider label="Donos naložb (%/leto)" value={simReturn} onChange={setSimReturn} min={-10} max={20} unit="%"/><PSlider label="Rast str. vrtca (%)" value={simC} onChange={setSimC} min={-10} max={15} unit="%"/><PSlider label="Dod. naložbe/mesec" value={simE} onChange={setSimE} min={-500} max={500} step={10} unit="€"/>
        <div style={{display:"flex",gap:8,alignItems:"center",marginTop:8,flexWrap:"wrap"}}>
          <span style={{fontSize:17,color:C.mt,minWidth:140}}>Začetni saldo (€)</span>
          <input type="number" style={{...sI,width:120}} value={simInitial} onChange={e=>setSimInitial(parseFloat(e.target.value)||0)} placeholder="0"/>
          {cryptoVal>0&&<button style={{...sB(false),fontSize:14,height:28,padding:"0 10px"}} onClick={()=>setSimInitial(Math.round(cryptoVal))}>+ Iz kripto: {fmt(cryptoVal)}</button>}
        </div>
      </div>
      <div style={sC}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <span style={{fontSize:16,fontWeight:600,color:C.sb}}>Hitri kaj-če</span>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <button style={sB(false)} onClick={()=>setSimE(e=>e+200)}>💰 +200€/mes varčevanja</button>
          <button style={sB(false)} onClick={()=>setSimReturn(r=>Math.min(20,r+2))}>📈 Donos +2%</button>
          <button style={sB(false)} onClick={()=>setSimI(i=>i+2)}>🔥 Inflacija +2%</button>
          <button style={sB(false)} onClick={()=>setSimEvents(e=>[...e,{id:Date.now(),year:new Date().getFullYear()+1,kind:"incPct",value:-20,recurring:true,label:"Plača -20%"}])}>📉 Plača -20%</button>
          <button style={sB(false)} onClick={()=>{setSimE(0);setSimReturn(5);setSimI(2);setSimG(3)}}>↺ Privzeto</button>
        </div>
      </div>
      <div style={sC}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,cursor:"pointer"}} onClick={()=>setSimShowEvents(s=>!s)}>
          <span style={{fontSize:16,fontWeight:600,color:C.sb}}>Življenjski dogodki ({simEvents.length+simSc.length}) {simShowEvents?"▼":"▶"}</span>
        </div>
        {simShowEvents&&<div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
            <button style={{...sB(false),fontSize:14}} onClick={()=>setSimSc(s=>[...s,{type:"mortgage",year:2027,amount:800}])}>+ Hipoteka</button>
            <button style={{...sB(false),fontSize:14}} onClick={()=>setSimSc(s=>[...s,{type:"raise",year:2027,pct:10}])}>+ Povišica 10%</button>
            <button style={{...sB(false),fontSize:14}} onClick={()=>setSimSc(s=>[...s,{type:"jobLoss",year:2028}])}>+ Izguba službe</button>
            <button style={{...sB(false),fontSize:14}} onClick={()=>setSimEvents(e=>[...e,{id:Date.now(),year:new Date().getFullYear()+1,kind:"expAmt",value:5000,recurring:false,label:"Enkratni izdatek"}])}>+ Enkratni izdatek</button>
            <button style={{...sB(false),fontSize:14}} onClick={()=>setSimEvents(e=>[...e,{id:Date.now(),year:new Date().getFullYear()+1,kind:"incAmt",value:1000,recurring:false,label:"Bonus"}])}>+ Enkratni prihodek</button>
            <button style={{...sB(false),fontSize:14}} onClick={()=>setSimEvents(e=>[...e,{id:Date.now(),year:new Date().getFullYear()+2,kind:"savAmt",value:100,recurring:true,label:"Dodatno varčevanje"}])}>+ Dodatno varčevanje</button>
          </div>
          {simEvents.map(ev=><div key={ev.id} style={{display:"grid",gridTemplateColumns:"1fr 70px 110px 80px 70px 30px",gap:6,alignItems:"center",padding:"4px 0",borderBottom:`1px solid ${C.fn}`}}>
            <input style={{...sI,height:30,fontSize:15}} value={ev.label||""} onChange={e=>setSimEvents(p=>p.map(x=>x.id===ev.id?{...x,label:e.target.value}:x))} placeholder="Opis"/>
            <input type="number" style={{...sI,height:30,fontSize:15}} value={ev.year} onChange={e=>setSimEvents(p=>p.map(x=>x.id===ev.id?{...x,year:parseInt(e.target.value)||0}:x))}/>
            <select style={{...sS,height:30,fontSize:14}} value={ev.kind} onChange={e=>setSimEvents(p=>p.map(x=>x.id===ev.id?{...x,kind:e.target.value}:x))}>
              <option value="incAmt">Prihodek €</option>
              <option value="expAmt">Odhodek €</option>
              <option value="incPct">Prihodek %</option>
              <option value="expPct">Odhodek %</option>
              <option value="savAmt">Varčevanje €</option>
            </select>
            <input type="number" style={{...sI,height:30,fontSize:15}} value={ev.value} onChange={e=>setSimEvents(p=>p.map(x=>x.id===ev.id?{...x,value:parseFloat(e.target.value)||0}:x))}/>
            <label style={{fontSize:14,display:"flex",alignItems:"center",gap:3,color:C.mt,cursor:"pointer"}}><input type="checkbox" checked={ev.recurring} onChange={e=>setSimEvents(p=>p.map(x=>x.id===ev.id?{...x,recurring:e.target.checked}:x))}/>Ponav.</label>
            <button style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:16}} onClick={()=>setSimEvents(p=>p.filter(x=>x.id!==ev.id))}>✕</button>
          </div>)}
          {simSc.length>0&&<div style={{marginTop:8,padding:"6px 8px",background:"#f9fafb",borderRadius:4,fontSize:14}}>
            <div style={{fontWeight:600,marginBottom:4}}>Predpripravljeni scenariji:</div>
            {simSc.map((s,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"2px 0"}}><span>{s.type==="mortgage"?`Hipoteka ${s.year}: +${s.amount}€/mes`:s.type==="raise"?`Povišica ${s.year}: +${s.pct}%`:s.type==="jobLoss"?`Izguba službe ${s.year}`:`Selitev ${s.year}: ${s.amount}€/mes`}</span><button style={{background:"none",border:"none",color:C.rd,cursor:"pointer"}} onClick={()=>setSimSc(p=>p.filter((_,idx)=>idx!==i))}>✕</button></div>)}
          </div>}
        </div>}
      </div>
      {simData.length>0&&<div style={{...sC,background:simData.some(d=>d.Razlika<0)?"#fef2f2":"#f0fdf4",border:`1px solid ${simData.some(d=>d.Razlika<0)?"#fecaca":"#bbf7d0"}`}}><div style={{fontSize:18,fontWeight:600,color:C.sb,marginBottom:6}}>Finančno zdravje</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>{simData.slice(-1).map((d,i)=><div key={i}><div style={{fontSize:16,color:C.mt}}>Letni tok gotovine</div><div style={{fontSize:18,fontWeight:700,color:d.Razlika>=0?C.gn:C.rd}}>{d.Razlika>=0?"+":""}{fmt(d.Razlika)}</div></div>)}<div><div style={{fontSize:16,color:C.mt}}>Status</div><div style={{fontSize:16,fontWeight:600,color:simData.some(d=>d.Razlika<-5000)?C.rd:simData.some(d=>d.Razlika<0)?"#f59e0b":C.gn}}>{simData.some(d=>d.Razlika<-5000)?"🔴 Precejšnji deficit":simData.some(d=>d.Razlika<0)?"🟡 Primanjkljaj":"🟢 Stabilno"}</div></div><div><div style={{fontSize:16,color:C.mt}}>Letnih mesecev v deficitu</div><div style={{fontSize:16,fontWeight:600}}>{simData.filter(d=>d.Razlika<0).length} od {simData.length}</div></div></div></div>}
      <div style={sC}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,flexWrap:"wrap",gap:6}}><span style={{fontSize:16,fontWeight:600,color:C.sb}}>Projekcija</span><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{["bar","line","area","cash","nw"].map(v=><button key={v} style={{...sB(simViz===v),fontSize:16,height:24,padding:"0 8px"}} onClick={()=>setSimViz(v)}>{v==="bar"?"Stolpci":v==="line"?"Črtni":v==="area"?"Površinski":v==="cash"?"Tok gotovine":"Neto vrednost"}</button>)}<label style={{display:"flex",alignItems:"center",gap:4,fontSize:14,color:C.mt,marginLeft:6,cursor:"pointer"}}><input type="checkbox" checked={simShowRange} onChange={e=>setSimShowRange(e.target.checked)}/>Razpon ±{simRangeWidth}%</label></div></div>
        <div style={{position:"relative",marginBottom:6}}>
          <div style={{fontSize:14,color:C.mt,padding:"8px 10px",background:"#f9fafb",borderRadius:4,border:"1px solid #ddd"}}>
            💡 Kako se izračunava:
            <div style={{display:"flex",gap:2,flexWrap:"wrap",marginTop:6}}>
              {[{name:"Prihodki",color:C.gn,desc:"Povprečni mesečni prihodek × rastni faktor × 12"},{name:"Odhodki",color:C.rd,desc:"Povprečni mesečni odhodki × inflacijski faktor × 12"},{name:"Prihranki",color:C.bl,desc:"Skupni prihranki: naraščajoči znesek "},{name:"Razlika",color:"#7c3aed",desc:"Letni tok gotovine: Prihodki - Odhodki"}].map(m=><div key={m.name} style={{position:"relative"}} onMouseEnter={()=>setHoveredMetric(m.name)} onMouseLeave={()=>setHoveredMetric(null)}>
                <span style={{cursor:"help",color:m.color,fontWeight:600,padding:"2px 6px",borderRadius:3,background:"#fff",border:`1px solid ${m.color}30`,display:"inline-block"}}>{m.name}</span>
                {hoveredMetric===m.name&&<div style={{position:"absolute",bottom:"100%",left:"50%",transform:"translateX(-50%)",background:"#1a1a2e",color:"#fff",padding:"8px 12px",borderRadius:6,fontSize:13,whiteSpace:"nowrap",zIndex:10,marginBottom:4,boxShadow:"0 4px 12px rgba(0,0,0,0.15)",border:"1px solid #333"}}>{m.desc}</div>}
              </div>)}
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          {simViz==="bar"?<BarChart data={simData} barGap={2}><XAxis dataKey="name" tick={{fontSize:16}} axisLine={false}/><YAxis tick={{fontSize:18}} axisLine={false} tickFormatter={v=>`€${Math.round(v/1000)}k`}/><Tooltip formatter={v=>fmt(v)} contentStyle={{fontSize:17}}/><Legend wrapperStyle={{fontSize:16}}/><Bar dataKey="Prihodki" fill={C.gn} radius={[3,3,0,0]} barSize={14}/><Bar dataKey="Odhodki" fill={C.rd} radius={[3,3,0,0]} barSize={14} opacity={0.6}/><Bar dataKey="Prihranki" fill={C.bl} radius={[3,3,0,0]} barSize={14} opacity={0.8}/><Bar dataKey="Donos" fill={C.pu} radius={[3,3,0,0]} barSize={14} opacity={0.7}/></BarChart>
          :simViz==="line"?<LineChart data={simData}><XAxis dataKey="name" tick={{fontSize:16}} axisLine={false}/><YAxis tick={{fontSize:18}} axisLine={false} tickFormatter={v=>`€${Math.round(v/1000)}k`}/><Tooltip formatter={v=>fmt(v)} contentStyle={{fontSize:17}}/><Legend wrapperStyle={{fontSize:16}}/><Line type="monotone" dataKey="Prihodki" stroke={C.gn} strokeWidth={2} dot={{r:4}}/><Line type="monotone" dataKey="Odhodki" stroke={C.rd} strokeWidth={2} dot={{r:4}}/><Line type="monotone" dataKey="Prihranki" stroke={C.bl} strokeWidth={2} dot={{r:4}}/><Line type="monotone" dataKey="Donos" stroke={C.pu} strokeWidth={2} dot={{r:3}} strokeDasharray="4 2"/></LineChart>
          :simViz==="area"?<AreaChart data={simBands}><XAxis dataKey="name" tick={{fontSize:16}} axisLine={false}/><YAxis tick={{fontSize:18}} axisLine={false} tickFormatter={v=>`€${Math.round(v/1000)}k`}/><Tooltip formatter={v=>fmt(v)} contentStyle={{fontSize:17}}/><Legend wrapperStyle={{fontSize:16}}/>{simShowRange&&<Area type="monotone" dataKey="Pas" fill={C.bl} stroke="none" fillOpacity={0.15} legendType="none" name="Razpon scenarijev"/>}<Area type="monotone" dataKey="Vloženo" fill={C.or} stroke={C.or} fillOpacity={0.25}/><Area type="monotone" dataKey="Prihranki" fill={C.bl} stroke={C.bl} fillOpacity={0.4}/></AreaChart>
          :simViz==="cash"?<BarChart data={simData} barGap={2}><XAxis dataKey="name" tick={{fontSize:16}} axisLine={false}/><YAxis tick={{fontSize:18}} axisLine={false} tickFormatter={v=>`€${Math.round(v/1000)}k`}/><Tooltip formatter={v=>fmt(v)} contentStyle={{fontSize:17}}/><Legend wrapperStyle={{fontSize:16}}/><Bar dataKey="Razlika" radius={[3,3,0,0]} barSize={14}>{simData.map((d,i)=><Cell key={i} fill={d.Razlika>=0?C.gn:C.rd}/>)}</Bar></BarChart>
          :<AreaChart data={simData}><XAxis dataKey="name" tick={{fontSize:16}} axisLine={false}/><YAxis tick={{fontSize:18}} axisLine={false} tickFormatter={v=>`€${Math.round(v/1000)}k`}/><Tooltip formatter={v=>fmt(v)} contentStyle={{fontSize:17}}/><Legend wrapperStyle={{fontSize:16}}/><Area type="monotone" dataKey="Vloženo" stackId="1" fill={C.or} stroke={C.or} fillOpacity={0.5} name="Vloženi kapital"/><Area type="monotone" dataKey="Donos" stackId="1" fill={C.pu} stroke={C.pu} fillOpacity={0.5} name="Donos naložb"/></AreaChart>}
        </ResponsiveContainer>
        {simViz==="nw"&&simData.length>0&&<div style={{marginTop:6,padding:"6px 10px",background:"#f0f7ff",borderRadius:4,fontSize:14,color:C.tx}}>
          <strong>Neto vrednost {simData[simData.length-1].name}:</strong> {fmt(simData[simData.length-1].Prihranki)} (vloženo {fmt(simData[simData.length-1].Vloženo)} + donos {fmt(simData[simData.length-1].Donos)})
        </div>}
      </div>

      {/* Goals anchored to projection */}
      {goalsAnchored.length>0&&<div style={sC}>
        <div style={{fontSize:16,fontWeight:600,color:C.sb,marginBottom:8}}>🎯 Cilji v simulaciji</div>
        {goalsAnchored.map(g=><div key={g.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.fn}`}}>
          <span style={{fontSize:15,color:C.tx}}>{g.name} <span style={{color:C.mt,fontSize:14}}>({fmt(g.target)})</span></span>
          {g.year?<span style={sT("#dcfce7","#166534")}>✓ Doseženo {g.year}</span>:<span style={sT("#fef3c7","#92400e")}>⚠ Ne doseže v izbranem obdobju</span>}
        </div>)}
      </div>}

      {/* Year-by-year detailed table */}
      <div style={sC}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setSimShowTable(s=>!s)}>
          <span style={{fontSize:16,fontWeight:600,color:C.sb}}>Tabela po letih {simShowTable?"▼":"▶"}</span>
        </div>
        {simShowTable&&<div style={{marginTop:8,overflowX:"auto"}}>
          <table style={{width:"100%",fontSize:14,borderCollapse:"collapse"}}>
            <thead><tr style={{background:"#f9fafb",borderBottom:`2px solid ${C.bd}`}}>
              <th style={{textAlign:"left",padding:"6px 8px"}}>Leto</th>
              <th style={{textAlign:"right",padding:"6px 8px"}}>Prihodki</th>
              <th style={{textAlign:"right",padding:"6px 8px"}}>Odhodki</th>
              <th style={{textAlign:"right",padding:"6px 8px"}}>Razlika</th>
              <th style={{textAlign:"right",padding:"6px 8px"}}>Vloženo</th>
              <th style={{textAlign:"right",padding:"6px 8px"}}>Donos</th>
              <th style={{textAlign:"right",padding:"6px 8px"}}>Saldo</th>
              <th style={{textAlign:"left",padding:"6px 8px"}}>Cilji</th>
            </tr></thead>
            <tbody>{simData.map((d,i)=>{
              const reached=goalsAnchored.filter(g=>g.idx===i);
              return<tr key={d.name} style={{borderBottom:`1px solid ${C.fn}`}}>
                <td style={{padding:"6px 8px",fontWeight:600}}>{d.name}</td>
                <td style={{padding:"6px 8px",textAlign:"right",color:C.gn}}>{fmt(d.Prihodki)}</td>
                <td style={{padding:"6px 8px",textAlign:"right",color:C.rd}}>{fmt(d.Odhodki)}</td>
                <td style={{padding:"6px 8px",textAlign:"right",fontWeight:600,color:d.Razlika>=0?C.gn:C.rd}}>{d.Razlika>=0?"+":""}{fmt(d.Razlika)}</td>
                <td style={{padding:"6px 8px",textAlign:"right",color:C.or}}>{fmt(d.Vloženo)}</td>
                <td style={{padding:"6px 8px",textAlign:"right",color:C.pu}}>{fmt(d.Donos)}</td>
                <td style={{padding:"6px 8px",textAlign:"right",fontWeight:700,color:C.bl}}>{fmt(d.Prihranki)}</td>
                <td style={{padding:"6px 8px",fontSize:13,color:C.gn}}>{reached.map(g=>"✓ "+g.name).join(", ")}</td>
              </tr>;
            })}</tbody>
          </table>
        </div>}
      </div>
    </div>}

    {/* ===== % RAZDELITEV ===== */}
    {vw==="pct"&&(()=>{
      const colTarget=(sub,base)=>{const m=pMd[sub.id]||"fixed";return m==="pct"?Math.round(base*(bPct[sub.id]||0)/100):(pFx[sub.id]||0)};
      const sumOfType=(tp,base)=>CATS.filter(c=>c.tp===tp).flatMap(c=>c.subs).filter(s=>subVis[s.id]!==true).reduce((s,sub)=>s+colTarget(sub,base),0);
      const fxSum=sumOfType("fixed",manualBudget);
      const vrSum=sumOfType("var",manualBudget);
      const nepTarget=nepMd==="pct"?Math.round(manualBudget*nepPct/100):nepFx;
      const totalPlan=fxSum+vrSum+nepTarget;
      const totalPct=manualBudget>0?Math.round(totalPlan/manualBudget*100):0;
      const sFxSum=sumOfType("fixed",scratchBudget);const sVrSum=sumOfType("var",scratchBudget);const sNep=nepMd==="pct"?Math.round(scratchBudget*nepPct/100):nepFx;const sTotal=sFxSum+sVrSum+sNep;
      return<div>
      <h2 style={{fontSize:24,fontWeight:700,margin:"0 0 8px"}}>% razdelitev</h2>

      {/* Scratch / Eksperiment */}
      <div style={{...sC,background:"#fefce8",border:"1px solid #fde68a"}}>
        <div style={{fontSize:16,fontWeight:600,color:"#92400e",marginBottom:6}}>🧪 Eksperimentalni izračun (ne vpliva na sinhronizacijo)</div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:6}}>
          <span style={{fontSize:16,color:C.mt}}>Hipotetičen proračun:</span>
          <input type="number" style={{...sI,width:120,height:32}} value={scratchBudget||""} onChange={e=>setScratchBudget(parseInt(e.target.value)||0)} placeholder="npr. 4000"/>
          <span style={{fontSize:16}}>€</span>
          {scratchBudget>0&&<button style={{...sB(false),fontSize:14,height:28}} onClick={()=>{setManualBudget(scratchBudget);setScratchBudget(0)}}>Uporabi kot aktivni →</button>}
        </div>
        {scratchBudget>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,fontSize:14,marginTop:6}}>
          <div><div style={{color:C.mt}}>Fiksni</div><div style={{fontWeight:700,color:C.bl}}>{fmt(sFxSum)} <span style={{fontSize:12,color:C.mt}}>({scratchBudget>0?pc(sFxSum,scratchBudget):0}%)</span></div></div>
          <div><div style={{color:C.mt}}>Variabilni</div><div style={{fontWeight:700,color:C.bl}}>{fmt(sVrSum)} <span style={{fontSize:12,color:C.mt}}>({scratchBudget>0?pc(sVrSum,scratchBudget):0}%)</span></div></div>
          <div><div style={{color:C.mt}}>Nepredvideni</div><div style={{fontWeight:700,color:C.or}}>{fmt(sNep)} <span style={{fontSize:12,color:C.mt}}>({scratchBudget>0?pc(sNep,scratchBudget):0}%)</span></div></div>
          <div><div style={{color:C.mt}}>Skupaj plan</div><div style={{fontWeight:700,color:sTotal<=scratchBudget?C.gn:C.rd}}>{fmt(sTotal)} <span style={{fontSize:12,color:C.mt}}>({scratchBudget>0?pc(sTotal,scratchBudget):0}%)</span></div></div>
        </div>}
      </div>

      {/* Active budget */}
      <div style={{...sC,background:"#f0fdf4",border:"1px solid #bbf7d0"}}>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:18,fontWeight:600,color:"#166534"}}>✓ Aktivni proračun:</span>
          <input type="number" style={{...sI,width:120,height:34,fontSize:18,fontWeight:700}} value={manualBudget} onChange={e=>setManualBudget(parseInt(e.target.value)||0)}/><span style={{fontSize:16,fontWeight:600}}>€</span>
          <button onClick={syncPctToPlan} style={{...sB(true),background:C.gn,fontSize:17}}>Sinhroniziraj → mesečni vnos</button>
          <span style={{marginLeft:"auto",fontSize:15,color:C.mt}}>Plan skupaj: <strong style={{color:totalPlan<=manualBudget?C.gn:C.rd}}>{fmt(totalPlan)}</strong> ({totalPct}%)</span>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,alignItems:"start"}}>
        {[{tp:"fixed",nm:"Fiksni stroški",sum:fxSum},{tp:"var",nm:"Variabilni stroški",sum:vrSum}].map(type=><div key={type.tp} style={sC}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6,paddingBottom:6,borderBottom:`2px solid ${C.bd}`}}>
            <span style={{fontSize:16,fontWeight:700,color:C.tx}}>{type.nm}</span>
            <span style={{fontSize:15,fontWeight:700,color:C.bl}}>{fmt(type.sum)} <span style={{fontSize:13,color:C.mt,fontWeight:500}}>({manualBudget>0?pc(type.sum,manualBudget):0}% proračuna)</span></span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 45px 55px 25px 55px 25px 70px",gap:5,fontSize:13,color:C.mt,fontWeight:600,padding:"0 0 4px",borderBottom:"1px solid #eee",alignItems:"center"}}>
            <span>Postavka</span><span>Način</span><span>%</span><span></span><span>€</span><span></span><span style={{textAlign:"right"}}>Cilj</span>
          </div>
          {CATS.filter(c=>c.tp===type.tp).map(cat=><div key={cat.id}><div style={{fontSize:15,fontWeight:600,color:C.tx,padding:"4px 0 2px",marginTop:3}}>{cat.nm}</div>{cat.subs.filter(sub=>subVis[sub.id]!==true).map(sub=>{const mode=pMd[sub.id]||"fixed";const pV=bPct[sub.id]||0;const fV=pFx[sub.id]||0;const base=manualBudget;const target=mode==="pct"?Math.round(base*pV/100):fV;const pctOfBudget=base>0?pc(target,base):0;const euroFromPct=Math.round(base*pV/100);
          return<div key={sub.id} style={{display:"grid",gridTemplateColumns:"1fr 45px 55px 25px 55px 25px 70px",gap:5,padding:"4px 0",borderBottom:`1px solid ${C.fn}`,fontSize:13,alignItems:"center",paddingLeft:10}}>
            <span style={{fontSize:13,color:"#666"}}>{sub.nm}</span>
            <select style={{...sS,width:42,height:24,fontSize:13}} value={mode} onChange={e=>setPMd(p=>({...p,[sub.id]:e.target.value}))}><option value="pct">%</option><option value="fixed">€</option></select>
            <input type="number" min={0} max={100} value={mode==="pct"?pV:pctOfBudget} onChange={e=>{if(mode==="pct")setBPct(p=>({...p,[sub.id]:parseInt(e.target.value)||0}));else{const newPct=parseInt(e.target.value)||0;setPFx(p=>({...p,[sub.id]:Math.round(base*newPct/100)}))}}} style={{...sI,width:50,height:24,fontSize:14,textAlign:"right",fontWeight:600}}/>
            <span style={{fontSize:13,color:C.mt}}>%</span>
            <input type="number" value={mode==="pct"?euroFromPct:fV} onChange={e=>{if(mode==="fixed")setPFx(p=>({...p,[sub.id]:parseInt(e.target.value)||0}));else{const euro=parseInt(e.target.value)||0;setBPct(p=>({...p,[sub.id]:base>0?Math.round(euro/base*100):0}))}}} style={{...sI,width:50,height:24,fontSize:14,textAlign:"right",fontWeight:600}}/>
            <span style={{fontSize:13,color:C.mt}}>€</span>
            <span style={{textAlign:"right",fontWeight:600,fontSize:14,color:C.tx}}>{fmt(target)}</span>
          </div>})}</div>)}
        </div>)}
      </div>

      {/* Nepredvideni stroški - planiran delež */}
      <div style={sC}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6,paddingBottom:6,borderBottom:`2px solid ${C.bd}`}}>
          <span style={{fontSize:16,fontWeight:700,color:C.tx}}>Nepredvideni stroški (planiran delež)</span>
          <span style={{fontSize:15,fontWeight:700,color:C.or}}>{fmt(nepTarget)} <span style={{fontSize:13,color:C.mt,fontWeight:500}}>({manualBudget>0?pc(nepTarget,manualBudget):0}% proračuna)</span></span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:8}}>
          <span style={{fontSize:14,color:C.mt}}>Način:</span>
          <select style={{...sS,width:60,height:28,fontSize:14}} value={nepMd} onChange={e=>setNepMd(e.target.value)}><option value="pct">%</option><option value="fixed">€</option></select>
          <input type="number" min={0} value={nepMd==="pct"?nepPct:nepFx} onChange={e=>{const v=parseInt(e.target.value)||0;if(nepMd==="pct")setNepPct(v);else setNepFx(v)}} style={{...sI,width:70,height:28,fontSize:14,textAlign:"right",fontWeight:600}}/>
          <span style={{fontSize:14,color:C.mt}}>{nepMd==="pct"?"%":"€"}</span>
          <span style={{marginLeft:8,fontSize:14,color:C.mt}}>= rezerva za nepredvidene mesečne dogodke</span>
        </div>
        <div style={{fontSize:15,fontWeight:600,color:C.tx,padding:"4px 0 2px",marginTop:4}}>Mesečne nepredvidene postavke (dejanske)</div>
        <AddUX onAdd={(d,a,p)=>{setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[yr])n[yr]=initY();if(!n[yr][mo])n[yr][mo]=initM();n[yr][mo].unexpectedItems.push({desc:d,amount:parseFloat(a)||0,person:p});return n})}} kuList={kuList}/>
        {(md.unexpectedItems||[]).map((it,i)=><div key={i} style={{display:"flex",gap:6,padding:"6px 0",borderBottom:`1px solid ${C.fn}`,fontSize:15,alignItems:"center",paddingLeft:16}}><span style={{flex:1,color:"#666"}}>{it.desc} <span style={{color:"#999"}}>/{it.person}</span></span><span style={{fontWeight:600}}>{fmt(it.amount)}</span><button type="button" onClick={()=>setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(n[yr]&&n[yr][mo])n[yr][mo].unexpectedItems=n[yr][mo].unexpectedItems.filter((_,j)=>j!==i);return n})} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:14}}>✕</button></div>)}
        <div style={{marginTop:8,fontSize:14,color:C.mt}}>Dejansko v {MF[mo]}: <strong style={{color:(md.unexpectedItems||[]).reduce((s,it)=>s+it.amount,0)<=nepTarget?C.gn:C.rd}}>{fmt((md.unexpectedItems||[]).reduce((s,it)=>s+it.amount,0))}</strong> / plan {fmt(nepTarget)}</div>
      </div>

      {/* Total summary */}
      <div style={{...sC,background:"#f9fafb"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,fontSize:15}}>
          <div><div style={{color:C.mt,fontSize:13}}>Fiksni</div><div style={{fontWeight:700,color:C.bl}}>{fmt(fxSum)} <span style={{fontSize:12,color:C.mt}}>({manualBudget>0?pc(fxSum,manualBudget):0}%)</span></div></div>
          <div><div style={{color:C.mt,fontSize:13}}>Variabilni</div><div style={{fontWeight:700,color:C.bl}}>{fmt(vrSum)} <span style={{fontSize:12,color:C.mt}}>({manualBudget>0?pc(vrSum,manualBudget):0}%)</span></div></div>
          <div><div style={{color:C.mt,fontSize:13}}>Nepredvideni</div><div style={{fontWeight:700,color:C.or}}>{fmt(nepTarget)} <span style={{fontSize:12,color:C.mt}}>({manualBudget>0?pc(nepTarget,manualBudget):0}%)</span></div></div>
          <div><div style={{color:C.mt,fontSize:13}}>Skupaj plan</div><div style={{fontSize:18,fontWeight:800,color:totalPlan<=manualBudget?C.gn:C.rd}}>{fmt(totalPlan)} <span style={{fontSize:13,color:C.mt,fontWeight:500}}>({totalPct}% od {fmt(manualBudget)})</span></div></div>
        </div>
      </div>
    </div>;})()}

    {/* ===== WISHLIST ===== */}
    {vw==="wishes"&&<div>
      <h2 style={{fontSize:24,fontWeight:700,margin:"0 0 12px"}}>Wishlist</h2>
      <div style={sC}>
        <div style={{fontSize:16,fontWeight:600,color:C.sb,marginBottom:8}}>Dodaj novo željo</div>
        <div style={{display:"grid",gridTemplateColumns:"auto 1fr 1fr 1fr 1fr auto",gap:6,marginBottom:8,alignItems:"flex-end"}}>
          <div><label style={{fontSize:14,color:C.mt,display:"block",marginBottom:2}}>Za:</label><select style={{...sS,height:34,width:"100%"}} value={wishForm.member} onChange={e=>setWishForm(p=>({...p,member:e.target.value}))}>{WISH_MEMBERS.map(m=><option key={m} value={m}>{m}</option>)}</select></div>
          <div><label style={{fontSize:14,color:C.mt,display:"block",marginBottom:2}}>Želja</label><input style={{...sI,width:"100%",height:34}} value={wishForm.wish} onChange={e=>setWishForm(p=>({...p,wish:e.target.value}))} placeholder="npr. PlayStation 5"/></div>
          <div><label style={{fontSize:14,color:C.mt,display:"block",marginBottom:2}}>Opis</label><input style={{...sI,width:"100%",height:34}} value={wishForm.desc} onChange={e=>setWishForm(p=>({...p,desc:e.target.value}))} placeholder="npr. Za igranje iger"/></div>
          <div><label style={{fontSize:14,color:C.mt,display:"block",marginBottom:2}}>Povezava</label><input style={{...sI,width:"100%",height:34}} value={wishForm.link} onChange={e=>setWishForm(p=>({...p,link:e.target.value}))} placeholder="npr. amazon.com/..."/></div>
          <div><label style={{fontSize:14,color:C.mt,display:"block",marginBottom:2}}>Komentar</label><input style={{...sI,width:"100%",height:34}} value={wishForm.comment} onChange={e=>setWishForm(p=>({...p,comment:e.target.value}))} placeholder="neobvezno"/></div>
          <button style={{...sB(true),height:34,padding:"0 12px"}} onClick={()=>{if(wishForm.wish.trim()){setWishes(prev=>[...prev,{id:Date.now(),member:wishForm.member,wish:wishForm.wish,desc:wishForm.desc,link:wishForm.link,comment:wishForm.comment,received:false,giftedBy:"",occasion:""}]);setWishForm({member:wishForm.member,wish:"",desc:"",link:"",comment:""})}}}>Dodaj</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:12,marginTop:12}}>
        {WISH_MEMBERS.map(member=>{const memberWishes=wishes.filter(w=>w.member===member);const openWishes=memberWishes.filter(w=>!w.received);const receivedWishes=memberWishes.filter(w=>w.received);return<div key={member}><div style={{fontSize:18,fontWeight:700,color:C.tx,marginBottom:8,padding:"8px 0",borderBottom:`2px solid ${C.bd}`}}>{member}</div>
          {openWishes.length>0&&<div style={{marginBottom:12}}><div style={{fontSize:15,fontWeight:600,color:C.mt,marginBottom:6}}>Odprte želje ({openWishes.length})</div>{openWishes.map((w,i)=><div key={i} style={{...sC,marginBottom:4,background:"#f9fafb",padding:"10px 12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:6}}>
              <div><div style={{fontSize:16,fontWeight:600,color:C.tx}}>{w.wish}</div>{w.desc&&<div style={{fontSize:13,color:C.mt,marginTop:2}}>{w.desc}</div>}</div>
              <button type="button" onClick={()=>setWishes(prev=>prev.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:16}}>✕</button>
            </div>
            {w.link&&<div style={{fontSize:12,marginBottom:4}}><a href={w.link} target="_blank" rel="noopener noreferrer" style={{color:C.bl,textDecoration:"none"}}>Povezava →</a></div>}
            {w.comment&&<div style={{fontSize:12,color:"#666",fontStyle:"italic",marginBottom:4}}>"{w.comment}"</div>}
            <button style={{...sB(true),background:C.gn,fontSize:13,padding:"4px 10px",height:"auto"}} onClick={()=>setWishes(prev=>prev.map((x,j)=>j===i?{...x,received:true,giftedBy:"",occasion:""}:x))}>Prejeto</button>
          </div>)}</div>}
          {receivedWishes.length>0&&<div><div style={{fontSize:15,fontWeight:600,color:C.gn,marginBottom:6}}>Prejeta darila ({receivedWishes.length})</div>{receivedWishes.map((w,i)=>{const idx=memberWishes.indexOf(w);return<div key={i} style={{...sC,marginBottom:4,background:"#f0fdf4",padding:"10px 12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:6}}>
              <div><div style={{fontSize:16,fontWeight:600,color:C.tx}}>{w.wish}</div></div>
              <button type="button" onClick={()=>setWishes(prev=>prev.filter((_,j)=>j!==idx))} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:16}}>✕</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
              <div><label style={{fontSize:12,color:C.mt,display:"block",marginBottom:2}}>Podarila:</label><input style={{...sI,width:"100%",height:28,fontSize:13}} value={w.giftedBy} onChange={e=>setWishes(prev=>prev.map((x,j)=>j===idx?{...x,giftedBy:e.target.value}:x))} placeholder="Ime osebe"/></div>
              <div><label style={{fontSize:12,color:C.mt,display:"block",marginBottom:2}}>Priložnost:</label><select style={{...sS,width:"100%",height:28,fontSize:13}} value={w.occasion} onChange={e=>setWishes(prev=>prev.map((x,j)=>j===idx?{...x,occasion:e.target.value}:x))}><option value="">Izberi...</option>{occasions.map(occ=><option key={occ} value={occ}>{occ}</option>)}</select></div>
            </div>
            <button style={{...sB(false),fontSize:13,padding:"4px 10px",height:"auto"}} onClick={()=>setWishes(prev=>prev.map((x,j)=>j===idx?{...x,received:false}:x))}>Označi kot odprto</button>
          </div>})}</div>}
          {memberWishes.length===0&&<div style={{fontSize:14,color:C.mt,textAlign:"center",padding:"12px",background:"#f5f5f0",borderRadius:4,fontStyle:"italic"}}>Ni želj za {member}</div>}
        </div>})}
      </div>
    </div>}

    {/* ===== VARČEVANJE (Savings Tracker) ===== */}
    {vw==="varsav"&&<div>
      {!savUnlocked?<div style={{...sC,display:"flex",flexDirection:"column",alignItems:"center",padding:"3rem",textAlign:"center"}}><div style={{fontSize:44,marginBottom:12}}>🏦</div><div style={{fontSize:16,fontWeight:700,marginBottom:12}}>Varčevanje</div><div style={{fontSize:18,color:C.mt,marginBottom:12}}>Zaščiteno z geslom. Nastavi ga v Nastavitvah.</div><div style={{display:"flex",gap:6}}><input type="password" style={{...sI,width:160}} value={savPwd} onChange={e=>setSavPwd(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){const s=ld('dp_savpwd','');if(!s||savPwd===s)setSavUnlocked(true)}}} placeholder="Geslo"/><button style={sB(true)} onClick={()=>{const s=ld('dp_savpwd','');if(!s||savPwd===s)setSavUnlocked(true)}}>Odkleni</button></div></div>
      :<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h2 style={{fontSize:24,fontWeight:700,margin:0}}>Varčevanje — družinski prihranki</h2><button style={{...sB(false),fontSize:16}} onClick={()=>{setSavUnlocked(false);setSavPwd('')}}>Zakleni 🔒</button></div>
        {/* Total */}
        <div style={{...sM,textAlign:"center",marginBottom:14}}><div style={{fontSize:16,color:C.mt,textTransform:"uppercase"}}>Skupni prihranki</div><div style={{fontSize:36,fontWeight:800,color:C.gn}}>{fmt(savData.members.reduce((s,m)=>s+m.sources.reduce((ss,src)=>ss+(src.amount||0),0),0))}</div></div>
        {/* Members */}
        {savData.members.map((member,mi)=><div key={mi} style={sC}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <input style={{...sI,fontSize:17,fontWeight:600,width:150}} defaultValue={member.name} onBlur={e=>{const n={...savData,members:[...savData.members]};n.members[mi]={...n.members[mi],name:e.target.value};setSavData(n)}}/>
            <div style={{fontSize:16,fontWeight:700,color:C.gn}}>{fmt(member.sources.reduce((s,src)=>s+(src.amount||0),0))}</div>
          </div>
          {member.sources.map((src,si)=><div key={si} style={{display:"flex",gap:6,alignItems:"center",padding:"3px 0",borderBottom:`1px solid ${C.fn}`,fontSize:17}}>
            <input style={{...sI,flex:1,height:26,fontSize:17}} defaultValue={src.name} onBlur={e=>{const n={...savData,members:[...savData.members]};n.members[mi]={...n.members[mi],sources:[...n.members[mi].sources]};n.members[mi].sources[si]={...n.members[mi].sources[si],name:e.target.value};setSavData(n)}} placeholder="Vir"/>
            <input type="number" style={{...sI,width:80,height:26,fontSize:17,textAlign:"right"}} defaultValue={src.amount} onBlur={e=>{const n={...savData,members:[...savData.members]};n.members[mi]={...n.members[mi],sources:[...n.members[mi].sources]};n.members[mi].sources[si]={...n.members[mi].sources[si],amount:parseFloat(e.target.value)||0};setSavData(n)}} placeholder="€"/>
            <button onClick={()=>{const n={...savData,members:[...savData.members]};n.members[mi]={...n.members[mi],sources:n.members[mi].sources.filter((_,i)=>i!==si)};setSavData(n)}} style={{fontSize:18,color:C.rd,background:"none",border:"none",cursor:"pointer"}}>✕</button>
          </div>)}
          <button style={{...sB(false),fontSize:16,marginTop:6}} onClick={()=>{const n={...savData,members:[...savData.members]};n.members[mi]={...n.members[mi],sources:[...n.members[mi].sources,{name:"",amount:0}]};setSavData(n)}}>+ Dodaj vir</button>
        </div>)}
        <button style={{...sB(true),marginTop:8}} onClick={()=>setSavData(d=>({...d,members:[...d.members,{name:"Nov član",sources:[{name:"",amount:0}]}]}))}>+ Dodaj člana</button>
      </div>}
    </div>}

    {/* ===== NASTAVITVE ===== */}
    {vw==="settings"&&<div>
      <h2 style={{fontSize:24,fontWeight:700,margin:"0 0 12px"}}>Nastavitve</h2>
      <div style={sC}><div style={{fontSize:16,fontWeight:600,marginBottom:6}}>Uporabnik</div><div style={{fontSize:18}}>Prijavljen: <strong>{curUser}</strong> <span style={sT(isSA?"#dbeafe":"#dcfce7",isSA?C.bl:"#166534")}>{curRole}</span></div></div>
      {isSA&&<div style={sC}><div style={{fontSize:16,fontWeight:600,marginBottom:6}}>Spremeni geslo (superadmin)</div><div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}><span style={{fontSize:17,minWidth:80}}>Uporabnik:</span><select style={{...sS,width:120}} id="chgPwdUser">{JSON.parse(localStorage.getItem('dp_accounts')||'[]').map(a=><option key={a.username}>{a.username}</option>)}</select></div><input style={{...sI,width:"100%",marginBottom:6}} type="password" value={sNP} onChange={e=>setSNP(e.target.value)} placeholder="Novo geslo (≥ 6)"/><input style={{...sI,width:"100%",marginBottom:6}} type="password" value={sNP2} onChange={e=>setSNP2(e.target.value)} placeholder="Ponovi"/><button style={sB(true)} onClick={()=>{const user=document.getElementById('chgPwdUser')?.value;if(user)doChgPwd(user,sNP)}}>Spremeni</button></div>}
      {isSA&&<CreateUserForm onAdd={async(u,p,e)=>{const accs=JSON.parse(localStorage.getItem('dp_accounts')||'[]');if(accs.find(a=>a.username===u)){setSMsg('Uporabnik že obstaja!');return}const salt=Array.from(crypto.getRandomValues(new Uint8Array(16))).join('');const h=await hPwd(p,salt);accs.push({username:u,hash:h,salt,role:'admin',email:e});localStorage.setItem('dp_accounts',JSON.stringify(accs));setAdminConf(prev=>({...prev,[u]:{varsav:false,crypto:false,settings:false}}));setSMsg(`Uporabnik ${u} ustvarjen!`)}}/>}
      {isSA&&(()=>{const reqs=ld('dp_resetreqs',[]);return reqs.length>0?<div style={{...sC,border:"1px solid #fde68a",background:"#fefce8"}}><div style={{fontSize:16,fontWeight:600,marginBottom:6}}>Zahteve za ponastavitev gesla</div>{reqs.map((r,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:`1px solid ${C.fn}`}}><span style={{fontSize:18}}>{r.email} — {r.date}</span><div style={{display:"flex",gap:4}}><button style={{...sB(true),height:24,fontSize:16}} onClick={()=>{const accs=JSON.parse(localStorage.getItem('dp_accounts')||'[]');const acc=accs.find(a=>a.email===r.email);if(acc){const newPwd=prompt(`Novo geslo za ${acc.username}:`);if(newPwd)doChgPwd(acc.username,newPwd)}const updated=reqs.filter((_,j)=>j!==i);sv('dp_resetreqs',updated);setSMsg('Geslo ponastavljeno.')}}>Ponastavi</button><button style={{...sB(false),height:24,fontSize:16,color:C.rd}} onClick={()=>{const updated=reqs.filter((_,j)=>j!==i);sv('dp_resetreqs',updated)}}>Zavrni</button></div></div>)}</div>:null})()}
      {isSA&&<div style={sC}><div style={{fontSize:16,fontWeight:600,marginBottom:6}}>Aktivni uporabniki</div>{JSON.parse(localStorage.getItem('dp_accounts')||'[]').map((a,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:`1px solid ${C.fn}`,fontSize:18}}><span><strong>{a.username}</strong> <span style={sT(a.role==='superadmin'?"#dbeafe":"#dcfce7",a.role==='superadmin'?C.bl:"#166534")}>{a.role}</span></span><span style={{color:C.mt}}>{a.email||"brez emaila"}</span></div>)}</div>}
      {isSA&&<div style={sC}><div style={{fontSize:16,fontWeight:600,marginBottom:6}}>Gesla za zaklenjene sekcije</div><div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}><span style={{fontSize:17,minWidth:80}}>Kripto:</span><input style={{...sI,flex:1}} type="password" value={sCP} onChange={e=>setSCP(e.target.value)} placeholder="Geslo za kripto"/><button style={sB(true)} onClick={()=>{sv('dp_cpwd',sCP);setSMsg('Kripto geslo nastavljeno!');setSCP('')}}>Nastavi</button></div><div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{fontSize:17,minWidth:80}}>Varčevanje:</span><input style={{...sI,flex:1}} type="password" id="savPwdSet" placeholder="Geslo za varčevanje"/><button style={sB(true)} onClick={()=>{sv('dp_savpwd',document.getElementById('savPwdSet')?.value||'');setSMsg('Varčevanje geslo nastavljeno!')}}>Nastavi</button></div></div>}
      {isSA&&<div style={sC}><div style={{fontSize:16,fontWeight:600,marginBottom:6}}>Vidnost kategorij za admin uporabnike</div><div style={{fontSize:17,color:C.mt,marginBottom:8}}>Izberi katere kategorije bodo vidne admin uporabnikom (ne-superadmin). Superadmin vidi vedno vse.</div><div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:4}}>{CATS.map(cat=><label key={cat.id} style={{display:"flex",alignItems:"center",gap:6,fontSize:17,padding:"3px 0",cursor:"pointer"}}><input type="checkbox" checked={adminViews.includes(cat.id)} onChange={e=>{if(e.target.checked)setAdminViews(v=>[...v,cat.id]);else setAdminViews(v=>v.filter(x=>x!==cat.id))}}/>{cat.nm}</label>)}</div><div style={{display:"flex",gap:6,marginTop:8}}><button style={{...sB(false),fontSize:16,height:24}} onClick={()=>setAdminViews(CATS.map(c=>c.id))}>Izberi vse</button><button style={{...sB(false),fontSize:16,height:24}} onClick={()=>setAdminViews([])}>Počisti</button></div></div>}
      <div style={sC}>
        <div style={{fontSize:16,fontWeight:600,marginBottom:6}}>Postavke (Fiksni & Variabilni stroški)</div>
        <div style={{fontSize:14,color:C.mt,marginBottom:10}}>Preimenuj postavko, jo trajno skrij iz vseh pogledov, ali izbriši (samo če nima nobenih dejanskih vnosov v letu).</div>
        {CATS.filter(c=>c.id!=="unexpected").map(cat=>{
          const subsWithStats=cat.subs.map(sub=>{let total=0,plan=0;for(let m=0;m<12;m++){const mdata=yd[m]||initM();total+=mdata.subs?.[sub.id]?.actual||0;plan+=mdata.subs?.[sub.id]?.plan||0}return{sub,total,plan,empty:total===0&&plan===0}});
          return<div key={cat.id} style={{marginBottom:10,paddingBottom:8,borderBottom:`1px solid ${C.fn}`}}>
            <div style={{fontSize:15,fontWeight:700,color:C.tx,marginBottom:6,display:"flex",justifyContent:"space-between"}}>
              <span>{cat.nm} <span style={sT(cat.tp==="fixed"?"#dbeafe":"#fef3c7",cat.tp==="fixed"?C.bl:"#92400e")}>{cat.tp==="fixed"?"Fiksni":"Variabilni"}</span></span>
            </div>
            {subsWithStats.map(({sub,total,plan,empty})=><div key={sub.id} style={{display:"grid",gridTemplateColumns:"1fr 220px 100px 110px 28px",gap:6,alignItems:"center",padding:"4px 0",fontSize:14}}>
              <span style={{color:"#666",fontSize:13}}>{sub.nm}</span>
              <input style={{...sI,height:26,fontSize:13}} value={subRename[sub.id]||""} onChange={e=>setSubRename(p=>({...p,[sub.id]:e.target.value}))} placeholder={`(privzeto: ${sub.nm.substring(0,20)})`}/>
              <span style={{fontSize:12,color:empty?C.gn:C.mt,textAlign:"right"}}>{empty?"✓ Brez podatkov":`${fmt(total)}/${fmt(plan)}`}</span>
              <label style={{display:"flex",alignItems:"center",gap:4,fontSize:12,cursor:"pointer",color:subVis[sub.id]?C.rd:C.mt}}>
                <input type="checkbox" checked={subVis[sub.id]===true} onChange={e=>setSubVis(p=>({...p,[sub.id]:e.target.checked?true:false}))}/>
                {subVis[sub.id]?"Skrito":"Skrij trajno"}
              </label>
              <button type="button" disabled={!empty} title={empty?"Izbriši (skrij trajno)":"Najprej počisti podatke"} onClick={()=>{if(empty&&confirm(`Skrij postavko "${sub.nm}" trajno? Ne bo več prikazana nikjer.`))setSubVis(p=>({...p,[sub.id]:true}))}} style={{background:"none",border:"none",color:empty?C.rd:"#ddd",cursor:empty?"pointer":"not-allowed",fontSize:14}}>🗑</button>
            </div>)}
          </div>;
        })}
        <div style={{marginTop:8,padding:"8px 10px",background:"#fef9c3",borderRadius:4,fontSize:13,color:"#713f12"}}>💡 <strong>Nasvet:</strong> Preimenuj postavke, da se ujemajo z tvojimi navadami. Postavka brez podatkov v letu lahko trajno skriješ — ne bo se pojavila nikjer.</div>
      </div>
      <div style={sC}><div style={{fontSize:16,fontWeight:600,marginBottom:6}}>Vrste prihodkov (Dropdown)</div><div style={{fontSize:17,color:C.mt,marginBottom:8}}>Dodaj ali odstrani vrste prihodkov</div><div style={{marginBottom:8}}>{itList.map((item,i)=><div key={i} style={{display:"flex",gap:6,alignItems:"center",padding:"4px 0",fontSize:17}}><input style={{...sI,flex:1,height:26}} value={item} onChange={e=>{const n=[...itList];n[i]=e.target.value;setItList(n)}}/><button type="button" onClick={()=>setItList(itList.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:16}}>✕</button></div>)}<button type="button" style={{...sB(false),fontSize:16,marginTop:4}} onClick={()=>setItList([...itList,'Nova vrsta'])}>+ Dodaj</button></div></div>
      <div style={sC}><div style={{fontSize:16,fontWeight:600,marginBottom:6}}>Nepredvideni stroški - Trgovine/Viri (Dropdown)</div><div style={{fontSize:17,color:C.mt,marginBottom:8}}>Dodaj ali odstrani trgovine in vire za nepredvidene stroške</div><div style={{marginBottom:8,maxHeight:200,overflowY:"auto"}}>{kuList.map((item,i)=><div key={i} style={{display:"flex",gap:6,alignItems:"center",padding:"4px 0",fontSize:17}}><input style={{...sI,flex:1,height:26}} value={item} onChange={e=>{const n=[...kuList];n[i]=e.target.value;setKuList(n)}}/><button type="button" onClick={()=>setKuList(kuList.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:16}}>✕</button></div>)}<button type="button" style={{...sB(false),fontSize:16,marginTop:4}} onClick={()=>setKuList([...kuList,'Nova trgovina'])}>+ Dodaj</button></div></div>
      <div style={sC}><div style={{fontSize:16,fontWeight:600,marginBottom:6}}>Priložnosti za Wishlist</div><div style={{fontSize:17,color:C.mt,marginBottom:8}}>Dodaj ali odstrani priložnosti (npr. rojstni dnevi, prazniki)</div><div style={{marginBottom:8}}>{occasions.map((occ,i)=><div key={i} style={{display:"flex",gap:6,alignItems:"center",padding:"4px 0",fontSize:17}}><input style={{...sI,flex:1,height:26}} value={occ} onChange={e=>{const n=[...occasions];n[i]=e.target.value;setOccasions(n)}}/><button type="button" onClick={()=>setOccasions(occasions.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:16}}>✕</button></div>)}<button type="button" style={{...sB(false),fontSize:16,marginTop:4}} onClick={()=>setOccasions([...occasions,'Nova priložnost'])}>+ Dodaj</button></div></div>
      <div style={sC}><div style={{fontSize:16,fontWeight:600,marginBottom:6}}>Podatki in varnostne kopije</div>
        <div style={{fontSize:17,color:C.mt,marginBottom:8}}>Priporočamo varnostno kopijo vsaj vsaka 2 tedna. Zadnja kopija: {localStorage.getItem('dp_lastbackup')?new Date(parseInt(localStorage.getItem('dp_lastbackup'))).toLocaleDateString("sl-SI"):"nikoli"}</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
          <button style={{...sB(true),background:"#d97706"}} onClick={()=>{createBackup();localStorage.setItem('dp_lastbackup',String(Date.now()));setSMsg('Varnostna kopija prenesena!')}}>Varnostna kopija (JSON)</button>
          <button style={sB(false)} onClick={doExport}>Izvoz Excel</button>
          <label style={{...sB(false),display:"flex",alignItems:"center",cursor:"pointer"}}><span>Obnovi iz kopije</span><input type="file" accept=".json" style={{display:"none"}} onChange={async e=>{const f=e.target.files?.[0];if(!f)return;try{const msg=await restoreBackup(f);setSMsg(msg+' Stran se bo osvežila.');setTimeout(()=>window.location.reload(),2000)}catch(err){setSMsg('Napaka: '+err)}}}/></label>
        </div>
        <button style={{...sB(false),color:C.rd,borderColor:C.rd}} onClick={()=>{if(confirm('Izbriši vse podatke? To je nepovratno!')){localStorage.clear();sessionStorage.clear();window.location.reload()}}}>Izbriši vse podatke</button>
      </div>
      {sMsg&&<div style={{fontSize:18,color:C.gn,marginTop:8}}>{sMsg}</div>}
    </div>}

    {/* ===== CRYPTO ===== */}
    {vw==="crypto"&&<div>
      {isSA&&<div>
        <h2 style={{fontSize:24,fontWeight:700,margin:"0 0 16px"}}>👮 Admin Kontrola</h2>
        <div style={sC}>
          <div style={{fontSize:18,fontWeight:600,color:C.sb,marginBottom:8}}>Vidljivost funkcij po administratorjih</div>
          <div style={{fontSize:17,color:C.mt,marginBottom:10}}>Izberi katere sekcije so vidne vsakemu administratorju. Superadmin vidi vedno vse.</div>
          {JSON.parse(localStorage.getItem('dp_accounts')||'[]').filter(a=>a.role==='admin').map(admin=>
            <div key={admin.username} style={{...sM,marginBottom:8}}>
              <div style={{fontWeight:600,color:C.tx,marginBottom:6}}>{admin.username}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {["varsav","settings","crypto"].map(feat=>
                  <label key={feat} style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer",fontSize:16}}>
                    <input type="checkbox" checked={adminConf[admin.username]?.[feat]!==false} onChange={e=>{setAdminConf(prev=>({...prev,[admin.username]:{...prev[admin.username],[feat]:e.target.checked}}));logAudit("Admin permission",`${admin.username} ${feat}: ${e.target.checked?"visible":"hidden"}`)}}/>
                    <span>{feat==="varsav"?"Varčevanje":feat==="settings"?"Nastavitve":"Kripto"}</span>
                  </label>
                )}
              </div>
            </div>
          )}
        </div>
        <div style={sC}>
          <div style={{fontSize:18,fontWeight:600,color:C.sb,marginBottom:8}}>Dnevnik aktivnosti ({auditLog.length} vnosov)</div>
          <div style={{maxHeight:250,overflowY:"auto",fontSize:18,color:"#666"}}>
            {auditLog.slice(0,50).map((e,i)=>
              <div key={i} style={{padding:"4px 0",borderBottom:"1px solid #eee"}}>
                <span style={{fontWeight:500}}>{e.timestamp}</span> | <span style={{color:C.bl}}>{e.user}</span> | {e.action}: {e.details}
              </div>
            )}
          </div>
        </div>
      </div>}
      {!cryU&&!isSA?<div style={{...sC,display:"flex",flexDirection:"column",alignItems:"center",padding:"3rem",textAlign:"center"}}><div style={{fontSize:44,marginBottom:12}}>🔒</div><div style={{fontSize:16,fontWeight:700,marginBottom:12}}>Kripto sekcija</div><div style={{display:"flex",gap:6}}><input type="password" style={{...sI,width:160}} value={cryP} onChange={e=>setCryP(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){const s=ld('dp_cpwd','');if(!s||cryP===s)setCryU(true)}}} placeholder="Geslo"/><button style={sB(true)} onClick={()=>{const s=ld('dp_cpwd','');if(!s||cryP===s)setCryU(true)}}>Odkleni</button></div></div>:<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h2 style={{fontSize:24,fontWeight:700,margin:0}}>Kripto</h2><button style={{...sB(false),fontSize:16}} onClick={()=>{setCryU(false);setCryP("")}}>🔒</button></div>
        <div style={sC}><table style={{width:"100%",fontSize:18,borderCollapse:"collapse"}}><thead><tr style={{color:C.mt}}><th style={{textAlign:"left",padding:6}}>Kovanec</th><th style={{textAlign:"right",padding:6}}>Količina</th><th style={{textAlign:"right",padding:6}}>Cena</th><th style={{textAlign:"right",padding:6}}>Vrednost</th></tr></thead><tbody>{cryH.map((h,i)=><tr key={i} style={{borderBottom:`1px solid ${C.fn}`}}><td style={{padding:6}}><input style={{...sI,width:55,fontWeight:600}} defaultValue={h.coin} onBlur={e=>{const n=[...cryH];n[i]={...n[i],coin:e.target.value};setCryH(n)}}/></td><td style={{textAlign:"right",padding:6}}><input type="number" step="0.01" style={{...sI,width:75,textAlign:"right"}} defaultValue={h.amount} onBlur={e=>{const n=[...cryH];n[i]={...n[i],amount:parseFloat(e.target.value)||0};setCryH(n)}}/></td><td style={{textAlign:"right",padding:6}}><input type="number" style={{...sI,width:75,textAlign:"right"}} defaultValue={h.avgPrice} onBlur={e=>{const n=[...cryH];n[i]={...n[i],avgPrice:parseFloat(e.target.value)||0};setCryH(n)}}/></td><td style={{textAlign:"right",padding:6,fontWeight:600}}>{fmt(Math.round(h.amount*h.avgPrice))}</td></tr>)}</tbody></table><button style={{...sB(false),marginTop:8,fontSize:16}} onClick={()=>setCryH(h=>[...h,{coin:"",amount:0,avgPrice:0}])}>+ Dodaj</button></div>
        <div style={sM}><div style={{fontSize:16,color:C.mt,textTransform:"uppercase"}}>Skupaj</div><div style={{fontSize:26,fontWeight:700,color:C.pu}}>{fmt(cryH.reduce((s,h)=>s+Math.round(h.amount*h.avgPrice),0))}</div></div>
      </div>}
    </div>}

    </div></div></EB>;
}
