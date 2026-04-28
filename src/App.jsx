import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import * as XLSX from 'xlsx';

// =================== SECURITY UTILITIES ===================
async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const data = enc.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  );
}

async function encryptData(data, password) {
  const salt = 'domaci-proracun-2026';
  const key = await deriveKey(password, salt);
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(data)));
  return JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) });
}

async function decryptData(encryptedStr, password) {
  try {
    const salt = 'domaci-proracun-2026';
    const key = await deriveKey(password, salt);
    const { iv, data } = JSON.parse(encryptedStr);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, key, new Uint8Array(data));
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch { return null; }
}

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 min auto-logout
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 30000; // 30 sec

const MONTHS = ["Januar","Februar","Marec","April","Maj","Junij","Julij","Avgust","September","Oktober","November","December"];
const MS = ["Jan","Feb","Mar","Apr","Maj","Jun","Jul","Avg","Sep","Okt","Nov","Dec"];
const FIXED_CATS = [
  { id:"housing", name:"Stanovanjski stroški", subs:["Najemnina/hipoteka","Položnice","Stroški upravnika","Internet/TV/telefon","Zavarovanje nepremičnine"] },
  { id:"transport_fix", name:"Prevoz (fiksni)", subs:["Kredit/leasing","Avtomobilsko zavarovanje"] },
  { id:"children_fix", name:"Otroški stroški (fiksni)", subs:["Vrtčevski prispevki"] },
  { id:"debts", name:"Dolgovi", subs:["Potrošniški krediti"] },
  { id:"savings", name:"Varčevanje in naložbe", subs:["Varčevanje za dopust","Mesečno ETF","Trade Republic"] },
];
const VAR_CATS = [
  { id:"food", name:"Hrana", subs:["Nakup živil","Restavracije/kavarne","Malice na poti"] },
  { id:"transport_var", name:"Prevoz (variabilni)", subs:["Gorivo","Parkirnine/cestnine","Vzdrževanje avta","Taxi"] },
  { id:"clothing", name:"Oblačila in osebna nega", subs:["Oblačila","Obutev","Frizer","Depilacija","Drogerija"] },
  { id:"fun", name:"Zabava in prosti čas", subs:["Hobiji","Izleti","Kino/koncerti","Druženje"] },
  { id:"health", name:"Zdravje", subs:["Lekarna","Masaža/terapija","Dodatki","Zobozdravnik"] },
  { id:"education", name:"Izobraževanje", subs:["Knjige","Tečaji/delavnice"] },
  { id:"subs", name:"Naročnine in članarine", subs:["Streaming","Članarine","Software"] },
  { id:"gifts", name:"Darila in donacije", subs:["Darila","Donacije"] },
  { id:"household", name:"Gospodinjstvo in dom", subs:["Popravila","Oprema"] },
  { id:"vacation", name:"Dopust", subs:["Potovanja"] },
  { id:"children_var", name:"Otroški stroški (var.)", subs:["Igrače/oblačila/plenice","Drugo"] },
  { id:"unexpected", name:"Nepredvideni stroški", subs:[] },
];
const ALL_CATS = [...FIXED_CATS, ...VAR_CATS];
const INCOME_TYPES = ["Plača","Nagrada","Regres","Božičnica","Otroški dodatek","Porodniška","Refund"];
const COLORS = ["#2563eb","#0d9488","#d97706","#dc2626","#7c3aed","#059669","#e11d48","#0284c7","#ca8a04","#6366f1","#be185d","#15803d","#ea580c","#4f46e5","#0891b2","#a21caf","#65a30d"];
const KNOWN_UNEXPECTED = ["Amazon","HM","About You","Sports Direct","Mohito","Notino","Stradivarius","Grand Hotel Bernardin","Best Secret","Equa","Lelosi","DDStepOnline","Fever vstopnice"];
const SAVINGS_SUBS = ["Varčevanje za dopust","Mesečno ETF","Trade Republic","Nujni sklad","Drugo"];

function fmt(n){return new Intl.NumberFormat("sl-SI",{style:"currency",currency:"EUR",minimumFractionDigits:0,maximumFractionDigits:0}).format(n)}
function fN(n){return new Intl.NumberFormat("sl-SI",{minimumFractionDigits:0,maximumFractionDigits:0}).format(n)}
function pc(a,b){return b===0?0:Math.round((a/b)*100)}

function initMonth(){
  const d={};ALL_CATS.forEach(c=>{d[c.id]={plan:0,actual:0,comment:""}});
  return {expenses:d,income:{Kristina:{},Tadej:{}},unexpectedItems:[],customIncome:[],savingsDetail:{}};
}
function initYear(){const y={};for(let i=0;i<12;i++)y[i]=initMonth();return y}
const DEFAULT_PCT={housing:28,transport_fix:0,children_fix:18,debts:0,savings:14,food:19,transport_var:2,clothing:6,fun:1,health:1,education:1,subs:1,gifts:1,household:1,vacation:4,children_var:1,unexpected:2};

const CAT_KEYWORDS={
  housing:["stanovanj","najemnin","hipoteka","položnic","upravnik","internet","zavarovanje neprem"],
  transport_fix:["prevoz","kredit","leasing","zavarovanje avt"],
  children_fix:["otroški stroški (fiksni","vrtec","vrtčevsk"],
  debts:["dolg","potrošniš"],
  savings:["varčevanj","naložb","etf","trade republic"],
  food:["hrana","živil","restavracij","malic"],
  transport_var:["gorivo","parkirni","vzdrževanje avt","taxi","cestnin"],
  clothing:["oblačil","obutev","frizer","depilacij","drogerij","osebna nega"],
  fun:["zabav","prosti čas","hobij","izlet","kino","koncert","druženj"],
  health:["zdravj","lekarn","masaž","zobozdrav","dodatki prehran"],
  education:["izobraž","knjig","tečaj","delavnic"],
  subs:["naročnin","članarin","streaming","software","fitnes"],
  gifts:["daril","donacij"],
  household:["gospodinjstv","dom","popravil","oprem"],
  vacation:["dopust","potovanj"],
  children_var:["otroški stroški (var","igrač","plenic"],
  unexpected:["nepredviden","ostalo","razno"],
};

function fuzzyMatch(label){
  const l=label.toLowerCase();
  let best=null,bestLen=0;
  for(const[id,kws]of Object.entries(CAT_KEYWORDS)){
    for(const kw of kws){if(l.includes(kw)&&kw.length>bestLen){best=id;bestLen=kw.length}}
  }
  return best;
}

