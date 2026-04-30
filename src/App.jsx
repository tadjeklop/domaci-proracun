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
function initM(){const s={};AS.forEach(sub=>{s[sub.id]={plan:sub.dp,actual:0,comment:""}});return{subs:s,income:{Kristina:{},Tadej:{}},customIncome:[],unexpectedItems:[],closed:false}}
function initY(){const y={};for(let i=0;i<12;i++)y[i]=initM();return y}
function ld(k,fb){try{const s=localStorage.getItem(k);return s?JSON.parse(s):fb}catch{return fb}}
function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
function cT(md,cat,f){return cat.subs.reduce((s,sub)=>s+(md?.subs?.[sub.id]?.[f]||0),0)}
function fxT(md,f){return CATS.filter(c=>c.tp==="fixed").reduce((s,c)=>s+cT(md,c,f),0)}
function vrT(md,f){return CATS.filter(c=>c.tp==="var").reduce((s,c)=>s+cT(md,c,f),0)}
function iT(md){let t=0;Object.values(md?.income?.Kristina||{}).forEach(v=>t+=(v||0));Object.values(md?.income?.Tadej||{}).forEach(v=>t+=(v||0));(md?.customIncome||[]).forEach(ci=>t+=(ci.amount||0));return t}
function pctDiff(plan,actual){if(!plan)return"N/A";const d=pc(actual,plan);return d+"%"}