export default function App() {
  const [authState, setAuthState] = useState('checking'); // checking, setup, login, authenticated
  const [currentUser, setCurrentUser] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [setupStep, setSetupStep] = useState(1);
  const [setupUser, setSetupUser] = useState('');
  const [setupPass, setSetupPass] = useState('');
  const [setupPass2, setSetupPass2] = useState('');
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const lastActivity = useRef(Date.now());
  const sessionTimer = useRef(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Check if accounts exist on mount
  useEffect(() => {
    const accounts = localStorage.getItem('dp_accounts');
    setAuthState(accounts ? 'login' : 'setup');
  }, []);

  // Session timeout - auto logout after 30min inactivity
  useEffect(() => {
    if (authState !== 'authenticated') return;
    const check = () => {
      if (Date.now() - lastActivity.current > SESSION_TIMEOUT) {
        setAuthState('login');
        setCurrentUser(null);
        setLoginError('Seja je potekla. Prijavi se znova.');
      }
    };
    sessionTimer.current = setInterval(check, 10000);
    const resetTimer = () => { lastActivity.current = Date.now(); };
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    return () => {
      clearInterval(sessionTimer.current);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [authState]);

  // Lockout countdown
  useEffect(() => {
    if (lockedUntil <= Date.now()) { setSecondsLeft(0); return; }
    const t = setInterval(() => {
      const left = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) clearInterval(t);
    }, 500);
    return () => clearInterval(t);
  }, [lockedUntil]);

  const handleSetup = async () => {
    if (!setupUser.trim()) { setLoginError('Vnesi uporabniško ime.'); return; }
    if (setupPass.length < 6) { setLoginError('Geslo mora imeti vsaj 6 znakov.'); return; }
    if (setupPass !== setupPass2) { setLoginError('Gesli se ne ujemata.'); return; }
    const salt = crypto.getRandomValues(new Uint8Array(16)).join('');
    const hash = await hashPassword(setupPass, salt);
    const accounts = [{ username: setupUser.trim(), hash, salt }];
    localStorage.setItem('dp_accounts', JSON.stringify(accounts));
    setCurrentUser(setupUser.trim());
    setAuthState('authenticated');
    setLoginError('');
  };

  const handleLogin = async () => {
    if (lockedUntil > Date.now()) return;
    const accountsRaw = localStorage.getItem('dp_accounts');
    if (!accountsRaw) { setAuthState('setup'); return; }
    const accounts = JSON.parse(accountsRaw);
    const account = accounts.find(a => a.username === loginUser.trim());
    if (!account) { handleFailedLogin(); return; }
    const hash = await hashPassword(loginPass, account.salt);
    if (hash !== account.hash) { handleFailedLogin(); return; }
    setCurrentUser(account.username);
    setAuthState('authenticated');
    setAttempts(0);
    setLoginError('');
    lastActivity.current = Date.now();
  };

  const handleFailedLogin = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      const until = Date.now() + LOCKOUT_TIME;
      setLockedUntil(until);
      setLoginError(`Preveč neuspelih poskusov. Počakaj ${LOCKOUT_TIME/1000} sekund.`);
      setTimeout(() => { setAttempts(0); setLoginError(''); }, LOCKOUT_TIME);
    } else {
      setLoginError(`Napačno uporabniško ime ali geslo. Poskus ${newAttempts}/${MAX_LOGIN_ATTEMPTS}.`);
    }
  };

  const handleLogout = () => {
    setAuthState('login');
    setCurrentUser(null);
    setLoginPass('');
    setLoginError('');
  };

  const handleAddUser = async (username, password) => {
    const accountsRaw = localStorage.getItem('dp_accounts');
    const accounts = accountsRaw ? JSON.parse(accountsRaw) : [];
    if (accounts.find(a => a.username === username)) return false;
    const salt = crypto.getRandomValues(new Uint8Array(16)).join('');
    const hash = await hashPassword(password, salt);
    accounts.push({ username, hash, salt });
    localStorage.setItem('dp_accounts', JSON.stringify(accounts));
    return true;
  };

  const L = {
    page: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8f7f4', fontFamily:"'Segoe UI',system-ui,-apple-system,sans-serif" },
    card: { background:'#fff', borderRadius:16, padding:'2.5rem', width:360, boxShadow:'0 2px 24px rgba(0,0,0,0.06)', border:'1px solid #e8e6e1' },
    title: { fontSize:22, fontWeight:700, marginBottom:4, color:'#1a1a2e', textAlign:'center' },
    subtitle: { fontSize:13, color:'#888', textAlign:'center', marginBottom:24 },
    label: { fontSize:12, color:'#555', marginBottom:4, display:'block', fontWeight:500 },
    input: { width:'100%', height:40, fontSize:14, border:'1px solid #ddd', borderRadius:8, padding:'0 12px', outline:'none', boxSizing:'border-box', marginBottom:12 },
    btn: { width:'100%', height:42, fontSize:14, fontWeight:600, border:'none', borderRadius:8, background:'#2563eb', color:'#fff', cursor:'pointer', marginTop:8 },
    btnSec: { width:'100%', height:36, fontSize:12, fontWeight:500, border:'1px solid #ddd', borderRadius:8, background:'#fff', color:'#555', cursor:'pointer', marginTop:8 },
    error: { fontSize:12, color:'#dc2626', textAlign:'center', marginTop:8, padding:'6px 10px', background:'#fef2f2', borderRadius:6 },
    info: { fontSize:11, color:'#888', textAlign:'center', marginTop:12 },
  };

  if (authState === 'checking') return <div style={L.page}><div style={L.card}><div style={{...L.title}}>Nalagam...</div></div></div>;

  if (authState === 'setup') return (
    <div style={L.page}><div style={L.card}>
      <div style={{fontSize:32,textAlign:'center',marginBottom:8}}>&#128176;</div>
      <div style={L.title}>Domači Proračun</div>
      <div style={L.subtitle}>Ustvari račun za zaščito tvojih podatkov</div>
      <label style={L.label}>Uporabniško ime</label>
      <input style={L.input} value={setupUser} onChange={e=>setSetupUser(e.target.value)} placeholder="npr. Tadej ali Kristina"/>
      <label style={L.label}>Geslo (vsaj 6 znakov)</label>
      <input style={L.input} type="password" value={setupPass} onChange={e=>setSetupPass(e.target.value)} placeholder="Geslo"/>
      <label style={L.label}>Ponovi geslo</label>
      <input style={L.input} type="password" value={setupPass2} onChange={e=>setSetupPass2(e.target.value)} placeholder="Ponovi geslo"
        onKeyDown={e=>{if(e.key==='Enter')handleSetup()}}/>
      <button style={L.btn} onClick={handleSetup}>Ustvari račun</button>
      {loginError && <div style={L.error}>{loginError}</div>}
      <div style={L.info}>Geslo se hashira z SHA-256. Nihče ga ne more prebrati.</div>
    </div></div>
  );

  if (authState === 'login') return (
    <div style={L.page}><div style={L.card}>
      <div style={{fontSize:32,textAlign:'center',marginBottom:8}}>&#128274;</div>
      <div style={L.title}>Prijava</div>
      <div style={L.subtitle}>Domači Proračun</div>
      <label style={L.label}>Uporabniško ime</label>
      <input style={L.input} value={loginUser} onChange={e=>setLoginUser(e.target.value)} placeholder="Uporabniško ime"
        disabled={lockedUntil > Date.now()}/>
      <label style={L.label}>Geslo</label>
      <input style={L.input} type="password" value={loginPass} onChange={e=>setLoginPass(e.target.value)} placeholder="Geslo"
        disabled={lockedUntil > Date.now()}
        onKeyDown={e=>{if(e.key==='Enter')handleLogin()}}/>
      <button style={{...L.btn, opacity: lockedUntil > Date.now() ? 0.5 : 1}} onClick={handleLogin}
        disabled={lockedUntil > Date.now()}>
        {lockedUntil > Date.now() ? `Zaklenjeno (${secondsLeft}s)` : 'Prijava'}
      </button>
      {loginError && <div style={L.error}>{loginError}</div>}
      <div style={L.info}>Seja poteče po 30 minutah neaktivnosti</div>
    </div></div>
  );

  return (
    <div>
      <div style={{position:'fixed',top:0,right:0,zIndex:100,padding:'8px 16px',display:'flex',alignItems:'center',gap:8,fontSize:11,color:'#888',background:'rgba(248,247,244,0.9)',borderBottomLeftRadius:8,borderLeft:'1px solid #e8e6e1',borderBottom:'1px solid #e8e6e1'}}>
        <span style={{fontWeight:500,color:'#2563eb'}}>{currentUser}</span>
        <button onClick={handleLogout} style={{fontSize:10,padding:'3px 10px',border:'1px solid #ddd',borderRadius:6,background:'#fff',color:'#555',cursor:'pointer'}}>Odjava</button>
      </div>
      <BudgetApp currentUser={currentUser} onAddUser={handleAddUser} onLogout={handleLogout}/>
    </div>
  );
}