// ===== STYLES =====
const C={bg:"#f8f7f4",cd:"#fff",bd:"#e8e6e1",mt:"#888",fn:"#f5f5f0",gn:"#059669",rd:"#dc2626",bl:"#2563eb",pu:"#7c3aed",or:"#d97706",tx:"#1a1a2e",sb:"#555"};
const sC={background:C.cd,borderRadius:8,border:`1px solid ${C.bd}`,padding:12,marginBottom:8};
const sM={background:"#fafaf8",borderRadius:6,padding:"10px 12px",border:"1px solid #eee",marginBottom:3};
const sI={height:28,fontSize:11,border:"1px solid #ddd",borderRadius:4,padding:"0 8px",outline:"none",boxSizing:"border-box"};
const sS={height:28,fontSize:11,border:"1px solid #ddd",borderRadius:4,padding:"0 6px",background:"#fff",outline:"none",boxSizing:"border-box"};
const sB=p=>({height:28,fontSize:10,fontWeight:600,border:p?"none":"1px solid #ddd",borderRadius:4,padding:"0 12px",background:p?C.bl:"#fff",color:p?"#fff":"#333",cursor:"pointer"});
const sT=(b,f)=>({fontSize:8,padding:"2px 6px",borderRadius:8,fontWeight:600,background:b,color:f,display:"inline-block"});
const aBtn={padding:'8px 16px',background:'#2563eb',color:'#fff',border:'none',borderRadius:6,cursor:'pointer'};
const aInp={width:'100%',height:36,fontSize:13,border:'1px solid #ddd',borderRadius:6,padding:'0 12px',outline:'none',boxSizing:'border-box',marginBottom:8};
const aPg={minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f8f7f4',fontFamily:"'Segoe UI',system-ui,sans-serif"};
const aCd={background:'#fff',borderRadius:16,padding:'2.5rem',width:380,boxShadow:'0 2px 24px rgba(0,0,0,0.06)',border:'1px solid #e8e6e1'};

function PSlider({label,value,onChange,min,max,step=1,unit=""}){return<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{fontSize:11,color:C.mt,minWidth:140}}>{label}</span><input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))} style={{flex:1}}/><input type="number" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value)||0)} style={{...sI,width:60,height:26,fontSize:11,textAlign:"right"}}/>{unit&&<span style={{fontSize:10,color:C.mt,minWidth:12}}>{unit}</span>}</div>}
function AddCI({onAdd}){const[l,sL]=useState('');const[a,sA]=useState('');const[p,sP]=useState('Kristina');const[c,sCC]=useState('');return<div style={{display:"flex",gap:4,marginTop:6,alignItems:"center",flexWrap:"wrap"}}><input style={{...sI,flex:1,minWidth:80,height:26,fontSize:11}} value={l} onChange={e=>sL(e.target.value)} placeholder="Opis"/><input style={{...sI,width:55,height:26,fontSize:11}} type="number" value={a} onChange={e=>sA(e.target.value)} placeholder="€"/><select style={{...sS,width:75,height:26,fontSize:11}} value={p} onChange={e=>sP(e.target.value)}><option>Kristina</option><option>Tadej</option></select><input style={{...sI,flex:0.5,minWidth:50,height:26,fontSize:10}} value={c} onChange={e=>sCC(e.target.value)} placeholder="komentar"/><button style={{...sB(true),height:26,padding:"0 8px"}} onClick={()=>{if(l){onAdd(l,a,p,c);sL('');sA('');sCC('')}}}>+</button></div>}
function AddUX({onAdd,kuList}){const[d,sD]=useState('');const[cu,sCu]=useState('');const[a,sA]=useState('');const[p,sP]=useState('Kristina');return<div style={{display:"flex",gap:6,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}><select style={{...sS,flex:1,minWidth:100}} value={d} onChange={e=>sD(e.target.value)}><option value="">Izberi...</option>{kuList.map(k=><option key={k} value={k}>{k}</option>)}<option value="__c">+ Drugo</option></select>{(d===""||d==="__c")&&<input style={{...sI,width:80}} value={cu} onChange={e=>sCu(e.target.value)} placeholder="Opis"/>}<input style={{...sI,width:60}} type="number" value={a} onChange={e=>sA(e.target.value)} placeholder="€"/><select style={{...sS,width:75}} value={p} onChange={e=>sP(e.target.value)}><option>Kristina</option><option>Tadej</option></select><button style={{...sB(true),padding:"0 10px"}} onClick={()=>{const desc=d==="__c"||!d?cu:d;if(desc){onAdd(desc,a,p);sD('');sCu('');sA('')}}}>+</button></div>}
function AddGoal({onAdd,onCancel}){const[n,sN]=useState('');const[t,sT2]=useState('saving');const[tg,sTg]=useState('');const[src,sSrc]=useState('');const[note,sNote]=useState('');const[mo,sMo]=useState('');const[scope,setScope]=useState('general');const[autoPull,setAutoPull]=useState(false);const[pullMo,setPullMo]=useState('all');return<div style={{...sC,border:"1px dashed #93c5fd",background:"#f0f7ff"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}><div><div style={{fontSize:10,color:C.mt,marginBottom:2}}>Ime cilja</div><input style={{...sI,width:"100%"}} value={n} onChange={e=>sN(e.target.value)} placeholder="npr. Nujni sklad"/></div><div><div style={{fontSize:10,color:C.mt,marginBottom:2}}>Tip</div><select style={{...sS,width:"100%"}} value={t} onChange={e=>sT2(e.target.value)}><option value="saving">Varčevalni</option><option value="limit">Mesečni limit</option><option value="manual">Ročni vnos</option></select></div><div><div style={{fontSize:10,color:C.mt,marginBottom:2}}>Obseg</div><select style={{...sS,width:"100%"}} value={scope} onChange={e=>setScope(e.target.value)}><option value="general">Splošni cilj</option><option value="monthly">Mesečni cilj</option></select></div><div><div style={{fontSize:10,color:C.mt,marginBottom:2}}>{scope==="monthly"?"Mesec":"Ciljni znesek (€)"}</div>{scope==="monthly"?<select style={{...sS,width:"100%"}} value={mo} onChange={e=>sMo(e.target.value)}><option value="">Izberi mesec</option>{MF.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>:<input style={{...sI,width:"100%"}} type="number" value={tg} onChange={e=>sTg(e.target.value)} placeholder="0"/>}</div>{scope==="monthly"&&<div><div style={{fontSize:10,color:C.mt,marginBottom:2}}>Ciljni znesek (€)</div><input style={{...sI,width:"100%"}} type="number" value={tg} onChange={e=>sTg(e.target.value)} placeholder="0"/></div>}<div><div style={{fontSize:10,color:C.mt,marginBottom:2}}>Vir podatkov</div><select style={{...sS,width:"100%"}} value={src} onChange={e=>sSrc(e.target.value)}><option value="">Ročno</option>{AS.map(s=><option key={s.id} value={s.id}>{s.nm.substring(0,28)}</option>)}</select></div></div><div style={{marginBottom:8}}><label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:11}}><input type="checkbox" checked={autoPull && src} onChange={e=>setAutoPull(e.target.checked)} disabled={!src}/><span style={{color:src?C.tx:C.mt}}>Avtomatsko prevzeni (samo s črtom podatkov)</span></label></div>{autoPull&&src&&<div><div style={{fontSize:10,color:C.mt,marginBottom:2}}>Od katerega meseca?</div><select style={{...sS,width:"100%"}} value={pullMo} onChange={e=>setPullMo(e.target.value)}><option value="all">Vsi zaprti meseci (skupaj)</option><option value="current">Trenutni mesec</option>{MF.map((m,i)=><option key={i} value={String(i)}>{m}</option>)}</select></div>}<div style={{marginBottom:8}}><div style={{fontSize:10,color:C.mt,marginBottom:2}}>Opomba</div><input style={{...sI,width:"100%"}} value={note} onChange={e=>sNote(e.target.value)} placeholder="neobvezno"/></div><div style={{display:"flex",gap:6,justifyContent:"flex-end"}}><button style={sB(false)} onClick={onCancel}>Prekliči</button><button style={sB(true)} onClick={()=>{if(n&&tg)onAdd({name:n,type:t,target:parseFloat(tg),current:0,source:src,note,scope,month:scope==="monthly"?parseInt(mo):null,autoPull:autoPull&&src,pullFromMonth:pullMo})}}>Shrani</button></div></div>}

// Superadmin user creation form
function CreateUserForm({onAdd}){const[u,sU]=useState('');const[p,sP]=useState('');const[e,sE]=useState('');const[msg,sMsg]=useState('');return<div style={sC}><div style={{fontSize:13,fontWeight:600,marginBottom:6}}>Ustvari novega uporabnika</div><div style={{fontSize:11,color:C.mt,marginBottom:8}}>Samo superadmin lahko ustvari račune. Uporabnik potrebuje email za obnovitev gesla.</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:6}}><div><div style={{fontSize:10,color:C.mt,marginBottom:2}}>Uporabniško ime</div><input style={{...sI,width:"100%"}} value={u} onChange={ev=>sU(ev.target.value)} placeholder="npr. Kristina"/></div><div><div style={{fontSize:10,color:C.mt,marginBottom:2}}>Geslo (≥ 6)</div><input style={{...sI,width:"100%"}} type="password" value={p} onChange={ev=>sP(ev.target.value)} placeholder="geslo"/></div><div><div style={{fontSize:10,color:C.mt,marginBottom:2}}>Email</div><input style={{...sI,width:"100%"}} value={e} onChange={ev=>sE(ev.target.value)} placeholder="email@domena.si"/></div></div><button style={sB(true)} onClick={()=>{if(!u.trim()||p.length<6||!e.includes('@')){sMsg('Izpolni vsa polja pravilno.');return}onAdd(u.trim(),p,e.trim());sU('');sP('');sE('');sMsg('Uporabnik ustvarjen!')}}>Ustvari uporabnika</button>{msg&&<div style={{fontSize:11,color:C.gn,marginTop:4}}>{msg}</div>}</div>}

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
      <button type="button" onClick={()=>setShowCalc(!showCalc)} style={{width:24,height:26,fontSize:11,border:"1px solid #ddd",borderRadius:4,background:showCalc?"#dbeafe":"#fff",color:C.bl,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}} title="Kalkulator">Σ</button>
    </div>
    {showCalc&&<div style={{position:"absolute",top:"100%",left:0,zIndex:20,background:"#fff",border:`1px solid ${C.bd}`,borderRadius:8,padding:10,minWidth:220,boxShadow:"0 4px 16px rgba(0,0,0,0.12)"}}>
      <div style={{fontSize:11,fontWeight:600,marginBottom:4}}>Seštevanje postavk</div>
      <div style={{fontSize:10,color:C.mt,marginBottom:6}}>Dodaj posamezne zneske — seštejejo se avtomatsko.</div>
      {items.map((it,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"2px 0",borderBottom:`1px solid ${C.fn}`}}>
        <span style={{color:C.mt}}>{it.desc}</span>
        <span style={{fontWeight:500}}>{fmt(it.amount)}</span>
      </div>)}
      <div style={{display:"flex",gap:4,marginTop:4}}>
        <input style={{...sI,flex:1,height:24,fontSize:11}} value={newItem} onChange={e=>setNewItem(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addItemToList()}} placeholder="znesek ali 23+15"/>
        <button type="button" style={{...sB(true),height:24,padding:"0 8px",fontSize:10}} onClick={addItemToList}>+</button>
      </div>
      {items.length>0&&<div style={{display:"flex",justifyContent:"space-between",marginTop:6,padding:"4px 0",borderTop:`2px solid ${C.bd}`,fontSize:12,fontWeight:700}}>
        <span>Skupaj</span><span style={{color:C.gn}}>{fmt(items.reduce((s,i)=>s+i.amount,0))}</span>
      </div>}
      <div style={{display:"flex",gap:4,marginTop:4}}>
        <button style={{...sB(false),fontSize:9,height:20}} onClick={()=>{setItems([]);setVal('');onResult(0)}}>Počisti</button>
        <button style={{...sB(true),fontSize:9,height:20}} onClick={()=>setShowCalc(false)}>Zapri</button>
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
  const[editPlan,setEditPlan]=useState(false);
  const[compMode,setCompMode]=useState(false);
  const[goalView,setGoalView]=useState("general");
  const[goalMonth,setGoalMonth]=useState(new Date().getMonth());
  const[annualDetailMonth,setAnnualDetailMonth]=useState(null); // month selected in letni pregled for detail view
  const[adminViews,setAdminViews]=useState(()=>ld('dp_adminviews',CATS.map(c=>c.id))); // cats visible to admin
  const[subVis,setSubVis]=useState(()=>ld('dp_subvis',{})); // subcategory visibility
  const[auditLog,setAuditLog]=useState(()=>ld('dp_audit',[]));
  const[adminConf,setAdminConf]=useState(()=>ld('dp_adminconf',{Kristina:{varsav:true,crypto:true,settings:true}}));
  // Savings section
  const[savUnlocked,setSavUnlocked]=useState(false);const[savPwd,setSavPwd]=useState('');
  const[savData,setSavData]=useState(()=>ld('dp_savdata',{members:[]}));
  // Editable lists
  const[itList,setItList]=useState(()=>ld('dp_it',["Plača","Nagrada","Regres","Božičnica","Otroški dodatek","Porodniška","Refund"]));
  const[kuList,setKuList]=useState(()=>ld('dp_ku',["Amazon","HM","About You","Sports Direct","Mohito","Notino","Stradivarius","Grand Hotel Bernardin","Best Secret","Equa","Lelosi","DDStepOnline","Fever vstopnice"]));
  // Settings
  const[sNP,setSNP]=useState('');const[sNP2,setSNP2]=useState('');const[sCP,setSCP]=useState('');const[sMsg,setSMsg]=useState('');

  // Persist
  useEffect(()=>{sv('dp_data',data)},[data]);useEffect(()=>{sv('dp_log',cLog.slice(0,200))},[cLog]);useEffect(()=>{sv('dp_goals',goals)},[goals]);useEffect(()=>{sv('dp_cry',cryH)},[cryH]);useEffect(()=>{sv('dp_pct',bPct)},[bPct]);useEffect(()=>{sv('dp_pm',pMd)},[pMd]);useEffect(()=>{sv('dp_pf',pFx)},[pFx]);useEffect(()=>{sv('dp_sv',savVis)},[savVis]);useEffect(()=>{sv('dp_mb',manualBudget)},[manualBudget]);useEffect(()=>{sv('dp_savdata',savData)},[savData]);useEffect(()=>{sv('dp_pending',pendingRegs)},[pendingRegs]);useEffect(()=>{sv('dp_simman',simManual)},[simManual]);useEffect(()=>{sv('dp_simcats',simCats)},[simCats]);useEffect(()=>{sv('dp_adminviews',adminViews)},[adminViews]);useEffect(()=>{sv('dp_subvis',subVis)},[subVis]);useEffect(()=>{sv('dp_audit',auditLog.slice(0,500))},[auditLog]);useEffect(()=>{sv('dp_adminconf',adminConf)},[adminConf]);useEffect(()=>{sv('dp_it',itList)},[itList]);useEffect(()=>{sv('dp_ku',kuList)},[kuList]);

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

  const uSub=(subId,field,val)=>{setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[yr])n[yr]=initY();if(!n[yr][mo])n[yr][mo]=initM();if(!n[yr][mo].subs[subId])n[yr][mo].subs[subId]={plan:0,actual:0,comment:""};const old=n[yr][mo].subs[subId][field];n[yr][mo].subs[subId][field]=field==="comment"?val:(parseFloat(val)||0);if(field==="plan"&&parseFloat(val)!==old)setCLog(l=>[{date:new Date().toLocaleDateString("sl-SI"),sub:subId,oldVal:old||0,newVal:parseFloat(val)||0,who:curUser||"?"},...l]);return n})};
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
  const doImport=()=>{if(!impPrev)return;setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[impYr])n[impYr]=initY();impPrev.preview.forEach(r=>{if(!n[impYr][r.mi])n[impYr][r.mi]=initM();const lbl=r.label.toLowerCase();CATS.forEach(cat=>{cat.subs.forEach(sub=>{const sl=sub.nm.toLowerCase();if(lbl.includes(sl.substring(0,12))||sl.includes(lbl.substring(0,12))){n[impYr][r.mi].subs[sub.id]={plan:r.plan||r.actual,actual:r.actual,comment:""}}})});if(lbl==="kristina"||lbl==="tadej"){const p=lbl==="kristina"?"Kristina":"Tadej";if(!n[impYr][r.mi].income[p])n[impYr][r.mi].income[p]={};n[impYr][r.mi].income[p]["Plača"]=(n[impYr][r.mi].income[p]["Plača"]||0)+r.actual}});return n});setImpPrev(null);setImpLog([{type:"ok",msg:`Uvoženo v ${impYr}!`}])};

  // Simulation data - uses manual overrides, selected categories, closed months
  const simData=(()=>{const sY=parseInt(simFrom.split("-")[0])||2026;const eY=parseInt(simTo.split("-")[0])||2029;const yrs=Math.max(1,eY-sY+1);
    let yrInc=0,yrExp=0,yrUxt=0,yrSav=0,closedCount=0;
    for(let m=0;m<12;m++){const mdata=yd[m]||initM();if(mdata.closed){yrInc+=iT(mdata);const selCats=CATS.filter(c=>simCats.includes(c.id));yrExp+=selCats.reduce((s,c)=>s+cT(mdata,c,'actual'),0);yrUxt+=uxtT(mdata);yrSav+=cT(mdata,CATS.find(c=>c.id==="savings_inv")||{subs:[]},'actual');closedCount++}};
    const baseInc=simManual.income!=null?simManual.income:(closedCount>0?yrInc/closedCount:(tInc||3600));
    const baseExp=simManual.expense!=null?simManual.expense:(closedCount>0?(yrExp+yrUxt)/closedCount:(tAc||3100));
    const baseSav=simManual.savings!=null?simManual.savings:(closedCount>0?yrSav/closedCount:500);
    const r=[];
    for(let i=0;i<yrs;i++){const ig=Math.pow(1+simG/100,i);const eg=Math.pow(1+simI/100,i);let yI=Math.round(baseInc*ig*12);let yE=Math.round(baseExp*eg*12);const yS=Math.round((baseSav+simE)*ig*12);const cum=r.length>0?r[r.length-1].Prihranki+yS:yS;simSc.forEach(sc=>{const curYr=sY+i;if(sc.type==="mortgage"&&curYr>=sc.year)yE+=sc.amount*12;if(sc.type==="raise"&&curYr>=sc.year)yI=Math.round(yI*(1+sc.pct/100));if(sc.type==="jobLoss"&&curYr===sc.year)yI=Math.round(yI*0.4);if(sc.type==="move"&&curYr>=sc.year)yE+=sc.amount*12});r.push({name:String(sY+i),Prihodki:yI,Odhodki:yE,Prihranki:cum,Razlika:yI-yE})}return r})();

  const pieData=visibleCats.map((c,i)=>({name:c.nm.split(" ")[0],value:cT(md,c,'actual'),color:CL[i%CL.length]})).filter(d=>d.value>0);
  const trendData=MS.map((m,i)=>{const mdata=yd[i]||initM();return{name:m,Prihodki:iT(mdata),Odhodki:fxT(mdata,'actual')+vrT(mdata,'actual')+uxtT(mdata),closed:mdata.closed}});

  const navP=()=>{if(mo===0){setMo(11);setYr(y=>y-1)}else setMo(m=>m-1)};
  const navN=()=>{if(mo===11){setMo(0);setYr(y=>y+1)}else setMo(m=>m+1)};

  if(!ready)return<div style={aPg}><div style={aCd}><p>Nalagam...</p></div></div>;

  // ===== AUTH SCREENS =====
  if(authSt==='init')return<div style={aPg}><div style={aCd}><p>Nalagam...</p></div></div>;
  if(authSt==='login')return<div style={aPg}><div style={aCd}>
    <div style={{fontSize:32,textAlign:'center',marginBottom:8}}>🔐</div>
    <h2 style={{textAlign:'center',margin:'0 0 20px'}}>Prijava</h2>
    <input style={aInp} value={lU} onChange={e=>setLU(e.target.value)} placeholder="Uporabniško ime" disabled={lock>Date.now()}/>
    <input style={aInp} type="password" value={lP} onChange={e=>setLP(e.target.value)} placeholder="Geslo" disabled={lock>Date.now()} onKeyDown={e=>{if(e.key==='Enter')doLogin()}}/>
    <button style={{...aBtn,width:'100%',height:42,fontSize:14,fontWeight:600,marginBottom:8}} onClick={doLogin} disabled={lock>Date.now()}>Prijava</button>
    {aErr&&<div style={{fontSize:12,color:C.rd,textAlign:'center',marginTop:8,padding:'6px 10px',background:'#fef2f2',borderRadius:6}}>{aErr}</div>}
    <div style={{textAlign:'center',marginTop:12}}>
      {!showForgot?<button onClick={()=>setShowForgot(true)} style={{background:'none',border:'none',color:C.bl,fontSize:12,cursor:'pointer',textDecoration:'underline'}}>Pozabljeno geslo?</button>
      :<div style={{background:'#fef3c7',padding:10,borderRadius:8,fontSize:11,color:'#92400e',marginTop:8}}>
        <p style={{margin:'0 0 6px',fontWeight:600}}>Ponastavitev gesla</p>
        <p style={{margin:'0 0 4px'}}>Vnesi svoj email. Superadmin bo prejel obvestilo o zahtevi.</p>
        <input style={{...aInp,height:32,fontSize:12,marginBottom:6}} id="resetEmail" placeholder="Tvoj email naslov"/>
        <button onClick={()=>{const email=document.getElementById('resetEmail')?.value;if(email){const reqs=ld('dp_resetreqs',[]);reqs.push({email,date:new Date().toLocaleDateString("sl-SI")});sv('dp_resetreqs',reqs);setAErr('Zahteva poslana. Superadmin bo ponastavil tvoje geslo.');setShowForgot(false)}else setAErr('Vnesi email.')}} style={{...sB(true),fontSize:11,height:28}}>Pošlji zahtevo</button>
        <button onClick={()=>setShowForgot(false)} style={{...sB(false),fontSize:11,height:28,marginLeft:6}}>Prekliči</button>
      </div>}
    </div>
    <div style={{fontSize:10,color:C.mt,textAlign:'center',marginTop:16}}>Račune ustvari superadmin. Če nimaš računa, se obrni na admina.</div>
  </div></div>;

  // ===== AUTHENTICATED =====
  const MNav=<div style={{display:"flex",alignItems:"center",gap:6}}><button onClick={navP} style={sB(false)}>←</button><span style={{fontSize:14,fontWeight:600,minWidth:120,textAlign:"center"}}>{MF[mo]} {yr}</span><button onClick={navN} style={sB(false)}>→</button></div>;
  const YPk=<div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}><span style={{fontSize:10,color:C.mt}}>Leto:</span><select style={{...sS,height:26,fontSize:11,width:70}} value={yr} onChange={e=>setYr(parseInt(e.target.value))}>{[2020,2021,2022,2023,2024,2025,2026,2027,2028].map(y=><option key={y} value={y}>{y}</option>)}</select></div>;
  const isClosed=md.closed;

  // Category entry renderer with % difference and N/A
  const CatEntry=({cats,title})=><div><div style={{fontSize:13,fontWeight:700,color:C.tx,marginBottom:4,marginTop:6}}>{title}</div><div style={sC}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 55px 55px 45px 40px 1fr",gap:6,fontSize:9,color:C.mt,fontWeight:600,padding:"0 0 4px",borderBottom:`1px solid ${C.bd}`}}><span>Postavka</span><span>Plan</span><span>Izvedba</span><span>Razl.€</span><span>%</span><span>Kom.</span></div>
    {cats.map(cat=><React.Fragment key={cat.id}>
      <div style={{fontSize:11,fontWeight:700,color:C.tx,padding:"5px 0 2px",marginTop:2,paddingLeft:0}}>{cat.nm}</div>
      {cat.subs.filter(sub=>subVis[sub.id]!==true).map(sub=>{const d=md.subs?.[sub.id]||{plan:0,actual:0,comment:""};const diff=d.plan-d.actual;const pct=d.plan?pc(d.actual,d.plan)+"%":"—";
        return<div key={sub.id} style={{display:"grid",gridTemplateColumns:"1fr 55px 55px 45px 40px 1fr",gap:6,fontSize:10,alignItems:"center",padding:"2px 0 2px 10px",borderBottom:`1px solid ${C.fn}`}}>
          <div style={{display:"flex",alignItems:"center",gap:3,fontSize:9}}><span>{sub.nm}</span><button type="button" onClick={()=>toggleSubVis(sub.id)} style={{background:"none",border:"none",cursor:"pointer",padding:0,fontSize:9,color:C.mt,flexShrink:0}}>👁</button></div>
          <span style={{color:"#999",fontSize:9,textAlign:"right"}}>{d.plan?fN(d.plan):"—"}</span>
          <CalcInput defaultValue={d.actual||""} onResult={v=>uSub(sub.id,"actual",v)} style={{width:45,height:24,fontSize:10}} placeholder="0"/>
          <span style={{fontSize:8,color:d.plan?(diff>=0?C.gn:C.rd):C.mt,textAlign:"right"}}>{d.plan?(diff>=0?"+":"")+fN(diff):"—"}</span>
          <span style={{fontSize:8,color:d.plan?(pc(d.actual,d.plan)>90?C.rd:C.gn):C.mt,textAlign:"right"}}>{pct}</span>
          <input style={{...sI,height:24,fontSize:9}} defaultValue={d.comment} onBlur={e=>uSub(sub.id,"comment",e.target.value)} placeholder=""/>
        </div>})}
    </React.Fragment>)}</div></div>;

  return<EB><div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",color:C.tx,minHeight:"100vh",background:C.bg}}>
    {/* USER BAR */}
    <div style={{position:'fixed',top:0,right:0,zIndex:100,padding:'5px 12px',display:'flex',alignItems:'center',gap:6,fontSize:11,color:'#888',background:'rgba(248,247,244,0.95)',borderBottomLeftRadius:6,border:'1px solid #e8e6e1',borderTop:'none',borderRight:'none'}}>
      <span style={{fontWeight:500,color:C.bl}}>{curUser}</span>
      <span style={sT(isSA?"#dbeafe":"#dcfce7",isSA?C.bl:"#166534")}>{isSA?"superadmin":"admin"}</span>
      <button onClick={doLogout} style={{fontSize:10,padding:'2px 8px',border:'1px solid #ddd',borderRadius:4,background:'#fff',cursor:'pointer'}}>Odjava</button>
    </div>
    {/* NAV */}
    <div style={{display:"flex",gap:0,background:C.tx,padding:"0 4px",overflowX:"auto"}}>
      {[["dash","Nadzorna plošča"],["entry","Mesečni vnos"],["annual","Letni pregled"],["goals","Cilji"],["sim","Simulacija"],["pct","% razdelitev"],["varsav","Varčevanje"],["settings","Nastavitve"],["crypto","🔒"]].filter(([k,l])=>isSA||(k!=="varsav"&&k!=="settings"&&k!=="crypto")||(k==="varsav"&&adminConf[curUser]?.varsav)||(k==="settings"&&adminConf[curUser]?.settings)||(k==="crypto"&&adminConf[curUser]?.crypto)).map(([k,l])=>
        <div key={k} style={{padding:"10px 10px",fontSize:11,fontWeight:vw===k?600:400,color:vw===k?"#f8f7f4":"#8888a0",cursor:"pointer",borderBottom:vw===k?"2px solid #60a5fa":"2px solid transparent",whiteSpace:"nowrap"}} onClick={()=>setVw(k)}>{l}</div>
      )}
    </div>
    <div style={{padding:"1rem 1.25rem 2rem"}}>

    {/* ===== NADZORNA PLOŠČA ===== */}
    {vw==="dash"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
        <h2 style={{fontSize:20,fontWeight:700,margin:0}}>Nadzorna plošča</h2>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          {YPk}
          <button onClick={()=>setShowImp(!showImp)} style={{...sB(false),fontSize:10}}>Uvoz</button>
          <button onClick={doExport} style={{...sB(false),fontSize:10}}>Izvoz</button>
          <button onClick={()=>setEditPlan(!editPlan)} style={{...sB(editPlan),fontSize:10}}>{editPlan?"Zaključi urejanje":"Uredi plan"}</button>
          {editPlan&&<button onClick={syncPlanToEntry} style={{...sB(true),fontSize:10,background:C.gn}}>Sinhroniziraj → mesečni vnos</button>}
          {MNav}
        </div>
      </div>
      {/* Month close/open */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <button onClick={()=>toggleClose(mo)} style={{...sB(isClosed),fontSize:10,background:isClosed?C.gn:undefined,color:isClosed?"#fff":undefined,border:isClosed?"none":undefined}}>{isClosed?`✓ ${MF[mo]} zaključen`:`Zaključi ${MF[mo]}`}</button>
        {isClosed&&<span style={{fontSize:10,color:C.gn}}>Podatki tega meseca se uporabijo v simulaciji kot dejanski.</span>}
      </div>
      {/* Backup reminder */}
      {checkBackupDue()&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fef3c7",border:"1px solid #fde68a",borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:11,color:"#92400e"}}>
        <span>⚠ Varnostna kopija ni bila narejena že 14+ dni. Priporočamo izvoz.</span>
        <button style={{...sB(true),height:24,fontSize:10,background:"#d97706"}} onClick={()=>{createBackup();localStorage.setItem('dp_lastbackup',String(Date.now()))}}>Varnostna kopija</button>
      </div>}
      {/* Import */}
      {showImp&&<div style={{...sC,background:"#f0f7ff",border:"1px dashed #93c5fd"}}><div style={{fontSize:12,fontWeight:600,color:C.bl,marginBottom:4}}>Uvozi iz Excel</div><div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}><span style={{fontSize:11}}>V leto:</span><select style={{...sS,width:70}} value={impYr} onChange={e=>setImpYr(parseInt(e.target.value))}>{[2020,2021,2022,2023,2024,2025,2026,2027,2028].map(y=><option key={y} value={y}>{y}</option>)}</select><input type="file" accept=".xlsx,.xls" onChange={handleImpFile} style={{fontSize:12}}/></div>{impPrev&&<div style={{border:"1px solid #e8e6e1",borderRadius:6,padding:8,background:"#fff",maxHeight:160,overflowY:"auto",marginBottom:8}}><div style={{fontSize:11,fontWeight:600,marginBottom:4}}>Predogled ({impPrev.preview.length} vnosov → {impYr}):</div><table style={{width:"100%",fontSize:10,borderCollapse:"collapse"}}><thead><tr><th style={{textAlign:"left",padding:2}}>Mesec</th><th style={{textAlign:"left",padding:2}}>Postavka</th><th style={{textAlign:"right",padding:2}}>Izvedba</th></tr></thead><tbody>{impPrev.preview.slice(0,20).map((r,i)=><tr key={i}><td style={{padding:2}}>{r.month}</td><td style={{padding:2}}>{r.label.substring(0,25)}</td><td style={{textAlign:"right",padding:2}}>{fmt(r.actual)}</td></tr>)}</tbody></table><div style={{display:"flex",gap:6,marginTop:6}}><button style={sB(true)} onClick={doImport}>Potrdi uvoz</button><button style={sB(false)} onClick={()=>setImpPrev(null)}>Prekliči</button></div></div>}{impLog.map((l,i)=><div key={i} style={{fontSize:11,color:l.type==="ok"?C.gn:C.rd}}>{l.msg}</div>)}</div>}

      {/* Metrics - Grouped for visual connection */}
      <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr 1.2fr",gap:8,marginBottom:10}}>
        {/* Income & Difference */}
        <div style={{...sC,borderLeft:`4px solid ${C.gn}`}}><div style={{fontSize:8,color:C.mt,textTransform:"uppercase",letterSpacing:0.5,marginBottom:1}}>Prihodki</div><div style={{fontSize:20,fontWeight:700,color:C.gn,marginBottom:6}}>{fmt(tInc)}</div><div style={{fontSize:8,color:C.mt,textTransform:"uppercase",letterSpacing:0.5,marginBottom:1}}>Razlika</div><div style={{fontSize:16,fontWeight:700,color:tInc-tAc>=0?C.gn:C.rd}}>{tInc-tAc>=0?"+":""}{fmt(tInc-tAc)}</div></div>
        {/* Expenses breakdown */}
        <div style={{...sC,borderLeft:`4px solid ${C.rd}`}}><div style={{fontSize:8,color:C.mt,textTransform:"uppercase",letterSpacing:0.5,marginBottom:1}}>Odhodki</div><div style={{fontSize:20,fontWeight:700,color:C.rd,marginBottom:2}}>{fmt(tAc)}</div><div style={{fontSize:8,color:"#999",fontWeight:500,lineHeight:1.3}}>F {fmt(tFx)} | V {fmt(tVr)}{tUxt>0?` | N ${fmt(tUxt)}`:"" }</div></div>
        {/* Savings */}
        <div style={{...sC,borderLeft:`4px solid ${C.bl}`,position:"relative"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:1}}><span style={{fontSize:8,color:C.mt,textTransform:"uppercase",letterSpacing:0.5}}>Varčevanje</span><span onClick={()=>setShowSavCfg(!showSavCfg)} style={{...sT("#dbeafe",C.bl),fontSize:7,cursor:"pointer",padding:"1px 5px"}}>⚙</span></div><div style={{fontSize:20,fontWeight:700,color:C.bl}}>{fmt(savVis.reduce((s,id)=>s+(md.subs?.[id]?.actual||0),0))}</div>{showSavCfg&&<div style={{position:"absolute",top:"100%",right:0,zIndex:20,background:"#fff",border:`1px solid ${C.bd}`,borderRadius:6,padding:8,minWidth:180,boxShadow:"0 2px 8px rgba(0,0,0,0.1)"}}>{CATS.find(c=>c.id==="savings_inv").subs.map(s=><label key={s.id} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,padding:"2px 0",cursor:"pointer"}}><input type="checkbox" checked={savVis.includes(s.id)} onChange={e=>{if(e.target.checked)setSavVis(v=>[...v,s.id]);else setSavVis(v=>v.filter(x=>x!==s.id))}}/>{s.nm.substring(0,20)}</label>)}<button onClick={()=>setShowSavCfg(false)} style={{...sB(true),height:20,fontSize:9,marginTop:3,width:"100%"}}>OK</button></div>}</div>
      </div>

      {/* Plan by category - FIXED */}
      <div style={{fontSize:13,fontWeight:700,color:C.tx,marginBottom:3,marginTop:8}}>Fiksni stroški</div>
      <div style={sC}>{visibleCats.filter(c=>c.tp==="fixed").map(cat=>{const pT2=cT(md,cat,'plan');const aT2=cT(md,cat,'actual');const p2=pc(aT2,pT2);return<React.Fragment key={cat.id}><div style={{display:"flex",alignItems:"center",gap:4,padding:"3px 0",borderBottom:`1px solid ${C.fn}`,fontSize:10}}><span style={{flex:1,fontWeight:600}}>{cat.nm}</span>{editPlan&&<input style={{...sI,width:60,height:24,fontSize:10}} defaultValue={pT2||""} onBlur={e=>{const v=parseFloat(e.target.value)||0;if(cat.subs.length===1)uSub(cat.subs[0].id,"plan",v);else{const total=cat.subs.reduce((s,sub)=>s+sub.dp,0);cat.subs.forEach(sub=>{uSub(sub.id,"plan",total>0?Math.round(v*sub.dp/total):Math.round(v/cat.subs.length))})}}} placeholder="Plan €"/>}<span style={{color:"#999",minWidth:50,textAlign:"right",fontSize:9}}>{fmt(pT2)}</span><span style={{minWidth:50,textAlign:"right",fontSize:9,fontWeight:600}}>{fmt(aT2)}</span><span style={{minWidth:28,textAlign:"right",fontWeight:600,fontSize:9,color:pT2?(p2>90?C.rd:p2>70?C.or:C.gn):C.mt}}>{pT2?p2+"%":"—"}</span><div style={{width:45,height:3,borderRadius:1,background:"#eee",overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(p2,100)}%`,borderRadius:1,background:p2>90?C.rd:p2>70?C.or:C.gn}}/></div></div>
        {editPlan&&cat.subs.map(sub=>{const sd=md.subs?.[sub.id]||{plan:0,actual:0};return<div key={sub.id} style={{display:"flex",alignItems:"center",gap:4,padding:"1px 0 1px 14px",borderBottom:`1px solid ${C.fn}`,fontSize:9,color:C.mt}}><span style={{flex:1}}>{sub.nm.substring(0,28)}</span><input style={{...sI,width:55,height:22,fontSize:9}} defaultValue={sd.plan||""} onBlur={e=>uSub(sub.id,"plan",e.target.value)} placeholder="€"/><span style={{minWidth:35,textAlign:"right"}}>{fN(sd.actual)}</span></div>})}
      </React.Fragment>})}</div>

      {/* Plan by category - VARIABLE */}
      <div style={{fontSize:13,fontWeight:700,color:C.tx,marginBottom:3,marginTop:6}}>Variabilni stroški</div>
      <div style={sC}>{visibleCats.filter(c=>c.tp==="var").map(cat=>{const pT2=cT(md,cat,'plan');const aT2=cT(md,cat,'actual');const p2=pc(aT2,pT2);return<React.Fragment key={cat.id}><div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:`1px solid ${C.fn}`,fontSize:11}}><span style={{flex:1,fontWeight:600}}>{cat.nm}</span>{editPlan&&<input style={{...sI,width:70,height:26,fontSize:11}} defaultValue={pT2||""} onBlur={e=>{const v=parseFloat(e.target.value)||0;if(cat.subs.length===1)uSub(cat.subs[0].id,"plan",v);else if(cat.subs.length===0)return;else{const total=cat.subs.reduce((s,sub)=>s+sub.dp,0);cat.subs.forEach(sub=>{uSub(sub.id,"plan",total>0?Math.round(v*sub.dp/total):Math.round(v/cat.subs.length))})}}} placeholder="Plan €"/>}<span style={{color:"#999",minWidth:55,textAlign:"right"}}>{fmt(pT2)}</span><span style={{minWidth:55,textAlign:"right"}}>{fmt(aT2)}</span><span style={{minWidth:32,textAlign:"right",fontWeight:600,color:pT2?(p2>90?C.rd:p2>70?C.or:C.gn):C.mt}}>{pT2?p2+"%":"N/A"}</span><div style={{width:50,height:4,borderRadius:2,background:"#eee",overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(p2,100)}%`,borderRadius:2,background:p2>90?C.rd:p2>70?C.or:C.gn}}/></div></div>
        {editPlan&&cat.subs.map(sub=>{const sd=md.subs?.[sub.id]||{plan:0,actual:0};return<div key={sub.id} style={{display:"flex",alignItems:"center",gap:6,padding:"2px 0 2px 16px",borderBottom:`1px solid ${C.fn}`,fontSize:10,color:C.mt}}><span style={{flex:1}}>{sub.nm.substring(0,30)}</span><input style={{...sI,width:60,height:22,fontSize:10}} defaultValue={sd.plan||""} onBlur={e=>uSub(sub.id,"plan",e.target.value)} placeholder="€"/><span style={{minWidth:40,textAlign:"right"}}>{fN(sd.actual)}</span></div>})}
      </React.Fragment>})}</div>

      {/* Charts */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:4}}>
        <div style={sC}><div style={{fontSize:11,fontWeight:600,color:C.sb,marginBottom:4}}>Razdelitev</div>{pieData.length>0?<div style={{display:"flex",alignItems:"center",gap:8}}><ResponsiveContainer width={100} height={100}><PieChart><Pie data={pieData} innerRadius={24} outerRadius={45} dataKey="value" stroke="none">{pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie></PieChart></ResponsiveContainer><div style={{fontSize:9,color:"#666"}}>{pieData.slice(0,5).map((d,i)=><div key={i} style={{marginBottom:2}}><span style={{display:"inline-block",width:7,height:7,borderRadius:1,background:d.color,marginRight:2}}/>{d.name} {pc(d.value,tAc)}%</div>)}</div></div>:<div style={{fontSize:10,color:"#999",textAlign:"center",padding:12}}>Vnesi podatke</div>}</div>
        <div style={sC}><div style={{fontSize:11,fontWeight:600,color:C.sb,marginBottom:4}}>Trend {yr}</div><ResponsiveContainer width="100%" height={100}><BarChart data={trendData} barGap={0}><XAxis dataKey="name" tick={{fontSize:8}} axisLine={false} tickLine={false}/><YAxis hide/><Tooltip formatter={v=>fmt(v)} contentStyle={{fontSize:10}}/><Bar dataKey="Prihodki" fill={C.gn} radius={[2,2,0,0]} barSize={5}/><Bar dataKey="Odhodki" fill={C.rd} radius={[2,2,0,0]} barSize={5} opacity={0.6}/></BarChart></ResponsiveContainer></div>
      </div>
    </div>}

    {/* ===== MESEČNI VNOS ===== */}
    {vw==="entry"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
        <h2 style={{fontSize:20,fontWeight:700,margin:0}}>Mesečni vnos</h2>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>{YPk}{MNav}<button onClick={()=>toggleClose(mo)} style={{...sB(isClosed),fontSize:10,background:isClosed?C.gn:undefined,color:isClosed?"#fff":undefined,border:isClosed?"none":undefined}}>{isClosed?"✓ Zaključen":"Zaključi mesec"}</button></div>
      </div>
      {isClosed&&<div style={{background:"#dcfce7",border:"1px solid #86efac",borderRadius:8,padding:"6px 12px",marginBottom:10,fontSize:11,color:"#166534"}}>Ta mesec je zaključen. Odpri ga z gumbom zgoraj za urejanje.</div>}
      <div style={{fontSize:13,fontWeight:600,color:C.sb,marginBottom:8}}>Prihodki</div>
      <div style={sC}>{["Kristina","Tadej"].map(person=><div key={person} style={{marginBottom:8}}><div style={{fontSize:12,fontWeight:600,color:C.bl,marginBottom:4}}>{person}</div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>{itList.map(t=><div key={`${person}-${t}`}><div style={{fontSize:9,color:"#999"}}>{t}</div><input style={{...sI,height:26,fontSize:11,width:"100%"}} defaultValue={md.income?.[person]?.[t]||""} onBlur={e=>uInc(person,t,e.target.value)} placeholder="0"/></div>)}</div></div>)}<div style={{borderTop:`1px solid ${C.bd}`,paddingTop:8}}><div style={{fontSize:11,fontWeight:600,color:C.sb,marginBottom:4}}>Dodatni prihodki</div>{(md.customIncome||[]).map((ci,i)=><div key={i} style={{fontSize:11,padding:"2px 0"}}>{ci.label} — {ci.person} — {fmt(ci.amount)}</div>)}<AddCI onAdd={addCI}/></div></div>
      <CatEntry cats={visibleCats.filter(c=>c.tp==="fixed")} title="Fiksni stroški"/>
      <CatEntry cats={visibleCats.filter(c=>c.tp==="var"&&c.id!=="unexpected")} title="Variabilni stroški"/>
      {AS.some(s=>subVis[s.id]===true)&&<div style={sC}><div style={{fontSize:12,fontWeight:600,color:C.tx,marginBottom:8}}>Skriti elementi 👁‍🗨</div>{AS.filter(s=>subVis[s.id]===true).map(sub=><div key={sub.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.fn}`,fontSize:11}}><span>{sub.nm}</span><button type="button" onClick={()=>toggleSubVis(sub.id)} style={{background:"none",border:"none",color:C.gn,cursor:"pointer",fontWeight:600}}>Pokaži</button></div>)}</div>}
      <div style={{fontSize:13,fontWeight:600,color:C.sb,marginBottom:8}}>Nepredvideni stroški</div>
      <div style={sC}><AddUX onAdd={addUX} kuList={kuList}/>{(md.unexpectedItems||[]).map((it,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:11,padding:"6px 0",borderBottom:`1px solid ${C.fn}`}}><span>{it.desc} — {fmt(it.amount)} ({it.person})</span><button type="button" onClick={()=>setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[yr])n[yr]=initY();if(!n[yr][mo])n[yr][mo]=initM();n[yr][mo].unexpectedItems=n[yr][mo].unexpectedItems.filter((_,j)=>j!==i);return n})} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:10}}>✕</button></div>)}</div>
      <div style={{fontSize:13,fontWeight:600,color:C.sb,marginBottom:8}}>Hitro dodaj cilj</div>
      {showNG?<AddGoal onAdd={g=>{setGoals(p=>[...p,{id:Date.now(),...g}]);setShowNG(false)}} onCancel={()=>setShowNG(false)}/>:<button style={{...sB(false),fontSize:11}} onClick={()=>setShowNG(true)}>+ Nov cilj</button>}
    </div>}

    {/* ===== LETNI PREGLED ===== */}
    {vw==="annual"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:6}}>
        <h2 style={{fontSize:20,fontWeight:700,margin:0}}>Letni pregled</h2>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>{YPk}<button onClick={()=>setCompMode(!compMode)} style={sB(compMode)}>{compMode?"Zapri primerjavo":"Primerjaj"}</button>{compMode&&<select style={{...sS,height:26,fontSize:11,width:70}} value={compYr||""} onChange={e=>setCompYr(e.target.value?parseInt(e.target.value):null)}><option value="">Izberi leto</option>{[2020,2021,2022,2023,2024,2025,2026,2027].filter(y=>y!==yr).map(y=><option key={y} value={y}>{y}</option>)}</select>}</div>
      </div>
      {/* Closed months indicator - clickable */}
      <div style={{display:"flex",gap:4,marginBottom:10}}>{MS.map((m,i)=>{const mdata=yd[i]||initM();return<button key={i} onClick={()=>setAnnualDetailMonth(annualDetailMonth===i?null:i)} type="button" style={{flex:1,textAlign:"center",fontSize:9,padding:"3px 0",borderRadius:4,background:annualDetailMonth===i?"#93c5fd":mdata.closed?"#dcfce7":"#f5f5f0",color:annualDetailMonth===i?C.bl:mdata.closed?"#166534":"#999",border:"none",cursor:"pointer",fontWeight:mdata.closed||annualDetailMonth===i?600:400}}>{m}</button>})}</div>
      {annualDetailMonth!==null&&<div style={{...sC,background:"#f0f7ff",border:`2px solid ${C.bl}`,marginBottom:8,padding:10}}>
        <div style={{fontSize:12,fontWeight:700,color:C.tx,marginBottom:6}}>Mesečni pregled: {MF[annualDetailMonth]} — {((md)=>{const fxA=fxT(md,'actual');const vrA=vrT(md,'actual');const uxA=uxtT(md);return `F: ${fN(fxA)} | V: ${fN(vrA)}${uxA>0?` | N: ${fN(uxA)}`:""}  =  ${fmt(fxA+vrA+uxA)}`})(yd[annualDetailMonth]||initM())}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 50px 50px 45px 38px",gap:5,fontSize:8,color:C.mt,fontWeight:600,padding:"0 0 3px",borderBottom:`1px solid ${C.bd}`}}>
          <span>Postavka</span><span>Plan</span><span>Izvedba</span><span>Razl.€</span><span>%</span>
        </div>
        {visibleCats.map(cat=>{const pT=cT(yd[annualDetailMonth]||initM(),cat,'plan');const aT=cT(yd[annualDetailMonth]||initM(),cat,'actual');return<div key={cat.id}><div style={{fontSize:11,fontWeight:700,color:C.tx,padding:"3px 0 1px",marginTop:1}}>{cat.nm}</div>{cat.subs.filter(sub=>subVis[sub.id]!==true).map(sub=>{const d=yd[annualDetailMonth]?.subs?.[sub.id]||{plan:0,actual:0};const diff=d.plan-d.actual;const pct=d.plan?pc(d.actual,d.plan)+"%":"—";return<div key={sub.id} style={{display:"grid",gridTemplateColumns:"1fr 50px 50px 45px 38px",gap:5,fontSize:9,alignItems:"center",padding:"1px 0 1px 10px",borderBottom:`1px solid #f5f5f5`}}><span style={{fontSize:8}}>{sub.nm}</span><span style={{color:"#999",fontSize:8,textAlign:"right"}}>{d.plan?fN(d.plan):"—"}</span><span style={{fontWeight:600,fontSize:9,textAlign:"right"}}>{d.actual?fN(d.actual):"—"}</span><span style={{fontSize:8,color:d.plan?(diff>=0?C.gn:C.rd):C.mt,textAlign:"right"}}>{d.plan?(diff>=0?"+":"")+fN(diff):"—"}</span><span style={{fontSize:8,color:d.plan?(pc(d.actual,d.plan)>90?C.rd:C.gn):C.mt,textAlign:"right"}}>{pct}</span></div>})}<div style={{display:"grid",gridTemplateColumns:"1fr 50px 50px 45px 38px",gap:5,fontSize:8,alignItems:"center",padding:"1px 0 1px 10px",borderTop:`1px solid ${C.bd}`,fontWeight:700,color:C.sb,background:"#f9fafb"}}><span style={{fontSize:9}}>{cat.nm}</span><span style={{textAlign:"right"}}>{pT>0?fN(pT):"—"}</span><span style={{textAlign:"right"}}>{aT>0?fN(aT):"—"}</span><span style={{textAlign:"right"}}>{pT?(aT-pT>=0?"+":"")+fN(aT-pT):"—"}</span><span style={{textAlign:"right"}}>{pT?pc(aT,pT)+"%":"—"}</span></div></div>})}
      </div>}

      {[{tp:"fixed",nm:"Fiksni stroški"},{tp:"var",nm:"Variabilni stroški"}].map(type=><div key={type.tp}><div style={{fontSize:13,fontWeight:700,color:C.tx,marginBottom:3,marginTop:type.tp==="var"?4:0}}>{type.nm}</div><div style={{...sC,overflowX:"auto",padding:8}}><table style={{width:"100%",fontSize:8,borderCollapse:"collapse"}}><thead><tr style={{color:C.mt,borderBottom:`2px solid ${C.bd}`}}><th style={{textAlign:"left",padding:"2px 4px",minWidth:"140px",fontSize:7}}>Postavka</th>{MS.map(m=><th key={m} style={{textAlign:"right",padding:"2px 2px",cursor:"pointer",fontWeight:600,fontSize:7}} onClick={()=>{setMo(MS.indexOf(m));setVw("entry")}}>{m}</th>)}<th style={{textAlign:"right",padding:"2px 4px",fontWeight:700,fontSize:7}}>Σ</th></tr></thead><tbody>{visibleCats.filter(c=>c.tp===type.tp).map(cat=><React.Fragment key={cat.id}><tr style={{background:"#f9fafb",borderTop:`1px solid ${C.fn}`}}><td colSpan={14} style={{padding:"2px 4px",fontSize:8,fontWeight:700,color:C.tx}}>{cat.nm}</td></tr>{cat.subs.filter(sub=>subVis[sub.id]!==true).map(sub=>{let tot=0;return<tr key={sub.id}><td style={{padding:"1px 4px 1px 12px",fontSize:7,color:"#888"}}>{sub.nm.substring(0,18)}</td>{Array.from({length:12},(_,i)=>{const mdata=yd[i]||initM();const v=mdata.subs?.[sub.id]?.actual||0;tot+=v;return<td key={i} style={{textAlign:"right",padding:"1px 2px",color:v>0?"#333":"#ddd",fontSize:8}}>{v>0?fN(v):"—"}</td>})}<td style={{textAlign:"right",padding:"1px 4px",fontWeight:600,fontSize:8}}>{tot>0?fmt(tot):"—"}</td></tr>})}</React.Fragment>)}</tbody></table></div></div>)}

      <div style={{fontSize:13,fontWeight:700,color:C.tx,marginBottom:3,marginTop:4}}>Nepredvideni stroški</div>
      <div style={{...sC,overflowX:"auto",padding:8}}><table style={{width:"100%",fontSize:8,borderCollapse:"collapse"}}><thead><tr style={{color:C.mt,borderBottom:`2px solid ${C.bd}`}}><th style={{textAlign:"left",padding:"2px 4px",fontSize:7}}>Nepredvideni</th>{MS.map(m=><th key={m} style={{textAlign:"right",padding:"2px 2px",cursor:"pointer",fontWeight:600,fontSize:7}} onClick={()=>{setMo(MS.indexOf(m));setVw("entry")}}>{m}</th>)}<th style={{textAlign:"right",padding:"2px 4px",fontWeight:700,fontSize:7}}>Σ</th></tr></thead><tbody><tr style={{borderTop:`1px solid ${C.fn}`}}><td style={{padding:"1px 4px",fontWeight:600,fontSize:7}}>Stroški</td>{Array.from({length:12},(_,i)=>{const mdata=yd[i]||initM();const v=uxtT(mdata);return<td key={i} style={{textAlign:"right",padding:"1px 2px",color:v>0?"#333":"#ddd",fontSize:8}}>{v>0?fN(v):"—"}</td>})}<td style={{textAlign:"right",padding:"1px 4px",fontWeight:700,fontSize:8}}>{(() => {let t=0; for(let i=0;i<12;i++)t+=uxtT(yd[i]||initM()); return t>0?fmt(t):"—"})()}</td></tr></tbody></table></div>

      {compMode&&compYr&&<div style={{...sC,background:"#fefce8",border:"1px solid #fde68a",marginTop:4}}><div style={{fontSize:12,fontWeight:600,marginBottom:3}}>Primerjava {yr} vs {compYr}</div><table style={{width:"100%",fontSize:9,borderCollapse:"collapse"}}><thead><tr style={{color:C.mt,borderBottom:`1px solid #fde68a`}}><th style={{textAlign:"left",padding:"2px 4px",minWidth:"140px",fontSize:8}}>Kategorija</th><th style={{textAlign:"right",padding:"2px 4px",fontSize:8}}>{yr}</th><th style={{textAlign:"right",padding:"2px 4px",fontSize:8}}>{compYr}</th><th style={{textAlign:"right",padding:"2px 4px",fontSize:8}}>±</th></tr></thead><tbody>{CATS.map(cat=>{let t1=0,t2=0;for(let m=0;m<12;m++){t1+=cT(yd[m]||initM(),cat,'actual');t2+=cT((data[compYr]||initY())[m]||initM(),cat,'actual')}const diff=t1-t2;return<tr key={cat.id} style={{borderTop:`1px solid #f5e6d3`}}><td style={{padding:"1px 4px",fontSize:9}}>{cat.nm}</td><td style={{textAlign:"right",padding:"1px 4px",fontSize:9}}>{fmt(t1)}</td><td style={{textAlign:"right",padding:"1px 4px",color:C.mt,fontSize:9}}>{fmt(t2)}</td><td style={{textAlign:"right",padding:"1px 4px",fontWeight:600,fontSize:9,color:diff>0?C.rd:diff<0?C.gn:C.mt}}>{diff>0?"+":""}{fmt(diff)}</td></tr>})}</tbody></table></div>}

      <div style={sC}><ResponsiveContainer width="100%" height={160}><LineChart data={trendData}><XAxis dataKey="name" tick={{fontSize:10}} axisLine={false}/><YAxis tick={{fontSize:10}} axisLine={false}/><Tooltip formatter={v=>fmt(v)} contentStyle={{fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Line type="monotone" dataKey="Prihodki" stroke={C.gn} strokeWidth={2} dot={{r:3}}/><Line type="monotone" dataKey="Odhodki" stroke={C.rd} strokeWidth={2} dot={{r:3}}/></LineChart></ResponsiveContainer></div>
    </div>}

    {/* ===== CILJI ===== */}
    {vw==="goals"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <h2 style={{fontSize:20,fontWeight:700,margin:0}}>Proračunski cilji</h2>
        <div style={{display:"flex",gap:6}}><button style={sB(goalView==="general")} onClick={()=>setGoalView("general")}>Splošni cilji</button><button style={sB(goalView==="monthly")} onClick={()=>setGoalView("monthly")}>Mesečni cilji</button><button style={{...sB(true),background:C.gn}} onClick={()=>setShowNG(!showNG)}>+ Nov cilj</button></div>
      </div>
      {goalView==="monthly"&&<div style={{marginBottom:10}}><span style={{fontSize:11,color:C.mt}}>Mesec: </span><select style={{...sS,height:26,fontSize:11,width:120}} value={goalMonth} onChange={e=>setGoalMonth(parseInt(e.target.value))}>{MF.map((m,i)=><option key={i} value={i}>{m}</option>)}</select></div>}
      {showNG&&<AddGoal onAdd={g=>{setGoals(p=>[...p,{id:Date.now(),...g}]);setShowNG(false)}} onCancel={()=>setShowNG(false)}/>}
      {goals.filter(g=>goalView==="general"?(g.scope!=="monthly"):(g.scope==="monthly"&&g.month===goalMonth)).map(g=>{const getAutoPullValue=()=>{if(!g.autoPull||!g.source)return g.current||0;let total=0;const sub=AS.find(s=>s.id===g.source);if(!sub)return g.current||0;if(g.pullFromMonth==="all"){for(let i=0;i<12;i++){const md2=yd[i]||initM();if(md2.closed)total+=md2.subs?.[g.source]?.actual||0}}else if(g.pullFromMonth==="current"){total=md.subs?.[g.source]?.actual||0}else{const mi=parseInt(g.pullFromMonth);const md2=yd[mi]||initM();total=md2.subs?.[g.source]?.actual||0}return total};const currentVal=getAutoPullValue();const p=g.target>0?pc(currentVal,g.target):0;return<div key={g.id} style={sC}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <span style={{fontSize:16,fontWeight:700}}>{g.name}</span>
          <div style={{display:"flex",gap:4,alignItems:"center"}}><span style={sT(g.type==="saving"?"#dbeafe":"#fef3c7",g.type==="saving"?C.bl:"#92400e")}>{g.type}</span>{g.month!=null&&<span style={sT("#f0f7ff",C.bl)}>{MF[g.month]}</span>}{g.autoPull&&<span style={sT("#dcfce7","#166534")}>🔗</span>}<button onClick={()=>setGoals(prev=>prev.filter(x=>x.id!==g.id))} style={{fontSize:10,color:C.rd,background:"none",border:"none",cursor:"pointer"}}>✕</button></div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
          <span style={{fontSize:13,color:C.mt}}>Trenutno:</span>
          {g.autoPull?<span style={{fontSize:13,fontWeight:600,width:90,color:C.bl}}>{fmt(currentVal)}</span>:<input style={{...sI,width:90,height:30,fontSize:13,fontWeight:600}} defaultValue={g.current||0} onBlur={e=>setGoals(prev=>prev.map(x=>x.id===g.id?{...x,current:parseFloat(e.target.value)||0}:x))}/>}
          <span style={{fontSize:16,fontWeight:700}}>/ {fmt(g.target)}</span>
          {g.source&&<span style={{fontSize:10,color:C.bl}}>← {AS.find(s=>s.id===g.source)?.nm||g.source}</span>}
        </div>
        <div style={{height:6,borderRadius:3,background:"#eee",overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(p,100)}%`,borderRadius:3,background:p>90&&g.type==="limit"?C.rd:C.bl}}/></div>
        <div style={{fontSize:11,color:C.mt,marginTop:4}}>{p}% {g.note&&`— ${g.note}`}</div>
      </div>})}
      {goals.filter(g=>goalView==="general"?(g.scope!=="monthly"):(g.scope==="monthly"&&g.month===goalMonth)).length===0&&<div style={{fontSize:12,color:C.mt,textAlign:"center",padding:20}}>Ni ciljev za ta pogled. Dodaj novega z gumbom zgoraj.</div>}
    </div>}

    {/* ===== SIMULACIJA ===== */}
    {vw==="sim"&&<div>
      <h2 style={{fontSize:20,fontWeight:700,margin:"0 0 8px"}}>Finančna simulacija</h2>
      {/* Time period selector - MOVED TO TOP */}
      <div style={sC}><div style={{fontSize:13,fontWeight:600,color:C.sb,marginBottom:8}}>Časovni okvir</div><div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}><span style={{fontSize:11,color:C.mt}}>Od:</span><input type="date" style={{...sI,width:130}} value={simFrom} onChange={e=>setSimFrom(e.target.value)}/><span style={{fontSize:11,color:C.mt}}>Do:</span><input type="date" style={{...sI,width:130}} value={simTo} onChange={e=>setSimTo(e.target.value)}/></div><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{[["1 leto","2027-04-30"],["3 leta","2029-04-30"],["5 let","2031-04-30"],["10 let","2036-04-30"]].map(([l,d])=><button key={l} style={sB(simTo===d)} onClick={()=>setSimTo(d)}>{l}</button>)}</div></div>

      {/* Big headline numbers */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
        <div style={{...sM,textAlign:"center"}}><div style={{fontSize:10,color:C.mt,textTransform:"uppercase"}}>Prihodki ({simData.length>0?simData[simData.length-1].name:""})</div><div style={{fontSize:28,fontWeight:800,color:C.gn}}>{simData.length>0?fmt(simData[simData.length-1].Prihodki):"—"}</div></div>
        <div style={{...sM,textAlign:"center"}}><div style={{fontSize:10,color:C.mt,textTransform:"uppercase"}}>Odhodki ({simData.length>0?simData[simData.length-1].name:""})</div><div style={{fontSize:28,fontWeight:800,color:C.rd}}>{simData.length>0?fmt(simData[simData.length-1].Odhodki):"—"}</div></div>
        <div style={{...sM,textAlign:"center"}}><div style={{fontSize:10,color:C.mt,textTransform:"uppercase"}}>Kumulativni prihranki</div><div style={{fontSize:28,fontWeight:800,color:C.bl}}>{simData.length>0?fmt(simData[simData.length-1].Prihranki):"—"}</div></div>
      </div>
      {/* Data source info */}
      <div style={{...sC,background:"#f9fafb",fontSize:11,color:C.mt}}>
        <strong>Podatki za simulacijo:</strong> {Object.values(yd).filter(m=>m.closed).length} zaključenih mesecev (dejanski podatki) + {12-Object.values(yd).filter(m=>m.closed).length} odprtih (ocena). Povprečni mesečni prihodek: {fmt(tInc||3600)}, povprečni odhodek: {fmt(tAc||3100)}.
      </div>

      {/* Manual overrides */}
      <div style={sC}><div style={{fontSize:13,fontWeight:600,color:C.sb,marginBottom:8}}>Ročni vnos podatkov <span style={sT("#fef3c7","#92400e")}>prevlada nad avtomatskimi</span></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          <div><div style={{fontSize:10,color:C.mt,marginBottom:2}}>Mesečni prihodki (€)</div><input type="number" style={{...sI,width:"100%"}} defaultValue={simManual.income??""} onBlur={e=>setSimManual(p=>({...p,income:e.target.value?parseFloat(e.target.value):null}))} placeholder={`Avto: ${fN(tInc||3600)}`}/></div>
          <div><div style={{fontSize:10,color:C.mt,marginBottom:2}}>Mesečni odhodki (€)</div><input type="number" style={{...sI,width:"100%"}} defaultValue={simManual.expense??""} onBlur={e=>setSimManual(p=>({...p,expense:e.target.value?parseFloat(e.target.value):null}))} placeholder={`Avto: ${fN(tAc||3100)}`}/></div>
          <div><div style={{fontSize:10,color:C.mt,marginBottom:2}}>Mesečno varčevanje (€)</div><input type="number" style={{...sI,width:"100%"}} defaultValue={simManual.savings??""} onBlur={e=>setSimManual(p=>({...p,savings:e.target.value?parseFloat(e.target.value):null}))} placeholder="Avto: 500"/></div>
        </div>
        <div style={{fontSize:10,color:C.mt,marginTop:4}}>Pusti prazno za avtomatski izračun iz zaključenih mesecev.</div>
      </div>

      {/* Category selector for simulation */}
      <div style={sC}><div style={{fontSize:13,fontWeight:600,color:C.sb,marginBottom:8}}>Kategorije vključene v simulacijo</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4}}>
          {CATS.map(cat=><label key={cat.id} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,padding:"2px 0",cursor:"pointer"}}>
            <input type="checkbox" checked={simCats.includes(cat.id)} onChange={e=>{if(e.target.checked)setSimCats(s=>[...s,cat.id]);else setSimCats(s=>s.filter(x=>x!==cat.id))}}/>
            {cat.nm.substring(0,20)}
          </label>)}
        </div>
        <div style={{display:"flex",gap:6,marginTop:6}}><button style={{...sB(false),fontSize:10,height:24}} onClick={()=>setSimCats(CATS.map(c=>c.id))}>Izberi vse</button><button style={{...sB(false),fontSize:10,height:24}} onClick={()=>setSimCats([])}>Počisti</button></div>
      </div>

      <div style={sC}><div style={{fontSize:13,fontWeight:600,color:C.sb,marginBottom:8}}>Predpostavke</div><PSlider label="Rast plač (%/leto)" value={simG} onChange={setSimG} min={-15} max={15} unit="%"/><PSlider label="Inflacija (%/leto)" value={simI} onChange={setSimI} min={-10} max={10} unit="%"/><PSlider label="Rast str. vrtca (%)" value={simC} onChange={setSimC} min={-10} max={15} unit="%"/><PSlider label="Dod. naložbe/mesec" value={simE} onChange={setSimE} min={-500} max={500} step={10} unit="€"/></div>
      <div style={sC}><div style={{fontSize:13,fontWeight:600,color:C.sb,marginBottom:8}}>Scenariji</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}><button style={sB(false)} onClick={()=>setSimSc(s=>[...s,{type:"mortgage",year:2027,amount:800}])}>+ Hipoteka 2027</button><button style={sB(false)} onClick={()=>setSimSc(s=>[...s,{type:"raise",year:2027,pct:10}])}>+ Povišica 10%</button><button style={sB(false)} onClick={()=>setSimSc(s=>[...s,{type:"jobLoss",year:2028}])}>+ Izguba službe</button><button style={sB(false)} onClick={()=>setSimSc(s=>[...s,{type:"move",year:2027,amount:-200}])}>+ Cenejše stanovanje</button>{simSc.length>0&&<button style={{...sB(false),color:C.rd,borderColor:C.rd}} onClick={()=>setSimSc([])}>Počisti</button>}</div>{simSc.length>0&&<div style={{marginTop:6,fontSize:10,color:C.bl}}>Aktivni: {simSc.map(s=>s.type).join(", ")}</div>}</div>
      {simData.length>0&&<div style={{...sC,background:simData.some(d=>d.Razlika<0)?"#fef2f2":"#f0fdf4",border:`1px solid ${simData.some(d=>d.Razlika<0)?"#fecaca":"#bbf7d0"}`}}><div style={{fontSize:12,fontWeight:600,color:C.sb,marginBottom:6}}>Finančno zdravje</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>{simData.slice(-1).map((d,i)=><div key={i}><div style={{fontSize:10,color:C.mt}}>Letni tok gotovine</div><div style={{fontSize:18,fontWeight:700,color:d.Razlika>=0?C.gn:C.rd}}>{d.Razlika>=0?"+":""}{fmt(d.Razlika)}</div></div>)}<div><div style={{fontSize:10,color:C.mt}}>Status</div><div style={{fontSize:13,fontWeight:600,color:simData.some(d=>d.Razlika<-5000)?C.rd:simData.some(d=>d.Razlika<0)?"#f59e0b":C.gn}}>{simData.some(d=>d.Razlika<-5000)?"🔴 Precejšnji deficit":simData.some(d=>d.Razlika<0)?"🟡 Primanjkljaj":"🟢 Stabilno"}</div></div><div><div style={{fontSize:10,color:C.mt}}>Letnih mesecev v deficitu</div><div style={{fontSize:13,fontWeight:600}}>{simData.filter(d=>d.Razlika<0).length} od {simData.length}</div></div></div></div>}
      <div style={sC}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:13,fontWeight:600,color:C.sb}}>Projekcija</span><div style={{display:"flex",gap:4}}>{["bar","line","area","cash"].map(v=><button key={v} style={{...sB(simViz===v),fontSize:10,height:24,padding:"0 8px"}} onClick={()=>setSimViz(v)}>{v==="bar"?"Stolpci":v==="line"?"Črtni":v==="area"?"Površinski":"Tok gotovine"}</button>)}</div></div>
        <ResponsiveContainer width="100%" height={220}>
          {simViz==="bar"?<BarChart data={simData} barGap={2}><XAxis dataKey="name" tick={{fontSize:10}} axisLine={false}/><YAxis tick={{fontSize:9}} axisLine={false} tickFormatter={v=>`€${Math.round(v/1000)}k`}/><Tooltip formatter={v=>fmt(v)} contentStyle={{fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="Prihodki" fill={C.gn} radius={[3,3,0,0]} barSize={14}/><Bar dataKey="Odhodki" fill={C.rd} radius={[3,3,0,0]} barSize={14} opacity={0.6}/><Bar dataKey="Prihranki" fill={C.bl} radius={[3,3,0,0]} barSize={14} opacity={0.8}/></BarChart>
          :simViz==="line"?<LineChart data={simData}><XAxis dataKey="name" tick={{fontSize:10}} axisLine={false}/><YAxis tick={{fontSize:9}} axisLine={false} tickFormatter={v=>`€${Math.round(v/1000)}k`}/><Tooltip formatter={v=>fmt(v)} contentStyle={{fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Line type="monotone" dataKey="Prihodki" stroke={C.gn} strokeWidth={2} dot={{r:4}}/><Line type="monotone" dataKey="Odhodki" stroke={C.rd} strokeWidth={2} dot={{r:4}}/><Line type="monotone" dataKey="Prihranki" stroke={C.bl} strokeWidth={2} dot={{r:4}}/></LineChart>
          :simViz==="area"?<AreaChart data={simData}><XAxis dataKey="name" tick={{fontSize:10}} axisLine={false}/><YAxis tick={{fontSize:9}} axisLine={false} tickFormatter={v=>`€${Math.round(v/1000)}k`}/><Tooltip formatter={v=>fmt(v)} contentStyle={{fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Area type="monotone" dataKey="Prihodki" fill={C.gn} stroke={C.gn} fillOpacity={0.3}/><Area type="monotone" dataKey="Odhodki" fill={C.rd} stroke={C.rd} fillOpacity={0.3}/><Area type="monotone" dataKey="Prihranki" fill={C.bl} stroke={C.bl} fillOpacity={0.3}/></AreaChart>
          :<BarChart data={simData} barGap={2}><XAxis dataKey="name" tick={{fontSize:10}} axisLine={false}/><YAxis tick={{fontSize:9}} axisLine={false} tickFormatter={v=>`€${Math.round(v/1000)}k`}/><Tooltip formatter={v=>fmt(v)} contentStyle={{fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="Razlika" fill={d=>d.Razlika>=0?C.gn:C.rd} radius={[3,3,0,0]} barSize={14}/></BarChart>}
        </ResponsiveContainer>
      </div>
    </div>}

    {/* ===== % RAZDELITEV ===== */}
    {vw==="pct"&&<div>
      <h2 style={{fontSize:20,fontWeight:700,margin:"0 0 4px"}}>% razdelitev</h2>
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
        <span style={{fontSize:12,color:C.mt}}>Mesečni proračun:</span>
        <input type="number" style={{...sI,width:120,height:34,fontSize:15,fontWeight:700}} value={manualBudget} onChange={e=>setManualBudget(parseInt(e.target.value)||0)}/><span style={{fontSize:13,fontWeight:600}}>€</span>
        <button onClick={syncPctToPlan} style={{...sB(true),background:C.gn,fontSize:11}}>Sinhroniziraj → mesečni vnos</button>
      </div>
      <div style={sC}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 50px 100px 60px 30px 60px 30px 80px",gap:8,fontSize:10,color:C.mt,fontWeight:600,padding:"0 0 6px",borderBottom:"1px solid #eee",alignItems:"center"}}>
          <span>Postavka</span><span>Način</span><span>Nastavi</span><span>%</span><span></span><span>€</span><span></span><span style={{textAlign:"right"}}>Cilj</span>
        </div>
        {[{tp:"fixed",nm:"Fiksni stroški"},{tp:"var",nm:"Variabilni stroški"}].map(type=><div key={type.tp}><div style={{fontSize:13,fontWeight:700,color:C.tx,padding:"8px 0 4px",marginTop:6}}>{type.nm}</div>{CATS.filter(c=>c.tp===type.tp).map(cat=><div key={cat.id}><div style={{fontSize:12,fontWeight:600,color:C.tx,padding:"4px 0 2px",marginTop:4}}>{cat.nm}</div>{cat.subs.filter(sub=>subVis[sub.id]!==true).map(sub=>{const mode=pMd[sub.id]||"fixed";const pV=bPct[sub.id]||0;const fV=pFx[sub.id]||0;const base=manualBudget;const target=mode==="pct"?Math.round(base*pV/100):fV;const pctOfBudget=base>0?pc(target,base):0;const euroFromPct=Math.round(base*pV/100);
        return<div key={sub.id} style={{display:"grid",gridTemplateColumns:"1fr 50px 100px 60px 30px 60px 30px 80px",gap:8,padding:"6px 0",borderBottom:`1px solid ${C.fn}`,fontSize:11,alignItems:"center",paddingLeft:16}}>
          <span style={{fontSize:10,color:"#666"}}>{sub.nm}</span>
          <select style={{...sS,width:46,height:28,fontSize:10}} value={mode} onChange={e=>setPMd(p=>({...p,[sub.id]:e.target.value}))}><option value="pct">%</option><option value="fixed">€</option></select>
          {mode==="pct"?<input type="range" min={0} max={50} value={pV} onChange={e=>setBPct(p=>({...p,[sub.id]:parseInt(e.target.value)}))} style={{flex:1}}/>
          :<div style={{flex:1,height:4,borderRadius:2,background:"#eee",overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(pctOfBudget,100)}%`,borderRadius:2,background:C.bl}}/></div>}
          <input type="number" min={0} max={100} value={mode==="pct"?pV:pctOfBudget} onChange={e=>{if(mode==="pct")setBPct(p=>({...p,[sub.id]:parseInt(e.target.value)||0}));else{const newPct=parseInt(e.target.value)||0;setPFx(p=>({...p,[sub.id]:Math.round(base*newPct/100)}))}}} style={{...sI,width:65,height:28,fontSize:12,textAlign:"right",fontWeight:600}}/>
          <span style={{fontSize:11,color:C.mt}}>%</span>
          <input type="number" value={mode==="pct"?euroFromPct:fV} onChange={e=>{if(mode==="fixed")setPFx(p=>({...p,[sub.id]:parseInt(e.target.value)||0}));else{const euro=parseInt(e.target.value)||0;setBPct(p=>({...p,[sub.id]:base>0?Math.round(euro/base*100):0}))}}} style={{...sI,width:65,height:28,fontSize:12,textAlign:"right",fontWeight:600}}/>
          <span style={{fontSize:11,color:C.mt}}>€</span>
          <span style={{textAlign:"right",fontWeight:600,fontSize:12,color:C.tx}}>{fmt(target)}</span>
        </div>})}</div>)}</div>)}
        <div style={{fontSize:13,fontWeight:700,color:C.tx,padding:"8px 0 4px",marginTop:8}}>Nepredvideni stroški</div>
        <div style={{fontSize:12,fontWeight:600,color:C.tx,padding:"4px 0 2px",marginTop:4}}>Mesečne nepredvidene postavke</div>
        <AddUX onAdd={(d,a,p)=>{setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[yr])n[yr]=initY();if(!n[yr][mo])n[yr][mo]=initM();n[yr][mo].unexpectedItems.push({desc:d,amount:parseFloat(a)||0,person:p});return n})}} kuList={kuList}/>
        {(md.unexpectedItems||[]).map((it,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"160px 50px 1fr 70px 30px 70px 30px 90px",gap:6,padding:"6px 0",borderBottom:`1px solid ${C.fn}`,fontSize:11,alignItems:"center",paddingLeft:16}}><span style={{fontSize:9,color:"#666"}}>{it.desc}</span><span style={{fontSize:9,color:"#999"}}>/{it.person}</span><div/><span/><span/><span style={{textAlign:"right",fontWeight:600}}>{fmt(it.amount)}</span><button type="button" onClick={()=>setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(n[yr]&&n[yr][mo])n[yr][mo].unexpectedItems=n[yr][mo].unexpectedItems.filter((_,j)=>j!==i);return n})} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:10}}>✕</button></div>)}
        <div style={{marginTop:10,padding:"8px 0 0",borderTop:`2px solid ${C.bd}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:15,fontWeight:700}}>Skupaj: {fmt(AS.reduce((s,sub)=>{const m=pMd[sub.id]||"pct";return s+(m==="pct"?Math.round(manualBudget*(bPct[sub.id]||0)/100):(pFx[sub.id]||0))},0)+(md.unexpectedItems||[]).reduce((s,it)=>s+it.amount,0))}</span>
          <span style={{fontSize:13,color:C.mt}}>od {fmt(manualBudget)}</span>
        </div>
      </div>
    </div>}

    {/* ===== VARČEVANJE (Savings Tracker) ===== */}
    {vw==="varsav"&&<div>
      {!savUnlocked?<div style={{...sC,display:"flex",flexDirection:"column",alignItems:"center",padding:"3rem",textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>🏦</div><div style={{fontSize:16,fontWeight:700,marginBottom:12}}>Varčevanje</div><div style={{fontSize:12,color:C.mt,marginBottom:12}}>Zaščiteno z geslom. Nastavi ga v Nastavitvah.</div><div style={{display:"flex",gap:6}}><input type="password" style={{...sI,width:160}} value={savPwd} onChange={e=>setSavPwd(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){const s=ld('dp_savpwd','');if(!s||savPwd===s)setSavUnlocked(true)}}} placeholder="Geslo"/><button style={sB(true)} onClick={()=>{const s=ld('dp_savpwd','');if(!s||savPwd===s)setSavUnlocked(true)}}>Odkleni</button></div></div>
      :<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h2 style={{fontSize:20,fontWeight:700,margin:0}}>Varčevanje — družinski prihranki</h2><button style={{...sB(false),fontSize:10}} onClick={()=>{setSavUnlocked(false);setSavPwd('')}}>Zakleni 🔒</button></div>
        {/* Total */}
        <div style={{...sM,textAlign:"center",marginBottom:14}}><div style={{fontSize:10,color:C.mt,textTransform:"uppercase"}}>Skupni prihranki</div><div style={{fontSize:28,fontWeight:800,color:C.gn}}>{fmt(savData.members.reduce((s,m)=>s+m.sources.reduce((ss,src)=>ss+(src.amount||0),0),0))}</div></div>
        {/* Members */}
        {savData.members.map((member,mi)=><div key={mi} style={sC}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <input style={{...sI,fontSize:14,fontWeight:600,width:150}} defaultValue={member.name} onBlur={e=>{const n={...savData,members:[...savData.members]};n.members[mi]={...n.members[mi],name:e.target.value};setSavData(n)}}/>
            <div style={{fontSize:16,fontWeight:700,color:C.gn}}>{fmt(member.sources.reduce((s,src)=>s+(src.amount||0),0))}</div>
          </div>
          {member.sources.map((src,si)=><div key={si} style={{display:"flex",gap:6,alignItems:"center",padding:"3px 0",borderBottom:`1px solid ${C.fn}`,fontSize:11}}>
            <input style={{...sI,flex:1,height:26,fontSize:11}} defaultValue={src.name} onBlur={e=>{const n={...savData,members:[...savData.members]};n.members[mi]={...n.members[mi],sources:[...n.members[mi].sources]};n.members[mi].sources[si]={...n.members[mi].sources[si],name:e.target.value};setSavData(n)}} placeholder="Vir"/>
            <input type="number" style={{...sI,width:80,height:26,fontSize:11,textAlign:"right"}} defaultValue={src.amount} onBlur={e=>{const n={...savData,members:[...savData.members]};n.members[mi]={...n.members[mi],sources:[...n.members[mi].sources]};n.members[mi].sources[si]={...n.members[mi].sources[si],amount:parseFloat(e.target.value)||0};setSavData(n)}} placeholder="€"/>
            <button onClick={()=>{const n={...savData,members:[...savData.members]};n.members[mi]={...n.members[mi],sources:n.members[mi].sources.filter((_,i)=>i!==si)};setSavData(n)}} style={{fontSize:9,color:C.rd,background:"none",border:"none",cursor:"pointer"}}>✕</button>
          </div>)}
          <button style={{...sB(false),fontSize:10,marginTop:6}} onClick={()=>{const n={...savData,members:[...savData.members]};n.members[mi]={...n.members[mi],sources:[...n.members[mi].sources,{name:"",amount:0}]};setSavData(n)}}>+ Dodaj vir</button>
        </div>)}
        <button style={{...sB(true),marginTop:8}} onClick={()=>setSavData(d=>({...d,members:[...d.members,{name:"Nov član",sources:[{name:"",amount:0}]}]}))}>+ Dodaj člana</button>
      </div>}
    </div>}

    {/* ===== NASTAVITVE ===== */}
    {vw==="settings"&&<div>
      <h2 style={{fontSize:20,fontWeight:700,margin:"0 0 12px"}}>Nastavitve</h2>
      <div style={sC}><div style={{fontSize:13,fontWeight:600,marginBottom:6}}>Uporabnik</div><div style={{fontSize:12}}>Prijavljen: <strong>{curUser}</strong> <span style={sT(isSA?"#dbeafe":"#dcfce7",isSA?C.bl:"#166534")}>{curRole}</span></div></div>
      {isSA&&<div style={sC}><div style={{fontSize:13,fontWeight:600,marginBottom:6}}>Spremeni geslo (superadmin)</div><div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}><span style={{fontSize:11,minWidth:80}}>Uporabnik:</span><select style={{...sS,width:120}} id="chgPwdUser">{JSON.parse(localStorage.getItem('dp_accounts')||'[]').map(a=><option key={a.username}>{a.username}</option>)}</select></div><input style={{...sI,width:"100%",marginBottom:6}} type="password" value={sNP} onChange={e=>setSNP(e.target.value)} placeholder="Novo geslo (≥ 6)"/><input style={{...sI,width:"100%",marginBottom:6}} type="password" value={sNP2} onChange={e=>setSNP2(e.target.value)} placeholder="Ponovi"/><button style={sB(true)} onClick={()=>{const user=document.getElementById('chgPwdUser')?.value;if(user)doChgPwd(user,sNP)}}>Spremeni</button></div>}
      {isSA&&<CreateUserForm onAdd={async(u,p,e)=>{const accs=JSON.parse(localStorage.getItem('dp_accounts')||'[]');if(accs.find(a=>a.username===u)){setSMsg('Uporabnik že obstaja!');return}const salt=Array.from(crypto.getRandomValues(new Uint8Array(16))).join('');const h=await hPwd(p,salt);accs.push({username:u,hash:h,salt,role:'admin',email:e});localStorage.setItem('dp_accounts',JSON.stringify(accs));setAdminConf(prev=>({...prev,[u]:{varsav:false,crypto:false,settings:false}}));setSMsg(`Uporabnik ${u} ustvarjen!`)}}/>}
      {isSA&&(()=>{const reqs=ld('dp_resetreqs',[]);return reqs.length>0?<div style={{...sC,border:"1px solid #fde68a",background:"#fefce8"}}><div style={{fontSize:13,fontWeight:600,marginBottom:6}}>Zahteve za ponastavitev gesla</div>{reqs.map((r,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:`1px solid ${C.fn}`}}><span style={{fontSize:12}}>{r.email} — {r.date}</span><div style={{display:"flex",gap:4}}><button style={{...sB(true),height:24,fontSize:10}} onClick={()=>{const accs=JSON.parse(localStorage.getItem('dp_accounts')||'[]');const acc=accs.find(a=>a.email===r.email);if(acc){const newPwd=prompt(`Novo geslo za ${acc.username}:`);if(newPwd)doChgPwd(acc.username,newPwd)}const updated=reqs.filter((_,j)=>j!==i);sv('dp_resetreqs',updated);setSMsg('Geslo ponastavljeno.')}}>Ponastavi</button><button style={{...sB(false),height:24,fontSize:10,color:C.rd}} onClick={()=>{const updated=reqs.filter((_,j)=>j!==i);sv('dp_resetreqs',updated)}}>Zavrni</button></div></div>)}</div>:null})()}
      {isSA&&<div style={sC}><div style={{fontSize:13,fontWeight:600,marginBottom:6}}>Aktivni uporabniki</div>{JSON.parse(localStorage.getItem('dp_accounts')||'[]').map((a,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:`1px solid ${C.fn}`,fontSize:12}}><span><strong>{a.username}</strong> <span style={sT(a.role==='superadmin'?"#dbeafe":"#dcfce7",a.role==='superadmin'?C.bl:"#166534")}>{a.role}</span></span><span style={{color:C.mt}}>{a.email||"brez emaila"}</span></div>)}</div>}
      {isSA&&<div style={sC}><div style={{fontSize:13,fontWeight:600,marginBottom:6}}>Gesla za zaklenjene sekcije</div><div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}><span style={{fontSize:11,minWidth:80}}>Kripto:</span><input style={{...sI,flex:1}} type="password" value={sCP} onChange={e=>setSCP(e.target.value)} placeholder="Geslo za kripto"/><button style={sB(true)} onClick={()=>{sv('dp_cpwd',sCP);setSMsg('Kripto geslo nastavljeno!');setSCP('')}}>Nastavi</button></div><div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{fontSize:11,minWidth:80}}>Varčevanje:</span><input style={{...sI,flex:1}} type="password" id="savPwdSet" placeholder="Geslo za varčevanje"/><button style={sB(true)} onClick={()=>{sv('dp_savpwd',document.getElementById('savPwdSet')?.value||'');setSMsg('Varčevanje geslo nastavljeno!')}}>Nastavi</button></div></div>}
      {isSA&&<div style={sC}><div style={{fontSize:13,fontWeight:600,marginBottom:6}}>Vidnost kategorij za admin uporabnike</div><div style={{fontSize:11,color:C.mt,marginBottom:8}}>Izberi katere kategorije bodo vidne admin uporabnikom (ne-superadmin). Superadmin vidi vedno vse.</div><div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:4}}>{CATS.map(cat=><label key={cat.id} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,padding:"3px 0",cursor:"pointer"}}><input type="checkbox" checked={adminViews.includes(cat.id)} onChange={e=>{if(e.target.checked)setAdminViews(v=>[...v,cat.id]);else setAdminViews(v=>v.filter(x=>x!==cat.id))}}/>{cat.nm}</label>)}</div><div style={{display:"flex",gap:6,marginTop:8}}><button style={{...sB(false),fontSize:10,height:24}} onClick={()=>setAdminViews(CATS.map(c=>c.id))}>Izberi vse</button><button style={{...sB(false),fontSize:10,height:24}} onClick={()=>setAdminViews([])}>Počisti</button></div></div>}
      <div style={sC}><div style={{fontSize:13,fontWeight:600,marginBottom:6}}>Vrste prihodkov (Dropdown)</div><div style={{fontSize:11,color:C.mt,marginBottom:8}}>Dodaj ali odstrani vrste prihodkov</div><div style={{marginBottom:8}}>{itList.map((item,i)=><div key={i} style={{display:"flex",gap:6,alignItems:"center",padding:"4px 0",fontSize:11}}><input style={{...sI,flex:1,height:26}} value={item} onChange={e=>{const n=[...itList];n[i]=e.target.value;setItList(n)}}/><button type="button" onClick={()=>setItList(itList.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:10}}>✕</button></div>)}<button type="button" style={{...sB(false),fontSize:10,marginTop:4}} onClick={()=>setItList([...itList,'Nova vrsta'])}>+ Dodaj</button></div></div>
      <div style={sC}><div style={{fontSize:13,fontWeight:600,marginBottom:6}}>Nepredvideni stroški - Trgovine/Viri (Dropdown)</div><div style={{fontSize:11,color:C.mt,marginBottom:8}}>Dodaj ali odstrani trgovine in vire za nepredvidene stroške</div><div style={{marginBottom:8,maxHeight:200,overflowY:"auto"}}>{kuList.map((item,i)=><div key={i} style={{display:"flex",gap:6,alignItems:"center",padding:"4px 0",fontSize:11}}><input style={{...sI,flex:1,height:26}} value={item} onChange={e=>{const n=[...kuList];n[i]=e.target.value;setKuList(n)}}/><button type="button" onClick={()=>setKuList(kuList.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:10}}>✕</button></div>)}<button type="button" style={{...sB(false),fontSize:10,marginTop:4}} onClick={()=>setKuList([...kuList,'Nova trgovina'])}>+ Dodaj</button></div></div>
      <div style={sC}><div style={{fontSize:13,fontWeight:600,marginBottom:6}}>Podatki in varnostne kopije</div>
        <div style={{fontSize:11,color:C.mt,marginBottom:8}}>Priporočamo varnostno kopijo vsaj vsaka 2 tedna. Zadnja kopija: {localStorage.getItem('dp_lastbackup')?new Date(parseInt(localStorage.getItem('dp_lastbackup'))).toLocaleDateString("sl-SI"):"nikoli"}</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
          <button style={{...sB(true),background:"#d97706"}} onClick={()=>{createBackup();localStorage.setItem('dp_lastbackup',String(Date.now()));setSMsg('Varnostna kopija prenesena!')}}>Varnostna kopija (JSON)</button>
          <button style={sB(false)} onClick={doExport}>Izvoz Excel</button>
          <label style={{...sB(false),display:"flex",alignItems:"center",cursor:"pointer"}}><span>Obnovi iz kopije</span><input type="file" accept=".json" style={{display:"none"}} onChange={async e=>{const f=e.target.files?.[0];if(!f)return;try{const msg=await restoreBackup(f);setSMsg(msg+' Stran se bo osvežila.');setTimeout(()=>window.location.reload(),2000)}catch(err){setSMsg('Napaka: '+err)}}}/></label>
        </div>
        <button style={{...sB(false),color:C.rd,borderColor:C.rd}} onClick={()=>{if(confirm('Izbriši vse podatke? To je nepovratno!')){localStorage.clear();sessionStorage.clear();window.location.reload()}}}>Izbriši vse podatke</button>
      </div>
      {sMsg&&<div style={{fontSize:12,color:C.gn,marginTop:8}}>{sMsg}</div>}
    </div>}

    {/* ===== CRYPTO ===== */}
    {vw==="crypto"&&<div>
      {isSA&&<div>
        <h2 style={{fontSize:20,fontWeight:700,margin:"0 0 16px"}}>👮 Admin Kontrola</h2>
        <div style={sC}>
          <div style={{fontSize:12,fontWeight:600,color:C.sb,marginBottom:8}}>Vidljivost funkcij po administratorjih</div>
          <div style={{fontSize:11,color:C.mt,marginBottom:10}}>Izberi katere sekcije so vidne vsakemu administratorju. Superadmin vidi vedno vse.</div>
          {JSON.parse(localStorage.getItem('dp_accounts')||'[]').filter(a=>a.role==='admin').map(admin=>
            <div key={admin.username} style={{...sM,marginBottom:8}}>
              <div style={{fontWeight:600,color:C.tx,marginBottom:6}}>{admin.username}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {["varsav","settings","crypto"].map(feat=>
                  <label key={feat} style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer",fontSize:10}}>
                    <input type="checkbox" checked={adminConf[admin.username]?.[feat]!==false} onChange={e=>{setAdminConf(prev=>({...prev,[admin.username]:{...prev[admin.username],[feat]:e.target.checked}}));logAudit("Admin permission",`${admin.username} ${feat}: ${e.target.checked?"visible":"hidden"}`)}}/>
                    <span>{feat==="varsav"?"Varčevanje":feat==="settings"?"Nastavitve":"Kripto"}</span>
                  </label>
                )}
              </div>
            </div>
          )}
        </div>
        <div style={sC}>
          <div style={{fontSize:12,fontWeight:600,color:C.sb,marginBottom:8}}>Dnevnik aktivnosti ({auditLog.length} vnosov)</div>
          <div style={{maxHeight:250,overflowY:"auto",fontSize:9,color:"#666"}}>
            {auditLog.slice(0,50).map((e,i)=>
              <div key={i} style={{padding:"4px 0",borderBottom:"1px solid #eee"}}>
                <span style={{fontWeight:500}}>{e.timestamp}</span> | <span style={{color:C.bl}}>{e.user}</span> | {e.action}: {e.details}
              </div>
            )}
          </div>
        </div>
      </div>}
      {!cryU&&!isSA?<div style={{...sC,display:"flex",flexDirection:"column",alignItems:"center",padding:"3rem",textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>🔒</div><div style={{fontSize:16,fontWeight:700,marginBottom:12}}>Kripto sekcija</div><div style={{display:"flex",gap:6}}><input type="password" style={{...sI,width:160}} value={cryP} onChange={e=>setCryP(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){const s=ld('dp_cpwd','');if(!s||cryP===s)setCryU(true)}}} placeholder="Geslo"/><button style={sB(true)} onClick={()=>{const s=ld('dp_cpwd','');if(!s||cryP===s)setCryU(true)}}>Odkleni</button></div></div>:<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h2 style={{fontSize:20,fontWeight:700,margin:0}}>Kripto</h2><button style={{...sB(false),fontSize:10}} onClick={()=>{setCryU(false);setCryP("")}}>🔒</button></div>
        <div style={sC}><table style={{width:"100%",fontSize:12,borderCollapse:"collapse"}}><thead><tr style={{color:C.mt}}><th style={{textAlign:"left",padding:6}}>Kovanec</th><th style={{textAlign:"right",padding:6}}>Količina</th><th style={{textAlign:"right",padding:6}}>Cena</th><th style={{textAlign:"right",padding:6}}>Vrednost</th></tr></thead><tbody>{cryH.map((h,i)=><tr key={i} style={{borderBottom:`1px solid ${C.fn}`}}><td style={{padding:6}}><input style={{...sI,width:55,fontWeight:600}} defaultValue={h.coin} onBlur={e=>{const n=[...cryH];n[i]={...n[i],coin:e.target.value};setCryH(n)}}/></td><td style={{textAlign:"right",padding:6}}><input type="number" step="0.01" style={{...sI,width:75,textAlign:"right"}} defaultValue={h.amount} onBlur={e=>{const n=[...cryH];n[i]={...n[i],amount:parseFloat(e.target.value)||0};setCryH(n)}}/></td><td style={{textAlign:"right",padding:6}}><input type="number" style={{...sI,width:75,textAlign:"right"}} defaultValue={h.avgPrice} onBlur={e=>{const n=[...cryH];n[i]={...n[i],avgPrice:parseFloat(e.target.value)||0};setCryH(n)}}/></td><td style={{textAlign:"right",padding:6,fontWeight:600}}>{fmt(Math.round(h.amount*h.avgPrice))}</td></tr>)}</tbody></table><button style={{...sB(false),marginTop:8,fontSize:10}} onClick={()=>setCryH(h=>[...h,{coin:"",amount:0,avgPrice:0}])}>+ Dodaj</button></div>
        <div style={sM}><div style={{fontSize:10,color:C.mt,textTransform:"uppercase"}}>Skupaj</div><div style={{fontSize:22,fontWeight:700,color:C.pu}}>{fmt(cryH.reduce((s,h)=>s+Math.round(h.amount*h.avgPrice),0))}</div></div>
      </div>}
    </div>}

    </div></div></EB>;
}