function BudgetApp({currentUser, onAddUser, onLogout}){
  const[view,setView]=useState("dash");
  const[month,setMonth]=useState(new Date().getMonth());
  const[dashYear,setDashYear]=useState(2026);
  const[data,setData]=useState(()=>({2026:initYear()}));
  const[changeLog,setChangeLog]=useState([]);
  const[goals,setGoals]=useState([
    {id:1,name:"Dopust sklad",type:"saving",catId:"savings",target:2700,current:900,monthly:300},
    {id:2,name:"Nujni sklad",type:"saving",catId:null,target:21000,current:8200,monthly:0},
    {id:3,name:"Mesečni limit hrana",type:"limit",catId:"food",target:670,current:0,monthly:0},
  ]);
  const[budgetPct,setBudgetPct]=useState(DEFAULT_PCT);
  const[cryptoUnlocked,setCryptoUnlocked]=useState(false);
  const[cryptoPwd,setCryptoPwd]=useState("");
  const[cryptoHoldings,setCryptoHoldings]=useState([{coin:"BTC",amount:0.05,avgPrice:45000},{coin:"ETH",amount:1.2,avgPrice:3200}]);
  const[simFrom,setSimFrom]=useState("2026-05-01");
  const[simTo,setSimTo]=useState("2029-04-30");
  const[simSalaryGrowth,setSimSalaryGrowth]=useState(3);
  const[simInflation,setSimInflation]=useState(2);
  const[simChildCost,setSimChildCost]=useState(5);
  const[simExtraInvest,setSimExtraInvest]=useState(100);
  const[showNewGoal,setShowNewGoal]=useState(false);
  const[newGoalName,setNewGoalName]=useState("");
  const[newGoalType,setNewGoalType]=useState("saving");
  const[newGoalCat,setNewGoalCat]=useState("");
  const[newGoalTarget,setNewGoalTarget]=useState("");
  const[importStatus,setImportStatus]=useState(null);
  const[showImport,setShowImport]=useState(false);
  const[importYear,setImportYear]=useState(2026);
  const[importLog,setImportLog]=useState([]);
  const[analysisRules,setAnalysisRules]=useState([{id:1,type:"compare"}]);
  const[savingsVisible,setSavingsVisible]=useState(["Varčevanje za dopust","Mesečno ETF","Trade Republic"]);
  const[showSavingsConfig,setShowSavingsConfig]=useState(false);
  const[compareYear,setCompareYear]=useState(null);

  const yd=useMemo(()=>data[dashYear]||initYear(),[data,dashYear]);
  const md=useMemo(()=>yd[month]||initMonth(),[yd,month]);
  const compYd=useMemo(()=>compareYear?data[compareYear]||null:null,[data,compareYear]);

  const totalIncome=useMemo(()=>{
    let t=0;
    Object.values(md.income?.Kristina||{}).forEach(v=>t+=(v||0));
    Object.values(md.income?.Tadej||{}).forEach(v=>t+=(v||0));
    (md.customIncome||[]).forEach(ci=>t+=(ci.amount||0));
    return t;
  },[md]);
  const totalFixed=useMemo(()=>FIXED_CATS.reduce((s,c)=>s+(md.expenses[c.id]?.actual||0),0),[md]);
  const totalVar=useMemo(()=>VAR_CATS.reduce((s,c)=>s+(md.expenses[c.id]?.actual||0),0),[md]);
  const totalActual=totalFixed+totalVar;
  const totalSavings=md.expenses.savings?.actual||0;
  const savingsDisplayTotal=savingsVisible.reduce((s,name)=>s+(md.savingsDetail?.[name]||0),0);

  const updateExpense=useCallback((catId,field,val)=>{
    setData(prev=>{
      const next=JSON.parse(JSON.stringify(prev));
      if(!next[dashYear])next[dashYear]=initYear();
      if(!next[dashYear][month])next[dashYear][month]=initMonth();
      const old=next[dashYear][month].expenses[catId]?.[field]||0;
      if(!next[dashYear][month].expenses[catId])next[dashYear][month].expenses[catId]={plan:0,actual:0,comment:""};
      next[dashYear][month].expenses[catId][field]=field==="comment"?val:(parseFloat(val)||0);
      if(field==="plan"&&parseFloat(val)!==old){
        setChangeLog(l=>[{date:new Date().toLocaleDateString("sl-SI"),cat:ALL_CATS.find(c=>c.id===catId)?.name,oldVal:old,newVal:parseFloat(val)||0,who:currentUser||"Uporabnik"},...l]);
      }
      return next;
    });
  },[dashYear,month]);

  const updateIncome=useCallback((person,type,val)=>{
    setData(prev=>{
      const next=JSON.parse(JSON.stringify(prev));
      if(!next[dashYear])next[dashYear]=initYear();
      if(!next[dashYear][month])next[dashYear][month]=initMonth();
      if(!next[dashYear][month].income[person])next[dashYear][month].income[person]={};
      next[dashYear][month].income[person][type]=parseFloat(val)||0;
      return next;
    });
  },[dashYear,month]);

  const updateSavingsDetail=useCallback((subName,val)=>{
    setData(prev=>{
      const next=JSON.parse(JSON.stringify(prev));
      if(!next[dashYear])next[dashYear]=initYear();
      if(!next[dashYear][month])next[dashYear][month]=initMonth();
      if(!next[dashYear][month].savingsDetail)next[dashYear][month].savingsDetail={};
      next[dashYear][month].savingsDetail[subName]=parseFloat(val)||0;
      return next;
    });
  },[dashYear,month]);

  const addCustomIncome=useCallback((label,amount,person,comment)=>{
    setData(prev=>{
      const next=JSON.parse(JSON.stringify(prev));
      if(!next[dashYear])next[dashYear]=initYear();
      if(!next[dashYear][month])next[dashYear][month]=initMonth();
      if(!next[dashYear][month].customIncome)next[dashYear][month].customIncome=[];
      next[dashYear][month].customIncome.push({label,amount:parseFloat(amount)||0,person,comment,showComment:false});
      return next;
    });
  },[dashYear,month]);

  const toggleIncomeComment=useCallback((idx)=>{
    setData(prev=>{
      const next=JSON.parse(JSON.stringify(prev));
      if(next[dashYear]?.[month]?.customIncome?.[idx]!=null){
        next[dashYear][month].customIncome[idx].showComment=!next[dashYear][month].customIncome[idx].showComment;
      }
      return next;
    });
  },[dashYear,month]);

  const addUnexpected=useCallback((desc,amount,person)=>{
    setData(prev=>{
      const next=JSON.parse(JSON.stringify(prev));
      if(!next[dashYear])next[dashYear]=initYear();
      if(!next[dashYear][month])next[dashYear][month]=initMonth();
      next[dashYear][month].unexpectedItems.push({desc,amount:parseFloat(amount)||0,person});
      const total=next[dashYear][month].unexpectedItems.reduce((s,i)=>s+i.amount,0);
      next[dashYear][month].expenses.unexpected={...next[dashYear][month].expenses.unexpected,actual:total};
      return next;
    });
  },[dashYear,month]);

  const addGoal=useCallback(()=>{
    if(!newGoalName||!newGoalTarget)return;
    setGoals(g=>[...g,{id:Date.now(),name:newGoalName,type:newGoalType,catId:newGoalCat||null,target:parseFloat(newGoalTarget),current:0,monthly:0}]);
    setNewGoalName("");setNewGoalTarget("");setShowNewGoal(false);
  },[newGoalName,newGoalType,newGoalCat,newGoalTarget]);

  const handleImport=useCallback(async(e)=>{
    const file=e.target.files?.[0];if(!file)return;
    setImportStatus("Uvažam...");setImportLog([]);
    try{
      const buf=await file.arrayBuffer();
      const wb=XLSX.read(buf,{type:"array"});
      const newData=JSON.parse(JSON.stringify(data));
      const tY=importYear;
      if(!newData[tY])newData[tY]=initYear();
      const monthMap={jan:0,feb:1,mar:2,apr:3,maj:4,jun:5,jul:6,avg:7,sep:8,okt:9,nov:10,dec:11,januar:0,februar:1,marec:2,april:3,junij:5,julij:6,avgust:7,september:8,oktober:9,november:10,december:11};
      const log=[];let matched=0,unmatched=0;
      wb.SheetNames.forEach(sn=>{
        const snl=sn.toLowerCase().trim();
        let mi=null;
        for(const[k,v]of Object.entries(monthMap)){if(snl.startsWith(k)){mi=v;break}}
        if(mi===null){log.push({type:"skip",msg:`List "${sn}" preskočen`});return}
        const ws=wb.Sheets[sn];const rows=XLSX.utils.sheet_to_json(ws,{header:1});
        if(!newData[tY][mi])newData[tY][mi]=initMonth();
        const mdat=newData[tY][mi];
        rows.forEach(r=>{
          if(!r[0]||typeof r[0]!=="string")return;
          const label=String(r[0]).trim();const lL=label.toLowerCase();
          if(lL.includes("kategorija")||lL.includes("postavka")||lL==="skupaj"||lL==="razlika")return;
          if(label==="Kristina"||label==="Tadej"){
            const amt=parseFloat(r[1])||0;
            if(amt>0){if(!mdat.income[label])mdat.income[label]={};mdat.income[label]["Plača"]=(mdat.income[label]["Plača"]||0)+amt;matched++;log.push({type:"ok",msg:`${MONTHS[mi]}: ${label} prihodek €${amt}`})}
            return;
          }
          const catId=fuzzyMatch(lL);
          if(catId){
            const plan=parseFloat(r[2])||parseFloat(r[1])||0;const actual=parseFloat(r[1])||0;
            if(actual>0||plan>0){mdat.expenses[catId]={plan:plan||mdat.expenses[catId]?.plan||0,actual:actual||mdat.expenses[catId]?.actual||0,comment:""};matched++;log.push({type:"ok",msg:`${MONTHS[mi]}: "${label}" → ${ALL_CATS.find(c=>c.id===catId)?.name}`})}
          }else if(parseFloat(r[1])>0){unmatched++;log.push({type:"warn",msg:`${MONTHS[mi]}: "${label}" ni prepoznan (€${r[1]})`})}
        });
      });
      log.unshift({type:"info",msg:`Končano: ${matched} ujemanj, ${unmatched} neprepoznanih`});
      setImportLog(log);setData(newData);setImportStatus(`Uvoz uspešen! ${matched} vnosov.`);
    }catch(err){setImportStatus("Napaka: "+err.message)}
  },[data,importYear]);

  const pieData=useMemo(()=>ALL_CATS.map((c,i)=>({name:c.name.split(" ")[0],value:md.expenses[c.id]?.actual||0,color:COLORS[i%COLORS.length]})).filter(d=>d.value>0),[md]);

  const trendData=useMemo(()=>MS.map((m,i)=>{
    const mdata=yd[i]||initMonth();let inc=0,exp=0;
    Object.values(mdata.income?.Kristina||{}).forEach(v=>inc+=(v||0));
    Object.values(mdata.income?.Tadej||{}).forEach(v=>inc+=(v||0));
    (mdata.customIncome||[]).forEach(ci=>inc+=(ci.amount||0));
    ALL_CATS.forEach(c=>exp+=(mdata.expenses[c.id]?.actual||0));
    const res={name:m,Prihodki:inc,Odhodki:exp};
    if(compYd){const cm=compYd[i]||initMonth();let ci2=0,ce2=0;
      Object.values(cm.income?.Kristina||{}).forEach(v=>ci2+=(v||0));
      Object.values(cm.income?.Tadej||{}).forEach(v=>ci2+=(v||0));
      ALL_CATS.forEach(c=>ce2+=(cm.expenses[c.id]?.actual||0));
      res[`Prihodki ${compareYear}`]=ci2;res[`Odhodki ${compareYear}`]=ce2;
    }
    return res;
  }),[yd,compYd,compareYear]);

  const simData=useMemo(()=>{
    const sY=parseInt(simFrom.split("-")[0])||2026;const eY=parseInt(simTo.split("-")[0])||2029;
    const years=Math.max(1,eY-sY+1);const mInc=totalIncome||3600;const mExp=totalActual||3100;const mSav=totalSavings||500;
    const res=[];
    for(let i=0;i<years;i++){
      const ig=Math.pow(1+simSalaryGrowth/100,i);const eg=Math.pow(1+simInflation/100,i);
      const yI=Math.round(mInc*ig*12);const yE=Math.round(mExp*eg*12);const yS=Math.round((mSav+simExtraInvest)*ig*12);
      const cum=res.length>0?res[res.length-1].Prihranki+yS:yS;
      res.push({name:String(sY+i),Prihodki:yI,Odhodki:yE,Prihranki:cum});
    }
    return res;
  },[simFrom,simTo,simSalaryGrowth,simInflation,simExtraInvest,totalIncome,totalActual,totalSavings]);

  const navPrev=()=>{if(month===0){setMonth(11);setDashYear(y=>y-1)}else setMonth(m=>m-1)};
  const navNext=()=>{if(month===11){setMonth(0);setDashYear(y=>y+1)}else setMonth(m=>m+1)};

  const C={bg:"#f8f7f4",card:"#fff",brd:"#e8e6e1",mut:"#888",fnt:"#f5f5f0",grn:"#059669",red:"#dc2626",blu:"#2563eb",pur:"#7c3aed",org:"#d97706",txt:"#1a1a2e",sub:"#555"};
  const S={
    nav:{display:"flex",gap:0,background:C.txt,padding:"0 8px",overflowX:"auto",borderRadius:"12px 12px 0 0"},
    ni:a=>({padding:"10px 14px",fontSize:12,fontWeight:a?600:400,color:a?"#f8f7f4":"#8888a0",cursor:"pointer",borderBottom:a?"2px solid #60a5fa":"2px solid transparent",whiteSpace:"nowrap",letterSpacing:".3px"}),
    card:{background:C.card,borderRadius:10,border:`1px solid ${C.brd}`,padding:16,marginBottom:12},
    met:{background:"#fafaf8",borderRadius:8,padding:"12px 14px",border:"1px solid #eee"},
    lab:{fontSize:10,color:C.mut,textTransform:"uppercase",letterSpacing:".5px",marginBottom:2},
    val:c=>({fontSize:20,fontWeight:600,color:c||C.txt}),
    ssub:{fontSize:10,color:"#999",marginTop:2},
    st:{fontSize:13,fontWeight:600,color:C.sub,marginBottom:8,display:"flex",alignItems:"center",gap:6},
    tag:(b,f)=>({fontSize:9,padding:"2px 8px",borderRadius:10,fontWeight:600,background:b,color:f,display:"inline-block",cursor:"pointer"}),
    inp:{height:30,fontSize:12,border:"1px solid #ddd",borderRadius:6,padding:"0 8px",width:"100%",outline:"none",boxSizing:"border-box"},
    sel:{height:30,fontSize:12,border:"1px solid #ddd",borderRadius:6,padding:"0 6px",background:"#fff",outline:"none",boxSizing:"border-box"},
    btn:p=>({height:30,fontSize:11,fontWeight:600,border:p?"none":"1px solid #ddd",borderRadius:6,padding:"0 14px",background:p?C.blu:"#fff",color:p?"#fff":"#333",cursor:"pointer"}),
    pb:{height:5,borderRadius:3,background:"#eee",overflow:"hidden"},
    pf:(w,c)=>({height:"100%",width:`${Math.min(w,100)}%`,borderRadius:3,background:c||C.blu,transition:"width .3s"}),
    alert:{display:"flex",alignItems:"center",gap:6,background:"#fff7ed",border:"1px solid #fed7aa",borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:11,color:"#9a3412"},
  };

  const MonthNav=()=><div style={{display:"flex",alignItems:"center",gap:6}}><button onClick={navPrev} style={S.btn(false)}>&larr;</button><span style={{fontSize:14,fontWeight:600,minWidth:110,textAlign:"center"}}>{MONTHS[month]} {dashYear}</span><button onClick={navNext} style={S.btn(false)}>&rarr;</button></div>;

  const YearPicker=()=><div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
    <span style={{fontSize:10,color:C.mut}}>Leto:</span>
    <select style={{...S.sel,height:26,fontSize:11,width:70}} value={dashYear} onChange={e=>setDashYear(parseInt(e.target.value))}>{[2020,2021,2022,2023,2024,2025,2026,2027,2028].map(y=><option key={y} value={y}>{y}</option>)}</select>
    <span style={{fontSize:10,color:C.mut,marginLeft:4}}>Primerjaj:</span>
    <select style={{...S.sel,height:26,fontSize:11,width:80}} value={compareYear||""} onChange={e=>setCompareYear(e.target.value?parseInt(e.target.value):null)}><option value="">Brez</option>{[2020,2021,2022,2023,2024,2025,2026,2027].filter(y=>y!==dashYear).map(y=><option key={y}>{y}</option>)}</select>
  </div>;

  const GoalForm=({inline})=><div style={{...S.card,border:inline?"1px dashed #93c5fd":`1px solid ${C.brd}`,background:inline?"#f0f7ff":"#fff"}}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
      <div><div style={{fontSize:10,color:C.mut,marginBottom:2}}>Ime cilja</div><input style={S.inp} value={newGoalName} onChange={e=>setNewGoalName(e.target.value)} placeholder="npr. Nujni sklad"/></div>
      <div><div style={{fontSize:10,color:C.mut,marginBottom:2}}>Tip</div><select style={{...S.sel,width:"100%"}} value={newGoalType} onChange={e=>setNewGoalType(e.target.value)}><option value="saving">Varčevalni cilj</option><option value="limit">Mesečni limit</option><option value="minimum">Mesečni minimum</option></select></div>
      <div><div style={{fontSize:10,color:C.mut,marginBottom:2}}>Kategorija</div><select style={{...S.sel,width:"100%"}} value={newGoalCat} onChange={e=>setNewGoalCat(e.target.value)}><option value="">Brez</option>{ALL_CATS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div><div style={{fontSize:10,color:C.mut,marginBottom:2}}>Ciljni znesek (€)</div><input style={S.inp} type="number" value={newGoalTarget} onChange={e=>setNewGoalTarget(e.target.value)} placeholder="0"/></div>
    </div>
    <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}><button style={S.btn(false)} onClick={()=>setShowNewGoal(false)}>Prekliči</button><button style={S.btn(true)} onClick={addGoal}>Shrani</button></div>
  </div>;

  // ===================== DASHBOARD =====================
  const DashView=()=><div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:8}}>
      <h2 style={{fontSize:20,fontWeight:700,margin:0}}>Nadzorna plošča</h2>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><YearPicker/><button onClick={()=>setShowImport(!showImport)} style={{...S.btn(false),fontSize:10}}>Uvoz Excel</button><MonthNav/></div>
    </div>
    {showImport&&<div style={{...S.card,background:"#f0f7ff",border:"1px dashed #93c5fd"}}>
      <div style={{fontSize:12,fontWeight:600,marginBottom:4,color:C.blu}}>Uvozi iz Excel (pametno ujemanje)</div>
      <div style={{fontSize:10,color:C.mut,marginBottom:8}}>Podpira različne strukture Excelov iz prejšnjih let. Sistem poskuša prepoznati kategorije avtomatsko.</div>
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
        <span style={{fontSize:11}}>V leto:</span>
        <select style={{...S.sel,width:80}} value={importYear} onChange={e=>setImportYear(parseInt(e.target.value))}>{[2020,2021,2022,2023,2024,2025,2026,2027].map(y=><option key={y}>{y}</option>)}</select>
        <input type="file" accept=".xlsx,.xls" onChange={handleImport} style={{fontSize:12}}/>
      </div>
      {importStatus&&<div style={{fontSize:11,marginBottom:6,fontWeight:600,color:importStatus.includes("Napaka")?C.red:C.grn}}>{importStatus}</div>}
      {importLog.length>0&&<div style={{maxHeight:140,overflowY:"auto",fontSize:10,border:"1px solid #e8e6e1",borderRadius:6,padding:8,background:"#fff"}}>
        {importLog.map((l,i)=><div key={i} style={{padding:"2px 0",color:l.type==="ok"?C.grn:l.type==="warn"?C.org:l.type==="info"?C.blu:C.mut}}>{l.type==="ok"?"✓":l.type==="warn"?"⚠":"ℹ"} {l.msg}</div>)}
      </div>}
    </div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
      <div style={S.met}><div style={S.lab}>Prihodki</div><div style={S.val(C.grn)}>{fmt(totalIncome)}</div><div style={S.ssub}>K + T skupaj</div></div>
      <div style={S.met}><div style={S.lab}>Odhodki</div><div style={S.val(C.red)}>{fmt(totalActual)}</div><div style={S.ssub}>Fiksni {fmt(totalFixed)} + Var. {fmt(totalVar)}</div></div>
      <div style={S.met}><div style={S.lab}>Razlika</div><div style={S.val(totalIncome-totalActual>=0?C.grn:C.red)}>{totalIncome-totalActual>=0?"+":""}{fmt(totalIncome-totalActual)}</div><div style={S.ssub}>{totalIncome>0?pc(totalIncome-totalActual,totalIncome):0}% prihodkov</div></div>
      <div style={{...S.met,position:"relative"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={S.lab}>Varčevanje</div><span onClick={()=>setShowSavingsConfig(!showSavingsConfig)} style={{...S.tag("#dbeafe",C.blu),fontSize:8}}>⚙ uredi</span></div>
        <div style={S.val(C.blu)}>{fmt(savingsDisplayTotal||totalSavings)}</div>
        <div style={S.ssub}>{savingsVisible.map(s=>s.replace("Varčevanje za ","").replace("Mesečno ","")).join(", ")}</div>
        {showSavingsConfig&&<div style={{position:"absolute",top:"100%",right:0,zIndex:20,background:"#fff",border:`1px solid ${C.brd}`,borderRadius:8,padding:12,minWidth:220,boxShadow:"0 4px 16px rgba(0,0,0,0.12)"}}>
          <div style={{fontSize:11,fontWeight:600,marginBottom:6}}>Prikaži v metriki:</div>
          {SAVINGS_SUBS.map(s=><label key={s} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,padding:"3px 0",cursor:"pointer"}}>
            <input type="checkbox" checked={savingsVisible.includes(s)} onChange={e=>{if(e.target.checked)setSavingsVisible(v=>[...v,s]);else setSavingsVisible(v=>v.filter(x=>x!==s))}}/>
            {s}
          </label>)}
          <div style={{borderTop:"1px solid #eee",marginTop:6,paddingTop:6,fontSize:10,color:C.mut}}>Znesek po postavki:</div>
          {savingsVisible.map(s=><div key={s} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,padding:"2px 0"}}>
            <span style={{flex:1}}>{s}</span>
            <input style={{...S.inp,width:60,height:24,fontSize:10}} value={md.savingsDetail?.[s]||""} onChange={e=>updateSavingsDetail(s,e.target.value)} placeholder="€"/>
          </div>)}
          <button onClick={()=>setShowSavingsConfig(false)} style={{...S.btn(true),marginTop:8,height:26,fontSize:10,width:"100%"}}>Zapri</button>
        </div>}
      </div>
    </div>
    {compareYear&&compYd&&<div style={{...S.card,background:"#fefce8",border:"1px solid #fde68a"}}>
      <div style={S.st}>Primerjava: {MONTHS[month]} {dashYear} vs {compareYear}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 75px 75px 75px",gap:4,fontSize:11}}>
        <div style={{fontWeight:600,color:C.mut}}>Kategorija</div><div style={{fontWeight:600,color:C.mut,textAlign:"right"}}>{dashYear}</div><div style={{fontWeight:600,color:C.mut,textAlign:"right"}}>{compareYear}</div><div style={{fontWeight:600,color:C.mut,textAlign:"right"}}>±</div>
        {ALL_CATS.slice(0,8).map(c=>{
          const curr=md.expenses[c.id]?.actual||0;const prev=compYd[month]?.expenses[c.id]?.actual||0;const diff=curr-prev;
          return[
            <div key={c.id+"n"} style={{padding:"3px 0",borderTop:`1px solid ${C.fnt}`}}>{c.name.length>18?c.name.substring(0,16)+"…":c.name}</div>,
            <div key={c.id+"c"} style={{textAlign:"right",padding:"3px 0",borderTop:`1px solid ${C.fnt}`}}>{fmt(curr)}</div>,
            <div key={c.id+"p"} style={{textAlign:"right",padding:"3px 0",borderTop:`1px solid ${C.fnt}`,color:C.mut}}>{fmt(prev)}</div>,
            <div key={c.id+"d"} style={{textAlign:"right",padding:"3px 0",borderTop:`1px solid ${C.fnt}`,color:diff>0?C.red:diff<0?C.grn:C.mut,fontWeight:600}}>{diff>0?"+":""}{fmt(diff)}</div>,
          ];
        })}
      </div>
    </div>}
    <div style={S.st}>Uredi plan <span style={S.tag("#dbeafe",C.blu)}>klikni za urejanje</span></div>
    <div style={S.card}>
      <div style={{display:"grid",gridTemplateColumns:"1.5fr 70px 70px 50px 1fr",gap:4,fontSize:10,color:C.mut,fontWeight:600,padding:"0 4px 6px",borderBottom:"1px solid #eee"}}><span>Kategorija</span><span>Plan €</span><span>Izvedba €</span><span>%</span><span></span></div>
      {ALL_CATS.map(c=>{const plan=md.expenses[c.id]?.plan||0;const actual=md.expenses[c.id]?.actual||0;const p=pc(actual,plan);const col=p>90?C.red:p>70?C.org:C.grn;
        return<div key={c.id} style={{display:"grid",gridTemplateColumns:"1.5fr 70px 70px 50px 1fr",gap:4,fontSize:11,alignItems:"center",padding:"5px 4px",borderBottom:`1px solid ${C.fnt}`}}>
          <span style={{fontWeight:500}}>{c.name.length>20?c.name.substring(0,18)+"…":c.name}</span>
          <input style={{...S.inp,width:60,height:26,fontSize:11}} value={plan||""} onChange={e=>updateExpense(c.id,"plan",e.target.value)}/>
          <span style={{color:C.sub}}>{fN(actual)}</span>
          <span style={{fontSize:10,color:col,fontWeight:600}}>{plan>0?p+"%":"—"}</span>
          <div style={S.pb}><div style={S.pf(p,col)}/></div>
        </div>
      })}
    </div>
    {changeLog.length>0&&<><div style={S.st}>Dnevnik sprememb</div><div style={S.card}>{changeLog.slice(0,5).map((l,i)=><div key={i} style={{display:"flex",gap:8,fontSize:10,color:"#666",padding:"4px 0",borderBottom:i<4?`1px solid ${C.fnt}`:"none"}}><span style={{minWidth:55,color:"#999"}}>{l.date}</span><span style={{minWidth:50,color:C.blu}}>{l.who}</span><span>{l.cat}: {fmt(l.oldVal)} → {fmt(l.newVal)}</span></div>)}</div></>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <div style={S.card}><div style={S.st}>Razdelitev stroškov</div>
        {pieData.length>0?<div style={{display:"flex",alignItems:"center",gap:12}}>
          <ResponsiveContainer width={120} height={120}><PieChart><Pie data={pieData} innerRadius={28} outerRadius={55} dataKey="value" stroke="none">{pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie></PieChart></ResponsiveContainer>
          <div style={{fontSize:10,color:"#666",display:"flex",flexDirection:"column",gap:2}}>{pieData.slice(0,6).map((d,i)=><span key={i}><span style={{display:"inline-block",width:8,height:8,borderRadius:2,background:d.color,marginRight:4}}/>{d.name} {pc(d.value,totalActual)}%</span>)}</div>
        </div>:<div style={{fontSize:11,color:"#999",textAlign:"center",padding:20}}>Vnesi podatke</div>}
      </div>
      <div style={S.card}><div style={S.st}>Trend {compareYear?`${dashYear} vs ${compareYear}`:dashYear}</div>
        <ResponsiveContainer width="100%" height={120}><BarChart data={trendData} barGap={1}><XAxis dataKey="name" tick={{fontSize:9}} axisLine={false} tickLine={false}/><YAxis hide/><Tooltip formatter={v=>fmt(v)} contentStyle={{fontSize:11}}/>
          <Bar dataKey="Prihodki" fill={C.grn} radius={[2,2,0,0]} barSize={compareYear?5:8}/><Bar dataKey="Odhodki" fill={C.red} radius={[2,2,0,0]} barSize={compareYear?5:8} opacity={0.6}/>
          {compareYear&&<Bar dataKey={`Prihodki ${compareYear}`} fill={C.grn} radius={[2,2,0,0]} barSize={5} opacity={0.25}/>}
          {compareYear&&<Bar dataKey={`Odhodki ${compareYear}`} fill={C.red} radius={[2,2,0,0]} barSize={5} opacity={0.2}/>}
        </BarChart></ResponsiveContainer>
      </div>
    </div>
  </div>;

  // ===================== MESEČNI VNOS =====================
  const EntryView=()=>{
    const[uDesc,setUDesc]=useState("");const[uAmt,setUAmt]=useState("");const[uPerson,setUPerson]=useState("Kristina");const[uCustom,setUCustom]=useState("");
    const[niL,setNiL]=useState("");const[niA,setNiA]=useState("");const[niP,setNiP]=useState("Kristina");const[niC,setNiC]=useState("");
    const[showIncComm,setShowIncComm]=useState({});
    return<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}><h2 style={{fontSize:20,fontWeight:700,margin:0}}>Mesečni vnos</h2><div style={{display:"flex",gap:8,alignItems:"center"}}><YearPicker/><MonthNav/></div></div>
      <div style={S.st}>Prihodki</div>
      <div style={S.card}>
        {["Kristina","Tadej"].map(person=><div key={person}>
          <div style={{fontSize:12,fontWeight:600,margin:"6px 0 4px",color:C.blu}}>{person}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
            {INCOME_TYPES.slice(0,4).map(t=><div key={t}>
              <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:9,color:"#999"}}>{t}</span>
                <span onClick={()=>setShowIncComm(p=>({...p,[`${person}-${t}`]:!p[`${person}-${t}`]}))} style={{fontSize:8,color:C.blu,cursor:"pointer",opacity:0.6}}>💬</span>
              </div>
              <input style={{...S.inp,height:26,fontSize:11}} value={md.income[person]?.[t]||""} onChange={e=>updateIncome(person,t,e.target.value)} placeholder="0"/>
              {showIncComm[`${person}-${t}`]&&<input style={{...S.inp,height:22,fontSize:9,marginTop:2,background:"#fafaf8",borderColor:"#e0e0dc"}} placeholder="skriti komentar..."/>}
            </div>)}
          </div>
        </div>)}
        <div style={{borderTop:`1px solid ${C.brd}`,marginTop:10,paddingTop:8}}>
          <div style={{fontSize:11,fontWeight:600,color:C.sub,marginBottom:6}}>Dodatni prihodki <span style={S.tag("#dcfce7","#166534")}>dodaj po meri</span></div>
          {(md.customIncome||[]).map((ci,idx)=><div key={idx} style={{display:"flex",gap:6,alignItems:"center",padding:"4px 0",borderBottom:`1px solid ${C.fnt}`,fontSize:11,flexWrap:"wrap"}}>
            <span style={{fontWeight:500,flex:1}}>{ci.label}</span><span style={{color:C.mut,fontSize:10}}>{ci.person}</span><span style={{fontWeight:600,color:C.grn}}>{fmt(ci.amount)}</span>
            <span onClick={()=>toggleIncomeComment(idx)} style={{fontSize:9,color:C.blu,cursor:"pointer"}}>💬</span>
            {ci.showComment&&<div style={{width:"100%",fontSize:9,color:C.mut,fontStyle:"italic",background:"#fafaf8",padding:"2px 6px",borderRadius:4}}>{ci.comment||"brez komentarja"}</div>}
          </div>)}
          <div style={{display:"flex",gap:4,marginTop:6,alignItems:"center",flexWrap:"wrap"}}>
            <input style={{...S.inp,flex:1,minWidth:100,height:26,fontSize:11}} value={niL} onChange={e=>setNiL(e.target.value)} placeholder="Opis (npr. prodaja, vračilo)"/>
            <input style={{...S.inp,width:60,height:26,fontSize:11}} type="number" value={niA} onChange={e=>setNiA(e.target.value)} placeholder="€"/>
            <select style={{...S.sel,width:75,height:26,fontSize:11}} value={niP} onChange={e=>setNiP(e.target.value)}><option>Kristina</option><option>Tadej</option><option>Skupno</option></select>
            <input style={{...S.inp,flex:0.7,minWidth:80,height:26,fontSize:10}} value={niC} onChange={e=>setNiC(e.target.value)} placeholder="skriti komentar"/>
            <button style={{...S.btn(true),height:26,padding:"0 8px"}} onClick={()=>{if(niL)addCustomIncome(niL,niA,niP,niC);setNiL("");setNiA("");setNiC("")}}>+</button>
          </div>
        </div>
      </div>
      <div style={S.st}>Fiksni stroški</div>
      <div style={S.card}>
        <div style={{display:"grid",gridTemplateColumns:"1.5fr 65px 65px 55px 1fr",gap:4,fontSize:10,color:C.mut,fontWeight:600,padding:"0 0 6px",borderBottom:"1px solid #eee"}}><span>Postavka</span><span>Plan</span><span>Izvedba</span><span>Razl.</span><span>Komentar</span></div>
        {FIXED_CATS.map(c=>{const plan=md.expenses[c.id]?.plan||0;const actual=md.expenses[c.id]?.actual||0;const diff=plan-actual;
          return<div key={c.id} style={{display:"grid",gridTemplateColumns:"1.5fr 65px 65px 55px 1fr",gap:4,fontSize:11,alignItems:"center",padding:"5px 0",borderBottom:`1px solid ${C.fnt}`}}>
            <span style={{fontWeight:500}}>{c.name.length>22?c.name.substring(0,20)+"…":c.name}</span><span style={{color:"#999"}}>{fmt(plan)}</span>
            <input style={{...S.inp,width:58,height:26,fontSize:11}} value={actual||""} onChange={e=>updateExpense(c.id,"actual",e.target.value)} placeholder="0"/>
            <span style={{fontSize:10,color:diff>=0?C.grn:C.red}}>{diff>=0?"+":""}{fN(diff)}</span>
            <input style={{...S.inp,height:26,fontSize:10}} value={md.expenses[c.id]?.comment||""} onChange={e=>updateExpense(c.id,"comment",e.target.value)} placeholder="komentar"/>
          </div>})}
      </div>
      <div style={S.st}>Variabilni stroški</div>
      <div style={S.card}>
        {VAR_CATS.filter(c=>c.id!=="unexpected").map(c=>{const plan=md.expenses[c.id]?.plan||0;const actual=md.expenses[c.id]?.actual||0;const diff=plan-actual;
          return<div key={c.id} style={{display:"grid",gridTemplateColumns:"1.5fr 65px 65px 55px 1fr",gap:4,fontSize:11,alignItems:"center",padding:"5px 0",borderBottom:`1px solid ${C.fnt}`}}>
            <span style={{fontWeight:500}}>{c.name.length>22?c.name.substring(0,20)+"…":c.name}</span><span style={{color:"#999"}}>{fmt(plan)}</span>
            <input style={{...S.inp,width:58,height:26,fontSize:11}} value={actual||""} onChange={e=>updateExpense(c.id,"actual",e.target.value)} placeholder="0"/>
            <span style={{fontSize:10,color:diff>=0?C.grn:C.red}}>{diff>=0?"+":""}{fN(diff)}</span>
            <input style={{...S.inp,height:26,fontSize:10}} value={md.expenses[c.id]?.comment||""} onChange={e=>updateExpense(c.id,"comment",e.target.value)} placeholder="komentar"/>
          </div>})}
      </div>
      <div style={S.st}>Nepredvideni stroški <span style={S.tag("#dcfce7","#166534")}>pametni vnos</span></div>
      <div style={S.card}>
        <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:8}}>
          <select style={{...S.sel,flex:1}} value={uDesc} onChange={e=>{setUDesc(e.target.value);if(e.target.value==="__custom__")setUDesc("")}}><option value="">Izberi...</option>{KNOWN_UNEXPECTED.map(k=><option key={k} value={k}>{k}</option>)}<option value="__custom__">+ Drugo</option></select>
          {uDesc===""&&<input style={{...S.inp,width:90}} value={uCustom} onChange={e=>setUCustom(e.target.value)} placeholder="Opis"/>}
          <input style={{...S.inp,width:65}} type="number" value={uAmt} onChange={e=>setUAmt(e.target.value)} placeholder="€"/>
          <select style={{...S.sel,width:75}} value={uPerson} onChange={e=>setUPerson(e.target.value)}><option>Kristina</option><option>Tadej</option></select>
          <button style={{...S.btn(true),padding:"0 10px"}} onClick={()=>{addUnexpected(uDesc||uCustom,uAmt,uPerson);setUDesc("");setUAmt("");setUCustom("")}}>+</button>
        </div>
        {(md.unexpectedItems||[]).map((it,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"3px 0",borderBottom:`1px solid ${C.fnt}`}}><span>{it.desc}</span><span>{fmt(it.amount)} <span style={{color:"#999"}}>({it.person})</span></span></div>)}
        {(md.unexpectedItems||[]).length>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,fontWeight:600,padding:"6px 0 0"}}><span>Skupaj</span><span>{fmt(md.unexpectedItems.reduce((s,i)=>s+i.amount,0))}</span></div>}
      </div>
      <div style={S.st}>Hitro dodaj cilj <span style={S.tag("#dbeafe",C.blu)}>sinhronizirano</span></div>
      {showNewGoal?<GoalForm inline/>:<button style={{...S.btn(false),fontSize:11}} onClick={()=>setShowNewGoal(true)}>+ Nov cilj</button>}
    </div>
  };

  // ===================== LETNI PREGLED =====================
  const AnnualView=()=><div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}><h2 style={{fontSize:20,fontWeight:700,margin:0}}>Letni pregled</h2><YearPicker/></div>
    <div style={S.st}>Pravila analize</div>
    <div style={S.card}>
      {analysisRules.map((r,i)=><div key={r.id} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 0",borderBottom:`1px solid ${C.fnt}`,fontSize:11,flexWrap:"wrap"}}>
        <span style={{color:C.blu,fontWeight:600}}>{i+1}.</span>
        <select style={S.sel}><option>Primerjaj</option><option>Trend</option><option>Povprečje</option></select>
        <select style={S.sel}><option>Jan–Apr {dashYear}</option><option>Q1 {dashYear}</option><option>H1 {dashYear}</option><option>Celotno {dashYear}</option></select>
        <span style={{color:"#999"}}>z</span>
        <select style={S.sel}>{[dashYear-1,dashYear-2,dashYear-3].map(y=><option key={y}>Celotno {y}</option>)}<option>Poljubno...</option></select>
        <select style={S.sel}><option>Vse</option><option>Fiksni</option><option>Variabilni</option>{ALL_CATS.map(c=><option key={c.id}>{c.name}</option>)}</select>
        <button style={{...S.btn(true),height:26,fontSize:10,padding:"0 8px"}}>Zaženi</button>
      </div>)}
      <button style={{...S.btn(false),marginTop:8,fontSize:10}} onClick={()=>setAnalysisRules(r=>[...r,{id:Date.now()}])}>+ Dodaj pravilo</button>
    </div>
    <div style={S.st}>Pregled — {dashYear}</div>
    <div style={{...S.card,overflowX:"auto"}}>
      <table style={{width:"100%",fontSize:11,borderCollapse:"collapse"}}>
        <thead><tr style={{color:C.mut}}><th style={{textAlign:"left",padding:"4px 8px",fontWeight:600}}>Kategorija</th>{MS.map(m=><th key={m} style={{textAlign:"right",padding:"4px 5px",fontWeight:500}}>{m}</th>)}<th style={{textAlign:"right",padding:"4px 8px",fontWeight:700}}>Skupaj</th></tr></thead>
        <tbody>{ALL_CATS.map(c=>{let total=0;return<tr key={c.id} style={{borderTop:`1px solid ${C.fnt}`}}>
          <td style={{padding:"3px 8px",fontWeight:500,maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</td>
          {Array.from({length:12},(_,i)=>{const v=yd[i]?.expenses[c.id]?.actual||0;total+=v;return<td key={i} style={{textAlign:"right",padding:"3px 5px",color:v>0?"#333":"#ccc"}}>{v>0?fN(v):"—"}</td>})}
          <td style={{textAlign:"right",padding:"3px 8px",fontWeight:700}}>{total>0?fmt(total):"—"}</td>
        </tr>})}</tbody>
      </table>
    </div>
    <div style={S.card}><div style={S.st}>Trend {compareYear?`(${dashYear} vs ${compareYear})`:""}</div>
      <ResponsiveContainer width="100%" height={180}><LineChart data={trendData}><XAxis dataKey="name" tick={{fontSize:10}} axisLine={false}/><YAxis tick={{fontSize:10}} axisLine={false}/><Tooltip formatter={v=>fmt(v)} contentStyle={{fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/>
        <Line type="monotone" dataKey="Prihodki" stroke={C.grn} strokeWidth={2} dot={{r:3}}/><Line type="monotone" dataKey="Odhodki" stroke={C.red} strokeWidth={2} dot={{r:3}}/>
        {compareYear&&<Line type="monotone" dataKey={`Prihodki ${compareYear}`} stroke={C.grn} strokeWidth={1} strokeDasharray="5 5" dot={false}/>}
        {compareYear&&<Line type="monotone" dataKey={`Odhodki ${compareYear}`} stroke={C.red} strokeWidth={1} strokeDasharray="5 5" dot={false}/>}
      </LineChart></ResponsiveContainer>
    </div>
  </div>;

  // ===================== CILJI =====================
  const GoalsView=()=><div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h2 style={{fontSize:20,fontWeight:700,margin:0}}>Proračunski cilji</h2><button style={S.btn(true)} onClick={()=>setShowNewGoal(!showNewGoal)}>+ Nov cilj</button></div>
    {showNewGoal&&<GoalForm/>}
    {goals.map(g=>{const p=g.target>0?pc(g.current,g.target):0;const col=g.type==="limit"?(p>90?C.red:p>70?C.org:C.grn):C.blu;
      return<div key={g.id} style={S.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><span style={{fontSize:14,fontWeight:600}}>{g.name}</span><span style={S.tag(g.type==="saving"?"#dbeafe":"#fef3c7",g.type==="saving"?C.blu:"#92400e")}>{g.type==="saving"?"varčevalni":"limit"}</span></div>
        <div style={{fontSize:18,fontWeight:700}}>{fmt(g.current)} / {fmt(g.target)}</div>
        <div style={{...S.pb,margin:"6px 0"}}><div style={S.pf(p,col)}/></div>
        <div style={{fontSize:10,color:C.mut}}>{p}% {g.monthly>0?`— €${g.monthly}/mes`:""}</div>
      </div>
    })}
  </div>;

  // ===================== SIMULACIJA =====================
  const SimView=()=><div>
    <h2 style={{fontSize:20,fontWeight:700,margin:"0 0 12px"}}>Finančna simulacija</h2>
    <div style={S.card}><div style={S.st}>Časovni okvir</div>
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:11,color:C.mut}}>Od:</span><input type="date" style={S.inp} value={simFrom} onChange={e=>setSimFrom(e.target.value)}/></div>
        <div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:11,color:C.mut}}>Do:</span><input type="date" style={S.inp} value={simTo} onChange={e=>setSimTo(e.target.value)}/></div>
      </div>
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{[["1 leto","2027-04-30"],["3 leta","2029-04-30"],["5 let","2031-04-30"],["10 let","2036-04-30"]].map(([l,d])=><button key={l} style={{...S.btn(simTo===d),fontSize:10,height:26}} onClick={()=>setSimTo(d)}>{l}</button>)}</div>
    </div>
    <div style={S.card}><div style={S.st}>Predpostavke <span style={S.tag("#dcfce7","#166534")}>podpira +/−</span></div>
      <div style={{fontSize:10,color:C.mut,marginBottom:8}}>Negativne vrednosti simulirajo recesijo, znižanje plače, deflacijo.</div>
      {[
        ["Rast plač (%/leto)",simSalaryGrowth,setSimSalaryGrowth,-15,15,"%"],
        ["Inflacija (%/leto)",simInflation,setSimInflation,-10,10,"%"],
        ["Rast stroškov vrtca (%)",simChildCost,setSimChildCost,-10,15,"%"],
        ["Dod. naložbe/mesec",simExtraInvest,setSimExtraInvest,-500,500,"€"],
      ].map(([label,val,setter,min,max,unit])=><div key={label} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
        <span style={{fontSize:11,color:C.mut,minWidth:155}}>{label}</span>
        <input type="range" min={min} max={max} value={val} onChange={e=>setter(parseInt(e.target.value))} style={{flex:1}}/>
        <span style={{fontSize:12,fontWeight:600,minWidth:44,textAlign:"right",color:val<0?C.red:val>0?C.grn:C.mut}}>
          {val>0?"+":""}{unit==="€"?`€${val}`:val+"%"}
        </span>
      </div>)}
    </div>
    <div style={S.card}><div style={S.st}>Projekcija</div>
      <ResponsiveContainer width="100%" height={200}><BarChart data={simData} barGap={2}><XAxis dataKey="name" tick={{fontSize:10}} axisLine={false}/><YAxis tick={{fontSize:9}} axisLine={false} tickFormatter={v=>`€${Math.round(v/1000)}k`}/><Tooltip formatter={v=>fmt(v)} contentStyle={{fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/>
        <Bar dataKey="Prihodki" fill={C.grn} radius={[3,3,0,0]} barSize={16}/><Bar dataKey="Odhodki" fill={C.red} radius={[3,3,0,0]} barSize={16} opacity={0.6}/><Bar dataKey="Prihranki" fill={C.blu} radius={[3,3,0,0]} barSize={16} opacity={0.8}/>
      </BarChart></ResponsiveContainer>
    </div>
    <div style={S.card}><div style={S.st}>Kaj če...?</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{["Drugi otrok 2028","Hipoteka 2027","Povišica 10%","Izguba službe","Selitev"].map(s=><button key={s} style={{...S.btn(false),fontSize:10}}>{s} ↗</button>)}</div>
    </div>
  </div>;

  // ===================== % RAZDELITEV =====================
  const PctView=()=>{const totalPc=Object.values(budgetPct).reduce((s,v)=>s+v,0);const base=totalIncome||3600;
    return<div><h2 style={{fontSize:20,fontWeight:700,margin:"0 0 6px"}}>% razdelitev</h2>
      <div style={{fontSize:11,color:C.mut,marginBottom:12}}>Ob prihodku {fmt(base)} se izračuna ciljni znesek.</div>
      <div style={S.card}>{ALL_CATS.map(c=><div key={c.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:`1px solid ${C.fnt}`}}>
        <span style={{minWidth:130,fontSize:11,fontWeight:500}}>{c.name.length>20?c.name.substring(0,18)+"…":c.name}</span>
        <input type="range" min={0} max={50} value={budgetPct[c.id]||0} onChange={e=>setBudgetPct(p=>({...p,[c.id]:parseInt(e.target.value)}))} style={{flex:1}}/>
        <span style={{fontSize:12,fontWeight:600,minWidth:32,textAlign:"right"}}>{budgetPct[c.id]||0}%</span>
        <span style={{fontSize:11,color:C.mut,minWidth:55,textAlign:"right"}}>{fmt(Math.round(base*(budgetPct[c.id]||0)/100))}</span>
      </div>)}
        <div style={{display:"flex",justifyContent:"space-between",marginTop:10,padding:"8px 0 0",borderTop:`2px solid ${C.brd}`}}>
          <span style={{fontSize:12,fontWeight:700,color:totalPc===100?C.grn:totalPc>100?C.red:C.org}}>Skupaj: {totalPc}% = {fmt(Math.round(base*totalPc/100))}</span>
          <button style={S.btn(true)} onClick={()=>{ALL_CATS.forEach(c=>updateExpense(c.id,"plan",Math.round(base*(budgetPct[c.id]||0)/100)))}}>Uporabi kot plan</button>
        </div>
      </div>
    </div>
  };

  // ===================== CRYPTO =====================
  const CryptoView=()=>{
    if(!cryptoUnlocked)return<div style={{...S.card,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"3rem",textAlign:"center"}}>
      <div style={{fontSize:40,marginBottom:12}}>🔒</div><div style={{fontSize:16,fontWeight:700,marginBottom:4}}>Kripto sekcija</div>
      <div style={{fontSize:12,color:C.mut,maxWidth:250,marginBottom:12}}>Zaščiteno z geslom.</div>
      <div style={{display:"flex",gap:6}}><input type="password" style={{...S.inp,width:160}} value={cryptoPwd} onChange={e=>setCryptoPwd(e.target.value)} placeholder="Geslo" onKeyDown={e=>{if(e.key==="Enter"&&cryptoPwd.length>=4)setCryptoUnlocked(true)}}/><button style={S.btn(true)} onClick={()=>{if(cryptoPwd.length>=4)setCryptoUnlocked(true)}}>Odkleni</button></div>
    </div>;
    return<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h2 style={{fontSize:20,fontWeight:700,margin:0}}>Kripto portfelj</h2><button style={{...S.btn(false),fontSize:10}} onClick={()=>{setCryptoUnlocked(false);setCryptoPwd("")}}>Zakleni 🔒</button></div>
      <div style={S.card}><table style={{width:"100%",fontSize:12,borderCollapse:"collapse"}}>
        <thead><tr style={{color:C.mut,borderBottom:"1px solid #eee"}}><th style={{textAlign:"left",padding:6}}>Kovanec</th><th style={{textAlign:"right",padding:6}}>Količina</th><th style={{textAlign:"right",padding:6}}>Povp. cena</th><th style={{textAlign:"right",padding:6}}>Vrednost</th></tr></thead>
        <tbody>{cryptoHoldings.map((h,i)=><tr key={i} style={{borderBottom:`1px solid ${C.fnt}`}}>
          <td style={{padding:6}}><input style={{...S.inp,width:60,fontWeight:600}} value={h.coin} onChange={e=>{const n=[...cryptoHoldings];n[i].coin=e.target.value;setCryptoHoldings(n)}}/></td>
          <td style={{textAlign:"right",padding:6}}><input type="number" step="0.01" style={{...S.inp,width:80,textAlign:"right"}} value={h.amount} onChange={e=>{const n=[...cryptoHoldings];n[i].amount=parseFloat(e.target.value)||0;setCryptoHoldings(n)}}/></td>
          <td style={{textAlign:"right",padding:6}}><input type="number" style={{...S.inp,width:80,textAlign:"right"}} value={h.avgPrice} onChange={e=>{const n=[...cryptoHoldings];n[i].avgPrice=parseFloat(e.target.value)||0;setCryptoHoldings(n)}}/></td>
          <td style={{textAlign:"right",padding:6,fontWeight:600}}>{fmt(Math.round(h.amount*h.avgPrice))}</td>
        </tr>)}</tbody>
      </table><button style={{...S.btn(false),marginTop:8,fontSize:10}} onClick={()=>setCryptoHoldings(h=>[...h,{coin:"",amount:0,avgPrice:0}])}>+ Dodaj</button></div>
      <div style={S.met}><div style={S.lab}>Skupna vrednost</div><div style={S.val(C.pur)}>{fmt(cryptoHoldings.reduce((s,h)=>s+Math.round(h.amount*h.avgPrice),0))}</div></div>
    </div>
  };

  const views={dash:DashView,entry:EntryView,annual:AnnualView,goals:GoalsView,sim:SimView,pct:PctView,crypto:CryptoView};
  const V=views[view]||DashView;
  return<div style={{fontFamily:"'Segoe UI',system-ui,-apple-system,sans-serif",color:C.txt,minHeight:"100vh",background:C.bg}}>
    <div style={S.nav}>{[["dash","Nadzorna plošča"],["entry","Mesečni vnos"],["annual","Letni pregled"],["goals","Cilji"],["sim","Simulacija"],["pct","% razdelitev"],["crypto","🔒"]].map(([k,l])=><div key={k} style={S.ni(view===k)} onClick={()=>setView(k)}>{l}</div>)}</div>
    <div style={{padding:"1.25rem"}}><V/></div>
  </div>;
}
