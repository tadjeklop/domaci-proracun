import React, { useState, useEffect, useRef, useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend, AreaChart, Area } from "recharts";
import * as XLSX from 'xlsx';
import BankImport from './components/BankImport.jsx';
import { parseNL, extractKeyword } from './lib/bankImport.js';
import InstallPrompt from './components/InstallPrompt.jsx';
import { pushToCloud, pullFromCloud, collectSyncData, applySyncData } from './lib/cloudSync.js';
import { MF, MS, CL, CATS, IT, KU, QUIZ_QS, BEHAVIOR_TAGS, AS, PROF_TEMPLATES, DASH_SECTIONS, VIEW_PROFILE_PRESETS, LOCAL_AUTH_DISABLED, FEATURE_RECOMMENDATIONS, HOVER_HELP_PAGES, HELP } from './lib/constants.js';
import { C, SH, SHL, GR, GRW, FF, sC, sM, sI, sS, sB, sT, aBtn, aInp, aPg, aCd, moneyText, compactMoney, kpiBox, metricGrid } from './lib/styles.js';
import { fmt, fN, pc, initM, initY, ld, sv, cT, fxT, vrT, iT, pctDiff, uxtT, simTooltip, hp } from './lib/helpers.js';
import { initProfiles, downloadEncryptedDebugBundle, createBackup, restoreBackup, checkBackupDue } from './lib/storage.js';
import { sHash, hPwd, ensureSuperadmin } from './lib/auth.js';
import { printMonthlyReport } from './lib/report.js';
import EB from './components/ErrorBoundary.jsx';
import { PSlider, AddCI, AddUX, AddGoal, CreateUserForm } from './components/forms.jsx';
import CalcInput from './components/CalcInput.jsx';
import CatEntry from './components/CatEntry.jsx';
import FinancialSimulationTab from './modules/finance/simulation/FinancialSimulationTab.jsx';

function useWindowWidth(){const[w,setW]=useState(()=>window.innerWidth);useEffect(()=>{const h=()=>setW(window.innerWidth);window.addEventListener('resize',h);return()=>window.removeEventListener('resize',h)},[]);return w}

// ===== MAIN APP =====
export default function App(){
  const[ready,setReady]=useState(false);
  useEffect(()=>{ensureSuperadmin().then(()=>setReady(true))},[]);

  const[authSt,setAuthSt]=useState(()=>LOCAL_AUTH_DISABLED?'auth':(sessionStorage.getItem('dp_s')?'auth':'init'));
  const[curUser,setCurUser]=useState(()=>LOCAL_AUTH_DISABLED?'Tadej':(sessionStorage.getItem('dp_u')||null));
  const[curRole,setCurRole]=useState(()=>LOCAL_AUTH_DISABLED?'superadmin':(sessionStorage.getItem('dp_r')||null));
  const[lU,setLU]=useState('');const[lP,setLP]=useState('');
  const[sU,setSU]=useState('');const[sP,setSP]=useState('');const[sP2,setSP2]=useState('');
  const[aErr,setAErr]=useState('');const[att,setAtt]=useState(0);const[lock,setLock]=useState(0);const[showForgot,setShowForgot]=useState(false);
  const[pendingRegs,setPendingRegs]=useState(()=>ld('dp_pending',[]));

  // App state
  const[vw,setVw]=useState("dash");const[mo,setMo]=useState(new Date().getMonth());const[yr,setYr]=useState(2026);
  const[data,setData]=useState(()=>ld('dp_data',{2026:initY()}));
  const[cLog,setCLog]=useState(()=>ld('dp_log',[]));
  const[goals,setGoals]=useState(()=>ld('dp_goals',[]));
  const[budgetProfiles,setBudgetProfiles]=useState(initProfiles);
  const[activeProfId,setActiveProfId]=useState(()=>ld('dp_activeprofid',(initProfiles().find(p=>p.isDefault)||initProfiles()[0])?.id||'moj_plan'));
  const[scratchBudget,setScratchBudget]=useState(0);
  const[cryU,setCryU]=useState(false);const[cryP,setCryP]=useState("");
  const[cryH,setCryH]=useState(()=>ld('dp_cry',[{coin:"BTC",amount:0.05,avgPrice:45000},{coin:"ETH",amount:1.2,avgPrice:3200}]));
  const[compYr,setCompYr]=useState(null);const[showImp,setShowImp]=useState(false);const[showBankImp,setShowBankImp]=useState(false);const[impYr,setImpYr]=useState(2025);
  const[impPrev,setImpPrev]=useState(null);const[impLog,setImpLog]=useState([]);
  const[showNG,setShowNG]=useState(false);const[showSavCfg,setShowSavCfg]=useState(false);
  const[savVis,setSavVis]=useState(()=>ld('dp_sv',["vacSav","etf","tradeRep"]));
  const[billDueDays,setBillDueDays]=useState(()=>ld('dp_billdays',{})); // {subId: dayOfMonth}
  const[syncUrl,setSyncUrl]=useState(()=>ld('dp_syncurl',''));
  const[syncToken,setSyncToken]=useState(()=>ld('dp_synctok',''));
  const[syncPwd,setSyncPwd]=useState(()=>ld('dp_syncpwd',''));
  const[syncStatus,setSyncStatus]=useState(''); // '', 'syncing', 'ok', 'err:...'
  const[syncLastPush,setSyncLastPush]=useState(()=>ld('dp_synclastpush',null));
  const[simFrom,setSimFrom]=useState("2026-05-01");const[simTo,setSimTo]=useState("2029-04-30");
  const[simG,setSimG]=useState(3);const[simI,setSimI]=useState(2);const[simE,setSimE]=useState(100);
  const[simUx,setSimUx]=useState(()=>ld('dp_simux','classic'));
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
  const[customSubs,setCustomSubs]=useState(()=>ld('dp_customsubs',{})); // {catId:[{id,nm,dp}]}
  const[customCatGroups,setCustomCatGroups]=useState(()=>ld('dp_customcatgroups',[])); // [{id,nm,tp,subs:[]}]
  const[subOrder,setSubOrder]=useState(()=>ld('dp_suborder',{})); // {catId:[subId,...]}
  const[subAlerts,setSubAlerts]=useState(()=>ld('dp_subalerts',{})); // {subId: threshold%}
  const[planManageMode,setPlanManageMode]=useState(false);
  const[addSubCat,setAddSubCat]=useState(null); // catId of category being expanded for add
  const[addSubNm,setAddSubNm]=useState('');
  const[addCatGrpForm,setAddCatGrpForm]=useState(null); // {nm:'',tp:'var'} when open
  const[showPlanHistory,setShowPlanHistory]=useState(false);
  const[bulkAdjType,setBulkAdjType]=useState('all');const[bulkAdjPct,setBulkAdjPct]=useState(0);
  const[expandBreakdown,setExpandBreakdown]=useState({}); // which subcategory breakdowns are expanded
  const[txnInput,setTxnInput]=useState({}); // transaction input values per subcategory
  const[auditLog,setAuditLog]=useState(()=>ld('dp_audit',[]));
  const[adminConf,setAdminConf]=useState(()=>ld('dp_adminconf',{Kristina:{varsav:true,crypto:true,settings:true}}));
  const[hoveredMetric,setHoveredMetric]=useState(null); // for showing visible tooltips
  // Savings section
  const[savUnlocked,setSavUnlocked]=useState(false);const[savPwd,setSavPwd]=useState('');
  const[savData,setSavData]=useState(()=>ld('dp_savdata',{members:[]}));
  const[nwAssets,setNwAssets]=useState(()=>ld('dp_nwassets',[]));
  const[nwLiabs,setNwLiabs]=useState(()=>ld('dp_nwliabs',[]));
  const[nwHist,setNwHist]=useState(()=>ld('dp_nwhist',[]));
  // Wishlist section
  const[wishes,setWishes]=useState(()=>ld('dp_wishes',[]));
  const[occasions,setOccasions]=useState(()=>ld('dp_occasions',["Rojstni dan","Novo leto","Božič","Obletnica","Drugi praznik"]));
  const[wishForm,setWishForm]=useState({member:"Tadej",wish:"",desc:"",link:"",comment:""});
  const WISH_MEMBERS=["Tadej","Kristina","Leon","Erik"];
  // Editable lists
  const[itList,setItList]=useState(()=>ld('dp_it',["Plača","Nagrada","Regres","Božičnica","Otroški dodatek","Porodniška","Refund"]));
  const[kuList,setKuList]=useState(()=>ld('dp_ku',["Amazon","HM","About You","Sports Direct","Mohito","Notino","Stradivarius","Grand Hotel Bernardin","Best Secret","Equa","Lelosi","DDStepOnline","Fever vstopnice"]));
  // Tab customization
  const[tabHidden,setTabHidden]=useState(()=>ld('dp_tabhidden',[]));
  const[tabNames,setTabNames]=useState(()=>ld('dp_tabnames',{}));
  const[showPayday,setShowPayday]=useState(false);
  // Mesečni vnos
  const[hideIncome,setHideIncome]=useState(()=>ld('dp_hideinc',false));
  // Settings UI
  const[settingsOpen,setSettingsOpen]=useState({account:true,guide:false,onboarding:false,features:false,automation:false,household:false,security:false,tabs:false,cats:false,lists:false,sync:false,data:false,receipts:false,privacy:false,locale:false,terms:false,snapshots:false,alerts:false});
  const togSec=(k)=>setSettingsOpen(p=>({...p,[k]:!p[k]}));
  // Plan tab profile UI
  const[showNewProf,setShowNewProf]=useState(false);const[newProfName,setNewProfName]=useState('');
  const[renamingProf,setRenamingProf]=useState(false);const[renameName,setRenameName]=useState('');
  // Settings
  const[sNP,setSNP]=useState('');const[sNP2,setSNP2]=useState('');const[sCP,setSCP]=useState('');const[sMsg,setSMsg]=useState('');
  // Lifted from IIFEs (hooks-in-IIFE fix)
  const[showBillCfg,setShowBillCfg]=useState(false);
  const[nlText,setNlText]=useState('');const[nlSel,setNlSel]=useState(null);
  const[showNWEdit,setShowNWEdit]=useState(false);
  const[payAlloc,setPayAlloc]=useState({});
  // #11 Retrospective
  const[showRetro,setShowRetro]=useState(false);const[retroStep,setRetroStep]=useState(0);
  // #12 Calendar
  const[showCalendar,setShowCalendar]=useState(false);
  // #13 Coach tips
  const[coachTips,setCoachTips]=useState(()=>ld('dp_coach',[]));
  // #14 Scenario builder
  const[scenarioItems,setScenarioItems]=useState(()=>ld('dp_scenario',[]));
  const[showScenario,setShowScenario]=useState(false);
  // #15 Per-person tracking
  const[showPersonBreak,setShowPersonBreak]=useState(false);
  // #16 Recurring templates
  const[txnTemplates,setTxnTemplates]=useState(()=>ld('dp_txntpls',[]));
  const[showTemplates,setShowTemplates]=useState(false);
  const[tplSaveName,setTplSaveName]=useState('');
  // #17 Emergency fund
  const[efCfg,setEfCfg]=useState(()=>ld('dp_efcfg',{months:6,subId:''}));
  // #18 Year-end ceremony
  const[showYearEnd,setShowYearEnd]=useState(false);const[yearEndStep,setYearEndStep]=useState(0);
  // #20 Auto-backup on close
  const[autoBackup,setAutoBackup]=useState(()=>ld('dp_autobackup',false));
  // #22 YoY heatmap
  const[showYoY,setShowYoY]=useState(false);
  // #24 Cost per day
  const[showPerDay,setShowPerDay]=useState(false);
  // #26 Alert rules
  const[alertRules,setAlertRules]=useState(()=>ld('dp_alertrules',[]));
  // #29 Monthly quiz
  const[quizAnswers,setQuizAnswers]=useState(()=>ld('dp_quizans',{}));
  // #31 Debt payoff
  const[debts,setDebts]=useState(()=>ld('dp_debts',[]));
  const[debtMethod,setDebtMethod]=useState(()=>ld('dp_debtmeth','snowball'));
  const[showAddDebt,setShowAddDebt]=useState(false);
  // #32 Subscriptions
  const[subscriptions,setSubscriptions]=useState(()=>ld('dp_subscriptions',[]));
  const[showSubForm,setShowSubForm]=useState(false);
  // #37 Investment tracking
  const[invAccounts,setInvAccounts]=useState(()=>ld('dp_invaccts',[]));
  const[showAddInv,setShowAddInv]=useState(false);
  // #34 Sparklines toggle
  const[showSparks,setShowSparks]=useState(false);
  // #40 Global transaction search
  const[showSearch,setShowSearch]=useState(false);
  const[searchQ,setSearchQ]=useState('');
  // #42 Quick-add floating button
  const[showQuickAdd,setShowQuickAdd]=useState(false);
  // #43 Recurring income templates
  const[incomeTemplates,setIncomeTemplates]=useState(()=>ld('dp_inctpls',[]));
  // #44 Spending by merchant toggle
  const[showMerchants,setShowMerchants]=useState(false);
  // #45 Category budget rollover
  const[rolloverSubs,setRolloverSubs]=useState(()=>ld('dp_rollover',[]));
  // #48 Net worth milestones
  const[nwMilestones,setNwMilestones]=useState(()=>ld('dp_nwmilestones',[10000,25000,50000,100000]));
  // #49 Dashboard widget visibility
  const[dashWidgets,setDashWidgets]=useState(()=>ld('dp_dashwidgets',{}));
  const[dashOrder,setDashOrder]=useState(()=>ld('dp_dashorder',DASH_SECTIONS.map(([k])=>k)));
  const[dashCostTextSize,setDashCostTextSize]=useState(()=>ld('dp_dashcosttext',15));
  const[dashClosed,setDashClosed]=useState(()=>ld('dp_dashclosed',{}));
  const[dragDashKey,setDragDashKey]=useState(null);
  const[showDashCfg,setShowDashCfg]=useState(false);
  // #50 Basic/advanced user mode (global)
  const[uiMode,setUiMode]=useState(()=>ld('dp_uimode','basic'));
  const[viewProfiles,setViewProfiles]=useState(()=>ld('dp_viewprofiles',{}));
  const[showTips,setShowTips]=useState(()=>ld('dp_showtips',false));
  const[hoverHelpEnabled,setHoverHelpEnabled]=useState(()=>ld('dp_hoverhelpenabled',true));
  const[hoverHelpMode,setHoverHelpMode]=useState(()=>ld('dp_hoverhelpmode','context')==="hover"?"context":ld('dp_hoverhelpmode','context'));
  const[hoverHelpPages,setHoverHelpPages]=useState(()=>({...HOVER_HELP_PAGES,...ld('dp_hoverhelppages',{})}));
  const[hoverHelp,setHoverHelp]=useState(null);
  const hoverHelpTimer=useRef(null);
  const hoverHelpTarget=useRef(null);
  const[copilotQ,setCopilotQ]=useState('');
  const[copilotA,setCopilotA]=useState('');
  const[timelineFilter,setTimelineFilter]=useState('all');
  const[reportFilter,setReportFilter]=useState({from:`${yr}-01`,to:`${yr}-12`,person:'all',cat:'all',tag:'all',min:'',max:''});
  const[savedReports,setSavedReports]=useState(()=>ld('dp_reports',[]));
  const[automationRules,setAutomationRules]=useState(()=>ld('dp_autorules',[]));
  const[autoRuleForm,setAutoRuleForm]=useState({name:'',keyword:'',targetSubId:'groc'});
  const[appPrefs,setAppPrefs]=useState(()=>ld('dp_prefs',{country:'SI',currency:'EUR',dateFormat:'sl-SI',storage:'local',offline:true}));
  const[household,setHousehold]=useState(()=>ld('dp_household',{members:[{name:"Tadej",role:"superadmin",share:"Skupno",active:true},{name:"Kristina",role:"član",share:"Skupno",active:true},{name:"Leon",role:"otrok",share:"Družina",active:true},{name:"Erik",role:"otrok",share:"Družina",active:true}],rules:{defaultExpense:"Skupaj",privateMode:false}}));
  const[onboarding,setOnboarding]=useState(()=>ld('dp_onboarding',{done:false,step:0}));
  const[showOnboarding,setShowOnboarding]=useState(()=>!ld('dp_onboarding',{done:false}).done);

  // Persist
  useEffect(()=>{sv('dp_data',data)},[data]);useEffect(()=>{sv('dp_log',cLog.slice(0,200))},[cLog]);useEffect(()=>{sv('dp_goals',goals)},[goals]);useEffect(()=>{sv('dp_cry',cryH)},[cryH]);useEffect(()=>{sv('dp_profiles',budgetProfiles)},[budgetProfiles]);useEffect(()=>{sv('dp_activeprofid',activeProfId)},[activeProfId]);useEffect(()=>{sv('dp_sv',savVis)},[savVis]);useEffect(()=>{sv('dp_savdata',savData)},[savData]);useEffect(()=>{sv('dp_nwassets',nwAssets)},[nwAssets]);useEffect(()=>{sv('dp_nwliabs',nwLiabs)},[nwLiabs]);useEffect(()=>{sv('dp_nwhist',nwHist)},[nwHist]);useEffect(()=>{sv('dp_pending',pendingRegs)},[pendingRegs]);useEffect(()=>{sv('dp_simux',simUx)},[simUx]);useEffect(()=>{sv('dp_simman',simManual)},[simManual]);useEffect(()=>{sv('dp_simcats',simCats)},[simCats]);useEffect(()=>{sv('dp_simret',simReturn)},[simReturn]);useEffect(()=>{sv('dp_siminit',simInitial)},[simInitial]);useEffect(()=>{sv('dp_simev',simEvents)},[simEvents]);useEffect(()=>{sv('dp_adminviews',adminViews)},[adminViews]);useEffect(()=>{sv('dp_subvis',subVis)},[subVis]);useEffect(()=>{sv('dp_subren',subRename)},[subRename]);useEffect(()=>{sv('dp_customsubs',customSubs)},[customSubs]);useEffect(()=>{sv('dp_customcatgroups',customCatGroups)},[customCatGroups]);useEffect(()=>{sv('dp_suborder',subOrder)},[subOrder]);useEffect(()=>{sv('dp_subalerts',subAlerts)},[subAlerts]);useEffect(()=>{sv('dp_audit',auditLog.slice(0,500))},[auditLog]);useEffect(()=>{sv('dp_adminconf',adminConf)},[adminConf]);useEffect(()=>{sv('dp_it',itList)},[itList]);useEffect(()=>{sv('dp_ku',kuList)},[kuList]);useEffect(()=>{sv('dp_wishes',wishes)},[wishes]);useEffect(()=>{sv('dp_occasions',occasions)},[occasions]);useEffect(()=>{sv('dp_tabhidden',tabHidden)},[tabHidden]);useEffect(()=>{sv('dp_tabnames',tabNames)},[tabNames]);useEffect(()=>{sv('dp_hideinc',hideIncome)},[hideIncome]);useEffect(()=>{sv('dp_billdays',billDueDays)},[billDueDays]);useEffect(()=>{sv('dp_syncurl',syncUrl)},[syncUrl]);useEffect(()=>{sv('dp_synctok',syncToken)},[syncToken]);useEffect(()=>{sv('dp_syncpwd',syncPwd)},[syncPwd]);useEffect(()=>{sv('dp_synclastpush',syncLastPush)},[syncLastPush]);useEffect(()=>{sv('dp_coach',coachTips)},[coachTips]);useEffect(()=>{sv('dp_scenario',scenarioItems)},[scenarioItems]);useEffect(()=>{sv('dp_txntpls',txnTemplates)},[txnTemplates]);useEffect(()=>{sv('dp_efcfg',efCfg)},[efCfg]);useEffect(()=>{sv('dp_autobackup',autoBackup)},[autoBackup]);useEffect(()=>{sv('dp_alertrules',alertRules)},[alertRules]);useEffect(()=>{sv('dp_quizans',quizAnswers)},[quizAnswers]);useEffect(()=>{sv('dp_debts',debts)},[debts]);useEffect(()=>{sv('dp_debtmeth',debtMethod)},[debtMethod]);useEffect(()=>{sv('dp_subscriptions',subscriptions)},[subscriptions]);useEffect(()=>{sv('dp_invaccts',invAccounts)},[invAccounts]);useEffect(()=>{sv('dp_inctpls',incomeTemplates)},[incomeTemplates]);useEffect(()=>{sv('dp_rollover',rolloverSubs)},[rolloverSubs]);useEffect(()=>{sv('dp_nwmilestones',nwMilestones)},[nwMilestones]);useEffect(()=>{sv('dp_dashwidgets',dashWidgets)},[dashWidgets]);useEffect(()=>{sv('dp_dashorder',dashOrder)},[dashOrder]);useEffect(()=>{sv('dp_dashcosttext',dashCostTextSize)},[dashCostTextSize]);useEffect(()=>{sv('dp_dashclosed',dashClosed)},[dashClosed]);useEffect(()=>{sv('dp_uimode',uiMode)},[uiMode]);useEffect(()=>{sv('dp_viewprofiles',viewProfiles)},[viewProfiles]);useEffect(()=>{sv('dp_showtips',showTips)},[showTips]);
  useEffect(()=>{sv('dp_hoverhelpenabled',hoverHelpEnabled)},[hoverHelpEnabled]);
  useEffect(()=>{sv('dp_hoverhelpmode',hoverHelpMode)},[hoverHelpMode]);
  useEffect(()=>{sv('dp_hoverhelppages',hoverHelpPages)},[hoverHelpPages]);
  useEffect(()=>{sv('dp_autorules',automationRules)},[automationRules]);
  useEffect(()=>{sv('dp_reports',savedReports)},[savedReports]);
  useEffect(()=>{sv('dp_prefs',appPrefs)},[appPrefs]);
  useEffect(()=>{sv('dp_household',household)},[household]);
  useEffect(()=>{sv('dp_onboarding',onboarding)},[onboarding]);
  // Daily snapshot (once per day)
  useEffect(()=>{const today=new Date().toISOString().split('T')[0];const snaps=ld('dp_snapshots',{});if(!snaps[today]){const snap={};Object.keys(localStorage).filter(k=>k.startsWith('dp_')&&k!=='dp_snapshots').forEach(k=>{const v=localStorage.getItem(k);try{snap[k]=v?JSON.parse(v):null}catch{snap[k]=v}});const dates=Object.keys(snaps).sort().reverse();const trimmed={};dates.slice(0,29).forEach(d=>trimmed[d]=snaps[d]);trimmed[today]=snap;sv('dp_snapshots',trimmed)}},[]);

  // Bill reminder notifications (local, no server needed)
  useEffect(()=>{
    if(authSt!=='auth'||!('Notification' in window))return;
    const today=new Date().getDate();
    const todayKey=new Date().toISOString().split('T')[0];
    if(localStorage.getItem('dp_lastnotif')===todayKey)return;
    const fixedSubs=CATS.filter(c=>c.tp==="fixed").flatMap(c=>c.subs);
    const overdue=fixedSubs.filter(s=>{const due=billDueDays[s.id];if(!due)return false;const paid=(md.subs?.[s.id]?.actual||0)>0;return!paid&&today>due});
    const soon=fixedSubs.filter(s=>{const due=billDueDays[s.id];if(!due)return false;const paid=(md.subs?.[s.id]?.actual||0)>0;const dl=due-today;return!paid&&dl>=0&&dl<=2});
    if(!overdue.length&&!soon.length)return;
    const send=()=>{
      localStorage.setItem('dp_lastnotif',todayKey);
      if(overdue.length)new Notification('Domači proračun — Zapadle položnice',{body:overdue.map(s=>s.nm.split('(')[0].trim()).join(', '),icon:'/pwa-192.svg'});
      if(soon.length)new Notification('Domači proračun — Položnice kmalu',{body:soon.map(s=>`${s.nm.split('(')[0].trim()} (${billDueDays[s.id]}. v mes.)`).join(', '),icon:'/pwa-192.svg'});
    };
    if(Notification.permission==='granted')send();
    else if(Notification.permission==='default')Notification.requestPermission().then(p=>{if(p==='granted')send()});
  },[authSt,mo,yr,billDueDays]);

  useEffect(()=>{if(LOCAL_AUTH_DISABLED){setAuthSt('auth');setCurUser('Tadej');setCurRole('superadmin');return}if(authSt==='init'){if(sessionStorage.getItem('dp_s')){setAuthSt('auth');setCurUser(sessionStorage.getItem('dp_u'));setCurRole(sessionStorage.getItem('dp_r'))}else setAuthSt('login')}},[]);

  const lastAct=useRef(Date.now());
  useEffect(()=>{if(LOCAL_AUTH_DISABLED||authSt!=='auth')return;const r=()=>{lastAct.current=Date.now()};const c=setInterval(()=>{if(Date.now()-lastAct.current>30*60*1000){setAuthSt('login');setCurUser(null);setCurRole(null);sessionStorage.clear();setAErr('Seja potekla.')}},10000);window.addEventListener('mousemove',r);window.addEventListener('keydown',r);return()=>{clearInterval(c);window.removeEventListener('mousemove',r);window.removeEventListener('keydown',r)}},[authSt]);

  const doLogin=async()=>{if(lock>Date.now())return;const accs=JSON.parse(localStorage.getItem('dp_accounts')||'[]');const acc=accs.find(a=>a.username===lU.trim());if(!acc){failL();return}const h=await hPwd(lP,acc.salt);if(h!==acc.hash){failL();return}setCurUser(acc.username);setCurRole(acc.role||'admin');setAuthSt('auth');setAtt(0);setAErr('');sessionStorage.setItem('dp_s','1');sessionStorage.setItem('dp_u',acc.username);sessionStorage.setItem('dp_r',acc.role||'admin')};
  const failL=()=>{const n=att+1;setAtt(n);if(n>=5){setLock(Date.now()+30000);setAErr('Preveč poskusov. Počakaj 30s.');setTimeout(()=>{setAtt(0);setAErr('')},30000)}else setAErr(`Napačni podatki. ${n}/5.`)};
  const doLogout=()=>{if(LOCAL_AUTH_DISABLED)return;setAuthSt('login');setCurUser(null);setCurRole(null);setLP('');sessionStorage.clear()};
  const doResetPwd=()=>{localStorage.removeItem('dp_accounts');ensureSuperadmin();setAErr('Gesla ponastavljena. Prijavi se kot Tadej.');setShowForgot(false)};
  const doChgPwd=async(user,newPwd)=>{if(newPwd.length<6){setSMsg('≥ 6 znakov');return}const accs=JSON.parse(localStorage.getItem('dp_accounts')||'[]');const i=accs.findIndex(a=>a.username===user);if(i<0)return;const salt=Array.from(crypto.getRandomValues(new Uint8Array(16))).join('');accs[i]={...accs[i],hash:await hPwd(newPwd,salt),salt};localStorage.setItem('dp_accounts',JSON.stringify(accs));setSMsg(`Geslo za ${user} spremenjeno!`)};
  const isSA=curRole==='superadmin';
  // Active budget profile helpers
  const AP=budgetProfiles.find(p=>p.id===activeProfId)||budgetProfiles[0]||{id:'',name:'',budget:3600,bPct:{},pMd:{},pFx:{},nepPct:5,nepMd:'pct',nepFx:150,method:'category',isDefault:false};
  const updProf=(key,val)=>setBudgetProfiles(ps=>ps.map(p=>p.id===activeProfId?{...p,[key]:val}:p));
  const defProf=budgetProfiles.find(p=>p.isDefault)||budgetProfiles[0];

  const sortSubs=(catId,subs)=>{const o=subOrder[catId];if(!o||!o.length)return subs;return[...subs].sort((a,b)=>{const ai=o.indexOf(a.id),bi=o.indexOf(b.id);if(ai<0&&bi<0)return 0;if(ai<0)return 1;if(bi<0)return-1;return ai-bi})};
  const effectiveCats=useMemo(()=>[...CATS.map(cat=>({...cat,subs:sortSubs(cat.id,[...cat.subs,...(customSubs[cat.id]||[])])})),...customCatGroups.map(cat=>({...cat,subs:sortSubs(cat.id,cat.subs||[])}))],[customSubs,customCatGroups,subOrder]);
  const effectiveAS=useMemo(()=>effectiveCats.flatMap(c=>c.subs),[effectiveCats]);
  const efxT=(mdata,f)=>effectiveCats.filter(c=>c.tp==="fixed").reduce((s,c)=>s+cT(mdata,c,f),0);
  const evrT=(mdata,f)=>effectiveCats.filter(c=>c.tp==="var").reduce((s,c)=>s+cT(mdata,c,f),0);
  const visibleCats=isSA?effectiveCats:effectiveCats.filter(c=>adminViews.includes(c.id));
  // #50 advanced-mode helper
  const adv=uiMode==='advanced';
  // #49 dashboard widget visibility — power widgets hidden in basic mode unless explicitly enabled
  const dashW=(k)=>(!adv&&(k==='merchants'||k==='velocity'))?dashWidgets[k]===true:dashWidgets[k]!==false;
  const dashOrd=(k)=>{const full=[...dashOrder,...DASH_SECTIONS.map(([id])=>id)].filter((v,i,a)=>a.indexOf(v)===i);const i=full.indexOf(k);return i<0?99:i};
  const moveDashSection=(from,to)=>setDashOrder(prev=>{const full=[...prev,...DASH_SECTIONS.map(([id])=>id)].filter((v,i,a)=>a.indexOf(v)===i);const a=full.filter(id=>DASH_SECTIONS.some(([k])=>k===id));const i=a.indexOf(from);const j=a.indexOf(to);if(i<0||j<0||i===j)return a;const [x]=a.splice(i,1);a.splice(j,0,x);return a});

  // Data helpers
  const ww=useWindowWidth();const isMob=ww<640;
  const yd=data[yr]||initY();const md=yd[mo]||initM();
  const uxtT=(mdata)=>(mdata.unexpectedItems||[]).reduce((s,it)=>s+it.amount,0);
  const tInc=iT(md);const tFx=efxT(md,'actual');const tVr=evrT(md,'actual');const tUxt=uxtT(md);const tAc=tFx+tVr+tUxt;
  const fillDemoData=()=>{const demo={};[yr,yr-1].forEach(y=>{demo[y]=initY();for(let m=0;m<12;m++){const dm=demo[y][m];dm.income.Kristina={"Plača":1650};dm.income.Tadej={"Plača":2100};dm.subs.rent={...dm.subs.rent,plan:710,actual:710,transactions:[{id:y*10000+m*100+1,amt:710,comment:"Najemnina"}]};dm.subs.utilities={...dm.subs.utilities,plan:250,actual:210+(m%4)*18,transactions:[{id:y*10000+m*100+2,amt:210+(m%4)*18,comment:"Položnice"}]};dm.subs.internet={...dm.subs.internet,plan:70,actual:68,transactions:[{id:y*10000+m*100+3,amt:68,comment:"Internet"}]};dm.subs.kinder={...dm.subs.kinder,plan:640,actual:640,transactions:[{id:y*10000+m*100+4,amt:640,comment:"Vrtec"}]};dm.subs.groc={...dm.subs.groc,plan:650,actual:560+(m%5)*25,transactions:[{id:y*10000+m*100+5,amt:260+(m%3)*20,comment:"Mercator"},{id:y*10000+m*100+6,amt:300+(m%4)*15,comment:"Hofer"}]};dm.subs.fuel={...dm.subs.fuel,plan:90,actual:75+(m%3)*15,transactions:[{id:y*10000+m*100+7,amt:75+(m%3)*15,comment:"Petrol"}]};dm.subs.clothes={...dm.subs.clothes,plan:80,actual:m%3===0?120:35,transactions:[{id:y*10000+m*100+8,amt:m%3===0?120:35,comment:"Oblačila"}]};dm.subs.etf={...dm.subs.etf,plan:200,actual:200,transactions:[{id:y*10000+m*100+9,amt:200,comment:"ETF"}]};dm.subs.tradeRep={...dm.subs.tradeRep,plan:300,actual:300,transactions:[{id:y*10000+m*100+10,amt:300,comment:"Trade Republic"}]};dm.closed=y<yr||m<mo;}});setData(demo);setGoals([{id:Date.now(),name:"Nujni sklad",type:"saving",target:10000,current:3200,scope:"general",note:"Demo cilj"},{id:Date.now()+1,name:"Dopust",type:"saving",target:2400,current:900,scope:"general"}]);setSavData({members:[{name:"Tadej",sources:[{name:"TR račun",amount:4200},{name:"ETF",amount:6800}]},{name:"Kristina",sources:[{name:"Varčevalni račun",amount:3500}]}]});setNwAssets([{id:1,name:"Avto",value:9000}]);setNwLiabs([{id:1,name:"Kredit",value:2500}]);setWishes([{id:1,member:"Leon",wish:"Kolo",desc:"Večje otroško kolo",link:"",comment:"pomlad",received:false},{id:2,member:"Erik",wish:"Lego set",desc:"Za rojstni dan",link:"",comment:"",received:false}]);setCryH([{coin:"BTC",amount:0.04,avgPrice:65000},{coin:"ETH",amount:0.8,avgPrice:3200}]);setSMsg("Testni podatki so dodani. Lahko jih kadarkoli izbrišeš ali prepišeš.");};
  const addReceiptText=()=>{const txt=(document.getElementById('receiptText')?.value||'').trim();if(!txt){setSMsg('Najprej prilepi besedilo računa ali naloži .txt izvoz.');return}const nums=[...txt.matchAll(/(\d+[,.]\d{2}|\d+)\s*(€|EUR)?/gi)].map(m=>parseFloat(m[1].replace(',','.'))).filter(n=>n>0);const total=nums.length?Math.max(...nums):0;const lower=txt.toLowerCase();const sub=effectiveAS.find(s=>lower.includes((subRename[s.id]||s.nm).toLowerCase().split(' ')[0]))||effectiveAS.find(s=>['mercator','spar','hofer','lidl','tuš','tus'].some(k=>lower.includes(k))&&s.id==='groc')||effectiveAS.find(s=>s.id==='groc')||effectiveAS[0];if(total&&sub){addTransaction(sub.id,total,`Račun: ${txt.split(/\n/)[0].slice(0,40)}`);setSMsg(`Račun dodan kot osnova: ${fmt(total)} → ${subRename[sub.id]||sub.nm}. OCR za slike potrebuje dodatno knjižnico ali zunanji servis.`)}};

  const uSub=(subId,field,val)=>{setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[yr])n[yr]=initY();if(!n[yr][mo])n[yr][mo]=initM();if(!n[yr][mo].subs[subId])n[yr][mo].subs[subId]={plan:0,actual:0,transactions:[],comment:""};const old=n[yr][mo].subs[subId][field];n[yr][mo].subs[subId][field]=field==="comment"?val:(parseFloat(val)||0);if(field==="plan"&&parseFloat(val)!==old)setCLog(l=>[{date:new Date().toLocaleDateString("sl-SI"),sub:subId,oldVal:old||0,newVal:parseFloat(val)||0,who:curUser||"?"},...l]);return n})};
  const addTransaction=(subId,amount,comment="",person="")=>{setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[yr])n[yr]=initY();if(!n[yr][mo])n[yr][mo]=initM();if(!n[yr][mo].subs[subId])n[yr][mo].subs[subId]={plan:0,actual:0,transactions:[],comment:""};if(!Array.isArray(n[yr][mo].subs[subId].transactions))n[yr][mo].subs[subId].transactions=[];const amt=parseFloat(amount)||0;if(amt>0){const txnId=Date.now()+Math.random();n[yr][mo].subs[subId].transactions.push({id:txnId,amt,comment:comment||"",person:person||""});n[yr][mo].subs[subId].actual=n[yr][mo].subs[subId].transactions.reduce((s,t)=>s+(t.amt||t),0)}return n})};
  const updateTransactionComment=(subId,txnId,comment)=>{setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(n[yr]&&n[yr][mo]&&n[yr][mo].subs[subId]&&Array.isArray(n[yr][mo].subs[subId].transactions)){n[yr][mo].subs[subId].transactions=n[yr][mo].subs[subId].transactions.map(t=>{const id=typeof t==='object'?t.id:t;return id===txnId?{...(typeof t==='object'?t:{id:t,amt:t}),comment}:t})}return n})};
  const removeTransaction=(subId,txnId)=>{setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(n[yr]&&n[yr][mo]&&n[yr][mo].subs[subId]){if(!Array.isArray(n[yr][mo].subs[subId].transactions))n[yr][mo].subs[subId].transactions=[];n[yr][mo].subs[subId].transactions=n[yr][mo].subs[subId].transactions.filter(t=>{const id=typeof t==='object'?t.id:t;return id!==txnId});n[yr][mo].subs[subId].actual=n[yr][mo].subs[subId].transactions.reduce((s,t)=>s+(t.amt||t),0)}return n})};
  const uInc=(person,type,val)=>{setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[yr])n[yr]=initY();if(!n[yr][mo])n[yr][mo]=initM();if(!n[yr][mo].income[person])n[yr][mo].income[person]={};n[yr][mo].income[person][type]=parseFloat(val)||0;return n})};
  const addCI=(l,a,p,c)=>{setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[yr])n[yr]=initY();if(!n[yr][mo])n[yr][mo]=initM();n[yr][mo].customIncome.push({label:l,amount:parseFloat(a)||0,person:p,comment:c});return n})};
  const addUX=(d,a,p)=>{setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[yr])n[yr]=initY();if(!n[yr][mo])n[yr][mo]=initM();n[yr][mo].unexpectedItems.push({desc:d,amount:parseFloat(a)||0,person:p});return n})};
  const toggleClose=(m)=>{setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[yr])n[yr]=initY();if(!n[yr][m])n[yr][m]=initM();const closing=!n[yr][m].closed;n[yr][m].closed=closing;if(closing){const tips=genCoachTips(yr,m);if(tips.length>0)setCoachTips(tips);if(syncUrl&&syncToken&&syncPwd)setTimeout(()=>doSyncPush(),500);if(autoBackup){createBackup();localStorage.setItem('dp_lastbackup',String(Date.now()))}if(m===11){setTimeout(()=>{setYearEndStep(0);setShowYearEnd(true)},400)}}return n})};
  const doSyncPush=async()=>{if(!syncUrl||!syncToken||!syncPwd){setSyncStatus('err:Nastavi URL, token in geslo v Nastavitvah.');return}setSyncStatus('syncing');try{const snap=collectSyncData();const v=await pushToCloud(snap,syncUrl,syncToken,syncPwd);setSyncLastPush(v);setSyncStatus('ok')}catch(e){setSyncStatus('err:'+e.message)}};
  const doSyncPull=async()=>{if(!syncUrl||!syncToken||!syncPwd){setSyncStatus('err:Nastavi URL, token in geslo v Nastavitvah.');return}if(!confirm('Potegni iz oblaka? Lokalni podatki bodo prepisani!'))return;setSyncStatus('syncing');try{const snap=await pullFromCloud(syncUrl,syncToken,syncPwd);if(!snap){setSyncStatus('err:V oblaku ni podatkov.');return}applySyncData(snap);setSyncStatus('ok');setSMsg('Podatki potegnjeni iz oblaka. Stran se osvežuje…');setTimeout(()=>window.location.reload(),1500)}catch(e){setSyncStatus('err:'+e.message)}};
  const syncPlanToEntry=()=>{setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[yr])n[yr]=initY();for(let m=0;m<12;m++){if(!n[yr][m])n[yr][m]=initM();CATS.forEach(cat=>{cat.subs.forEach(sub=>{if(md.subs?.[sub.id]?.plan)n[yr][m].subs[sub.id]={...n[yr][m].subs[sub.id],plan:md.subs[sub.id].plan}})})}return n})};
  const syncPctToPlan=(prof)=>{const p=prof||defProf;if(!p)return;const base=p.budget;effectiveAS.forEach(sub=>{const mode=p.pMd[sub.id]||"fixed";const target=mode==="pct"?Math.round(base*(p.bPct[sub.id]||0)/100):(p.pFx[sub.id]||0);uSub(sub.id,"plan",target)})};;
  const toggleSubVis=(subId)=>{setSubVis(prev=>({...prev,[subId]:!prev[subId]}))};
  const moveSubUp=(catId,subId)=>{setSubOrder(prev=>{const cat=effectiveCats.find(c=>c.id===catId);if(!cat)return prev;const o=prev[catId]||cat.subs.map(s=>s.id);const idx=o.indexOf(subId);if(idx<=0)return prev;const n=[...o];[n[idx-1],n[idx]]=[n[idx],n[idx-1]];return{...prev,[catId]:n}})};
  const moveSubDown=(catId,subId)=>{setSubOrder(prev=>{const cat=effectiveCats.find(c=>c.id===catId);if(!cat)return prev;const o=prev[catId]||cat.subs.map(s=>s.id);const idx=o.indexOf(subId);if(idx<0||idx>=o.length-1)return prev;const n=[...o];[n[idx],n[idx+1]]=[n[idx+1],n[idx]];return{...prev,[catId]:n}})};
  const uNote=(text)=>{setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[yr])n[yr]=initY();if(!n[yr][mo])n[yr][mo]=initM();n[yr][mo].note=text;return n})};
  const copyPlanFromLastYear=()=>{const py=yr-1;const pyd=data[py]||{};const cms=[];for(let m=0;m<12;m++){if((pyd[m]||{}).closed)cms.push(pyd[m]||initM())}if(cms.length===0){alert(`V letu ${py} ni zaključenih mesecev.`);return}effectiveAS.forEach(sub=>{const avg=Math.round(cms.reduce((s,md2)=>s+(md2.subs?.[sub.id]?.actual||0),0)/cms.length);if(avg>0)uSub(sub.id,"plan",avg)});alert(`Plan prenesen iz dejanskih ${py} (${cms.length} mesecev).`)};
  const logAudit=(action,details)=>{if(isSA||curRole==="admin")setAuditLog(prev=>[{timestamp:new Date().toLocaleString("sl-SI"),user:curUser||"?",action,details},...prev])};

  const currentTransactions=()=>effectiveAS.flatMap(sub=>(md.subs?.[sub.id]?.transactions||[]).map(t=>({subId:sub.id,subName:subRename[sub.id]||sub.nm,txn:typeof t==='object'?t:{id:t,amt:t,comment:''}})));
  const allReportRows=useMemo(()=>{
    const rows=[];
    Object.entries(data||{}).forEach(([yy,yd2])=>{Object.entries(yd2||{}).forEach(([mm,mdata])=>{
      effectiveCats.forEach(cat=>cat.subs.forEach(sub=>{
        (mdata?.subs?.[sub.id]?.transactions||[]).forEach(t=>{const tx=typeof t==='object'?t:{id:t,amt:t,comment:''};rows.push({year:+yy,month:+mm,date:`${yy}-${String(+mm+1).padStart(2,'0')}`,catId:cat.id,catName:cat.nm,subId:sub.id,subName:subRename[sub.id]||sub.nm,amount:tx.amt||0,comment:tx.comment||'',person:tx.person||'Skupaj',tags:(tx.comment||'').match(/#\w+/g)||[]});});
      }));
      (mdata?.unexpectedItems||[]).forEach((it,i)=>rows.push({year:+yy,month:+mm,date:`${yy}-${String(+mm+1).padStart(2,'0')}`,catId:'unexpected',catName:'Nepredvideni stroški',subId:'unexpected',subName:it.desc||'Nepredvideno',amount:it.amount||0,comment:it.desc||'',person:it.person||'Skupaj',tags:[]}));
    })});
    return rows.sort((a,b)=>a.date.localeCompare(b.date));
  },[data,effectiveCats,subRename]);
  const filteredReportRows=useMemo(()=>{
    const from=reportFilter.from||'0000-00',to=reportFilter.to||'9999-99';
    return allReportRows.filter(r=>r.date>=from&&r.date<=to)
      .filter(r=>reportFilter.person==='all'||r.person===reportFilter.person)
      .filter(r=>reportFilter.cat==='all'||r.catId===reportFilter.cat)
      .filter(r=>reportFilter.tag==='all'||r.tags.map(t=>t.toLowerCase()).includes(`#${reportFilter.tag}`))
      .filter(r=>!reportFilter.min||r.amount>=parseFloat(reportFilter.min))
      .filter(r=>!reportFilter.max||r.amount<=parseFloat(reportFilter.max));
  },[allReportRows,reportFilter]);
  const exportReportCsv=()=>{
    const rows=[["Mesec","Kategorija","Postavka","Znesek","Oseba","Oznake","Komentar"],...filteredReportRows.map(r=>[r.date,r.catName,r.subName,r.amount,r.person,r.tags.join(' '),r.comment])];
    const csv=rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`porocilo-${Date.now()}.csv`;a.click();URL.revokeObjectURL(url);
  };
  const behaviorSummary=useMemo(()=>{
    const totals=Object.fromEntries(BEHAVIOR_TAGS.map(([tag,label])=>[tag,{tag,label,count:0,total:0,items:[]}]));
    currentTransactions().forEach(x=>{
      const c=(x.txn.comment||'').toLowerCase();
      BEHAVIOR_TAGS.forEach(([tag])=>{if(c.includes(`#${tag}`)){totals[tag].count++;totals[tag].total+=x.txn.amt||0;totals[tag].items.push(x);}});
    });
    const rows=Object.values(totals).filter(x=>x.count>0).sort((a,b)=>b.total-a.total);
    const soft=[];
    const impulse=(totals.impulse.total||0)+(totals.stress.total||0)+(totals.regret.total||0);
    const planned=(totals.planned.total||0)+(totals.essential.total||0)+(totals.family.total||0);
    if(rows.length===0)soft.push("Dodaj vedenjske oznake na transakcije, da bo mesečni pregled znal razložiti tudi zakaj se je poraba zgodila.");
    if(impulse>0)soft.push(`Impulz/stres/obžalovanje skupaj: ${fmt(impulse)}. To ni napaka, samo signal za pogovor pri zaključku meseca.`);
    if(planned>0)soft.push(`Načrtovana, nujna ali družinska poraba: ${fmt(planned)}. To je dober kontekst pri presoji meseca.`);
    const top=rows[0];if(top)soft.push(`Največ označene porabe je "${top.label}" (${fmt(top.total)}, ${top.count} vnosov).`);
    return{rows,soft:soft.slice(0,3),impulse,planned};
  },[md,effectiveAS,subRename]);
  const copilotInsights=()=>{
    const varPlan=evrT(md,'plan');const fixedPlan=efxT(md,'plan');const safe=tInc-fixedPlan-tVr-tUxt;
    const catRows=effectiveCats.map(cat=>({name:cat.nm,plan:cT(md,cat,'plan'),actual:cT(md,cat,'actual')})).filter(x=>x.plan||x.actual);
    const over=catRows.filter(x=>x.plan>0&&x.actual>x.plan).sort((a,b)=>(b.actual-b.plan)-(a.actual-a.plan)).slice(0,3);
    const unused=catRows.filter(x=>x.plan>0&&x.actual<x.plan*.35).sort((a,b)=>(b.plan-b.actual)-(a.plan-a.actual)).slice(0,3);
    const tx=currentTransactions().sort((a,b)=>(b.txn.amt||0)-(a.txn.amt||0)).slice(0,3);
    const riskyGoals=goals.filter(g=>(g.target||0)>0&&((g.current||0)/(g.target||1))<.5).slice(0,3);
    return{
      summary:`${MF[mo]} ${yr}: prihodki ${fmt(tInc)}, odhodki ${fmt(tAc)}, razlika ${(tInc-tAc)>=0?"+":""}${fmt(tInc-tAc)}. Varno za porabo: ${fmt(Math.max(0,safe))}.`,
      over:over.map(x=>`${x.name}: ${fmt(x.actual-x.plan)} nad planom`).join(' · ')||"Ni večjih preseganj plana.",
      unused:unused.map(x=>`${x.name}: ${fmt(x.plan-x.actual)} še neporabljeno`).join(' · ')||"Vse kategorije so v mejah plana.",
      tx:tx.map(x=>`${x.subName}: ${fmt(x.txn.amt)} ${x.txn.comment?`(${x.txn.comment})`:''}`).join(' · ')||"Ni transakcij z opisom.",
      goals:riskyGoals.map(g=>`${g.name}: ${pc(g.current||0,g.target||1)}% cilja`).join(' · ')||"Cilji niso kritični ali niso nastavljeni.",
      varUse:varPlan>0?pc(tVr+tUxt,varPlan):0
    };
  };
  const askCopilot=()=>{
    const i=copilotInsights();const q=copilotQ.toLowerCase();
    let answer=[i.summary,`Preseganja: ${i.over}`,`Neporabljeno: ${i.unused}`];
    if(q.includes('cilj')||q.includes('goal'))answer=[i.summary,`Cilji: ${i.goals}`];
    else if(q.includes('transakc')||q.includes('nakup')||q.includes('trgov'))answer=[i.summary,`Največji vnosi: ${i.tx}`];
    else if(q.includes('varno')||q.includes('porab'))answer=[i.summary,`Variabilna poraba je pri ${i.varUse}% plana. ${i.varUse>85?'Ustavi nenujne nakupe do naslednjega pregleda.':'Še je nekaj prostora, ampak spremljaj večje postavke.'}`];
    setCopilotA(answer.join('\n'));
  };
  const timelineEvents=useMemo(()=>{
    const events=[];const pad=n=>String(n).padStart(2,'0');const today=new Date();
    const push=(date,type,title,amount=0,detail='',source='')=>events.push({date,type,title,amount,detail,source,ts:new Date(date).getTime()||0});
    Object.entries(billDueDays).forEach(([subId,day])=>{
      const sub=effectiveAS.find(s=>s.id===subId);if(!sub||!day)return;
      for(let i=0;i<6;i++){const d=new Date(yr,mo+i,Math.min(day,28));push(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,'bill',subRename[subId]||sub.nm,md.subs?.[subId]?.plan||sub.dp||0,'Položnica iz nastavljenega dneva zapadlosti','Položnice');}
    });
    subscriptions.forEach(s=>{if(s.nextDate)push(s.nextDate,'subscription',s.name||'Naročnina',s.amount||0,s.period==='annual'?'Letna naročnina':'Mesečna naročnina','Naročnine')});
    goals.forEach(g=>{if(g.targetDate)push(g.targetDate,'goal',g.name||'Cilj',g.target||0,`Trenutno ${fmt(g.current||0)} od ${fmt(g.target||0)}`,'Cilji')});
    debts.forEach(d=>{if(d.minPayment||d.payment){for(let i=0;i<6;i++){const dt=new Date(yr,mo+i,15);push(`${dt.getFullYear()}-${pad(dt.getMonth()+1)}-15`,'debt',d.name||'Dolg',d.minPayment||d.payment||0,`Preostanek ${fmt(d.balance||0)}`,'Dolgovi');}}});
    simEvents.forEach(ev=>push(`${ev.year||yr}-12-31`,'simulation',ev.name||ev.label||'Simulacijski dogodek',ev.value||0,ev.recurring?'Ponavljajoč dogodek':'Enkraten dogodek','Simulacija'));
    return events.filter(e=>e.ts>=new Date(today.getFullYear(),today.getMonth()-1,1).getTime()).sort((a,b)=>a.ts-b.ts);
  },[billDueDays,effectiveAS,subRename,subscriptions,goals,debts,simEvents,yr,mo,md]);
  const automationMatches=useMemo(()=>automationRules.map(rule=>{
    const kw=(rule.keyword||'').toLowerCase().trim();
    const matches=kw?currentTransactions().filter(x=>(x.txn.comment||'').toLowerCase().includes(kw)&&x.subId!==rule.targetSubId):[];
    return{...rule,matches};
  }),[automationRules,md,effectiveAS]);
  const runAutomationRules=()=>{
    if(md.closed){setSMsg('Mesec je zaključen. Pravila ne spreminjajo zaprtih mesecev.');return}
    let moved=0;
    setData(prev=>{
      const n=JSON.parse(JSON.stringify(prev));if(!n[yr])n[yr]=initY();if(!n[yr][mo])n[yr][mo]=initM();
      automationRules.forEach(rule=>{
        const kw=(rule.keyword||'').toLowerCase().trim();if(!kw||!rule.targetSubId)return;
        if(!n[yr][mo].subs[rule.targetSubId])n[yr][mo].subs[rule.targetSubId]={plan:0,actual:0,transactions:[],comment:""};
        Object.keys(n[yr][mo].subs).forEach(subId=>{
          if(subId===rule.targetSubId)return;
          const src=n[yr][mo].subs[subId];if(!Array.isArray(src.transactions))return;
          const stay=[];const move=[];
          src.transactions.forEach(t=>{const tx=typeof t==='object'?t:{id:t,amt:t,comment:''};((tx.comment||'').toLowerCase().includes(kw)?move:stay).push(tx)});
          if(move.length){src.transactions=stay;src.actual=stay.reduce((s,t)=>s+(t.amt||0),0);n[yr][mo].subs[rule.targetSubId].transactions=[...(n[yr][mo].subs[rule.targetSubId].transactions||[]),...move.map(t=>({...t,comment:`${t.comment||''} #pravilo:${rule.name||kw}`.trim()}))];moved+=move.length;}
        });
        const dst=n[yr][mo].subs[rule.targetSubId];dst.actual=(dst.transactions||[]).reduce((s,t)=>s+(t.amt||0),0);
      });
      return n;
    });
    logAudit('automation.rules',`${moved} transakcij prerazporejenih v ${MF[mo]} ${yr}`);
    setSMsg(moved?`Pravila so premaknila ${moved} transakcij.`:'Ni bilo ujemanj za trenutni mesec.');
  };
  const privacyHealth=useMemo(()=>{
    const dpKeys=Object.keys(localStorage).filter(k=>k.startsWith('dp_'));
    const bytes=dpKeys.reduce((s,k)=>s+(localStorage.getItem(k)||'').length,0);
    const lastBackup=parseInt(localStorage.getItem('dp_lastbackup')||'0');
    const backupAge=lastBackup?Math.floor((Date.now()-lastBackup)/86400000):null;
    const syncReady=!!(syncUrl&&syncToken&&syncPwd);
    return{keys:dpKeys.length,bytes,backupAge,syncReady};
  },[data,goals,automationRules,savedReports,syncUrl,syncToken,syncPwd]);

  // Export
  const doExport=()=>{const wb=XLSX.utils.book_new();const ov=[["ODHODKI",...CATS.map(c=>c.nm)]];for(let m=0;m<12;m++){const md2=(data[yr]||{})[m]||initM();ov.push([MF[m],...CATS.map(c=>cT(md2,c,'actual'))])}ov.push([]);ov.push(["PRIHODKI",...itList]);for(let m=0;m<12;m++){const md2=(data[yr]||{})[m]||initM();ov.push([MF[m],...itList.map(t=>(md2.income?.Kristina?.[t]||0)+(md2.income?.Tadej?.[t]||0))])}XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(ov),"pregled");for(let m=0;m<12;m++){const md2=(data[yr]||{})[m]||initM();const rows=[["","Izvedba","Plan","Razlika €","Razlika %","Komentar"]];CATS.forEach(cat=>{rows.push([cat.nm+":",cT(md2,cat,'actual'),cT(md2,cat,'plan')]);cat.subs.forEach(sub=>{const d=md2.subs?.[sub.id]||{plan:0,actual:0,comment:""};rows.push([sub.nm,d.actual,d.plan,d.plan-d.actual,d.plan?pc(d.actual,d.plan)+"%":"N/A",d.comment])});rows.push([])});rows.push(["PRIHODKI"]);["Kristina","Tadej"].forEach(p=>{itList.forEach(t=>{const v=md2.income?.[p]?.[t]||0;if(v>0)rows.push([p,t,v])})});XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),MS[m].toLowerCase())}XLSX.writeFile(wb,`proracun_${yr}.xlsx`)};

  // Import
  const handleImpFile=async(e)=>{const file=e.target.files?.[0];if(!file)return;try{const buf=await file.arrayBuffer();const wb=XLSX.read(buf,{type:"array"});const prev=[];const mm={jan:0,feb:1,mar:2,apr:3,maj:4,jun:5,jul:6,avg:7,sep:8,okt:9,nov:10,dec:11};wb.SheetNames.forEach(sn=>{const snl=sn.toLowerCase().trim();let mi=null;for(const[k,v]of Object.entries(mm)){if(snl.startsWith(k)){mi=v;break}}if(mi===null)return;XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1}).forEach(r=>{if(!r[0]||typeof r[0]!=="string")return;const a=parseFloat(r[1])||0;const p=parseFloat(r[2])||0;if(a>0||p>0)prev.push({month:MF[mi],mi,label:String(r[0]).trim(),actual:a,plan:p})})});setImpPrev({wb,preview:prev})}catch(err){setImpLog([{type:"err",msg:"Napaka: "+err.message}])}};
  const doImport=()=>{if(!impPrev)return;setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[impYr])n[impYr]=initY();const importDate=new Date().toLocaleDateString("sl-SI");impPrev.preview.forEach(r=>{if(!n[impYr][r.mi])n[impYr][r.mi]=initM();const lbl=r.label.toLowerCase().trim();
    // Map "nepredvideni stroški" / "drugi stroški" → unexpectedItems
    if(lbl.includes("nepredvid")||lbl.includes("drugi strošk")||lbl.includes("drugi stroski")||lbl==="drugi"){
      if(r.actual>0){n[impYr][r.mi].unexpectedItems.push({desc:`📥 Uvoz iz Excela (${importDate})`,amount:r.actual,person:"Uvoz",imported:true})}
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
        n[impYr][r.mi].subs[sub.id].transactions.push({id:Date.now()+Math.random(),amt:r.actual,comment:`📥 Uvoz iz Excela (${importDate})`,imported:true});
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
    for(let m=0;m<12;m++){const mdata=yd[m]||initM();if(mdata.closed){yrInc+=iT(mdata);const selCats=effectiveCats.filter(c=>simCats.includes(c.id));yrExp+=selCats.reduce((s,c)=>s+cT(mdata,c,'actual'),0);yrUxt+=uxtT(mdata);yrSav+=cT(mdata,effectiveCats.find(c=>c.id==="savings_inv")||{subs:[]},'actual');closedCount++}};
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
        const pf=Math.pow(1+mRate,mths);balance=balance*pf+monthlyDeposit*((pf-1)/mRate);
      }else{
        balance+=yDeposit;
      }

      r.push({name:String(curY),Prihodki:yI,Odhodki:yE,Prihranki:Math.round(balance),Vloženo:Math.round(invested),Donos:Math.round(balance-invested),Razlika:yI-yE});
    }
    return r;
  };
  const[simData,simBest,simWorst]=useMemo(()=>{const base=calcSim();const best=simShowRange?calcSim(simRangeWidth,-simRangeWidth,simRangeWidth):null;const worst=simShowRange?calcSim(-simRangeWidth,simRangeWidth,-simRangeWidth):null;return[base,best,worst];},[simFrom,simTo,simG,simI,simReturn,simE,simManual,simSc,simEvents,simInitial,simShowRange,simRangeWidth,data,yr,mo,effectiveCats,simCats]);
  const simBands=simShowRange?simData.map((d,i)=>({...d,Najboljši:simBest[i].Prihranki,Najslabši:simWorst[i].Prihranki,Pas:[simWorst[i].Prihranki,simBest[i].Prihranki]})):simData;
  const cryptoVal=cryH.reduce((s,c)=>s+(c.amount||0)*(c.avgPrice||0),0);
  const goalsAnchored=useMemo(()=>goals.filter(g=>g.type==="saving"&&g.target>0&&g.scope!=="monthly").map(g=>{const idx=simData.findIndex(d=>d.Prihranki>=g.target);return{name:g.name,target:g.target,year:idx>=0?simData[idx].name:null,idx};}),[goals,simData]);

  const pieData=visibleCats.map((c,i)=>({name:c.nm.split(" ")[0],value:cT(md,c,'actual'),color:CL[i%CL.length]})).filter(d=>d.value>0);
  const trendData=MS.map((m,i)=>{const mdata=yd[i]||initM();return{name:m,Prihodki:iT(mdata),Odhodki:efxT(mdata,'actual')+evrT(mdata,'actual')+uxtT(mdata),closed:mdata.closed}});

  useEffect(()=>{
    if(!savUnlocked) return;
    const today=new Date().toISOString().split('T')[0];
    if(nwHist.length>0&&nwHist[nwHist.length-1].date===today) return;
    const savT=savData.members.reduce((s,m)=>s+m.sources.reduce((ss,src)=>ss+(src.amount||0),0),0);
    const assT=nwAssets.reduce((s,a)=>s+(a.value||0),0);
    const liabT=nwLiabs.reduce((s,l)=>s+(l.value||0),0);
    const nw=savT+cryptoVal+assT-liabT;
    setNwHist(h=>[...h,{date:today,nw}].slice(-60));
  },[savUnlocked,savData,nwAssets,nwLiabs,cryptoVal]);

  const navP=()=>{if(mo===0){setMo(11);setYr(y=>y-1)}else setMo(m=>m-1)};
  const navN=()=>{if(mo===11){setMo(0);setYr(y=>y+1)}else setMo(m=>m+1)};

  const genCoachTips=(closedYr,closedMo)=>{
    const allClosed=[];
    for(let y=Math.max(closedYr-2,2020);y<=closedYr;y++){const yd2=data[y]||{};for(let m=0;m<12;m++){if(yd2[m]?.closed&&!(y===closedYr&&m>closedMo))allClosed.push(yd2[m]);}}
    const last4=allClosed.slice(-4);if(last4.length<2)return[];
    const tips=[];
    effectiveCats.forEach(cat=>{
      const over=last4.filter(mdata=>{const p=cT(mdata,cat,'plan');const a=cT(mdata,cat,'actual');return p>50&&a>p*1.1;}).length;
      if(over>=3){const avg=Math.round(last4.reduce((s,mdata)=>s+cT(mdata,cat,'actual'),0)/last4.length);tips.push({id:Date.now()+tips.length,type:'over',text:`${cat.nm} je bila ${over}× od ${last4.length} mesecev nad planom (povprečje ${fmt(avg)}).`});}
    });
    const last3=allClosed.slice(-3);
    if(last3.length===3){effectiveCats.forEach(cat=>{const [a,b,c]=last3.map(mdata=>cT(mdata,cat,'actual'));if(c>b&&b>a&&a>30&&c>a*1.15)tips.push({id:Date.now()+tips.length,type:'trend',text:`${cat.nm} raste 3 mesece zapored: ${fmt(a)} → ${fmt(b)} → ${fmt(c)}.`});});}
    return tips.slice(0,3);
  };

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
  const MNav=<div style={{display:"flex",alignItems:"center",gap:6}}><button aria-label="Prejšnji mesec" onClick={navP} style={sB(false)}>←</button><span style={{fontSize:17,fontWeight:600,minWidth:120,textAlign:"center"}}>{MF[mo]} {yr}</span><button aria-label="Naslednji mesec" onClick={navN} style={sB(false)}>→</button></div>;
  const YPk=<div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}><span style={{fontSize:16,color:C.mt}}>Leto:</span><select style={{...sS,height:26,fontSize:17,width:70}} value={yr} onChange={e=>setYr(parseInt(e.target.value))}>{[2020,2021,2022,2023,2024,2025,2026,2027,2028].map(y=><option key={y} value={y}>{y}</option>)}</select></div>;
  const isClosed=md.closed;
  const dInMo=new Date(yr,mo+1,0).getDate();
  const guideText={
    dash:"Pregled bere prihodke, plan in dejansko porabo iz mesečnega vnosa. Tukaj vidiš, ali je mesec še varen, kje plan uhaja in kaj se prenaša v letne grafe.",
    pct:"Plan je mesečni dogovor. Zneski iz plana postanejo osnova za primerjavo v mesečnem vnosu, pregledu, simulaciji in ciljih.",
    entry:"Mesečni vnos je glavni delovni ekran. Vpiši prihodke in dejanske stroške; odstotki pokažejo, koliko plana je že porabljenega.",
    annual:"Letni pregled sešteje zaprte in odprte mesece po istih kategorijah, zato hitro vidiš sezonske spremembe in skupno sliko leta.",
    goals:"Cilji uporabljajo tvoje prihodke, porabo in prihranke, da pokažejo, koliko manjka do izbranega cilja.",
    sim:"Simulacija uporablja plan, dejanske zaprte mesece in ročne spremembe, da oceni prihodnje stanje.",
    timeline:"Časovnica združi prihodnje položnice, naročnine, dolgove, cilje in simulacijske dogodke v en vrstni red.",
    analytics:"Analitika omogoča shranjena poročila, filtre po obdobju, osebi, kategoriji, oznakah in znesku ter CSV izvoz.",
    wishes:"Wishlist loči želje od nujnih stroškov. Ko željo kupiš, jo lahko vneseš kot dejanski strošek v pravi kategoriji.",
    varsav:"Varčevanje in neto vrednost sta ločena od mesečne porabe, vendar vplivata na skupno finančno sliko.",
    settings:"V nastavitvah urejaš zavihke, kategorije, sezname, varnost, uvoz, varnostne kopije in ta vodnik.",
    crypto:"Kripto je zaklenjen del naložb. Vrednosti se štejejo v neto vrednost, če jih vneseš."
  };
  const DashSection=({id,title,children,style={},bodyStyle={},helpKey})=>{
    const closed=!!dashClosed[id];
    return <div {...(helpKey?hp(helpKey):{})} style={{...sC,order:dashOrd(id),padding:0,overflow:"hidden",...style}}>
      <div onClick={()=>setDashClosed(p=>({...p,[id]:!p[id]}))} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",userSelect:"none"}}>
        <span style={{fontSize:15,fontWeight:800,color:C.tx}}>{title}</span>
        <span style={{fontSize:13,color:C.mt}}>{closed?"▼":"▲"}</span>
      </div>
      {!closed&&<div style={{padding:"0 14px 14px",...bodyStyle}}>{children}</div>}
    </div>;
  };
  const helpForText=(raw)=>{
    const t=String(raw||"").toLowerCase();
    if(!t.trim())return "";
    const has=(...xs)=>xs.some(x=>t.includes(x));
    if(has("finančno zdravje","finanäno zdravje"))return HELP.health;
    if(has("prihodki")&&has("odhodki")&&has("razlika"))return HELP.kpi;
    if(has("primerjava z"))return HELP.mom;
    if(has("varčevalna stopnja","varäevalna stopnja"))return HELP.savtrend;
    if(has("denarni tok"))return HELP.cashflow;
    if(has("nujni sklad"))return HELP.emergency;
    if(has("eksperimentalni"))return HELP.scratch;
    if(has("profili proračuna","profili proraäuna"))return HELP.profiles;
    if(has("scenarij"))return HELP.scenario;
    if(has("sinhroniziraj"))return HELP.sync;
    if(has("razdeli pla"))return HELP.payday;
    if(has("prenos neporabljenega"))return HELP.rollover;
    if(has("predloge transakcij","ponavljajoči prihodki","ponavljajoäi prihodki"))return HELP.templates;
    if(has("hitri vnos","naravni jezik"))return HELP.quick;
    if(has("nov cilj"))return HELP.newgoal;
    if(has("primerjaj"))return HELP.annualCompare;
    if(has("yoy"))return HELP.yoy;
    if(has("jan")&&has("feb")&&has("mar")&&has("dec"))return HELP.annualChart;
    if(has("trendi kategorij"))return HELP.categoryTrends;
    if(has("odznaki"))return HELP.badges;
    if(has("splošni cilji","sploÅ¡ni cilji","mesečni cilji","meseäni cilji"))return HELP.goalsTabs;
    if(has("saving")&&has("trenutno"))return HELP.goalCard;
    if(has("finančna simulacija","finanäna simulacija","vaša finančna pot","vaÅ¡a finanäna pot"))return HELP.sim;
    if(has("osnovni")&&has("napredni"))return HELP.mode;
    if((has("osnovni")||has("napredni"))&&has("zavihki"))return HELP.mode;
    if(has("dnevni posnetki"))return HELP.snapshots;
    return "";
  };
  const helpTargetFromEvent=(e)=>{
    if(!hoverHelpEnabled||!hoverHelpPages[vw])return stopHoverHelp();
    const tag=e.target?.tagName?.toLowerCase?.();
    if(tag==="input"||tag==="textarea"||tag==="select"||e.target?.isContentEditable)return stopHoverHelp();
    const el=e.target?.closest?.(".dp-help,[data-help]");
    const msg=el?.dataset?.help||"";
    return msg?{el,msg}:null;
  };
  const startHoverHelp=(e)=>{
    if(hoverHelpMode!=="hover")return;
    if(!e.altKey)return;
    const target=helpTargetFromEvent(e);
    if(!target)return;
    const {el,msg}=target;
    if(!msg)return;
    if(hoverHelpTarget.current===el)return;
    hoverHelpTarget.current=el;
    clearTimeout(hoverHelpTimer.current);
    const x=Math.min(e.clientX+14,window.innerWidth-420);
    const y=Math.min(e.clientY+18,window.innerHeight-180);
    hoverHelpTimer.current=setTimeout(()=>setHoverHelp({msg,x:Math.max(12,x),y:Math.max(12,y)}),1000);
  };
  const moveHoverHelp=(e)=>{if(hoverHelpMode==="hover"&&hoverHelp)setHoverHelp(h=>h?{...h,x:Math.max(12,Math.min(e.clientX+14,window.innerWidth-420)),y:Math.max(12,Math.min(e.clientY+18,window.innerHeight-180))}:h)};
  const stopHoverHelp=(e)=>{if(e?.relatedTarget&&hoverHelpTarget.current?.contains?.(e.relatedTarget))return;clearTimeout(hoverHelpTimer.current);hoverHelpTarget.current=null;setHoverHelp(h=>h?null:h)};
  const openContextHelp=(e)=>{
    if(hoverHelpMode!=="context")return;
    const target=helpTargetFromEvent(e);
    if(!target)return;
    e.preventDefault();
    if(hoverHelpTarget.current===target.el&&hoverHelp){stopHoverHelp();return}
    clearTimeout(hoverHelpTimer.current);
    hoverHelpTarget.current=target.el;
    setHoverHelp({msg:target.msg,x:Math.max(12,Math.min(e.clientX+14,window.innerWidth-420)),y:Math.max(12,Math.min(e.clientY+18,window.innerHeight-180))});
  };
  const visibleTabs=[["dash","Pregled"],["pct","Plan"],["entry","Mesečni vnos"],["annual","Letni pregled"],["goals","Cilji"],["sim","Simulacija"],["timeline","Časovnica"],["analytics","Analitika"],["wishes","Wishlist"],["varsav","Varčevanje"],["settings","Nastavitve"],["crypto","🔒"]].filter(([k])=>!tabHidden.includes(k)&&(adv||k!=="crypto")&&(isSA||(k!=="varsav"&&k!=="settings"&&k!=="crypto"&&k!=="wishes")||(k==="varsav"&&adminConf[curUser]?.varsav)||(k==="settings"&&adminConf[curUser]?.settings)||(k==="crypto"&&adminConf[curUser]?.crypto)||(k==="wishes")));

  return<EB><div onMouseOver={hoverHelpMode==="hover"?startHoverHelp:undefined} onMouseMove={hoverHelpMode==="hover"?moveHoverHelp:undefined} onMouseOut={hoverHelpMode==="hover"?stopHoverHelp:undefined} onContextMenu={openContextHelp} onClick={()=>hoverHelpMode==="context"&&hoverHelp&&stopHoverHelp()} style={{fontFamily:FF,color:C.tx,minHeight:"100vh",background:C.bg}}>
    <style>{`.dp-help{position:relative}`}</style>
    {hoverHelp&&<div style={{position:"fixed",left:hoverHelp.x,top:hoverHelp.y,width:"min(390px,calc(100vw - 32px))",background:C.cd,color:C.tx,border:`1px solid ${C.bd}`,borderRadius:12,boxShadow:SHL,padding:"12px 14px",fontSize:14,lineHeight:1.4,fontWeight:650,zIndex:4000,pointerEvents:"none"}}>{hoverHelp.msg}</div>}
    {/* USER BAR */}
    <div style={{position:isMob?'sticky':'fixed',top:0,right:0,zIndex:100,padding:isMob?'6px 10px':'6px 12px',display:'flex',alignItems:'center',justifyContent:isMob?'flex-end':'flex-start',gap:6,fontSize:isMob?14:16,color:C.mt,background:'rgba(255,253,251,0.94)',backdropFilter:'blur(8px)',borderBottomLeftRadius:isMob?0:14,border:`1px solid ${C.bd}`,borderTop:'none',borderRight:isMob?'none':'none',borderLeft:isMob?'none':`1px solid ${C.bd}`,boxShadow:SH}}>
      <span style={{fontWeight:700,color:C.bl}}>{curUser}</span>
      <span style={sT(isSA?"#fbe8db":"#d9f3e6",isSA?C.bl:"#0e7a52")}>{isSA?"superadmin":"admin"}</span>
      {!LOCAL_AUTH_DISABLED&&<button onClick={doLogout} style={{fontSize:15,fontWeight:600,padding:'3px 10px',border:`1px solid ${C.bd}`,borderRadius:9,background:C.cd,color:C.sb,cursor:'pointer',fontFamily:FF}}>Odjava</button>}
    </div>
    {/* NAV */}
    {isMob?<div style={{background:C.tx,padding:"8px",position:"sticky",top:38,zIndex:90,boxShadow:SH}}>
      <select aria-label="Izberi zavihek" value={vw} onChange={e=>setVw(e.target.value)} style={{...sS,width:"100%",height:42,fontSize:16,fontWeight:800,background:C.cd,color:C.tx,borderRadius:12}}>
        {visibleTabs.map(([k,def])=><option key={k} value={k}>{tabNames[k]||def}</option>)}
      </select>
    </div>:<div style={{display:"flex",gap:2,background:C.tx,padding:"6px 6px 0",overflowX:"auto"}}>
      {visibleTabs.map(([k,def])=>
        <div key={k} style={{padding:"10px 14px",fontSize:16,fontWeight:vw===k?800:600,color:vw===k?C.tx:"#c4b6a6",cursor:"pointer",whiteSpace:"nowrap",background:vw===k?C.bg:"transparent",borderRadius:"12px 12px 0 0",transition:"color .15s ease"}} onClick={()=>setVw(k)}>{tabNames[k]||def}</div>
      )}
    </div>}
    <div style={{padding:isMob?"0.85rem 0.65rem 5rem":"1rem 1.25rem 2rem"}}>
    {showTips&&<div style={{...sC,background:"#f0f7ff",border:"1px solid #bfdbfe",padding:"10px 12px",marginBottom:10,fontSize:15,lineHeight:1.4,color:C.tx}}><strong>Vodnik:</strong> {guideText[vw]||guideText.dash}</div>}
    {showOnboarding&&(()=>{const steps=[
      {t:"Način uporabe",d:"Izberi osnovni ali napredni prikaz. Osnovni skriva hrup, napredni pokaže vse funkcije.",a:<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{Object.entries(VIEW_PROFILE_PRESETS).map(([k,p])=><button key={k} style={{...sB(uiMode===k),height:34,fontSize:14}} onClick={()=>{const all=["dash","pct","entry","annual","goals","sim","timeline","analytics","wishes","varsav","settings","crypto"];setUiMode(k);setTabHidden(all.filter(x=>!(p.tabs||[]).includes(x)));setDashWidgets(p.widgets||{});}}>{p.icon} {p.label}</button>)}</div>},
      {t:"Prihodki",d:"V mesečnem vnosu vpiši plače in dodatne prihodke. To napaja pregled, simulacijo in cilje.",a:<button style={sB(true)} onClick={()=>{setVw('entry');setShowOnboarding(false)}}>Odpri mesečni vnos</button>},
      {t:"Plan",d:"Plan je mesečni dogovor. Izberi metodo proračuna in popravi fiksne/variabilne stroške.",a:<button style={sB(true)} onClick={()=>{setVw('pct');setShowOnboarding(false)}}>Odpri plan</button>},
      {t:"Pregled",d:"Na pregledu lahko skriješ razdelke, spremeniš vrstni red in velikost besedila.",a:<button style={sB(true)} onClick={()=>{setVw('dash');setShowDashCfg(true);setShowOnboarding(false)}}>Prilagodi pregled</button>},
      {t:"Varnost",d:"Naredi varnostno kopijo in po želji nastavi šifriran sync. Lokalno delo je privzeto.",a:<button style={sB(true)} onClick={()=>{createBackup();localStorage.setItem('dp_lastbackup',String(Date.now()));setSMsg('Varnostna kopija prenesena.')}}>Naredi kopijo</button>}
    ];const st=Math.min(onboarding.step||0,steps.length-1);const cur=steps[st];return<div style={{position:"fixed",inset:0,background:"rgba(58,50,44,.42)",zIndex:3500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:C.cd,border:`1px solid ${C.bd}`,borderRadius:18,boxShadow:SHL,width:"min(560px,100%)",padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:10}}><div><div style={{fontSize:12,color:C.mt,fontWeight:900,textTransform:"uppercase"}}>Začetna nastavitev {st+1}/{steps.length}</div><h3 style={{margin:"3px 0 0",fontSize:23}}>{cur.t}</h3></div><button onClick={()=>{setShowOnboarding(false);setOnboarding(o=>({...o,done:true}))}} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:C.mt}}>×</button></div>
        <div style={{fontSize:15,color:C.sb,lineHeight:1.45,marginBottom:14}}>{cur.d}</div>
        <div style={{marginBottom:14}}>{cur.a}</div>
        <div style={{display:"flex",gap:5,marginBottom:14}}>{steps.map((_,i)=><div key={i} style={{height:5,flex:1,borderRadius:9,background:i<=st?C.bl:C.fn}}/>)}</div>
        <div style={{display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}><button style={{...sB(false),height:34}} disabled={st===0} onClick={()=>setOnboarding(o=>({...o,step:Math.max(0,st-1)}))}>Nazaj</button><div style={{display:"flex",gap:8}}><button style={{...sB(false),height:34}} onClick={()=>{setShowOnboarding(false);setOnboarding(o=>({...o,done:true}))}}>Preskoči</button>{st<steps.length-1?<button style={{...sB(true),height:34}} onClick={()=>setOnboarding(o=>({...o,step:st+1}))}>Naprej</button>:<button style={{...sB(true),height:34,background:C.gn}} onClick={()=>{setShowOnboarding(false);setOnboarding({done:true,step:0})}}>Končaj</button>}</div></div>
      </div>
    </div>})()}

    {/* ===== PREGLED ===== */}
    {vw==="dash"&&<div style={{display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
        <h2 style={{fontSize:24,fontWeight:700,margin:0}}>{tabNames.dash||"Pregled"}</h2>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          {YPk}
          <button onClick={()=>{setShowBankImp(s=>!s);setShowImp(false)}} style={{...sB(showBankImp),fontSize:16}}>Bančni izpisek</button>
          <button onClick={()=>{setShowImp(!showImp);setShowBankImp(false)}} style={{...sB(false),fontSize:16}}>Uvoz Excel</button>
          <button onClick={doExport} style={{...sB(false),fontSize:16}}>Izvoz</button>
          <button onClick={()=>setEditPlan(!editPlan)} style={{...sB(editPlan),fontSize:16}}>{editPlan?"Zaključi urejanje":"Uredi plan"}</button>
          {editPlan&&<button {...hp("sync")} onClick={syncPlanToEntry} style={{...sB(true),fontSize:16,background:C.gn}}>Sinhroniziraj → mesečni vnos</button>}
          <button onClick={()=>setShowPerDay(p=>!p)} style={{...sB(showPerDay),fontSize:15}} title="Prikaz stroška na dan">{showPerDay?"€/dan":"€/mes"}</button>
          <button onClick={()=>setShowDashCfg(v=>!v)} style={{...sB(showDashCfg),fontSize:15}} title="Prilagodi pregled">⚙</button>
          {MNav}
        </div>
      </div>
      {/* #49 Dashboard widget customization */}
      {showDashCfg&&<div style={{...sC,background:GRW,border:`1px solid #f2d9c6`}}>
        <div style={{fontSize:14,fontWeight:800,color:C.tx,marginBottom:8}}>⚙ Prilagodi pregled — izberi, kaj naj bo prikazano</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:6}}>
          {[["health","Finančno zdravje"],["mom","Primerjava z mesecem"],["savtrend","Varčevalna stopnja"],["merchants","Poraba po trgovcih"],["velocity","Napoved porabe"],["charts","Grafi (razdelitev, trend)"]].map(([k,lbl])=>
            <label key={k} style={{display:"flex",alignItems:"center",gap:7,fontSize:13,padding:"6px 9px",background:C.cd,borderRadius:10,border:`1px solid ${C.bd}`,cursor:"pointer",fontWeight:600,color:C.sb}}>
              <input type="checkbox" checked={dashW(k)} onChange={e=>setDashWidgets(p=>({...p,[k]:e.target.checked}))} style={{accentColor:C.bl,width:16,height:16}}/>
              {lbl}
            </label>
          )}
        </div>
      </div>}
      {showDashCfg&&<div style={{...sC,background:"#fffdfb",border:`1px solid ${C.bd}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:8}}>
          <div style={{fontSize:14,fontWeight:800,color:C.tx}}>Razpored, skriti razdelki in velikost teksta</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <button onClick={()=>setDashWidgets(Object.fromEntries(DASH_SECTIONS.map(([k])=>[k,true])))} style={{...sB(false),height:28,fontSize:13,padding:"0 10px"}}>Izberi vse</button>
            <button onClick={()=>setDashWidgets(Object.fromEntries(DASH_SECTIONS.map(([k])=>[k,false])))} style={{...sB(false),height:28,fontSize:13,padding:"0 10px"}}>Počisti vse</button>
          </div>
        </div>
        <label style={{display:"grid",gridTemplateColumns:isMob?"1fr":"180px 1fr 42px",gap:10,alignItems:"center",fontSize:13,fontWeight:800,color:C.sb,marginBottom:10}}>
          Velikost teksta stroškov
          <input type="range" min="13" max="19" value={dashCostTextSize} onChange={e=>setDashCostTextSize(parseInt(e.target.value)||15)} style={{width:"100%"}}/>
          <span style={{textAlign:"right",color:C.tx}}>{dashCostTextSize}px</span>
        </label>
        <div style={{fontSize:12,color:C.mt,marginBottom:6}}>Povleci vrstico za spremembo vrstnega reda na zavihku Pregled.</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:6}}>
          {[...dashOrder,...DASH_SECTIONS.map(([k])=>k)].filter((v,i,a)=>a.indexOf(v)===i).map(k=>DASH_SECTIONS.find(([id])=>id===k)).filter(Boolean).map(([k,lbl])=>
            <div key={k} draggable onDragStart={()=>setDragDashKey(k)} onDragOver={e=>e.preventDefault()} onDrop={()=>{if(dragDashKey)moveDashSection(dragDashKey,k);setDragDashKey(null)}} style={{display:"grid",gridTemplateColumns:"22px 1fr 44px",gap:7,alignItems:"center",fontSize:13,padding:"7px 9px",background:C.cd,borderRadius:10,border:`1px solid ${dragDashKey===k?C.bl:C.bd}`,cursor:"grab",fontWeight:700,color:C.sb}}>
              <span style={{color:C.mt}}>☰</span>
              <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer"}}>
                <input type="checkbox" checked={dashW(k)} onChange={e=>setDashWidgets(p=>({...p,[k]:e.target.checked}))} style={{accentColor:C.bl,width:16,height:16}}/>
                {lbl}
              </label>
              <span style={{fontSize:11,color:C.mt,textAlign:"right"}}>#{dashOrd(k)+1}</span>
            </div>
          )}
        </div>
        <button onClick={()=>{setDashWidgets({});setDashOrder(DASH_SECTIONS.map(([k])=>k));setDashCostTextSize(15)}} style={{...sB(false),height:28,fontSize:13,marginTop:8}}>Ponastavi pregled</button>
      </div>}
      {/* Month close/open */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <button onClick={()=>{if(!isClosed){setRetroStep(0);setShowRetro(true)}else{toggleClose(mo)}}} style={{...sB(isClosed),fontSize:16,background:isClosed?C.gn:undefined,color:isClosed?"#fff":undefined,border:isClosed?"none":undefined}}>{isClosed?`✓ ${MF[mo]} zaključen`:`Zaključi ${MF[mo]}`}</button>
        {isClosed&&<span style={{fontSize:16,color:C.gn}}>Podatki tega meseca se uporabijo v simulaciji kot dejanski.</span>}
      </div>
      {/* Backup reminder */}
      {checkBackupDue()&&<div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8,background:"#fffdfb",border:`1px solid ${C.bd}`,borderRadius:10,padding:"4px 6px 4px 10px",fontSize:12,color:C.mt,boxShadow:"none",maxWidth:"100%",width:"fit-content",whiteSpace:"nowrap"}}>
          <span>Varnostna kopija je starejša od 14 dni.</span>
          <button style={{...sB(true),height:24,fontSize:12,padding:"0 10px",borderRadius:8,background:C.or,color:"#fff",boxShadow:"0 2px 8px rgba(224,145,60,0.28)"}} onClick={()=>{createBackup();localStorage.setItem('dp_lastbackup',String(Date.now()))}}>Kopija</button>
        </div>
      </div>}
      {/* Bančni izpisek uvoz */}
      {showBankImp&&<BankImport
        allSubs={AS}
        mo={mo} yr={yr}
        onImport={(items)=>{
          setData(prev=>{
            const n=JSON.parse(JSON.stringify(prev));
            const importDate=new Date().toLocaleDateString("sl-SI");
            items.forEach(r=>{
              const iy=r.date&&r.date.length>=4?parseInt(r.date.substring(0,4)):yr;
              const im=r.mo>=0?r.mo:mo;
              if(!n[iy])n[iy]=initY();
              if(!n[iy][im])n[iy][im]=initM();
              if(!n[iy][im].subs[r.subId])n[iy][im].subs[r.subId]={plan:0,actual:0,transactions:[],comment:""};
              if(!Array.isArray(n[iy][im].subs[r.subId].transactions))n[iy][im].subs[r.subId].transactions=[];
              const amt=Math.abs(r.amount);
              const shortDate=r.date?r.date.split('-').reverse().slice(0,2).join('.'):importDate;
              n[iy][im].subs[r.subId].transactions.push({id:Date.now()+Math.random(),amt,comment:`📥 ${shortDate} ${r.desc.substring(0,30)}`,imported:true});
              n[iy][im].subs[r.subId].actual=n[iy][im].subs[r.subId].transactions.reduce((s,t)=>s+(t.amt||t),0);
            });
            return n;
          });
          setShowBankImp(false);
        }}
        onClose={()=>setShowBankImp(false)}
      />}
      {/* Import Excel */}
      {showImp&&<div style={{...sC,background:"#f0f7ff",border:"1px dashed #93c5fd"}}><div style={{fontSize:18,fontWeight:600,color:C.bl,marginBottom:4}}>Uvozi iz Excela</div><div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}><span style={{fontSize:17}}>V leto:</span><select style={{...sS,width:70}} value={impYr} onChange={e=>setImpYr(parseInt(e.target.value))}>{[2020,2021,2022,2023,2024,2025,2026,2027,2028].map(y=><option key={y} value={y}>{y}</option>)}</select><input type="file" accept=".xlsx,.xls" onChange={handleImpFile} style={{fontSize:18}}/></div>{impPrev&&<div style={{border:"1px solid #e8e6e1",borderRadius:6,padding:8,background:"#fff",maxHeight:160,overflowY:"auto",marginBottom:8}}><div style={{fontSize:17,fontWeight:600,marginBottom:4}}>Predogled ({impPrev.preview.length} vnosov → {impYr}):</div><table style={{width:"100%",fontSize:16,borderCollapse:"collapse"}}><thead><tr><th style={{textAlign:"left",padding:2}}>Mesec</th><th style={{textAlign:"left",padding:2}}>Postavka</th><th style={{textAlign:"right",padding:2}}>Izvedba</th></tr></thead><tbody>{impPrev.preview.slice(0,20).map((r,i)=><tr key={i}><td style={{padding:2}}>{r.month}</td><td style={{padding:2}}>{r.label.substring(0,25)}</td><td style={{textAlign:"right",padding:2}}>{fmt(r.actual)}</td></tr>)}</tbody></table><div style={{display:"flex",gap:6,marginTop:6}}><button style={sB(true)} onClick={doImport}>Potrdi uvoz</button><button style={sB(false)} onClick={()=>setImpPrev(null)}>Prekliči</button></div></div>}{impLog.map((l,i)=><div key={i} style={{fontSize:17,color:l.type==="ok"?C.gn:C.rd}}>{l.msg}</div>)}</div>}

      {/* #41 Financial health score hero */}
      {dashW('health')&&(()=>{
        const closedMs=[];for(let i=0;i<12;i++){const m2=yd[i]||initM();if(m2.closed)closedMs.push(m2);}
        let srScore=55;
        if(closedMs.length){const rates=closedMs.map(m2=>{const inc=iT(m2);const exp=efxT(m2,'actual')+evrT(m2,'actual')+uxtT(m2);return inc>0?(inc-exp)/inc:0;});const avgSr=rates.reduce((s,r)=>s+r,0)/rates.length;srScore=Math.max(0,Math.min(100,Math.round(avgSr/0.2*100)));}
        else if(tInc>0){srScore=Math.max(0,Math.min(100,Math.round((tInc-tAc)/tInc/0.2*100)));}
        let bdScore=70;
        if(closedMs.length){const okCnt=closedMs.filter(m2=>{const p=efxT(m2,'plan')+evrT(m2,'plan');const a=efxT(m2,'actual')+evrT(m2,'actual')+uxtT(m2);return p>0&&a<=p*1.05;}).length;bdScore=Math.round(okCnt/closedMs.length*100);}
        const savTotal=savData.members.reduce((s,m2)=>s+m2.sources.reduce((ss,src)=>ss+(src.amount||0),0),0);
        const avgExp=closedMs.length?closedMs.reduce((s,m2)=>s+efxT(m2,'actual')+evrT(m2,'actual')+uxtT(m2),0)/closedMs.length:(tAc||2500);
        const moCovered=avgExp>0?savTotal/avgExp:0;
        const erScore=Math.max(0,Math.min(100,Math.round(moCovered/6*100)));
        const totalDebt=debts.reduce((s,d)=>s+(d.balance||0),0);
        const annualInc=(closedMs.length?closedMs.reduce((s,m2)=>s+iT(m2),0)/closedMs.length:(tInc||3000))*12;
        let dScore=100;
        if(totalDebt>0&&annualInc>0)dScore=Math.max(0,Math.min(100,Math.round(100-(totalDebt/annualInc)*120)));
        const overall=Math.round((srScore+bdScore+erScore+dScore)/4);
        const tier=overall>=85?{t:"Odlično! Proračun cveti 🌿",c:C.gn}:overall>=70?{t:"Zelo dobro — kar tako naprej 👍",c:"#3d9970"}:overall>=55?{t:"Dobro, na pravi poti 👌",c:C.bl}:overall>=40?{t:"V redu — nekaj prostora za rast",c:C.or}:{t:"Potrebuje malo pozornosti",c:C.rd};
        const R=46,CIRC=2*Math.PI*R,dash=CIRC*(overall/100);
        const subs=[{l:"Varčevanje",v:srScore,ic:"🐷"},{l:"Disciplina",v:bdScore,ic:"🎯"},{l:"Rezerva",v:erScore,ic:"🛡️"},{l:"Dolg",v:dScore,ic:"⚖️"}];
        return<DashSection id="health" title="Finančno zdravje" helpKey="health" style={{background:GRW,border:`1px solid #f2d9c6`,animation:"dpFadeUp .4s ease"}} bodyStyle={{padding:16}}>
          <div style={{display:"flex",gap:18,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{position:"relative",width:120,height:120,flexShrink:0}}>
              <svg width={120} height={120} viewBox="0 0 120 120">
                <circle cx={60} cy={60} r={R} fill="none" stroke="#f0e0d2" strokeWidth={11}/>
                <circle cx={60} cy={60} r={R} fill="none" stroke={tier.c} strokeWidth={11} strokeDasharray={`${dash} ${CIRC-dash}`} strokeLinecap="round" transform="rotate(-90 60 60)" style={{transition:"stroke-dasharray .6s ease"}}/>
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:34,fontWeight:900,color:tier.c,lineHeight:1}}>{overall}</span>
                <span style={{fontSize:11,color:C.mt,fontWeight:700,letterSpacing:0.5}}>/ 100</span>
              </div>
            </div>
            <div style={{flex:1,minWidth:200}}>
              <div style={{fontSize:13,fontWeight:800,color:C.mt,textTransform:"uppercase",letterSpacing:0.6}}>Finančno zdravje</div>
              <div style={{fontSize:19,fontWeight:800,color:tier.c,margin:"2px 0 10px"}}>{tier.t}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:6}}>
                {subs.map(s=>{const sc=s.v>=70?C.gn:s.v>=45?C.or:C.rd;return<div key={s.l} style={{background:C.cd,borderRadius:11,padding:"7px 9px",border:`1px solid ${C.bd}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><span style={{fontSize:12,color:C.sb,fontWeight:700}}>{s.ic} {s.l}</span><span style={{fontSize:13,fontWeight:800,color:sc}}>{s.v}</span></div>
                  <div style={{height:5,borderRadius:3,background:"#f0e6da",overflow:"hidden"}}><div style={{height:"100%",width:`${s.v}%`,borderRadius:3,background:sc,transition:"width .5s ease"}}/></div>
                </div>;})}
              </div>
            </div>
          </div>
        </DashSection>;
      })()}

      {/* KPI grid: left=Prihodki/Odhodki/Razlika, right=Fiksni/Variabilni/Varčevanje */}
      {dashW('kpi')&&<DashSection id="kpi" title="Glavni kvadratki" helpKey="kpi" bodyStyle={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:10,alignItems:"stretch"}}>
        <div style={kpiBox(C.gn)}><div style={{fontSize:11,color:C.mt,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Prihodki{showPerDay&&<span style={{color:C.bl,marginLeft:4,fontSize:9,fontWeight:400}}>/dan</span>}</div><div style={moneyText(C.gn,isMob?25:28)}>{showPerDay?fmt(tInc/dInMo):fmt(tInc)}</div></div>
        <div style={kpiBox(C.rd)}><div style={{fontSize:11,color:C.mt,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Odhodki{showPerDay&&<span style={{color:C.bl,marginLeft:4,fontSize:9,fontWeight:400}}>/dan</span>}</div><div style={moneyText(C.rd,isMob?25:28)}>{showPerDay?fmt(tAc/dInMo):fmt(tAc)}</div></div>
        <div style={kpiBox(tInc-tAc>=0?C.gn:C.rd)}><div style={{fontSize:11,color:C.mt,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Razlika{showPerDay&&<span style={{color:C.bl,marginLeft:4,fontSize:9,fontWeight:400}}>/dan</span>}</div><div style={moneyText(tInc-tAc>=0?C.gn:C.rd,isMob?24:26)}>{(()=>{const d=tInc-tAc;return(d>=0?"+":"-")+fmt(showPerDay?Math.abs(d)/dInMo:Math.abs(d))})()}</div></div>
        {(()=>{const varPlan=evrT(md,'plan');const fixPlan=efxT(md,'plan');const safe=tInc-fixPlan-tVr-tUxt;const pctUsed=varPlan>0?pc(tVr+tUxt,varPlan):0;const clr=safe>=200?C.gn:safe>=0?C.or:C.rd;return<div style={kpiBox(clr)}><div style={{fontSize:11,color:C.mt,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Varno za porabo</div><div style={moneyText(clr,isMob?24:26)}>{fmt(Math.max(0,safe))}</div><div style={{fontSize:12,color:C.mt,marginTop:4}}>po fiksnih stroških · var. {pctUsed}% plana</div></div>;})()}
        <div style={kpiBox("#d97706")}><div style={{fontSize:11,color:C.mt,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Fiksni stroški</div><div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"3px 8px",alignItems:"baseline"}}><span style={{fontSize:13,color:C.mt}}>Plan:</span><span style={{...compactMoney(C.tx),fontSize:18}}>{fmt(efxT(md,'plan'))}</span><span style={{fontSize:13,color:C.mt}}>Porabljeno:</span><span style={{...compactMoney(C.tx),fontSize:18}}>{fmt(tFx)}</span></div></div>
        <div style={kpiBox("#0891b2")}><div style={{fontSize:11,color:C.mt,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Variabilni stroški</div><div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"3px 8px",alignItems:"baseline"}}><span style={{fontSize:13,color:C.mt}}>Plan:</span><span style={{...compactMoney(C.tx),fontSize:18}}>{fmt(evrT(md,'plan'))}</span><span style={{fontSize:13,color:C.mt}}>Porabljeno:</span><span style={{...compactMoney(C.tx),fontSize:18}}>{fmt(tVr)}</span></div></div>
        <div style={{...kpiBox(C.bl),position:"relative"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><span style={{fontSize:11,color:C.mt,textTransform:"uppercase",letterSpacing:0.5}}>Varčevanje</span><span onClick={()=>setShowSavCfg(!showSavCfg)} style={{...sT("#dbeafe",C.bl),fontSize:14,cursor:"pointer",padding:"1px 5px"}}>⚙</span></div><div style={moneyText(C.bl,isMob?24:26)}>{fmt(savVis.reduce((s,id)=>s+(md.subs?.[id]?.actual||0),0))}</div>{showSavCfg&&<div style={{position:"absolute",top:"100%",right:0,zIndex:20,background:"#fff",border:`1px solid ${C.bd}`,borderRadius:6,padding:8,minWidth:180,boxShadow:"0 2px 8px rgba(0,0,0,0.1)"}}>{(effectiveCats.find(c=>c.id==="savings_inv")?.subs||[]).map(s=><label key={s.id} style={{display:"flex",alignItems:"center",gap:4,fontSize:16,padding:"2px 0",cursor:"pointer"}}><input type="checkbox" checked={savVis.includes(s.id)} onChange={e=>{if(e.target.checked)setSavVis(v=>[...v,s.id]);else setSavVis(v=>v.filter(x=>x!==s.id))}}/>{s.nm.substring(0,20)}</label>)}<button onClick={()=>setShowSavCfg(false)} style={{...sB(true),height:20,fontSize:18,marginTop:3,width:"100%"}}>OK</button></div>}</div>
        {(()=>{const savT=savData.members.reduce((s,m)=>s+m.sources.reduce((ss,src)=>ss+(src.amount||0),0),0);const assT=nwAssets.reduce((s,a)=>s+(a.value||0),0);const liabT=nwLiabs.reduce((s,l)=>s+(l.value||0),0);const nw=savT+cryptoVal+assT-liabT;const nwDelta=nwHist.length>1?nw-nwHist[0].nw:null;if(!savT&&!assT&&!liabT&&!cryptoVal)return null;return<div style={{...kpiBox(nw>=0?C.pu:'#f43f5e'),cursor:"pointer"}} onClick={()=>setVw('varsav')} title="Odpri Varčevanje"><div style={{fontSize:11,color:C.mt,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Neto vrednost →</div><div style={moneyText(nw>=0?C.pu:'#f43f5e',isMob?24:26)}>{fmt(nw)}</div>{nwDelta!==null&&<div style={{fontSize:12,color:nwDelta>=0?C.gn:C.rd,marginTop:4,whiteSpace:"nowrap"}}>{nwDelta>=0?"+":""}{fmt(nwDelta)} od prvega merenja</div>}</div>;})()}
      </DashSection>}

      {dashW('copilot')&&<DashSection id="copilot" title="Finančni copilot" bodyStyle={{display:"grid",gridTemplateColumns:isMob?"1fr":"1.1fr .9fr",gap:10}}>
        {(()=>{const i=copilotInsights();return<>
          <div style={{display:"grid",gap:8}}>
            <div style={{fontSize:13,color:C.mt,fontWeight:700}}>Lokalni pomočnik. Podatki se ne pošiljajo nikamor.</div>
            <div style={{fontSize:18,fontWeight:900,color:tInc-tAc>=0?C.gn:C.rd}}>{i.summary}</div>
            <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"repeat(2,1fr)",gap:8}}>
              <div style={{...sM,margin:0}}><strong>Preseganja</strong><div style={{fontSize:13,color:C.sb,marginTop:4}}>{i.over}</div></div>
              <div style={{...sM,margin:0}}><strong>Prihranki</strong><div style={{fontSize:13,color:C.sb,marginTop:4}}>{i.unused}</div></div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <input value={copilotQ} onChange={e=>setCopilotQ(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')askCopilot()}} placeholder="Vprašaj npr. kaj lahko še varno porabim?" style={{...sI,width:"100%"}}/>
            <button onClick={askCopilot} style={{...sB(true),height:36}}>Vprašaj</button>
            <pre style={{whiteSpace:"pre-wrap",fontFamily:FF,fontSize:13,lineHeight:1.35,color:C.sb,background:"#fffdfb",border:`1px solid ${C.bd}`,borderRadius:10,padding:10,minHeight:84,margin:0}}>{copilotA||"Vprašaj po porabi, ciljih, transakcijah ali varnem znesku za porabo."}</pre>
          </div>
        </>})()}
      </DashSection>}

      {/* #47 Month-over-month + #46 Savings rate trend */}
      {dashW('momtrend')&&(dashW('mom')||dashW('savtrend'))&&<DashSection id="momtrend" title="Primerjava in varčevalna stopnja" bodyStyle={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:10}}>
        {dashW('mom')&&(()=>{
          const prevMo=mo===0?11:mo-1;const prevYr=mo===0?yr-1:yr;
          const pmd=(data[prevYr]||{})[prevMo]||initM();
          const prevExp=efxT(pmd,'actual')+evrT(pmd,'actual')+uxtT(pmd);
          const diff=tAc-prevExp;
          const movers=effectiveCats.map(cat=>{const a=cT(md,cat,'actual');const b=cT(pmd,cat,'actual');return{nm:cat.nm,d:a-b};}).filter(x=>Math.abs(x.d)>=10).sort((a,b)=>Math.abs(b.d)-Math.abs(a.d)).slice(0,3);
          return<div {...hp("mom")} style={sC}>
            <div style={{fontSize:13,fontWeight:800,color:C.mt,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Primerjava z {MS[prevMo]}</div>
            <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:8}}>
              <span style={{fontSize:26,fontWeight:900,color:diff>0?C.rd:C.gn}}>{diff>0?"+":diff<0?"−":""}{fmt(Math.abs(diff))}</span>
              <span style={{fontSize:13,color:C.mt,fontWeight:600}}>{diff>0?"več porabljeno":diff<0?"manj porabljeno — bravo!":"enaka poraba"}</span>
            </div>
            {prevExp===0&&tAc===0?<div style={{fontSize:13,color:C.mt}}>Še ni podatkov za primerjavo.</div>:
            movers.length?movers.map((x,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:i<movers.length-1?`1px solid ${C.fn}`:"none",fontSize:13}}>
              <span style={{color:C.sb}}>{x.d>0?"▲":"▼"} {x.nm}</span>
              <span style={{fontWeight:800,color:x.d>0?C.rd:C.gn}}>{x.d>0?"+":"−"}{fmt(Math.abs(x.d))}</span>
            </div>):<div style={{fontSize:13,color:C.mt}}>Brez večjih sprememb po kategorijah.</div>}
          </div>;
        })()}
        {dashW('savtrend')&&(()=>{
          const srData=MS.map((m,i)=>{const m2=yd[i]||initM();const inc=iT(m2);const exp=efxT(m2,'actual')+evrT(m2,'actual')+uxtT(m2);return{name:m,rate:inc>0?Math.round((inc-exp)/inc*100):null};});
          const valid=srData.filter(d=>d.rate!==null);
          const avg=valid.length?Math.round(valid.reduce((s,d)=>s+d.rate,0)/valid.length):null;
          return<div {...hp("savtrend")} style={sC}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
              <span style={{fontSize:13,fontWeight:800,color:C.mt,textTransform:"uppercase",letterSpacing:0.5}}>Varčevalna stopnja {yr}</span>
              {avg!==null&&<span style={{fontSize:15,fontWeight:900,color:avg>=20?C.gn:avg>=0?C.or:C.rd}}>Ø {avg}%</span>}
            </div>
            {valid.length?<ResponsiveContainer width="100%" height={96}><BarChart data={srData} barGap={0}><XAxis dataKey="name" tick={{fontSize:10}} axisLine={false} tickLine={false}/><YAxis hide/><Tooltip formatter={v=>v+"%"} contentStyle={{fontSize:14,borderRadius:10,border:`1px solid ${C.bd}`}}/><Bar dataKey="rate" radius={[3,3,0,0]} barSize={13}>{srData.map((d,i)=><Cell key={i} fill={d.rate===null?"#eee":d.rate>=20?C.gn:d.rate>=0?C.or:C.rd}/>)}</Bar></BarChart></ResponsiveContainer>:<div style={{fontSize:13,color:C.mt,textAlign:"center",padding:20}}>Vnesi prihodke in odhodke za prikaz.</div>}
          </div>;
        })()}
      </DashSection>}

      {/* #30 Velocity forecast chips */}
      {dashW('velocity')&&(()=>{const now3=new Date();const df=mo===now3.getMonth()&&yr===now3.getFullYear()?now3.getDate()/dInMo:0;if(df<0.1||df>0.95)return null;const overCats=effectiveCats.map(cat=>{const plan=cT(md,cat,'plan');const actual=cT(md,cat,'actual');if(plan<=0||actual<=0)return null;const pace=Math.round(actual/df);const ovr=pace-plan;return ovr>50?{cat,pace,plan,ovr}:null}).filter(Boolean).sort((a,b)=>b.ovr-a.ovr).slice(0,3);if(!overCats.length)return null;return<DashSection id="velocity" title="⚡ Napoved porabe">{overCats.map(({cat,pace,ovr})=><div key={cat.id} style={{display:"inline-flex",alignItems:"center",gap:3,padding:"3px 10px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:20,fontSize:13,color:C.rd,margin:"0 6px 6px 0"}}><span style={{fontWeight:600}}>{cat.nm.split(" ")[0]}</span><span>{fmt(pace)}</span><span style={{fontWeight:700}}>+{fmt(ovr)}</span></div>)}</DashSection>;})()}
      {/* #44 Spending by merchant */}
      {dashW('merchants')&&(()=>{
        const merch={};
        effectiveAS.forEach(sub=>{(md.subs?.[sub.id]?.transactions||[]).forEach(t=>{
          if(typeof t!=='object')return;
          const c=(t.comment||'').replace(/[📥💰🎯]/gu,'').replace(/\d{1,2}\.\d{1,2}\.?\d{0,4}/g,'').trim();
          if(!c)return;
          const kw=extractKeyword(c);if(!kw||kw.length<3)return;
          merch[kw]=(merch[kw]||0)+(t.amt||0);
        });});
        const top=Object.entries(merch).sort((a,b)=>b[1]-a[1]).slice(0,8);
        const maxV=top.length?top[0][1]:1;
        return<div {...hp("cashflow")} style={{...sC,order:dashOrd('merchants')}}>
          <div onClick={()=>setShowMerchants(v=>!v)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",userSelect:"none"}}>
            <span style={{fontSize:15,fontWeight:800,color:C.tx}}>🏪 Poraba po trgovcih — {MF[mo]}</span>
            <span style={{fontSize:13,color:C.mt}}>{showMerchants?"▲":"▼"}</span>
          </div>
          {showMerchants&&<div style={{marginTop:8}}>
            {top.length===0?<div style={{fontSize:13,color:C.mt,padding:"6px 0"}}>Ni dovolj podatkov. Uvozi bančni izpisek ali dodaj transakcije z opisom.</div>:
            top.map(([nm,amt])=><div key={nm} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",fontSize:13}}>
              <span style={{width:120,color:C.sb,fontWeight:700,textTransform:"capitalize",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flexShrink:0}}>{nm}</span>
              <div style={{flex:1,height:14,background:C.fn,borderRadius:7,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.max(6,Math.round(amt/maxV*100))}%`,background:GR,borderRadius:7}}/></div>
              <span style={{width:64,textAlign:"right",fontWeight:800,color:C.tx,flexShrink:0}}>{fmt(amt)}</span>
            </div>)}
          </div>}
        </div>;
      })()}
      {/* Plan by category - SIDE-BY-SIDE FIXED + VARIABLE */}
      {dashW('categories')&&<DashSection id="categories" title="Fiksni in variabilni stroški" bodyStyle={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:10}}>
        {/* LEFT: Fiksni stroški */}
        <div>
          <div style={{fontSize:Math.max(18,dashCostTextSize+4),fontWeight:800,color:C.tx,marginBottom:5}}>Fiksni stroški</div>
          <div style={{...sC,padding:"10px 14px"}}>{visibleCats.filter(c=>c.tp==="fixed").map(cat=>{const pT2=cT(md,cat,'plan');const aT2=cT(md,cat,'actual');const p2=pc(aT2,pT2);return<React.Fragment key={cat.id}><div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",borderBottom:`1px solid ${C.fn}`,fontSize:dashCostTextSize+1,lineHeight:1.25}}><span style={{flex:1,fontWeight:800,minWidth:0}}>{cat.nm}</span>{editPlan&&<input style={{...sI,width:64,height:26,fontSize:15}} defaultValue={pT2||""} onBlur={e=>{const v=parseFloat(e.target.value)||0;if(cat.subs.length===1)uSub(cat.subs[0].id,"plan",v);else{const total=cat.subs.reduce((s,sub)=>s+sub.dp,0);cat.subs.forEach(sub=>{uSub(sub.id,"plan",total>0?Math.round(v*sub.dp/total):Math.round(v/cat.subs.length))})}}} placeholder="€"/>}<span style={{...compactMoney("#777"),minWidth:66,textAlign:"right",fontSize:dashCostTextSize}}>{fmt(pT2)}</span><span style={{...compactMoney(C.tx),minWidth:66,textAlign:"right",fontSize:dashCostTextSize,fontWeight:800}}>{fmt(aT2)}</span><span style={{minWidth:44,textAlign:"right",fontWeight:800,fontSize:Math.max(13,dashCostTextSize-1),color:pT2?(p2>90?C.rd:p2>70?C.or:C.gn):C.mt}}>{pT2?p2+"%":"—"}</span></div>
            {cat.subs.filter(sub=>subVis[sub.id]!==true).map(sub=>{const sd=md.subs?.[sub.id]||{plan:0,actual:0};const sp=pc(sd.actual,sd.plan);return<div key={sub.id} style={{display:"flex",alignItems:"center",gap:8,padding:"3px 0 3px 14px",borderBottom:`1px solid ${C.fn}`,fontSize:dashCostTextSize,lineHeight:1.25,color:"#555"}}><span style={{flex:1,minWidth:0}}>{sub.nm}</span>{editPlan?<input style={{...sI,width:58,height:24,fontSize:14}} defaultValue={sd.plan||""} onBlur={e=>uSub(sub.id,"plan",e.target.value)} placeholder="€"/>:<span style={{...compactMoney("#777"),minWidth:58,textAlign:"right",fontWeight:500}}>{sd.plan?fN(sd.plan):"—"}</span>}<span style={{...compactMoney(C.tx),minWidth:58,textAlign:"right",fontWeight:600}}>{sd.actual?fN(sd.actual):"—"}</span><span style={{minWidth:40,textAlign:"right",fontSize:Math.max(12,dashCostTextSize-2),fontWeight:700,color:sd.plan?(sp>90?C.rd:sp>70?C.or:C.gn):C.mt}}>{sd.plan?sp+"%":"—"}</span></div>})}
          </React.Fragment>})}</div>
        </div>
        {/* RIGHT: Variabilni stroški */}
        <div>
          <div style={{fontSize:Math.max(18,dashCostTextSize+4),fontWeight:800,color:C.tx,marginBottom:5}}>Variabilni stroški</div>
          <div style={{...sC,padding:"10px 14px"}}>{visibleCats.filter(c=>c.tp==="var").map(cat=>{const pT2=cT(md,cat,'plan');const aT2=cT(md,cat,'actual');const p2=pc(aT2,pT2);return<React.Fragment key={cat.id}><div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",borderBottom:`1px solid ${C.fn}`,fontSize:dashCostTextSize+1,lineHeight:1.25}}><span style={{flex:1,fontWeight:800,minWidth:0}}>{cat.nm}</span>{editPlan&&<input style={{...sI,width:64,height:26,fontSize:15}} defaultValue={pT2||""} onBlur={e=>{const v=parseFloat(e.target.value)||0;if(cat.subs.length===1)uSub(cat.subs[0].id,"plan",v);else if(cat.subs.length===0)return;else{const total=cat.subs.reduce((s,sub)=>s+sub.dp,0);cat.subs.forEach(sub=>{uSub(sub.id,"plan",total>0?Math.round(v*sub.dp/total):Math.round(v/cat.subs.length))})}}} placeholder="€"/>}<span style={{...compactMoney("#777"),minWidth:66,textAlign:"right",fontSize:dashCostTextSize}}>{fmt(pT2)}</span><span style={{...compactMoney(C.tx),minWidth:66,textAlign:"right",fontSize:dashCostTextSize,fontWeight:800}}>{fmt(aT2)}</span><span style={{minWidth:44,textAlign:"right",fontWeight:800,fontSize:Math.max(13,dashCostTextSize-1),color:pT2?(p2>90?C.rd:p2>70?C.or:C.gn):C.mt}}>{pT2?p2+"%":"—"}</span></div>
            {cat.subs.filter(sub=>subVis[sub.id]!==true).map(sub=>{const sd=md.subs?.[sub.id]||{plan:0,actual:0};const sp=pc(sd.actual,sd.plan);return<div key={sub.id} style={{display:"flex",alignItems:"center",gap:8,padding:"3px 0 3px 14px",borderBottom:`1px solid ${C.fn}`,fontSize:dashCostTextSize,lineHeight:1.25,color:"#555"}}><span style={{flex:1,minWidth:0}}>{sub.nm}</span>{editPlan?<input style={{...sI,width:58,height:24,fontSize:14}} defaultValue={sd.plan||""} onBlur={e=>uSub(sub.id,"plan",e.target.value)} placeholder="€"/>:<span style={{...compactMoney("#777"),minWidth:58,textAlign:"right",fontWeight:500}}>{sd.plan?fN(sd.plan):"—"}</span>}<span style={{...compactMoney(C.tx),minWidth:58,textAlign:"right",fontWeight:600}}>{sd.actual?fN(sd.actual):"—"}</span><span style={{minWidth:40,textAlign:"right",fontSize:Math.max(12,dashCostTextSize-2),fontWeight:700,color:sd.plan?(sp>90?C.rd:sp>70?C.or:C.gn):C.mt}}>{sd.plan?sp+"%":"—"}</span></div>})}
          </React.Fragment>})}</div>
        </div>
      </DashSection>}

      {/* Charts */}
      {dashW('charts')&&<DashSection id="charts" title="Grafi" bodyStyle={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:8}}>
        <div style={sC}><div style={{fontSize:17,fontWeight:600,color:C.sb,marginBottom:4}}>Razdelitev</div>{pieData.length>0?<div style={{display:"flex",alignItems:"center",gap:8}}><ResponsiveContainer width={100} height={100}><PieChart><Pie data={pieData} innerRadius={24} outerRadius={45} dataKey="value" stroke="none">{pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie></PieChart></ResponsiveContainer><div style={{fontSize:18,color:"#666"}}>{pieData.slice(0,5).map((d,i)=><div key={i} style={{marginBottom:2}}><span style={{display:"inline-block",width:7,height:7,borderRadius:1,background:d.color,marginRight:2}}/>{d.name} {pc(d.value,tAc)}%</div>)}</div></div>:<div style={{fontSize:16,color:"#999",textAlign:"center",padding:12}}>Vnesi podatke</div>}</div>
        <div style={sC}><div style={{fontSize:17,fontWeight:600,color:C.sb,marginBottom:4}}>Trend {yr}</div><ResponsiveContainer width="100%" height={100}><BarChart data={trendData} barGap={0}><XAxis dataKey="name" tick={{fontSize:11}} axisLine={false} tickLine={false}/><YAxis hide/><Tooltip formatter={v=>fmt(v)} contentStyle={{fontSize:16,borderRadius:10,border:`1px solid ${C.bd}`}}/><Bar dataKey="Prihodki" fill={C.gn} radius={[2,2,0,0]} barSize={5}/><Bar dataKey="Odhodki" fill={C.rd} radius={[2,2,0,0]} barSize={5} opacity={0.6}/></BarChart></ResponsiveContainer></div>
      </DashSection>}

      {/* #32 Subscription tracker */}
      {dashW('subscriptions')&&(()=>{
        const today2=new Date();
        const upcomingDays=7;
        const subsWithStatus=subscriptions.map(s=>{
          const next=s.nextDate?new Date(s.nextDate):null;
          const daysLeft=next?Math.round((next-today2)/(1000*60*60*24)):null;
          const status=daysLeft===null?'unknown':daysLeft<0?'overdue':daysLeft<=upcomingDays?'soon':'ok';
          return{...s,daysLeft,status};
        }).sort((a,b)=>{const o={overdue:0,soon:1,unknown:2,ok:3};return o[a.status]-o[b.status]});
        const monthlyTotal=subscriptions.reduce((s,sub)=>s+(sub.period==='annual'?sub.amount/12:sub.amount),0);
        return<DashSection id="subscriptions" title={<span>Naročnine <span style={{fontSize:13,fontWeight:400,color:C.mt}}>{fmt(monthlyTotal)}/mes</span></span>}>
          <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",marginBottom:6}}>
            <button onClick={()=>setShowSubForm(v=>!v)} style={{fontSize:13,padding:"2px 8px",borderRadius:4,border:`1px solid ${C.bd}`,background:showSubForm?"#dbeafe":"#f5f5f0",color:C.mt,cursor:"pointer"}}>{showSubForm?"Zapri":"+ Dodaj"}</button>
          </div>
          {showSubForm&&<div style={{display:"grid",gridTemplateColumns:"1fr 70px 80px 110px auto",gap:4,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
            <input id="sub-nm" style={{...sI,height:28,fontSize:14}} placeholder="Netflix, Spotify…"/>
            <input id="sub-amt" type="number" style={{...sI,height:28,fontSize:14}} placeholder="€"/>
            <select id="sub-per" style={{...sS,height:28,fontSize:13}}><option value="monthly">Mesečno</option><option value="annual">Letno</option></select>
            <input id="sub-dt" type="date" style={{...sI,height:28,fontSize:13}}/>
            <button style={{...sB(true),height:28,padding:"0 10px",fontSize:14}} onClick={()=>{const nm=document.getElementById('sub-nm').value.trim();const amt=parseFloat(document.getElementById('sub-amt').value)||0;const per=document.getElementById('sub-per').value;const dt=document.getElementById('sub-dt').value;if(!nm||!amt)return;setSubscriptions(p=>[...p,{id:Date.now(),name:nm,amount:amt,period:per,nextDate:dt||null}]);document.getElementById('sub-nm').value='';document.getElementById('sub-amt').value='';document.getElementById('sub-dt').value='';setShowSubForm(false)}}>+</button>
          </div>}
          {subsWithStatus.length===0&&!showSubForm&&<div style={{fontSize:14,color:C.mt}}>Dodaj naročnine (Netflix, Spotify, fitnes…)</div>}
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {subsWithStatus.map(s=>{
              const bg=s.status==='overdue'?'#fee2e2':s.status==='soon'?'#fef3c7':'#f0f9ff';
              const fc=s.status==='overdue'?C.rd:s.status==='soon'?'#92400e':C.bl;
              const label=s.daysLeft===null?'':s.daysLeft<0?`${Math.abs(s.daysLeft)}d zamude`:s.daysLeft===0?'danes':s.daysLeft<=7?`čez ${s.daysLeft}d`:'';
              return<div key={s.id} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 8px",background:bg,borderRadius:16,fontSize:13,border:`1px solid ${bg==='#f0f9ff'?'#bae6fd':bg==='#fef3c7'?'#fde68a':'#fecaca'}`}}>
                <span style={{fontWeight:600,color:fc}}>{s.name}</span>
                <span style={{color:C.mt}}>{s.period==='annual'?`${fmt(s.amount)}/l`:`${fmt(s.amount)}/m`}</span>
                {label&&<span style={{fontSize:11,fontWeight:700,color:fc}}>{label}</span>}
                <button onClick={()=>setSubscriptions(p=>p.filter(x=>x.id!==s.id))} style={{background:"none",border:"none",color:"#999",cursor:"pointer",padding:0,fontSize:13,lineHeight:1}}>✕</button>
              </div>
            })}
          </div>
        </DashSection>;
      })()}

      {/* #33 Cash flow forecast (6 months) */}
      {dashW('emergency')&&(()=>{
        const now4=new Date();
        const cfData=[];
        for(let i=0;i<6;i++){
          const d=new Date(now4.getFullYear(),now4.getMonth()+i,1);
          const y=d.getFullYear();const m=d.getMonth();
          const mdata=(data[y]||{})[m]||initM();
          const inc=mdata.closed?iT(mdata):AP.budget;
          const exp=mdata.closed?(efxT(mdata,'actual')+evrT(mdata,'actual')+uxtT(mdata)):(efxT(mdata,'plan')+evrT(mdata,'plan'));
          cfData.push({name:MS[m],inc,exp,diff:inc-exp,closed:mdata.closed});
        }
        return<DashSection id="cashflow" title={<span>Denarni tok — napoved 6 mesecev <span style={{fontSize:12,fontWeight:400,color:C.mt}}>(zaprte: dejanski · odprte: plan)</span></span>} helpKey="cashflow">
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={cfData} barGap={2}>
              <XAxis dataKey="name" tick={{fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip formatter={v=>fmt(v)} contentStyle={{fontSize:13}}/>
              <Legend iconSize={8} wrapperStyle={{fontSize:12}}/>
              <Bar dataKey="inc" name="Prihodki" fill={C.gn} radius={[3,3,0,0]} barSize={14}/>
              <Bar dataKey="exp" name="Odhodki" fill={C.rd} radius={[3,3,0,0]} barSize={14} opacity={0.8}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>
            {cfData.map((d,i)=><div key={i} style={{fontSize:12,padding:"2px 6px",borderRadius:4,background:d.diff>=0?"#f0fdf4":"#fef2f2",color:d.diff>=0?C.gn:C.rd,fontWeight:600}}>{d.name}: {d.diff>=0?"+":""}{fmt(d.diff)}</div>)}
          </div>
        </DashSection>;
      })()}

      {/* Položnice */}
      {(()=>{
        const today=new Date().getDate();
        const fixedSubs=effectiveCats.filter(c=>c.tp==="fixed").flatMap(c=>c.subs).filter(s=>subVis[s.id]!==true);
        const tracked=fixedSubs.filter(s=>billDueDays[s.id]);
        const untracked=fixedSubs.filter(s=>!billDueDays[s.id]);
        const bills=tracked.map(sub=>{
          const due=billDueDays[sub.id];const paid=(md.subs?.[sub.id]?.actual||0)>0;const dl=due-today;
          const status=paid?'paid':dl<0?'overdue':dl<=2?'soon':'future';
          return{sub,due,paid,dl,status};
        }).sort((a,b)=>{const o={overdue:0,soon:1,future:2,paid:3};return o[a.status]-o[b.status]});
        return<DashSection id="bills" title="Položnice">
          <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",marginBottom:8}}>
            <button onClick={()=>setShowBillCfg(v=>!v)} style={{fontSize:13,padding:"2px 8px",borderRadius:4,border:`1px solid ${C.bd}`,background:showBillCfg?"#dbeafe":"#f5f5f0",color:C.mt,cursor:"pointer"}}>{showBillCfg?"Zapri":"⚙ Urediroke"}</button>
          </div>
          {bills.length===0&&!showBillCfg&&<div style={{fontSize:14,color:C.mt}}>Nastavi datume zapadlosti z gumbom ⚙.</div>}
          {bills.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:showBillCfg?8:0}}>
            {bills.map(({sub,due,paid,dl,status})=>{
              const bg=status==='paid'?'#dcfce7':status==='overdue'?'#fee2e2':status==='soon'?'#fef3c7':'#f0f7ff';
              const fc=status==='paid'?'#166534':status==='overdue'?C.rd:status==='soon'?'#92400e':C.bl;
              const chip=status==='paid'?'✓ Plačano':status==='overdue'?`Zapadlo (${due}.)`:dl===0?`Danes (${due}.)`:dl===1?`Jutri (${due}.)`:`${due}. v mesecu`;
              const nm=(subRename[sub.id]||sub.nm).split('(')[0].trim().split(' ').slice(0,2).join(' ');
              return<div key={sub.id} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 8px",borderRadius:6,background:bg,fontSize:13,border:`1px solid ${fc}30`}}>
                <span style={{fontWeight:600,color:C.tx,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nm}</span>
                <span style={{color:fc,fontWeight:600,whiteSpace:"nowrap"}}>{chip}</span>
                {!paid&&<button onClick={()=>uSub(sub.id,'actual',(md.subs?.[sub.id]?.plan||0))} style={{background:'none',border:`1px solid ${fc}`,borderRadius:3,padding:'1px 6px',fontSize:12,color:fc,cursor:'pointer'}}>✓</button>}
              </div>;
            })}
          </div>}
          {showBillCfg&&<div style={{borderTop:`1px solid ${C.bd}`,paddingTop:8}}>
            <div style={{fontSize:13,color:C.mt,marginBottom:6}}>Nastavi dan v mesecu (1–31) za vsako postavko. Prazno = ni sledenja.</div>
            <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:4}}>
              {fixedSubs.map(sub=>{
                const nm=(subRename[sub.id]||sub.nm).split('(')[0].trim();
                return<label key={sub.id} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,padding:"3px 0"}}>
                  <span style={{flex:1,color:"#555",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={nm}>{nm}</span>
                  <input type="number" min="1" max="31" value={billDueDays[sub.id]||""} placeholder="—"
                    onChange={e=>{const v=parseInt(e.target.value);setBillDueDays(p=>{const n={...p};if(v>=1&&v<=31)n[sub.id]=v;else delete n[sub.id];return n})}}
                    style={{width:42,height:24,fontSize:13,border:"1px solid #ddd",borderRadius:4,padding:"0 4px",textAlign:"center"}}/>
                </label>;
              })}
            </div>
          </div>}
        </DashSection>;
      })()}

      {/* #13 Coach tips */}
      {coachTips.length>0&&<DashSection id="coach" title="💡 Nasveti — vzorci iz zadnjih mesecev" style={{background:"#f0fdf4",border:"1px solid #86efac"}}>
        <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",marginBottom:6}}>
          <button onClick={()=>setCoachTips([])} style={{background:"none",border:"none",color:C.mt,cursor:"pointer",fontSize:13}}>✕ Skrij</button>
        </div>
        {coachTips.map((t,i)=><div key={t.id||i} style={{fontSize:14,padding:"4px 0",borderBottom:i<coachTips.length-1?`1px solid #dcfce7`:"none",color:"#166534"}}>
          {t.type==="over"?"⚠️":"📈"} {t.text}
        </div>)}
      </DashSection>}

      {/* #35 Spending insights */}
      {(()=>{const ins=[];effectiveCats.forEach(cat=>{const p=cT(md,cat,'plan');const a=cT(md,cat,'actual');if(p>30&&a>p*1.2)ins.push({tp:'over',txt:`${cat.nm}: ${fmt(a)} (${Math.round((a/p-1)*100)}% nad planom)`,cl:C.rd});});const cl3=[];for(let i=mo;i>=0&&cl3.length<3;i--){if((yd[i]||{}).closed)cl3.unshift(yd[i]);}if(cl3.length===3){effectiveCats.forEach(cat=>{const[a,b,c]=cl3.map(m=>cT(m,cat,'actual'));if(c>b&&b>a&&a>20&&c>a*1.1)ins.push({tp:'trend',txt:`${cat.nm} raste zadnje 3 mes.: ${fmt(a)}→${fmt(b)}→${fmt(c)}`,cl:C.or});});}if(tInc>0){const sr=Math.round((tInc-tAc)/tInc*100);if(sr<0)ins.push({tp:'warn',txt:`Poraba ${fmt(Math.abs(tInc-tAc))} presega prihodke!`,cl:C.rd});else if(sr>=20)ins.push({tp:'save',txt:`Odlična varčevalna stopnja: ${sr}% (${fmt(tInc-tAc)} prihrankov)`,cl:C.gn});}if(!ins.length)return null;return<DashSection id="insights" title={`💡 Uvidi — ${MF[mo]}`} style={{background:"#fffbeb",border:"1px solid #fde68a"}}>{ins.slice(0,4).map((x,i)=><div key={i} style={{display:"flex",gap:5,alignItems:"flex-start",padding:"3px 0",fontSize:13,borderBottom:i<Math.min(3,ins.length-1)?`1px solid #fef3c7`:"none"}}><span style={{color:x.cl,fontWeight:700,minWidth:10,flexShrink:0}}>{x.tp==='over'?'▲':x.tp==='trend'?'↑':x.tp==='warn'?'⚠':'✓'}</span><span style={{color:C.tx}}>{x.txt}</span></div>)}</DashSection>;})()}

      {dashW('insights')&&<DashSection id="behavior" title={`Vedenjski uvidi — ${MF[mo]}`} style={{background:"#f8fafc",border:"1px solid #dbeafe"}}>
        <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"repeat(auto-fit,minmax(130px,1fr))",gap:6,marginBottom:8}}>
          {BEHAVIOR_TAGS.map(([tag,label])=>{const r=behaviorSummary.rows.find(x=>x.tag===tag);return<div key={tag} style={{padding:"7px 9px",border:`1px solid ${C.bd}`,borderRadius:10,background:C.cd}}>
            <div style={{fontSize:12,color:C.mt,fontWeight:800}}>{label}</div>
            <div style={{fontSize:17,fontWeight:900,color:r?C.bl:C.mt}}>{r?fmt(r.total):"—"}</div>
            <div style={{fontSize:11,color:C.mt}}>{r?r.count:0} vnosov</div>
          </div>})}
        </div>
        {behaviorSummary.soft.map((x,i)=><div key={i} style={{fontSize:13,color:C.sb,padding:"3px 0",borderTop:i?`1px solid ${C.fn}`:"none"}}>{x}</div>)}
      </DashSection>}

      {/* #12 Finančni koledar */}
      {dashW('calendar')&&<DashSection id="calendar" title={`📅 Finančni koledar — ${MF[mo]} ${yr}`}>
        {(()=>{
          const dInMo=new Date(yr,mo+1,0).getDate();
          const firstDay=(new Date(yr,mo,1).getDay()+6)%7;
          const today=new Date();const isCurrentMo=mo===today.getMonth()&&yr===today.getFullYear();const todayD=isCurrentMo?today.getDate():null;
          const daySpend={};
          effectiveAS.forEach(sub=>{(md.subs?.[sub.id]?.transactions||[]).forEach(txn=>{
            const comment=typeof txn==="object"?txn.comment||"":"";
            const m2=comment.match(/📥\s*(\d{1,2})\.(\d{1,2})\./);
            if(m2){const d=parseInt(m2[1]);if(d>=1&&d<=dInMo)daySpend[d]=(daySpend[d]||0)+(typeof txn==="object"?txn.amt||0:0);}
          });});
          const maxSpend=Math.max(1,...Object.values(daySpend));
          const billSubs=effectiveCats.filter(c=>c.tp==="fixed").flatMap(c=>c.subs).filter(s=>billDueDays[s.id]);
          return<div style={{marginTop:8}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:4}}>
              {["Pon","Tor","Sre","Čet","Pet","Sob","Ned"].map(d=><div key={d} style={{textAlign:"center",fontSize:11,color:C.mt,fontWeight:600}}>{d}</div>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
              {Array.from({length:firstDay}).map((_,i)=><div key={"e"+i}/>)}
              {Array.from({length:dInMo},(_,i)=>{
                const d=i+1;const isToday=d===todayD;
                const bills=billSubs.filter(s=>billDueDays[s.id]===d);
                const spend=daySpend[d]||0;
                const intensity=spend>0?0.15+0.65*(spend/maxSpend):0;
                const bg=isToday?C.bl:spend>0?`rgba(37,99,235,${intensity.toFixed(2)})`:"#f5f5f0";
                const fc=isToday?"#fff":spend>0&&intensity>0.45?"#fff":C.tx;
                return<div key={d} style={{borderRadius:5,padding:"4px 2px",textAlign:"center",background:bg,border:bills.length?`2px solid ${C.rd}`:isToday?"none":"1px solid #eee",minHeight:46,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",gap:1}}>
                  <span style={{fontSize:12,fontWeight:isToday?700:400,color:fc}}>{d}</span>
                  {spend>0&&<span style={{fontSize:10,fontWeight:600,color:fc}}>{fmt(spend)}</span>}
                  {bills.slice(0,2).map(s=>{const nm=(subRename[s.id]||s.nm).split(" ")[0].substring(0,4);return<span key={s.id} style={{fontSize:9,background:C.rd+"20",color:C.rd,borderRadius:2,padding:"0 2px",lineHeight:1.2}}>{nm}</span>;})}
                </div>;
              })}
            </div>
            <div style={{display:"flex",gap:12,marginTop:6,fontSize:11,color:C.mt,flexWrap:"wrap"}}>
              <span><span style={{color:C.bl}}>■</span> Danes</span>
              <span><span style={{color:"rgba(37,99,235,0.5)"}}>■</span> Poraba (uvoz)</span>
              <span><span style={{color:C.rd}}>□</span> Rok položnice</span>
            </div>
          </div>;
        })()}
      </DashSection>}

      {/* #17 Emergency Fund Widget */}
      {dashW('cashflow')&&(()=>{
        const efSub=effectiveAS.find(s=>s.id===efCfg.subId);
        const closedMonths=[];for(let i=0;i<12;i++){const mdata=yd[i]||initM();if(mdata.closed)closedMonths.push(mdata)}
        const avgMonthlyExp=closedMonths.length>0?closedMonths.reduce((s,mdata)=>s+(efxT(mdata,'actual')+evrT(mdata,'actual')+uxtT(mdata)),0)/closedMonths.length:0;
        const targetAmt=Math.round(avgMonthlyExp*efCfg.months);
        let efCurrent=0;
        if(efSub){for(let i=0;i<12;i++){const mdata=yd[i]||initM();efCurrent+=mdata.subs?.[efCfg.subId]?.actual||0}}
        const efPct=targetAmt>0?Math.min(100,pc(efCurrent,targetAmt)):0;
        const r=32;const circ=2*Math.PI*r;const dash=circ*(efPct/100);
        return<DashSection id="emergency" title="🛡️ Nujni sklad" helpKey="emergency">
          <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
            <svg width={80} height={80} viewBox="0 0 80 80">
              <circle cx={40} cy={40} r={r} fill="none" stroke={C.fn} strokeWidth={8}/>
              <circle cx={40} cy={40} r={r} fill="none" stroke={efPct>=100?C.gn:efPct>=50?C.bl:C.or} strokeWidth={8} strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round" transform="rotate(-90 40 40)"/>
              <text x={40} y={44} textAnchor="middle" fontSize={14} fontWeight={700} fill={C.tx}>{efPct}%</text>
            </svg>
            <div style={{flex:1}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:13,marginBottom:8}}>
                <div><div style={{color:C.mt}}>Trenutno</div><div style={{fontWeight:700,fontSize:16,color:C.bl}}>{fmt(efCurrent)}</div></div>
                <div><div style={{color:C.mt}}>Cilj ({efCfg.months} mes.)</div><div style={{fontWeight:700,fontSize:16,color:C.tx}}>{fmt(targetAmt)}</div></div>
                <div><div style={{color:C.mt}}>Pokritost</div><div style={{fontWeight:700,fontSize:15,color:efPct>=100?C.gn:efPct>=50?C.bl:C.rd}}>{avgMonthlyExp>0?(efCurrent/avgMonthlyExp).toFixed(1)+" mes.":"—"}</div></div>
                <div><div style={{color:C.mt}}>Mesečno potrebno</div><div style={{fontWeight:700,fontSize:15,color:C.or}}>{efCurrent<targetAmt?fmt(Math.ceil((targetAmt-efCurrent)/Math.max(1,efCfg.months))):"✓"}</div></div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                <select style={{...sS,height:26,fontSize:13,width:80}} value={efCfg.months} onChange={e=>setEfCfg(p=>({...p,months:parseInt(e.target.value)}))}>
                  <option value={3}>3 mes.</option><option value={6}>6 mes.</option><option value={12}>12 mes.</option>
                </select>
                <select style={{...sS,height:26,fontSize:13,flex:1}} value={efCfg.subId} onChange={e=>setEfCfg(p=>({...p,subId:e.target.value}))}>
                  <option value="">Poveži s podkategorijo...</option>
                  {effectiveCats.filter(c=>c.tp==="fixed"&&c.id==="savings_inv").flatMap(c=>c.subs).map(s=><option key={s.id} value={s.id}>{s.nm}</option>)}
                  {effectiveCats.filter(c=>c.tp==="fixed"&&c.id!=="savings_inv").flatMap(c=>c.subs).map(s=><option key={s.id} value={s.id}>{s.nm}</option>)}
                </select>
              </div>
            </div>
          </div>
        </DashSection>;
      })()}

      {/* #29 Financial quiz */}
      {dashW('quiz')&&(()=>{const qKey=`${yr}-${mo}`;const ans=quizAnswers[qKey];const q=QUIZ_QS[mo]||QUIZ_QS[0];if(ans!==undefined)return<DashSection id="quiz" title="🎯 Mesečno vprašanje" style={{background:"#f0fdf4",border:"1px solid #bbf7d0"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:14,color:C.tx,marginTop:2}}>{q}</div><span style={{fontSize:22,marginLeft:8}}>{ans?"✅":"❌"}</span></div><button style={{fontSize:11,color:C.mt,background:"none",border:"none",cursor:"pointer",marginTop:4,padding:0}} onClick={()=>setQuizAnswers(p=>{const n={...p};delete n[qKey];return n})}>Ponastavi</button></DashSection>;return<DashSection id="quiz" title={`🎯 Mesečno vprašanje — ${MF[mo]}`} style={{border:"1px solid #e9d5ff"}}><div style={{fontSize:14,color:C.tx,marginBottom:8}}>{q}</div><div style={{display:"flex",gap:8}}><button style={{...sB(true),height:28,fontSize:13,padding:"0 14px",background:C.gn}} onClick={()=>setQuizAnswers(p=>({...p,[qKey]:true}))}>Da ✓</button><button style={{...sB(false),height:28,fontSize:13,padding:"0 14px",color:C.rd,borderColor:C.rd}} onClick={()=>setQuizAnswers(p=>({...p,[qKey]:false}))}>Ne ✗</button></div></DashSection>;})()}
      {/* Varčevalni cilji widget */}
      {dashW('linkedGoals')&&(()=>{
        const now=new Date();
        const linkedGoals=goals.filter(g=>g.autoPull&&g.source&&g.targetDate&&g.type==="saving"&&g.scope!=="monthly");
        if(linkedGoals.length===0)return null;
        return<DashSection id="linkedGoals" title="Varčevalni cilji">
          {linkedGoals.map(g=>{
            let current=0;const sub=effectiveAS.find(s=>s.id===g.source);if(!sub)return null;
            if(g.pullFromMonth==="all"){for(let i=0;i<12;i++){const mdata=yd[i]||initM();if(mdata.closed)current+=mdata.subs?.[g.source]?.actual||0}}else{current=md.subs?.[g.source]?.actual||0}
            const p=g.target>0?pc(current,g.target):0;
            const td=new Date(g.targetDate+"-01");const moLeft=Math.max(1,(td.getFullYear()-now.getFullYear())*12+(td.getMonth()-now.getMonth()));
            const reqMo=current<g.target?Math.ceil((g.target-current)/moLeft):0;
            return<div key={g.id} style={{marginBottom:8,paddingBottom:8,borderBottom:`1px solid ${C.fn}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{fontSize:14,fontWeight:600}}>{g.name}</span>
                <span style={{fontSize:13,color:C.mt}}>{fmt(current)} / {fmt(g.target)}</span>
              </div>
              <div style={{height:5,borderRadius:3,background:"#eee",overflow:"hidden",marginBottom:3}}><div style={{height:"100%",width:`${Math.min(p,100)}%`,borderRadius:3,background:p>=100?C.gn:C.bl}}/></div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:12,color:C.mt}}>{p}% • {moLeft} mes. do {g.targetDate}</span>
                {reqMo>0&&<button style={{...sB(true),background:C.gn,fontSize:12,height:22,padding:"0 8px"}} onClick={()=>{addTransaction(g.source,reqMo,`💰 ${g.name}`);setVw('entry')}}>+ {fmt(reqMo)}</button>}
              </div>
            </div>;
          })}
        </DashSection>;
      })()}
    </div>}

    {/* ===== MESEČNI VNOS ===== */}
    {vw==="entry"&&(()=>{
      const now=new Date();const isCurMo2=mo===now.getMonth()&&yr===now.getFullYear();const dInMo=new Date(yr,mo+1,0).getDate();const dayFrac=isCurMo2?now.getDate()/dInMo:0;
      const incomeBlock=<><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{fontSize:16,fontWeight:600,color:C.sb}}>Prihodki</div><button onClick={()=>setHideIncome(h=>!h)} style={{fontSize:13,padding:"2px 8px",borderRadius:4,border:`1px solid ${C.bd}`,background:hideIncome?"#fef3c7":"#f5f5f0",color:C.mt,cursor:"pointer"}}>{hideIncome?"Pokaži prihodke ▾":"Skrij prihodke ▴"}</button>{tInc>0&&<button onClick={()=>{const savCat2=effectiveCats.find(c=>c.id==="savings_inv");const savSubs2=savCat2?savCat2.subs.filter(s=>subVis[s.id]!==true):[];const a={};savSubs2.forEach(s=>{a[s.id]=md.subs?.[s.id]?.plan||0});setPayAlloc(a);setShowPayday(true)}} style={{fontSize:13,padding:"2px 10px",borderRadius:4,border:`1px solid ${C.bl}`,background:"#dbeafe",color:C.bl,cursor:"pointer",fontWeight:600}}>💰 Razdeli plačo</button>}</div>
      <div style={sC}>{["Kristina","Tadej"].map(person=><div key={person} style={{marginBottom:8}}><div style={{fontSize:18,fontWeight:600,color:C.bl,marginBottom:4}}>{person}</div><div style={{display:"grid",gridTemplateColumns:isMob?"repeat(2,minmax(0,1fr))":"repeat(4,1fr)",gap:6}}>{itList.map(t=><div key={`${person}-${t}`} style={{minWidth:0}}><div style={{fontSize:isMob?15:18,color:"#999",whiteSpace:"normal",lineHeight:1.15,minHeight:isMob?18:"auto"}}>{t}</div><input style={{...sI,height:isMob?34:26,fontSize:isMob?16:17,width:"100%"}} defaultValue={md.income?.[person]?.[t]||""} onBlur={e=>uInc(person,t,e.target.value)} placeholder="0"/></div>)}</div></div>)}<div style={{borderTop:`1px solid ${C.bd}`,paddingTop:8}}><div style={{fontSize:17,fontWeight:600,color:C.sb,marginBottom:4}}>Dodatni prihodki</div>{(md.customIncome||[]).map((ci,i)=><div key={i} style={{fontSize:17,padding:"2px 0"}}>{ci.label} — {ci.person} — {fmt(ci.amount)}</div>)}<AddCI onAdd={addCI}/></div>
      <div style={{borderTop:`1px solid ${C.bd}`,paddingTop:8,marginTop:8}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <span style={{fontSize:15,fontWeight:700,color:C.sb}}>🔁 Ponavljajoči prihodki</span>
          {tInc>0&&<button onClick={()=>{const nm=prompt('Ime predloge prihodkov:','Mesečna plača');if(nm&&nm.trim())setIncomeTemplates(p=>[...p,{id:Date.now(),name:nm.trim(),income:JSON.parse(JSON.stringify(md.income||{}))}])}} style={{...sB(false),height:28,fontSize:13,padding:"0 10px"}}>+ Shrani trenutne</button>}
        </div>
        {incomeTemplates.length===0&&<div style={{fontSize:13,color:C.mt}}>Shrani redne prihodke kot predlogo in jih z enim klikom dodaj v katerikoli mesec.</div>}
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {incomeTemplates.map((t,i)=>{const tot=["Kristina","Tadej"].reduce((s,p)=>s+Object.values(t.income?.[p]||{}).reduce((ss,v)=>ss+(v||0),0),0);return<div key={t.id} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",background:C.fn,borderRadius:10,border:`1px solid ${C.bd}`}}>
            <button onClick={()=>{["Kristina","Tadej"].forEach(p=>{Object.entries(t.income?.[p]||{}).forEach(([ty,v])=>{if(v)uInc(p,ty,v)})})}} title="Dodaj te prihodke v ta mesec" style={{background:"none",border:"none",cursor:"pointer",fontWeight:800,color:C.bl,fontSize:13,fontFamily:FF}}>{t.name} · {fmt(tot)}</button>
            <span onClick={()=>setIncomeTemplates(p=>p.filter((_,j)=>j!==i))} style={{cursor:"pointer",color:C.mt,fontSize:14}}>✕</span>
          </div>;})}
        </div>
      </div></div></>;
      return<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
        <h2 style={{fontSize:24,fontWeight:700,margin:0}}>Mesečni vnos</h2>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>{YPk}{MNav}<button onClick={()=>toggleClose(mo)} style={{...sB(isClosed),fontSize:16,background:isClosed?C.gn:undefined,color:isClosed?"#fff":undefined,border:isClosed?"none":undefined}}>{isClosed?"✓ Zaključen":"Zaključi mesec"}</button><button onClick={()=>printMonthlyReport({monthName:MF[mo],yr,cats:visibleCats,md,tInc,tAc,subRename,fmt,fN,pc,cT})} style={{...sB(false),fontSize:14}}>🖨 PDF</button></div>
      </div>
      {isClosed&&<div style={{background:"#dcfce7",border:"1px solid #86efac",borderRadius:8,padding:"6px 12px",marginBottom:10,fontSize:17,color:"#166534"}}>Ta mesec je zaključen. Odpri ga z gumbom zgoraj za urejanje.</div>}
      {/* Quick Add — natural language input */}
      {(()=>{
        const bankMap=JSON.parse(localStorage.getItem('dp_bankmap')||'{}');
        const parsed=nlText.trim()?parseNL(nlText,bankMap):{amt:null,subId:null,desc:''};
        const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        const words=norm(parsed.desc||nlText).split(/[^a-z0-9]+/).filter(w=>w.length>2);
        const subMatch=effectiveAS.map(s=>{const name=norm(`${subRename[s.id]||s.nm} ${s.id}`);const score=words.reduce((n,w)=>n+(name.includes(w)?1:0),0);return{s,score}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.s.nm.length-b.s.nm.length)[0]?.s;
        const suggestedSub=parsed.subId||subMatch?.id||null;
        const matchedSub=suggestedSub?effectiveAS.find(s=>s.id===suggestedSub):null;
        const doAdd=()=>{
          const subId=nlSel||suggestedSub;
          const amt=parsed.amt;
          if(!subId||!amt||amt<=0)return;
          addTransaction(subId,amt,parsed.desc||nlText);
          setNlText('');setNlSel(null);
        };
        return<div style={{...sC,background:"#f0f7ff",border:"1px dashed #93c5fd",marginBottom:10,padding:"8px 12px"}}>
          <div style={{fontSize:13,color:C.mt,marginBottom:4}}>Hitri vnos — naravni jezik <span style={{fontSize:12,opacity:0.7}}>npr. "75€ mercator živila"</span></div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
            <input style={{...sI,flex:1,minWidth:180,fontSize:15}} value={nlText} onChange={e=>{setNlText(e.target.value);setNlSel(null)}} onKeyDown={e=>e.key==='Enter'&&doAdd()} placeholder="znesek + opis..."/>
            {parsed.amt&&<span style={{fontSize:14,fontWeight:700,color:C.gn}}>{fmt(parsed.amt)}</span>}
            {suggestedSub&&<select style={{...sS,fontSize:13,height:32,minWidth:220}} value={nlSel||suggestedSub} onChange={e=>setNlSel(e.target.value)}>
              {effectiveAS.map(s=><option key={s.id} value={s.id}>{s.nm.substring(0,25)}</option>)}
            </select>}
            <button style={{...sB(true),height:32,fontSize:14,padding:"0 12px"}} onClick={doAdd} disabled={!parsed.amt||!(nlSel||suggestedSub)}>Dodaj</button>
            {nlText&&<button style={{...sB(false),height:28,fontSize:14,padding:"0 8px"}} onClick={()=>{setNlText('');setNlSel(null)}}>✕</button>}
          </div>
          {parsed.amt&&!suggestedSub&&nlText.trim()&&<div style={{fontSize:13,color:C.or,marginTop:4}}>Kategorija ni prepoznana — napiši del imena postavke, npr. najemnina, gorivo, živila.</div>}
        </div>;
      })()}
      {/* #16 Recurring Transaction Templates */}
      <div style={{...sC,background:"#fdf4ff",border:"1px solid #e9d5ff",marginBottom:10,padding:"8px 12px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:14,fontWeight:600,color:"#7e22ce"}}>📋 Predloge transakcij</span>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {(()=>{const allTxns=[];effectiveAS.forEach(sub=>{(md.subs?.[sub.id]?.transactions||[]).forEach(t=>{if(typeof t==='object'&&t.amt>0)allTxns.push({subId:sub.id,amount:t.amt,comment:t.comment||""})})});return allTxns.length>0&&!tplSaveName&&<button style={{fontSize:12,padding:"2px 8px",borderRadius:4,border:"1px solid #e9d5ff",background:"#fdf4ff",color:"#7e22ce",cursor:"pointer"}} onClick={()=>setTplSaveName('Nova predloga')}>+ Shrani ta mesec</button>;})()}
            <button onClick={()=>setShowTemplates(v=>!v)} style={{fontSize:12,padding:"2px 8px",borderRadius:4,border:"1px solid #e9d5ff",background:showTemplates?"#ede9fe":"#fdf4ff",color:"#7e22ce",cursor:"pointer"}}>{showTemplates?"Zapri ▲":`Predloge (${txnTemplates.length}) ▼`}</button>
          </div>
        </div>
        {tplSaveName&&<div style={{display:"flex",gap:6,alignItems:"center",marginTop:8}}>
          <input style={{...sI,flex:1,height:28,fontSize:13}} value={tplSaveName} onChange={e=>setTplSaveName(e.target.value)} placeholder="Ime predloge"/>
          <button style={{...sB(true),height:28,fontSize:13,padding:"0 10px",background:"#7e22ce"}} onClick={()=>{const items=[];effectiveAS.forEach(sub=>{(md.subs?.[sub.id]?.transactions||[]).forEach(t=>{if(typeof t==='object'&&t.amt>0)items.push({subId:sub.id,amount:t.amt,comment:t.comment||""})})});if(items.length>0){setTxnTemplates(p=>[...p,{id:Date.now(),name:tplSaveName.trim()||"Predloga",items}])};setTplSaveName('')}}>Shrani</button>
          <button style={{...sB(false),height:28,fontSize:13,padding:"0 8px"}} onClick={()=>setTplSaveName('')}>✕</button>
        </div>}
        {showTemplates&&<div style={{marginTop:8}}>
          {txnTemplates.length===0&&<div style={{fontSize:13,color:C.mt,fontStyle:"italic"}}>Ni shranjenih predlog.</div>}
          {txnTemplates.map((tpl,i)=><div key={tpl.id} style={{display:"flex",gap:6,alignItems:"center",padding:"6px 8px",background:"#fff",borderRadius:6,marginBottom:4,border:"1px solid #e9d5ff"}}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:C.tx}}>{tpl.name}</div>
              <div style={{fontSize:12,color:C.mt}}>{tpl.items.length} vnosov — {fmt(tpl.items.reduce((s,x)=>s+x.amount,0))}</div>
            </div>
            <button style={{...sB(true),height:26,fontSize:12,padding:"0 8px",background:"#7e22ce"}} onClick={()=>{tpl.items.forEach(x=>{if(x.subId&&x.amount>0)addTransaction(x.subId,x.amount,x.comment||"")});setShowTemplates(false)}}>Uporabi</button>
            <button onClick={()=>setTxnTemplates(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:16}}>✕</button>
          </div>)}
        </div>}
      </div>

      {/* #45 Category budget rollover */}
      {(()=>{
        const prevMo=mo===0?11:mo-1;const prevYr=mo===0?yr-1:yr;
        const pmd=(data[prevYr]||{})[prevMo]||initM();
        return<div style={{...sC,background:"#f0fbf6",border:`1px solid #bce7d5`,padding:"9px 12px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:15,fontWeight:700,color:"#0e7a52"}}>🔄 Prenos neporabljenega proračuna</span>
            <span style={{fontSize:12,color:C.mt}}>{rolloverSubs.length} izbranih</span>
          </div>
          {rolloverSubs.length>0&&<div style={{marginTop:6}}>{rolloverSubs.map(sid=>{
            const sub=effectiveAS.find(s=>s.id===sid);if(!sub)return null;
            const carry=Math.max(0,(pmd.subs?.[sid]?.plan||0)-(pmd.subs?.[sid]?.actual||0));
            const basePlan=md.subs?.[sid]?.plan||0;
            return<div key={sid} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13,padding:"3px 0",borderBottom:`1px solid ${C.fn}`}}>
              <span style={{color:C.sb,fontWeight:600}}>{subRename[sid]||sub.nm}</span>
              <span><span style={{color:C.mt}}>{fmt(basePlan)} + </span><span style={{color:C.gn,fontWeight:800}}>{fmt(carry)}</span><span style={{color:C.mt}}> = </span><span style={{fontWeight:800,color:C.tx}}>{fmt(basePlan+carry)}</span></span>
            </div>;
          })}<div style={{fontSize:11,color:C.mt,marginTop:4}}>Prenos = neporabljeni del proračuna iz {MS[prevMo]}. Učinkovit proračun ta mesec.</div></div>}
          <details style={{marginTop:6}}>
            <summary style={{fontSize:12,color:C.bl,cursor:"pointer",fontWeight:700}}>Izberi kategorije za prenos</summary>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:2,marginTop:6,maxHeight:180,overflowY:"auto"}}>
              {effectiveAS.map(s=><label key={s.id} style={{display:"flex",alignItems:"center",gap:5,fontSize:12,padding:"2px 0",cursor:"pointer",color:C.sb}}>
                <input type="checkbox" checked={rolloverSubs.includes(s.id)} onChange={e=>{if(e.target.checked)setRolloverSubs(p=>[...p,s.id]);else setRolloverSubs(p=>p.filter(x=>x!==s.id))}} style={{accentColor:C.gn,flexShrink:0}}/>
                <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{subRename[s.id]||s.nm}</span>
              </label>)}
            </div>
          </details>
        </div>;
      })()}

      {!hideIncome&&incomeBlock}
      <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:10,alignItems:"start"}}>
        <CatEntry cats={visibleCats.filter(c=>c.tp==="fixed")} title="Fiksni stroški" md={md} subVis={subVis} subRename={subRename} expandBreakdown={expandBreakdown} txnInput={txnInput} toggleSubVis={toggleSubVis} setExpandBreakdown={setExpandBreakdown} setTxnInput={setTxnInput} addTransaction={addTransaction} removeTransaction={removeTransaction} updateTransactionComment={updateTransactionComment} uSub={uSub} subAlerts={subAlerts} dayFrac={dayFrac}/>
        <CatEntry cats={visibleCats.filter(c=>c.tp==="var"&&c.id!=="unexpected")} title="Variabilni stroški" md={md} subVis={subVis} subRename={subRename} expandBreakdown={expandBreakdown} txnInput={txnInput} toggleSubVis={toggleSubVis} setExpandBreakdown={setExpandBreakdown} setTxnInput={setTxnInput} addTransaction={addTransaction} removeTransaction={removeTransaction} updateTransactionComment={updateTransactionComment} uSub={uSub} subAlerts={subAlerts} dayFrac={dayFrac}/>
      </div>
      {hideIncome&&incomeBlock}
      {effectiveAS.some(s=>subVis[s.id]===true)&&<div style={sC}><div style={{fontSize:18,fontWeight:600,color:C.tx,marginBottom:8}}>Skriti elementi 👁‍🗨</div>{effectiveAS.filter(s=>subVis[s.id]===true).map(sub=><div key={sub.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.fn}`,fontSize:17}}><span>{sub.nm}</span><button type="button" onClick={()=>toggleSubVis(sub.id)} style={{background:"none",border:"none",color:C.gn,cursor:"pointer",fontWeight:600}}>Pokaži</button></div>)}</div>}
      <div style={{fontSize:16,fontWeight:600,color:C.sb,marginBottom:8}}>Nepredvideni stroški</div>
      <div style={sC}><AddUX onAdd={addUX} kuList={kuList} setKuList={setKuList}/>{(md.unexpectedItems||[]).map((it,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:17,padding:"6px 0",borderBottom:`1px solid ${C.fn}`}}><span>{it.desc} — {fmt(it.amount)} ({it.person})</span><button type="button" onClick={()=>setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[yr])n[yr]=initY();if(!n[yr][mo])n[yr][mo]=initM();n[yr][mo].unexpectedItems=n[yr][mo].unexpectedItems.filter((_,j)=>j!==i);return n})} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:16}}>✕</button></div>)}</div>
      <div style={{...sC,marginBottom:8}}>
        <div style={{fontSize:15,fontWeight:600,color:C.sb,marginBottom:4}}>📝 Mesečna opomba — {MF[mo]} {yr}</div>
        <textarea style={{width:"100%",minHeight:60,fontSize:15,border:`1px solid ${C.bd}`,borderRadius:4,padding:"6px 10px",fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}} defaultValue={md.note||""} onBlur={e=>uNote(e.target.value)} placeholder="Beležke, opomniki, posebnosti tega meseca…"/>
      </div>
      <div style={{fontSize:16,fontWeight:600,color:C.sb,marginBottom:8}}>Hitro dodaj cilj</div>
      {showNG?<AddGoal onAdd={g=>{setGoals(p=>[...p,{id:Date.now(),...g}]);setShowNG(false)}} onCancel={()=>setShowNG(false)}/>:<button style={{...sB(false),fontSize:17}} onClick={()=>setShowNG(true)}>+ Nov cilj</button>}
    </div>;})()}

    {/* ===== LETNI PREGLED ===== */}
    {vw==="annual"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:6}}>
        <h2 style={{fontSize:24,fontWeight:700,margin:0}}>Letni pregled</h2>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>{YPk}<button onClick={()=>setCompMode(!compMode)} style={sB(compMode)}>{compMode?"Zapri primerjavo":"Primerjaj"}</button>{compMode&&<select style={{...sS,height:26,fontSize:17,width:70}} value={compYr||""} onChange={e=>setCompYr(e.target.value?parseInt(e.target.value):null)}><option value="">Izberi leto</option>{[2020,2021,2022,2023,2024,2025,2026,2027].filter(y=>y!==yr).map(y=><option key={y} value={y}>{y}</option>)}</select>}<button onClick={()=>setShowYoY(v=>!v)} style={{...sB(showYoY),fontSize:16}}>{showYoY?"YoY ▲":"YoY ▼"}</button></div>
      </div>
      {/* Closed months indicator - clickable */}
      <div style={{display:"flex",gap:4,marginBottom:10}}>{MS.map((m,i)=>{const mdata=yd[i]||initM();return<button key={i} onClick={()=>setAnnualDetailMonth(annualDetailMonth===i?null:i)} type="button" style={{flex:1,textAlign:"center",fontSize:18,padding:"3px 0",borderRadius:4,background:annualDetailMonth===i?"#93c5fd":mdata.closed?"#dcfce7":"#f5f5f0",color:annualDetailMonth===i?C.bl:mdata.closed?"#166534":"#999",border:"none",cursor:"pointer",fontWeight:mdata.closed||annualDetailMonth===i?600:400}}>{m}{mdata.note?"📝":""}</button>})}</div>
      {annualDetailMonth!==null&&<div style={{...sC,background:"#f0f7ff",border:`2px solid ${C.bl}`,marginBottom:8,padding:10}}>
        <div style={{fontSize:18,fontWeight:700,color:C.tx,marginBottom:6}}>Mesečni pregled: {MF[annualDetailMonth]} — {((md)=>{const fxA=efxT(md,'actual');const vrA=evrT(md,'actual');const uxA=uxtT(md);return `F: ${fmt(fxA)} | V: ${fmt(vrA)}${uxA>0?` | N: ${fmt(uxA)}`:""}  =  ${fmt(fxA+vrA+uxA)}`})(yd[annualDetailMonth]||initM())}</div>
        {(yd[annualDetailMonth]||{}).note&&<div style={{background:"#fff",border:`1px solid ${C.bd}`,borderRadius:6,padding:"6px 10px",fontSize:14,color:"#555",marginBottom:6,fontStyle:"italic"}}>📝 {(yd[annualDetailMonth]||{}).note}</div>}
        <div style={{overflowX:"auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"minmax(180px,1fr) 92px 92px 88px 54px",gap:6,fontSize:18,color:C.mt,fontWeight:600,padding:"0 0 3px",borderBottom:`1px solid ${C.bd}`,minWidth:540}}>
          <span>Postavka</span><span>Plan</span><span>Izvedba</span><span>Razl.</span><span>%</span>
        </div>
        {visibleCats.map(cat=>{const pT=cT(yd[annualDetailMonth]||initM(),cat,'plan');const aT=cT(yd[annualDetailMonth]||initM(),cat,'actual');const catDev=pT>0&&aT>0?Math.abs((aT-pT)/pT*100):null;const catColor=catDev===null?C.sb:catDev<=5?C.gn:catDev<=10?"#d97706":C.rd;return<div key={cat.id}><div style={{fontSize:17,fontWeight:700,color:C.tx,padding:"3px 0 1px",marginTop:1}}>{cat.nm}</div>{cat.subs.filter(sub=>subVis[sub.id]!==true).map(sub=>{const d=yd[annualDetailMonth]?.subs?.[sub.id]||{plan:0,actual:0};const diff=d.plan-d.actual;const dev=d.plan>0&&d.actual>0?Math.abs((d.actual-d.plan)/d.plan*100):null;const cellColor=dev===null?(d.actual>0?"#333":C.mt):dev<=5?C.gn:dev<=10?"#d97706":C.rd;const pct=d.plan?pc(d.actual,d.plan)+"%":"—";return<div key={sub.id} style={{display:"grid",gridTemplateColumns:"minmax(180px,1fr) 92px 92px 88px 54px",gap:6,fontSize:16,alignItems:"center",padding:"2px 0 2px 10px",borderBottom:`1px solid #f5f5f5`,minWidth:540}}><span style={{fontSize:18}}>{sub.nm}</span><span style={{...compactMoney("#789"),fontSize:17,textAlign:"right"}}>{d.plan?fmt(d.plan):"—"}</span><span style={{...compactMoney(cellColor),fontSize:16,textAlign:"right"}}>{d.actual?fmt(d.actual):"—"}</span><span style={{...compactMoney(d.plan?(diff>=0?C.gn:C.rd):C.mt),fontSize:14,textAlign:"right"}}>{d.plan?(diff>=0?"+":"")+fmt(diff):"—"}</span><span style={{...compactMoney(cellColor),fontSize:14,textAlign:"right"}}>{pct}</span></div>})}<div style={{display:"grid",gridTemplateColumns:"minmax(180px,1fr) 92px 92px 88px 54px",gap:6,fontSize:16,alignItems:"center",padding:"2px 0 2px 10px",borderTop:`1px solid ${C.bd}`,fontWeight:700,color:catColor,background:"#f9fafb",minWidth:540}}><span style={{fontSize:16}}>{cat.nm}</span><span style={{...compactMoney(catColor),textAlign:"right"}}>{pT>0?fmt(pT):"—"}</span><span style={{...compactMoney(catColor),textAlign:"right"}}>{aT>0?fmt(aT):"—"}</span><span style={{...compactMoney(catColor),textAlign:"right"}}>{pT?(aT-pT>=0?"+":"")+fmt(aT-pT):"—"}</span><span style={{...compactMoney(catColor),textAlign:"right"}}>{pT?pc(aT,pT)+"%":"—"}</span></div></div>})}
        </div>
      </div>}

      {(()=>{const devColor=(actual,plan)=>{if(!plan||!actual)return"#333";const dev=Math.abs((actual-plan)/plan*100);return dev<=5?C.gn:dev<=10?"#d97706":C.rd};return null})()}
      {[{tp:"fixed",nm:"Fiksni stroški"},{tp:"var",nm:"Variabilni stroški"}].map(type=><div key={type.tp}><div style={{fontSize:16,fontWeight:700,color:C.tx,marginBottom:3,marginTop:type.tp==="var"?4:0}}>{type.nm}</div><div style={{...sC,overflowX:"auto",padding:8}}><table style={{width:"100%",fontSize:14,borderCollapse:"collapse"}}><thead><tr style={{color:C.mt,borderBottom:`2px solid ${C.bd}`}}><th style={{textAlign:"left",padding:"6px 10px",minWidth:"180px",fontSize:14}}>Postavka</th>{MS.map(m=><th key={m} style={{textAlign:"right",padding:"6px 6px",cursor:"pointer",fontWeight:600,fontSize:14,minWidth:"68px"}} onClick={()=>{setMo(MS.indexOf(m));setVw("entry")}}>{m}</th>)}<th style={{textAlign:"right",padding:"2px 4px",fontWeight:700,fontSize:14}}>Σ</th></tr></thead><tbody>{visibleCats.filter(c=>c.tp===type.tp).map(cat=><React.Fragment key={cat.id}><tr style={{background:"#f9fafb",borderTop:`1px solid ${C.fn}`}}><td colSpan={14} style={{padding:"6px 8px",fontSize:14,fontWeight:700,color:C.tx}}>{cat.nm}</td></tr>{cat.subs.filter(sub=>subVis[sub.id]!==true).map(sub=>{let tot=0,totPlan=0;return<tr key={sub.id}><td style={{padding:"4px 8px 4px 12px",fontSize:14,color:"#888",minWidth:"280px",whiteSpace:"normal"}}>{sub.nm}</td>{Array.from({length:12},(_,i)=>{const mdata=yd[i]||initM();const v=mdata.subs?.[sub.id]?.actual||0;const p=mdata.subs?.[sub.id]?.plan||0;tot+=v;totPlan+=p;const dev=p>0&&v>0?Math.abs((v-p)/p*100):null;const color=dev===null?(v>0?"#333":"#ddd"):dev<=5?C.gn:dev<=10?"#d97706":C.rd;return<td key={i} style={{textAlign:"right",padding:"4px 6px",color,fontWeight:dev!==null?600:400,fontSize:14,minWidth:"68px",verticalAlign:"top"}}>{v>0?fmt(v):"—"}{showYoY&&v>0&&(()=>{const pv=((data[yr-1]||{})[i]||{}).subs?.[sub.id]?.actual||0;if(!pv)return null;const yoyD=Math.round(pc(v,pv)-100);return<div style={{fontSize:9,color:yoyD>10?C.rd:yoyD<-10?C.gn:"#aaa",lineHeight:1.2}}>{yoyD>0?"+":""}{yoyD}%</div>})()}</td>})}<td style={{textAlign:"right",padding:"4px 8px",fontWeight:700,fontSize:14,color:totPlan>0&&tot>0?(Math.abs((tot-totPlan)/totPlan*100)<=5?C.gn:Math.abs((tot-totPlan)/totPlan*100)<=10?"#d97706":C.rd):"#333"}}>{tot>0?fmt(tot):"—"}</td></tr>})}</React.Fragment>)}<tr style={{background:"#e8f5e9",borderTop:`2px solid ${C.bd}`,fontWeight:700,fontSize:15}}><td style={{padding:"6px 8px",color:C.gn}}>{type.nm.includes("Fiksni")?"Skupaj fiksni stroški":"Skupaj variabilni stroški"}</td>{Array.from({length:12},(_,i)=>{const mdata=yd[i]||initM();const tot=visibleCats.filter(c=>c.tp===type.tp).reduce((s,cat)=>s+cat.subs.filter(sub=>subVis[sub.id]!==true).reduce((ss,sub)=>ss+(mdata.subs?.[sub.id]?.actual||0),0),0);const totP=visibleCats.filter(c=>c.tp===type.tp).reduce((s,cat)=>s+cat.subs.filter(sub=>subVis[sub.id]!==true).reduce((ss,sub)=>ss+(mdata.subs?.[sub.id]?.plan||0),0),0);const dev=totP>0&&tot>0?Math.abs((tot-totP)/totP*100):null;const color=dev===null?C.gn:dev<=5?C.gn:dev<=10?"#d97706":C.rd;return<td key={i} style={{textAlign:"right",padding:"6px 6px",color,minWidth:"68px"}}>{tot>0?fmt(tot):"—"}</td>})}<td style={{textAlign:"right",padding:"6px 8px",color:C.gn}}>{(() => {let total=0; for(let i=0;i<12;i++){const mdata=yd[i]||initM(); const m=visibleCats.filter(c=>c.tp===type.tp).reduce((s,cat)=>s+cat.subs.filter(sub=>subVis[sub.id]!==true).reduce((ss,sub)=>ss+(mdata.subs?.[sub.id]?.actual||0),0),0); total+=m;} return total>0?fmt(total):"—"})()}</td></tr></tbody></table></div></div>)}

      <div style={{fontSize:16,fontWeight:700,color:C.tx,marginBottom:3,marginTop:4}}>Nepredvideni stroški</div>
      <div style={{...sC,overflowX:"auto",padding:8}}><table style={{width:"100%",fontSize:14,borderCollapse:"collapse"}}><thead><tr style={{color:C.mt,borderBottom:`2px solid ${C.bd}`}}><th style={{textAlign:"left",padding:"6px 10px",fontSize:14}}>Nepredvideni</th>{MS.map(m=><th key={m} style={{textAlign:"right",padding:"6px 6px",cursor:"pointer",fontWeight:600,fontSize:14,minWidth:"68px"}} onClick={()=>{setMo(MS.indexOf(m));setVw("entry")}}>{m}</th>)}<th style={{textAlign:"right",padding:"2px 4px",fontWeight:700,fontSize:14}}>Σ</th></tr></thead><tbody><tr style={{borderTop:`1px solid ${C.fn}`}}><td style={{padding:"6px 8px",fontWeight:600,fontSize:14}}>Stroški</td>{Array.from({length:12},(_,i)=>{const mdata=yd[i]||initM();const v=uxtT(mdata);return<td key={i} style={{textAlign:"right",padding:"4px 6px",color:v>0?C.rd:"#ddd",fontSize:14,minWidth:"68px",fontWeight:v>0?600:400}}>{v>0?fmt(v):"—"}</td>})}<td style={{textAlign:"right",padding:"4px 8px",fontWeight:700,fontSize:14}}>{(() => {let t=0; for(let i=0;i<12;i++)t+=uxtT(yd[i]||initM()); return t>0?fmt(t):"—"})()}</td></tr></tbody></table></div>

      {/* #15 Per-person breakdown */}
      <div style={sC}>
        <div onClick={()=>setShowPersonBreak(v=>!v)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
          <span style={{fontSize:15,fontWeight:700,color:C.tx}}>👥 Poraba po osebi — {yr}</span>
          <span style={{fontSize:13,color:C.mt}}>{showPersonBreak?"▲":"▼"}</span>
        </div>
        {showPersonBreak&&(()=>{
          const pTot={};
          effectiveCats.forEach(cat=>{pTot[cat.id]={T:0,K:0,U:0};cat.subs.forEach(sub=>{for(let i=0;i<12;i++){const mdata=yd[i]||initM();if(!mdata.closed)continue;(mdata.subs?.[sub.id]?.transactions||[]).forEach(t=>{const p=typeof t==='object'?t.person||"":"";const amt=typeof t==='object'?t.amt||0:0;if(p==="Tadej")pTot[cat.id].T+=amt;else if(p==="Kristina")pTot[cat.id].K+=amt;else pTot[cat.id].U+=amt})}})});
          const hasTxns=effectiveCats.some(cat=>pTot[cat.id].T+pTot[cat.id].K+pTot[cat.id].U>0);
          if(!hasTxns)return<div style={{fontSize:14,color:C.mt,padding:"12px 0",textAlign:"center"}}>Ni podatkov po osebi. Pri vnosu transakcij izberi Tadej ali Kristina.</div>;
          const gT=effectiveCats.reduce((s,cat)=>s+pTot[cat.id].T,0);const gK=effectiveCats.reduce((s,cat)=>s+pTot[cat.id].K,0);const gU=effectiveCats.reduce((s,cat)=>s+pTot[cat.id].U,0);
          return<div style={{marginTop:10}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 90px 90px 90px",gap:8,marginBottom:8,fontSize:13,fontWeight:700}}>
              <div/><div style={{textAlign:"right",color:C.bl}}>Tadej<br/>{fmt(gT)}</div><div style={{textAlign:"right",color:"#be185d"}}>Kristina<br/>{fmt(gK)}</div><div style={{textAlign:"right",color:C.mt}}>Skupaj<br/>{fmt(gU)}</div>
            </div>
            {effectiveCats.filter(cat=>pTot[cat.id].T+pTot[cat.id].K+pTot[cat.id].U>0).map(cat=>{
              const{T,K,U}=pTot[cat.id];
              return<div key={cat.id} style={{display:"grid",gridTemplateColumns:"1fr 90px 90px 90px",gap:8,padding:"4px 0",borderBottom:`1px solid ${C.fn}`,fontSize:14,alignItems:"center"}}>
                <span style={{color:C.tx}}>{cat.nm}</span>
                <span style={{textAlign:"right",color:T>0?C.bl:"#ccc",fontWeight:T>0?600:400}}>{T>0?fmt(T):"—"}</span>
                <span style={{textAlign:"right",color:K>0?"#be185d":"#ccc",fontWeight:K>0?600:400}}>{K>0?fmt(K):"—"}</span>
                <span style={{textAlign:"right",color:U>0?C.mt:"#ccc",fontWeight:U>0?500:400}}>{U>0?fmt(U):"—"}</span>
              </div>;
            })}
            {/* #39 Partner expense balance */}
            {(()=>{const diff=Math.abs(gT-gK);const total=gT+gK;if(total<100||diff<50)return null;const more=gT>gK?"Tadej":"Kristina";const moreClr=gT>gK?C.bl:"#be185d";return<div style={{marginTop:8,padding:"8px",background:"#fff7ed",borderRadius:6,fontSize:13,color:C.tx}}><span style={{fontWeight:600,color:C.or}}>Razdelitev: </span><span style={{color:moreClr,fontWeight:600}}>{more}</span>{` je prispeval/-a ${fmt(diff)} več (${Math.round(gT/total*100)}% vs ${Math.round(gK/total*100)}%). Za izravnavo: ${fmt(Math.round(diff/2))}.`}</div>;})()}
          </div>;
        })()}
      </div>

      {compMode&&compYr&&<div style={{...sC,background:"#fefce8",border:"1px solid #fde68a",marginTop:4}}><div style={{fontSize:18,fontWeight:600,marginBottom:3}}>Primerjava {yr} vs {compYr}</div><table style={{width:"100%",fontSize:18,borderCollapse:"collapse"}}><thead><tr style={{color:C.mt,borderBottom:`1px solid #fde68a`}}><th style={{textAlign:"left",padding:"2px 4px",minWidth:"140px",fontSize:11}}>Kategorija</th><th style={{textAlign:"right",padding:"2px 4px",fontSize:11}}>{yr}</th><th style={{textAlign:"right",padding:"2px 4px",fontSize:11}}>{compYr}</th><th style={{textAlign:"right",padding:"2px 4px",fontSize:11}}>±</th></tr></thead><tbody>{effectiveCats.map(cat=>{let t1=0,t2=0;for(let m=0;m<12;m++){t1+=cT(yd[m]||initM(),cat,'actual');t2+=cT((data[compYr]||initY())[m]||initM(),cat,'actual')}const diff=t1-t2;return<tr key={cat.id} style={{borderTop:`1px solid #f5e6d3`}}><td style={{padding:"1px 4px",fontSize:18}}>{cat.nm}</td><td style={{textAlign:"right",padding:"1px 4px",fontSize:18}}>{fmt(t1)}</td><td style={{textAlign:"right",padding:"1px 4px",color:C.mt,fontSize:18}}>{fmt(t2)}</td><td style={{textAlign:"right",padding:"1px 4px",fontWeight:600,fontSize:18,color:diff>0?C.rd:diff<0?C.gn:C.mt}}>{diff>0?"+":""}{fmt(diff)}</td></tr>})}</tbody></table></div>}

      <div style={sC}><ResponsiveContainer width="100%" height={160}><LineChart data={trendData}><XAxis dataKey="name" tick={{fontSize:16}} axisLine={false}/><YAxis tick={{fontSize:16}} axisLine={false}/><Tooltip formatter={v=>fmt(v)} contentStyle={{fontSize:17}}/><Legend wrapperStyle={{fontSize:16}}/><Line type="monotone" dataKey="Prihodki" stroke={C.gn} strokeWidth={2} dot={{r:3}}/><Line type="monotone" dataKey="Odhodki" stroke={C.rd} strokeWidth={2} dot={{r:3}}/></LineChart></ResponsiveContainer></div>

      {/* #34 Category sparklines */}
      <div style={sC}>
        <div onClick={()=>setShowSparks(v=>!v)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",userSelect:"none"}}>
          <span style={{fontSize:15,fontWeight:700,color:C.tx}}>📊 Trendi kategorij — 12 mesecev</span>
          <span style={{fontSize:13,color:C.mt}}>{showSparks?"▲":"▼"}</span>
        </div>
        {showSparks&&<div style={{marginTop:8}}>{effectiveCats.map(cat=>{const vals=Array.from({length:12},(_,i)=>cT(yd[i]||initM(),cat,'actual'));const mxV=Math.max(1,...vals);if(mxV<5)return null;const sum=vals.reduce((s,v)=>s+v,0);return<div key={cat.id} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",borderBottom:`1px solid ${C.fn}`,fontSize:12}}><span style={{width:160,color:"#555",flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cat.nm}</span><svg width={132} height={22} style={{flexShrink:0}}>{vals.map((v,i)=>{const h=v>0?Math.max(2,Math.round(v/mxV*18)):0;const cl=(yd[i]||{}).closed?C.bl:"#bfdbfe";return<rect key={i} x={i*11} y={22-h} width={9} height={h} rx={1} fill={cl}/>;})}</svg><span style={{fontSize:12,color:C.mt,width:72,textAlign:"right",flexShrink:0}}>{fmt(sum)}</span></div>;})}
        </div>}
      </div>
    </div>}

    {/* ===== CILJI ===== */}
    {vw==="goals"&&<div>
      {(()=>{
        const closedMs=[];for(let i=0;i<12;i++){if((yd[i]||{}).closed)closedMs.push(yd[i]);}
        if(closedMs.length===0)return null;
        const badges=[];
        const consOnBudget=(()=>{let cnt=0,max=0;[...closedMs].reverse().forEach(m=>{const p=effectiveCats.reduce((s,c)=>s+cT(m,c,'plan'),0);const a=efxT(m,'actual')+evrT(m,'actual')+uxtT(m);if(p>0&&a<=p){cnt++;max=Math.max(max,cnt)}else cnt=0});return max})();
        if(consOnBudget>=3)badges.push({icon:"🏅",label:`${consOnBudget}× zapored v planu`});
        const totalSav=closedMs.reduce((s,m)=>{const p=effectiveCats.reduce((ss,c)=>ss+cT(m,c,'plan'),0);const a=efxT(m,'actual')+evrT(m,'actual')+uxtT(m);return s+(p>a?p-a:0)},0);
        if(totalSav>500)badges.push({icon:"💰",label:`${fmt(totalSav)} prihranjeno`});
        if(closedMs.length>=6)badges.push({icon:"📅",label:`${closedMs.length} mesecev zaključenih`});
        const underPct=closedMs.filter(m=>{const p=effectiveCats.reduce((s,c)=>s+cT(m,c,'plan'),0);const a=efxT(m,'actual')+evrT(m,'actual')+uxtT(m);return p>0&&a<p}).length/closedMs.length;
        if(underPct>=0.7)badges.push({icon:"⭐",label:"70%+ mesecev pod planom"});
        if(!badges.length)return null;
        return<div style={{...sC,background:"#fffbeb",border:"1px solid #fde68a",marginBottom:8,padding:"10px 12px"}}><div style={{fontSize:13,fontWeight:700,color:"#92400e",marginBottom:6}}>🏆 Odznaki — {yr}</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{badges.map((b,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",background:"#fef3c7",border:"1px solid #fde68a",borderRadius:20,fontSize:13,fontWeight:600,color:"#78350f"}}><span>{b.icon}</span><span>{b.label}</span></div>)}</div></div>;
      })()}
      {/* #36 Debt payoff goals */}
      {debts.length>0&&<div style={sC}><div style={{fontSize:15,fontWeight:700,color:C.rd,marginBottom:8}}>Odplačevanje dolgov</div>{(()=>{const mx=Math.max(1,...debts.map(d=>d.balance||0));return debts.map(d=>{const bw=Math.round((d.balance||0)/mx*100);return<div key={d.id} style={{marginBottom:6,paddingBottom:6,borderBottom:`1px solid ${C.fn}`}}><div style={{display:"flex",justifyContent:"space-between",fontSize:14,marginBottom:3}}><span style={{fontWeight:600}}>{d.name||"Dolg"}</span><span style={{color:C.rd,fontWeight:600}}>{fmt(d.balance||0)} · {d.rate||0}%</span></div><div style={{height:5,borderRadius:3,background:"#fee2e2",overflow:"hidden"}}><div style={{height:"100%",width:`${bw}%`,borderRadius:3,background:C.rd}}/></div><div style={{fontSize:11,color:C.mt,marginTop:1}}>Min {fmt(d.minPayment||0)}/mes</div></div>;});})()}<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4}}><span style={{fontSize:13,fontWeight:700,color:C.rd}}>Skupaj: {fmt(debts.reduce((s,d)=>s+(d.balance||0),0))}</span><button style={{...sB(false),fontSize:12,height:24,padding:"0 8px"}} onClick={()=>setVw('varsav')}>Uredi →</button></div></div>}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <h2 style={{fontSize:24,fontWeight:700,margin:0}}>Proračunski cilji</h2>
        <div style={{display:"flex",gap:6}}><button style={sB(goalView==="general")} onClick={()=>setGoalView("general")}>Splošni cilji</button><button style={sB(goalView==="monthly")} onClick={()=>setGoalView("monthly")}>Mesečni cilji</button><button style={{...sB(true),background:C.gn}} onClick={()=>setShowNG(!showNG)}>+ Nov cilj</button></div>
      </div>
      {goalView==="monthly"&&<div style={{marginBottom:10}}><span style={{fontSize:17,color:C.mt}}>Mesec: </span><select style={{...sS,height:26,fontSize:17,width:120}} value={goalMonth} onChange={e=>setGoalMonth(parseInt(e.target.value))}>{MF.map((m,i)=><option key={i} value={i}>{m}</option>)}</select></div>}
      {showNG&&<AddGoal onAdd={g=>{setGoals(p=>[...p,{id:Date.now(),...g}]);setShowNG(false)}} onCancel={()=>setShowNG(false)}/>}
      {goals.filter(g=>goalView==="general"?(g.scope!=="monthly"):(g.scope==="monthly"&&g.month===goalMonth)).map(g=>{const getAutoPullValue=()=>{if(!g.autoPull||!g.source)return g.current||0;let total=0;const sub=effectiveAS.find(s=>s.id===g.source);if(!sub)return g.current||0;if(g.pullFromMonth==="all"){for(let i=0;i<12;i++){const md2=yd[i]||initM();if(md2.closed)total+=md2.subs?.[g.source]?.actual||0}}else if(g.pullFromMonth==="current"){total=md.subs?.[g.source]?.actual||0}else{const mi=parseInt(g.pullFromMonth);const md2=yd[mi]||initM();total=md2.subs?.[g.source]?.actual||0}return total};const currentVal=getAutoPullValue();const p=g.target>0?pc(currentVal,g.target):0;return<div key={g.id} style={sC}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <span style={{fontSize:16,fontWeight:700}}>{g.name}</span>
          <div style={{display:"flex",gap:4,alignItems:"center"}}><span style={sT(g.type==="saving"?"#dbeafe":"#fef3c7",g.type==="saving"?C.bl:"#92400e")}>{g.type}</span>{g.month!=null&&<span style={sT("#f0f7ff",C.bl)}>{MF[g.month]}</span>}{g.autoPull&&<span style={sT("#dcfce7","#166534")}>🔗</span>}<button onClick={()=>setGoals(prev=>prev.filter(x=>x.id!==g.id))} style={{fontSize:16,color:C.rd,background:"none",border:"none",cursor:"pointer"}}>✕</button></div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
          <span style={{fontSize:16,color:C.mt}}>Trenutno:</span>
          {g.autoPull?<span style={{fontSize:16,fontWeight:600,width:90,color:C.bl}}>{fmt(currentVal)}</span>:<input style={{...sI,width:90,height:30,fontSize:16,fontWeight:600}} defaultValue={g.current||0} onBlur={e=>setGoals(prev=>prev.map(x=>x.id===g.id?{...x,current:parseFloat(e.target.value)||0}:x))}/>}
          <span style={{fontSize:16,fontWeight:700}}>/ {fmt(g.target)}</span>
          {g.source&&<span style={{fontSize:16,color:C.bl}}>← {effectiveAS.find(s=>s.id===g.source)?.nm||g.source}</span>}
        </div>
        <div style={{height:6,borderRadius:3,background:"#eee",overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(p,100)}%`,borderRadius:3,background:p>90&&g.type==="limit"?C.rd:C.bl}}/></div>
        <div style={{fontSize:17,color:C.mt,marginTop:4}}>{p}% {g.note&&`— ${g.note}`}</div>
        {g.targetDate&&(()=>{const td=new Date(g.targetDate+"-01");const now=new Date();const moLeft=Math.max(1,(td.getFullYear()-now.getFullYear())*12+(td.getMonth()-now.getMonth()));const remaining=g.target-currentVal;const reqMo=remaining>0?Math.ceil(remaining/moLeft):0;const onTrack=reqMo<=0;return<div style={{marginTop:4,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{padding:"4px 8px",borderRadius:4,background:onTrack?"#dcfce7":"#fef3c7",fontSize:14,color:onTrack?"#166534":"#92400e",fontWeight:600}}>🎯 Do {g.targetDate}: {moLeft} mes. ostane {onTrack?"✓ cilj dosežen":` → potrebuješ ${fmt(reqMo)}/mesec`}</div>
          {!onTrack&&g.source&&reqMo>0&&<button style={{...sB(true),background:C.gn,fontSize:13,height:26,padding:"0 10px"}} onClick={()=>{addTransaction(g.source,reqMo,`💰 ${g.name} — ${new Date().toLocaleDateString('sl-SI')}`);setVw('entry')}}>💰 Financiraj {fmt(reqMo)}</button>}
        </div>})()}
      </div>})}
      {goals.filter(g=>goalView==="general"?(g.scope!=="monthly"):(g.scope==="monthly"&&g.month===goalMonth)).length===0&&<div style={{fontSize:18,color:C.mt,textAlign:"center",padding:20}}>Ni ciljev za ta pogled. Dodaj novega z gumbom zgoraj.</div>}
    </div>}

    {/* ===== SIMULACIJA ===== */}
    {vw==="sim"&&<div style={{display:"flex",gap:8,flexWrap:"wrap",margin:"0 0 12px",alignItems:"center"}}>
      <button style={{...sB(simUx==="classic"),height:36,fontSize:14}} onClick={()=>setSimUx("classic")}>Klasični pogled</button>
      <button style={{...sB(simUx==="decision"),height:36,fontSize:14}} onClick={()=>setSimUx("decision")}>Odločitve in scenariji</button>
      <span style={{fontSize:13,color:C.mt}}>Klasični pogled je stara projekcija; scenariji so novi laboratorij za posamezne odločitve.</span>
    </div>}
    {vw==="sim"&&simUx==="decision"&&<FinancialSimulationTab
      data={data}
      year={yr}
      month={mo}
      categories={effectiveCats}
      savingsData={savData}
      netWorthAssets={nwAssets}
      netWorthLiabilities={nwLiabs}
      debts={debts}
      subscriptions={subscriptions}
      isMobile={isMob}
    />}
    {vw==="sim"&&simUx==="classic"&&<div>
      <h2 style={{fontSize:24,fontWeight:800,margin:"0 0 10px"}}>Finančna simulacija</h2>

      {/* Hero — projected outcome + plain-language verdict */}
      {(()=>{
        const last=simData.length>0?simData[simData.length-1]:null;
        const defYears=simData.filter(d=>d.Razlika<0).length;
        const hY=simData.length;
        let vIcon="",verdict="";
        if(!last)verdict="Izberi obdobje in predpostavke za izračun projekcije.";
        else if(defYears===0){vIcon="🟢";verdict="Tok gotovine je stabilen — tvoji prihranki rastejo vsako leto.";}
        else if(defYears<=hY/2){vIcon="🟡";verdict=`Pozor: v ${defYears} ${defYears===1?"letu":"letih"} bi porabili več, kot zaslužite.`;}
        else{vIcon="🔴";verdict="Opozorilo: večino obdobja bi bili v primanjkljaju — razmislite o prilagoditvi.";}
        return<div style={{...sC,background:GR,border:"none",color:"#fff",padding:18,boxShadow:SHL,animation:"dpFadeUp .4s ease"}}>
          <div style={{fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:0.7,opacity:0.92}}>Tvoja finančna pot</div>
          {last?<>
            <div style={{fontSize:15,opacity:0.95,marginTop:6}}>Do konca leta {last.name} boš predvidoma prihranil/-a</div>
            <div style={{fontSize:isMob?38:52,fontWeight:900,margin:"2px 0 8px",lineHeight:1.04}}>{fmt(last.Prihranki)}</div>
            <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>{vIcon} {verdict}</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <span style={{background:"rgba(255,255,255,0.22)",borderRadius:10,padding:"5px 11px",fontSize:13,fontWeight:700}}>💰 Vloženo {fmt(last.Vloženo)}</span>
              <span style={{background:"rgba(255,255,255,0.22)",borderRadius:10,padding:"5px 11px",fontSize:13,fontWeight:700}}>📈 Donos naložb {fmt(last.Donos)}</span>
            </div>
          </>:<div style={{fontSize:15,marginTop:8,opacity:0.95}}>{verdict}</div>}
        </div>;
      })()}

      {/* Horizon selector — compact */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10,alignItems:"center"}}>
        <span style={{fontSize:13,fontWeight:800,color:C.mt}}>Obdobje:</span>
        {[["1 leto","2027-04-30"],["3 leta","2029-04-30"],["5 let","2031-04-30"],["10 let","2036-04-30"],["20 let","2046-04-30"]].map(([l,d])=><button key={l} style={{...sB(simTo===d),fontSize:14,height:36}} onClick={()=>setSimTo(d)}>{l}</button>)}
        {adv&&<><span style={{fontSize:13,color:C.mt,marginLeft:4}}>po meri:</span><input type="date" style={{...sI,width:140,height:36}} value={simFrom} onChange={e=>setSimFrom(e.target.value)}/><input type="date" style={{...sI,width:140,height:36}} value={simTo} onChange={e=>setSimTo(e.target.value)}/></>}
      </div>

      {/* Manual overrides — advanced only */}
      {adv&&<details style={{...sC,padding:0,overflow:"hidden"}}>
      <summary style={{fontSize:15,fontWeight:800,color:C.tx,padding:"12px 14px",cursor:"pointer",listStyle:"none"}}>⚙ Ročni vnos podatkov in kategorije</summary>
      <div style={{padding:"0 14px 14px"}}>
      <div style={{fontSize:13,color:C.mt,marginBottom:10}}><strong>Podatki:</strong> {Object.values(yd).filter(m=>m.closed).length} zaključenih mesecev + {12-Object.values(yd).filter(m=>m.closed).length} ocenjenih. Ø prihodek {fmt(tInc||3600)}, Ø odhodek {fmt(tAc||3100)}.</div>
      <div style={{marginBottom:10}}><div style={{fontSize:14,fontWeight:700,color:C.sb,marginBottom:8}}>Ročni vnos podatkov <span style={sT("#fbe8db","#92400e")}>prevlada nad avtomatskimi</span></div>
        <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr 1fr",gap:10}}>
          <div><div style={{fontSize:16,color:C.mt,marginBottom:2}}>Mesečni prihodki (€)</div><input type="number" style={{...sI,width:"100%"}} defaultValue={simManual.income??""} onBlur={e=>setSimManual(p=>({...p,income:e.target.value?parseFloat(e.target.value):null}))} placeholder={`Avto: ${fN(tInc||3600)}`}/></div>
          <div><div style={{fontSize:16,color:C.mt,marginBottom:2}}>Mesečni odhodki (€)</div><input type="number" style={{...sI,width:"100%"}} defaultValue={simManual.expense??""} onBlur={e=>setSimManual(p=>({...p,expense:e.target.value?parseFloat(e.target.value):null}))} placeholder={`Avto: ${fN(tAc||3100)}`}/></div>
          <div><div style={{fontSize:16,color:C.mt,marginBottom:2}}>Mesečno varčevanje (€)</div><input type="number" style={{...sI,width:"100%"}} defaultValue={simManual.savings??""} onBlur={e=>setSimManual(p=>({...p,savings:e.target.value?parseFloat(e.target.value):null}))} placeholder="Avto: 500"/></div>
        </div>
        <div style={{fontSize:16,color:C.mt,marginTop:4}}>Pusti prazno za avtomatski izračun iz zaključenih mesecev.</div>
      </div>

      {/* Category selector for simulation */}
      <div><div style={{fontSize:14,fontWeight:700,color:C.sb,marginBottom:8}}>Kategorije vključene v simulacijo</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4}}>
          {CATS.map(cat=><label key={cat.id} style={{display:"flex",alignItems:"center",gap:4,fontSize:17,padding:"2px 0",cursor:"pointer"}}>
            <input type="checkbox" checked={simCats.includes(cat.id)} onChange={e=>{if(e.target.checked)setSimCats(s=>[...s,cat.id]);else setSimCats(s=>s.filter(x=>x!==cat.id))}}/>
            {cat.nm.substring(0,20)}
          </label>)}
        </div>
        <div style={{display:"flex",gap:6,marginTop:6}}><button style={{...sB(false),fontSize:14,height:28}} onClick={()=>setSimCats(CATS.map(c=>c.id))}>Izberi vse</button><button style={{...sB(false),fontSize:14,height:28}} onClick={()=>setSimCats([])}>Počisti</button></div>
      </div>
      </div></details>}

      <div style={sC}><div style={{fontSize:16,fontWeight:800,color:C.tx,marginBottom:4}}>Nastavitve projekcije</div><div style={{fontSize:13,color:C.mt,marginBottom:8}}>Premakni drsnike in glej, kako se spremeni projekcija zgoraj.</div><PSlider label="Donos naložb (%/leto)" value={simReturn} onChange={setSimReturn} min={-10} max={20} unit="%"/><PSlider label="Dodatne naložbe/mesec" value={simE} onChange={setSimE} min={-500} max={500} step={10} unit="€"/>{adv&&<><PSlider label="Rast plač (%/leto)" value={simG} onChange={setSimG} min={-15} max={15} unit="%"/><PSlider label="Inflacija (%/leto)" value={simI} onChange={setSimI} min={-10} max={10} unit="%"/></>}
        <div style={{display:"flex",gap:8,alignItems:"center",marginTop:8,flexWrap:"wrap"}}>
          <span style={{fontSize:17,color:C.mt,minWidth:140}}>Začetni saldo (€)</span>
          <input type="number" style={{...sI,width:120}} value={simInitial} onChange={e=>setSimInitial(parseFloat(e.target.value)||0)} placeholder="0"/>
          {cryptoVal>0&&<button style={{...sB(false),fontSize:14,height:28,padding:"0 10px"}} onClick={()=>setSimInitial(Math.round(cryptoVal))}>+ Iz kripto: {fmt(cryptoVal)}</button>}
        </div>
      </div>
      <div style={sC}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <span style={{fontSize:15,fontWeight:800,color:C.tx}}>Hitri scenariji — kaj če…</span>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <button style={sB(false)} onClick={()=>setSimE(e=>e+200)}>💰 +200€/mes varčevanja</button>
          <button style={sB(false)} onClick={()=>setSimReturn(r=>Math.min(20,r+2))}>📈 Donos +2%</button>
          <button style={sB(false)} onClick={()=>setSimI(i=>i+2)}>🔥 Inflacija +2%</button>
          <button style={sB(false)} onClick={()=>setSimEvents(e=>[...e,{id:Date.now(),year:new Date().getFullYear()+1,kind:"incPct",value:-20,recurring:true,label:"Plača -20%"}])}>📉 Plača -20%</button>
          <button style={sB(false)} onClick={()=>{setSimE(0);setSimReturn(5);setSimI(2);setSimG(3)}}>↺ Privzeto</button>
        </div>
      </div>
      {adv&&<details style={sC}>
        <summary style={{fontSize:15,fontWeight:800,color:C.tx,cursor:"pointer",listStyle:"none"}}>📅 Življenjski dogodki ({simEvents.length+simSc.length}) — hipoteka, povišica, izguba službe…</summary>
        <div style={{marginTop:8}}>
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
        </div>
      </details>}
      <div style={sC}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}><span style={{fontSize:16,fontWeight:800,color:C.tx}}>Projekcija — rast premoženja</span>{adv&&<div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>{["nw","bar","line","area","cash"].map(v=><button key={v} style={{...sB(simViz===v),fontSize:13,height:28,padding:"0 9px"}} onClick={()=>setSimViz(v)}>{v==="bar"?"Stolpci":v==="line"?"Črtni":v==="area"?"Površinski":v==="cash"?"Tok gotovine":"Neto vrednost"}</button>)}<label style={{display:"flex",alignItems:"center",gap:4,fontSize:13,color:C.mt,marginLeft:4,cursor:"pointer"}}><input type="checkbox" checked={simShowRange} onChange={e=>setSimShowRange(e.target.checked)} style={{accentColor:C.bl}}/>Razpon ±{simRangeWidth}%</label></div>}</div>
        <div style={{fontSize:12,color:C.mt,marginBottom:8}}>💡 Projekcija temelji na vaših zaključenih mesecih in nastavitvah spodaj. Površina prikazuje vloženi kapital (oranžna) in donos naložb (vijolična).</div>
        <ResponsiveContainer width="100%" height={260}>
          {adv&&simViz==="bar"?<BarChart data={simData} barGap={2}><XAxis dataKey="name" tick={{fontSize:16}} axisLine={false}/><YAxis tick={{fontSize:18}} axisLine={false} tickFormatter={v=>`€${Math.round(v/1000)}k`}/><Tooltip formatter={v=>fmt(v)} contentStyle={{fontSize:17}}/><Legend wrapperStyle={{fontSize:16}}/><Bar dataKey="Prihodki" fill={C.gn} radius={[3,3,0,0]} barSize={14}/><Bar dataKey="Odhodki" fill={C.rd} radius={[3,3,0,0]} barSize={14} opacity={0.6}/><Bar dataKey="Prihranki" fill={C.bl} radius={[3,3,0,0]} barSize={14} opacity={0.8}/><Bar dataKey="Donos" fill={C.pu} radius={[3,3,0,0]} barSize={14} opacity={0.7}/></BarChart>
          :adv&&simViz==="line"?<LineChart data={simData}><XAxis dataKey="name" tick={{fontSize:16}} axisLine={false}/><YAxis tick={{fontSize:18}} axisLine={false} tickFormatter={v=>`€${Math.round(v/1000)}k`}/><Tooltip formatter={v=>fmt(v)} contentStyle={{fontSize:17}}/><Legend wrapperStyle={{fontSize:16}}/><Line type="monotone" dataKey="Prihodki" stroke={C.gn} strokeWidth={2} dot={{r:4}}/><Line type="monotone" dataKey="Odhodki" stroke={C.rd} strokeWidth={2} dot={{r:4}}/><Line type="monotone" dataKey="Prihranki" stroke={C.bl} strokeWidth={2} dot={{r:4}}/><Line type="monotone" dataKey="Donos" stroke={C.pu} strokeWidth={2} dot={{r:3}} strokeDasharray="4 2"/></LineChart>
          :adv&&simViz==="area"?<AreaChart data={simBands}><XAxis dataKey="name" tick={{fontSize:16}} axisLine={false}/><YAxis tick={{fontSize:18}} axisLine={false} tickFormatter={v=>`€${Math.round(v/1000)}k`}/><Tooltip formatter={v=>fmt(v)} contentStyle={{fontSize:17}}/><Legend wrapperStyle={{fontSize:16}}/>{simShowRange&&<Area type="monotone" dataKey="Pas" fill={C.bl} stroke="none" fillOpacity={0.15} legendType="none" name="Razpon scenarijev"/>}<Area type="monotone" dataKey="Vloženo" fill={C.or} stroke={C.or} fillOpacity={0.25}/><Area type="monotone" dataKey="Prihranki" fill={C.bl} stroke={C.bl} fillOpacity={0.4}/></AreaChart>
          :adv&&simViz==="cash"?<BarChart data={simData} barGap={2}><XAxis dataKey="name" tick={{fontSize:16}} axisLine={false}/><YAxis tick={{fontSize:18}} axisLine={false} tickFormatter={v=>`€${Math.round(v/1000)}k`}/><Tooltip formatter={v=>fmt(v)} contentStyle={{fontSize:17}}/><Legend wrapperStyle={{fontSize:16}}/><Bar dataKey="Razlika" radius={[3,3,0,0]} barSize={14}>{simData.map((d,i)=><Cell key={i} fill={d.Razlika>=0?C.gn:C.rd}/>)}</Bar></BarChart>
          :<AreaChart data={simData}><XAxis dataKey="name" tick={{fontSize:16}} axisLine={false}/><YAxis tick={{fontSize:18}} axisLine={false} tickFormatter={v=>`€${Math.round(v/1000)}k`}/><Tooltip formatter={v=>fmt(v)} contentStyle={{fontSize:17}}/><Legend wrapperStyle={{fontSize:16}}/><Area type="monotone" dataKey="Vloženo" stackId="1" fill={C.or} stroke={C.or} fillOpacity={0.5} name="Vloženi kapital"/><Area type="monotone" dataKey="Donos" stackId="1" fill={C.pu} stroke={C.pu} fillOpacity={0.5} name="Donos naložb"/></AreaChart>}
        </ResponsiveContainer>
        {(!adv||simViz==="nw")&&simData.length>0&&<div style={{marginTop:6,padding:"8px 10px",background:GRW,borderRadius:10,fontSize:13,color:C.tx,border:`1px solid #f2d9c6`}}>
          <strong>Neto vrednost {simData[simData.length-1].name}:</strong> {fmt(simData[simData.length-1].Prihranki)} = vloženo {fmt(simData[simData.length-1].Vloženo)} + donos {fmt(simData[simData.length-1].Donos)}
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

      {/* Year-by-year detailed table — advanced only */}
      {adv&&<div style={sC}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setSimShowTable(s=>!s)}>
          <span style={{fontSize:15,fontWeight:800,color:C.tx}}>Tabela po letih {simShowTable?"▼":"▶"}</span>
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
      </div>}
    </div>}

    {/* ===== PLAN ===== */}
    {vw==="pct"&&(()=>{
      const colTarget=(sub,base)=>{const m=AP.pMd[sub.id]||"fixed";return m==="pct"?Math.round(base*(AP.bPct[sub.id]||0)/100):(AP.pFx[sub.id]||0)};
      const sumOfType=(tp,base)=>effectiveCats.filter(c=>c.tp===tp).flatMap(c=>c.subs).filter(s=>subVis[s.id]!==true).reduce((s,sub)=>s+colTarget(sub,base),0);
      const fxSum=sumOfType("fixed",AP.budget);
      const vrSum=sumOfType("var",AP.budget);
      const nepTarget=AP.nepMd==="pct"?Math.round(AP.budget*AP.nepPct/100):AP.nepFx;
      const totalPlan=fxSum+vrSum+nepTarget;
      const totalPct=AP.budget>0?Math.round(totalPlan/AP.budget*100):0;
      const sFxSum=sumOfType("fixed",scratchBudget);const sVrSum=sumOfType("var",scratchBudget);const sNep=AP.nepMd==="pct"?Math.round(scratchBudget*AP.nepPct/100):AP.nepFx;const sTotal=sFxSum+sVrSum+sNep;
      return<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
        <h2 style={{fontSize:24,fontWeight:700,margin:0}}>{tabNames.pct||"Plan"}</h2>
        <button style={{...sB(planManageMode),fontSize:15,height:34,padding:"0 14px"}} onClick={()=>{setPlanManageMode(!planManageMode);setAddSubCat(null);setAddSubNm('')}}>{planManageMode?"✓ Zaključi urejanje":"⚙ Uredi postavke"}</button>
      </div>

      {/* Profile selector — advanced only */}
      {adv&&<div style={{...sC,background:GRW,border:`1px solid #f2d9c6`}}>
        <div style={{fontSize:16,fontWeight:800,color:C.tx,marginBottom:8}}>Profili proračuna</div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:6}}>
          <select style={{...sS,height:34,fontSize:15,flex:1,minWidth:140}} value={activeProfId} onChange={e=>setActiveProfId(e.target.value)}>
            {budgetProfiles.map(p=><option key={p.id} value={p.id}>{p.name}{p.isDefault?" ✓":""}</option>)}
          </select>
          {!AP.isDefault&&<button style={{...sB(true),background:C.gn,height:34,fontSize:14}} onClick={()=>setBudgetProfiles(ps=>ps.map(p=>({...p,isDefault:p.id===activeProfId})))}>Nastavi kot privzeti ✓</button>}
          {!renamingProf&&<button style={{...sB(false),height:34,fontSize:14}} onClick={()=>{setRenamingProf(true);setRenameName(AP.name)}}>Preimenuj</button>}
          {renamingProf&&<><input style={{...sI,height:34,fontSize:14,width:140}} value={renameName} onChange={e=>setRenameName(e.target.value)}/><button style={{...sB(true),height:34,fontSize:14}} onClick={()=>{updProf('name',renameName);setRenamingProf(false)}}>✓</button><button style={{...sB(false),height:34,fontSize:14}} onClick={()=>setRenamingProf(false)}>✕</button></>}
          {budgetProfiles.length>1&&AP.id!=='moj_plan'&&<button style={{...sB(false),height:34,fontSize:14,color:C.rd,borderColor:C.rd}} onClick={()=>{if(confirm(`Izbriši profil "${AP.name}"?`)){const next=budgetProfiles.find(p=>p.id!==activeProfId);if(next){setActiveProfId(next.id);if(AP.isDefault)setBudgetProfiles(ps=>[...ps.filter(p=>p.id!==activeProfId).map((p,i)=>i===0?{...p,isDefault:true}:p)]);else setBudgetProfiles(ps=>ps.filter(p=>p.id!==activeProfId))}}}}>Izbriši</button>}
          <button style={{...sB(false),height:34,fontSize:14}} onClick={()=>setShowNewProf(!showNewProf)}>+ Nov profil</button>
        </div>
        {showNewProf&&<div style={{display:"flex",gap:6,alignItems:"center",padding:"6px 0",borderTop:`1px solid #bfdbfe`,flexWrap:"wrap"}}>
          <span style={{fontSize:14,color:C.mt}}>Ime:</span>
          <input style={{...sI,height:30,fontSize:14,flex:1,minWidth:100}} value={newProfName} onChange={e=>setNewProfName(e.target.value)} placeholder="npr. Varčevalni plan"/>
          <span style={{fontSize:13,color:C.mt}}>Kopiraj iz:</span>
          <select style={{...sS,height:30,fontSize:13}} id="profCopyFrom">{budgetProfiles.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}{PROF_TEMPLATES.map(t=><option key={t.id+'_tpl'} value={t.id+'_tpl'}>{t.name} (privzeto)</option>)}</select>
          <button style={{...sB(true),height:30,fontSize:14}} onClick={()=>{if(!newProfName.trim())return;const src=document.getElementById('profCopyFrom').value;const base=src.endsWith('_tpl')?PROF_TEMPLATES.find(t=>t.id===src.replace('_tpl','')):budgetProfiles.find(p=>p.id===src);if(!base)return;const np={...base,id:'prof_'+Date.now(),name:newProfName.trim(),isDefault:false};setBudgetProfiles(ps=>[...ps,np]);setActiveProfId(np.id);setNewProfName('');setShowNewProf(false)}}>Ustvari</button>
          <button style={{...sB(false),height:30,fontSize:14}} onClick={()=>setShowNewProf(false)}>✕</button>
        </div>}
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",paddingTop:6,borderTop:`1px solid #bfdbfe`,marginTop:2}}>
          <span style={{fontSize:14,color:C.mt}}>Privzet (za sync):</span>
          <span style={{fontSize:14,fontWeight:600,color:C.bl}}>{defProf?.name||"—"}</span>
          {PROF_TEMPLATES.map(t=><button key={t.id} style={{...sB(false),height:26,fontSize:12,color:"#7c3aed",borderColor:"#7c3aed"}} onClick={()=>{if(confirm(`Ponastavi "${AP.name}" na vrednosti predloge "${t.name}"?`)){setBudgetProfiles(ps=>ps.map(p=>p.id===activeProfId?{...p,budget:t.budget,bPct:t.bPct,pMd:t.pMd,pFx:{...t.pFx},nepPct:t.nepPct,nepMd:t.nepMd,nepFx:t.nepFx}:p))}}}>↺ {t.name}</button>)}
        </div>
        {!AP.isDefault&&<div style={{marginTop:6,fontSize:13,color:"#b45309",background:"#fefce8",border:"1px solid #fde68a",borderRadius:4,padding:"4px 8px"}}>⚠ Urejate profil <strong>{AP.name}</strong>. Sync bo iz privzetega <strong>{defProf?.name}</strong>.</div>}
      </div>}

      <div style={{...sC,background:"#fffdfb",border:`1px solid ${C.bd}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:8}}>
          <div><div style={{fontSize:16,fontWeight:900,color:C.tx}}>Metoda proračuna</div><div style={{fontSize:13,color:C.mt}}>Metoda vodi preverjanje plana, obstoječih zneskov pa ne pokvari.</div></div>
          <select value={AP.method||'category'} onChange={e=>updProf('method',e.target.value)} style={{...sS,minWidth:220}}>
            <option value="category">Kategorijski plan</option>
            <option value="zero">Zero-based</option>
            <option value="envelope">Envelope / kuverte</option>
            <option value="flexible">Fleksibilni plan</option>
            <option value="hybrid">Hibridni plan</option>
          </select>
        </div>
        {(()=>{const method=AP.method||'category';const leftover=AP.budget-totalPlan;const messages={category:"Klasičen način: vsaka kategorija ima svoj plan, glavno merilo je plan proti dejanski porabi.",zero:`Zero-based želi, da je vsak evro razporejen. Trenutno ostane ${fmt(leftover)} nerazporejeno.`,envelope:"Envelope način obravnava kategorije kot kuverte. Prenos neporabljenega proračuna je pri tej metodi posebej pomemben.",flexible:"Fleksibilni način dopušča več prostega prostora; spremljaj predvsem varno za porabo in večja odstopanja.",hybrid:"Hibridni način združi stroge fiksne stroške z bolj fleksibilnimi variabilnimi kategorijami."};return<div style={{fontSize:14,color:method==='zero'&&Math.abs(leftover)>10?C.or:C.sb,background:method==='zero'&&Math.abs(leftover)>10?"#fff7ed":C.fn,borderRadius:10,padding:"9px 11px",fontWeight:700}}>{messages[method]}</div>})()}
      </div>

      {/* ===== MANAGEMENT PANEL ===== */}
      {planManageMode&&<div style={{...sC,background:"#f8f8ff",border:"1px solid #c7d2fe",marginBottom:10}}>
        <div style={{fontSize:15,fontWeight:700,color:"#4338ca",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>⚙ Upravljanje postavk <span style={{fontSize:13,color:C.mt,fontWeight:400}}>— spremembe so takoj vidne v vseh zavihkih</span></div>

        {/* Bulk adjust */}
        <div style={{...sC,background:"#f0fdf4",border:"1px solid #bbf7d0",marginBottom:8,padding:"8px 10px"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#166534",marginBottom:5}}>📐 Množično prilagodi plan</div>
          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
            <select style={{...sS,height:28,fontSize:13,width:120}} value={bulkAdjType} onChange={e=>setBulkAdjType(e.target.value)}><option value="all">Vse</option><option value="fixed">Samo fiksni</option><option value="var">Samo variabilni</option></select>
            <span style={{fontSize:13}}>×</span>
            <input type="number" style={{...sI,width:65,height:28,fontSize:13,textAlign:"right"}} value={bulkAdjPct||""} onChange={e=>setBulkAdjPct(parseFloat(e.target.value)||0)} placeholder="+5"/>
            <span style={{fontSize:13}}>%</span>
            <button style={{...sB(true),height:28,fontSize:13,padding:"0 10px",background:C.gn}} type="button" onClick={()=>{if(!bulkAdjPct)return;const factor=1+bulkAdjPct/100;const newFx={...AP.pFx};const newPct={...AP.bPct};effectiveAS.filter(sub=>{const cat=effectiveCats.find(c=>c.subs.some(s=>s.id===sub.id));return cat&&(bulkAdjType==="all"||(bulkAdjType==="fixed"&&cat.tp==="fixed")||(bulkAdjType==="var"&&cat.tp==="var"))}).forEach(sub=>{const mode=AP.pMd[sub.id]||"fixed";if(mode==="fixed"){const cur=newFx[sub.id]||0;if(cur>0)newFx[sub.id]=Math.round(cur*factor)}else{const cur=newPct[sub.id]||0;if(cur>0)newPct[sub.id]=Math.round(cur*factor*10)/10}});updProf('pFx',newFx);updProf('bPct',newPct);setBulkAdjPct(0)}}>Uporabi</button>
            <span style={{fontSize:12,color:C.mt}}>Prilagodi fiksne € ali % vrednosti za vse vidne postavke</span>
          </div>
        </div>

        {/* Copy from last year + Plan history */}
        <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
          <button style={{...sB(false),fontSize:13,height:28,padding:"0 10px"}} type="button" onClick={copyPlanFromLastYear}>📋 Prenesi plan iz {yr-1}</button>
          <button style={{...sB(showPlanHistory),fontSize:13,height:28,padding:"0 10px"}} type="button" onClick={()=>setShowPlanHistory(!showPlanHistory)}>📜 {showPlanHistory?"Skrij":"Pokaži"} zgodovino sprememb ({cLog.length})</button>
        </div>
        {showPlanHistory&&<div style={{...sC,marginBottom:8,maxHeight:200,overflowY:"auto",padding:6}}>
          <div style={{fontSize:13,fontWeight:600,color:C.sb,marginBottom:4}}>Zadnje spremembe plana</div>
          {cLog.slice(0,50).map((l,i)=>{const sub=effectiveAS.find(s=>s.id===l.sub);return<div key={i} style={{fontSize:12,padding:"2px 4px",borderBottom:`1px solid ${C.fn}`,color:"#555"}}>{l.date} — <strong>{sub?.nm||l.sub}</strong>: {fmt(l.oldVal)} → <span style={{color:l.newVal>l.oldVal?C.rd:C.gn,fontWeight:600}}>{fmt(l.newVal)}</span> <span style={{color:C.mt}}>({l.who})</span></div>})}
          {cLog.length===0&&<div style={{fontSize:12,color:C.mt,textAlign:"center",padding:8}}>Ni sprememb.</div>}
        </div>}

        {/* Per-category sub management */}
        {[{tp:"fixed",label:"Fiksni stroški"},{tp:"var",label:"Variabilni stroški"}].map(type=><div key={type.tp} style={{marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:700,color:C.sb,padding:"4px 0 6px",borderBottom:`2px solid ${C.bd}`,marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>{type.label}</div>
          {effectiveCats.filter(c=>c.tp===type.tp).map(cat=>{
            const isAddOpen=addSubCat===cat.id;
            const visibleCount=cat.subs.filter(s=>subVis[s.id]!==true).length;
            const isCustomCatGroup=!CATS.find(c=>c.id===cat.id);
            return<div key={cat.id} style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"3px 0 4px",borderBottom:`1px solid ${C.fn}`}}>
                <span style={{fontSize:14,fontWeight:600,color:C.tx}}>{cat.nm} <span style={{fontSize:12,color:C.mt}}>({visibleCount}/{cat.subs.length})</span>{isCustomCatGroup&&<span style={{...sT("#e0e7ff","#4338ca"),fontSize:11,marginLeft:4,padding:"1px 4px"}}>nova skupina</span>}</span>
                <div style={{display:"flex",gap:4}}>
                  {isCustomCatGroup&&<button style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:C.rd,padding:"0 4px"}} title="Izbriši skupino" type="button" onClick={()=>{if(window.confirm(`Izbriši skupino "${cat.nm}"?`))setCustomCatGroups(p=>p.filter(c=>c.id!==cat.id))}}>🗑 skupino</button>}
                  <button style={{...sB(isAddOpen),height:22,fontSize:13,padding:"0 8px"}} onClick={()=>{setAddSubCat(isAddOpen?null:cat.id);setAddSubNm('')}}>+ Dodaj</button>
                </div>
              </div>
              {cat.subs.map((sub,si)=>{
                const hidden=subVis[sub.id]===true;
                const isCustom=isCustomCatGroup||(customSubs[cat.id]||[]).some(s=>s.id===sub.id);
                const displayNm=subRename[sub.id]||sub.nm;
                const alertV=subAlerts[sub.id]||"";
                return<div key={sub.id} style={{display:"flex",alignItems:"center",gap:4,padding:"2px 0 2px 4px",borderBottom:`1px solid #f5f5f5`,opacity:hidden?0.45:1}}>
                  <div style={{display:"flex",flexDirection:"column",gap:0}}>
                    <button type="button" onClick={()=>moveSubUp(cat.id,sub.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,padding:"0 2px",color:si===0?"#ddd":C.mt,lineHeight:1}} disabled={si===0}>▲</button>
                    <button type="button" onClick={()=>moveSubDown(cat.id,sub.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,padding:"0 2px",color:si===cat.subs.length-1?"#ddd":C.mt,lineHeight:1}} disabled={si===cat.subs.length-1}>▼</button>
                  </div>
                  <span style={{flex:1,fontSize:13,color:hidden?"#aaa":C.tx,textDecoration:hidden?"line-through":"none"}}>{displayNm}{isCustom&&<span style={{...sT("#e0e7ff","#4338ca"),fontSize:11,marginLeft:4,padding:"1px 4px"}}>novo</span>}</span>
                  <span title="Opozorilo pri % plana (prazno = brez)"><input type="number" min={0} max={200} value={alertV} onChange={e=>setSubAlerts(p=>({...p,[sub.id]:parseInt(e.target.value)||0}))} style={{...sI,width:44,height:22,fontSize:11,textAlign:"right",padding:"0 4px"}} placeholder="⚡%"/></span>
                  <button title={hidden?"Pokaži":"Začasno skrij"} onClick={()=>toggleSubVis(sub.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,padding:"0 2px",color:hidden?C.mt:C.bl}} type="button">{hidden?"🙈":"👁"}</button>
                  <button title="Preimenuj" onClick={()=>{const nm=prompt("Novo ime:",displayNm);if(nm&&nm.trim())setSubRename(p=>({...p,[sub.id]:nm.trim()}))}} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,padding:"0 2px",color:C.bl}} type="button">✎</button>
                  <button title={isCustom?"Izbriši":"Trajno skrij"} onClick={()=>{if(isCustom){if(!window.confirm(`Izbriši "${displayNm}"?`))return;if(isCustomCatGroup){setCustomCatGroups(p=>p.map(c=>c.id===cat.id?{...c,subs:c.subs.filter(s=>s.id!==sub.id)}:c))}else{setCustomSubs(p=>{const n={...p};n[cat.id]=(n[cat.id]||[]).filter(s=>s.id!==sub.id);return n})}}else{if(!window.confirm(`Trajno skrij "${displayNm}"?`))return;setSubVis(p=>({...p,[sub.id]:true}))}}} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,padding:"0 2px",color:C.rd}} type="button">🗑</button>
                </div>
              })}
              {isAddOpen&&<div style={{display:"flex",gap:5,marginTop:4,padding:"5px 6px",background:"#f0f7ff",borderRadius:4,alignItems:"center"}}>
                <input style={{...sI,flex:1,height:26,fontSize:13}} value={addSubNm} onChange={e=>setAddSubNm(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){const nm=addSubNm.trim();if(!nm)return;const id="custom_"+cat.id+"_"+Date.now();if(isCustomCatGroup){setCustomCatGroups(p=>p.map(c=>c.id===cat.id?{...c,subs:[...c.subs,{id,nm,dp:0}]}:c))}else{setCustomSubs(p=>{const n={...p};n[cat.id]=[...(n[cat.id]||[]),{id,nm,dp:0}];return n})};setAddSubNm('');setAddSubCat(null)}}} placeholder="Ime nove postavke" autoFocus/>
                <button style={{...sB(true),height:26,fontSize:13,padding:"0 8px"}} type="button" onClick={()=>{const nm=addSubNm.trim();if(!nm)return;const id="custom_"+cat.id+"_"+Date.now();if(isCustomCatGroup){setCustomCatGroups(p=>p.map(c=>c.id===cat.id?{...c,subs:[...c.subs,{id,nm,dp:0}]}:c))}else{setCustomSubs(p=>{const n={...p};n[cat.id]=[...(n[cat.id]||[]),{id,nm,dp:0}];return n})};setAddSubNm('');setAddSubCat(null)}}>Dodaj</button>
                <button style={{...sB(false),height:26,fontSize:13,padding:"0 6px"}} type="button" onClick={()=>{setAddSubCat(null);setAddSubNm('')}}>×</button>
              </div>}
            </div>
          })}

          {/* Add new category group */}
          {addCatGrpForm&&addCatGrpForm.tp===type.tp?<div style={{display:"flex",gap:5,padding:"6px 8px",background:"#f0fdf4",borderRadius:4,alignItems:"center",marginTop:4}}>
            <input style={{...sI,flex:1,height:26,fontSize:13}} value={addCatGrpForm.nm} onChange={e=>setAddCatGrpForm(p=>({...p,nm:e.target.value}))} placeholder="Ime nove kategorije" autoFocus/>
            <button style={{...sB(true),height:26,fontSize:13,padding:"0 8px",background:C.gn}} type="button" onClick={()=>{const nm=addCatGrpForm.nm.trim();if(!nm)return;const id="cgrp_"+Date.now();setCustomCatGroups(p=>[...p,{id,nm,tp:type.tp,subs:[]}]);setAddCatGrpForm(null)}}>Ustvari skupino</button>
            <button style={{...sB(false),height:26,fontSize:13,padding:"0 6px"}} type="button" onClick={()=>setAddCatGrpForm(null)}>×</button>
          </div>:<button style={{...sB(false),height:22,fontSize:12,padding:"0 8px",marginTop:4}} type="button" onClick={()=>setAddCatGrpForm({nm:"",tp:type.tp})}>+ Nova kategorija pod {type.label}</button>}
        </div>)}

        <div style={{marginTop:4,padding:"6px 10px",background:"#eef2ff",borderRadius:6,fontSize:12,color:"#4338ca",display:"flex",alignItems:"center",gap:6}}>
          💡 <span><strong>↑↓</strong> = preurejanje &nbsp;|&nbsp; <strong>⚡%</strong> = opozorilo pri % plana &nbsp;|&nbsp; <strong>👁</strong> = skrij/pokaži &nbsp;|&nbsp; <strong>✎</strong> = preimenuj &nbsp;|&nbsp; <strong>🗑</strong> = izbriši/skrij trajno</span>
        </div>
      </div>}

      {/* Scratch experiment */}
      <div style={{...sC,background:"#fefce8",border:"1px solid #fde68a"}}>
        <div style={{fontSize:15,fontWeight:600,color:"#92400e",marginBottom:6}}>🧪 Eksperimentalni izračun (ne vpliva na sync)</div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:16,color:C.mt}}>Hipotetičen proračun:</span>
          <input type="number" style={{...sI,width:120,height:32}} value={scratchBudget||""} onChange={e=>setScratchBudget(parseInt(e.target.value)||0)} placeholder="npr. 4000"/>
          <span>€</span>
          {scratchBudget>0&&<button style={{...sB(false),fontSize:14,height:28}} onClick={()=>{updProf('budget',scratchBudget);setScratchBudget(0)}}>Uporabi kot aktivni →</button>}
        </div>
        {scratchBudget>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,fontSize:14,marginTop:6}}><div><div style={{color:C.mt}}>Fiksni</div><div style={{fontWeight:700,color:C.bl}}>{fmt(sFxSum)} ({scratchBudget>0?pc(sFxSum,scratchBudget):0}%)</div></div><div><div style={{color:C.mt}}>Variabilni</div><div style={{fontWeight:700,color:C.bl}}>{fmt(sVrSum)} ({scratchBudget>0?pc(sVrSum,scratchBudget):0}%)</div></div><div><div style={{color:C.mt}}>Nepredvideni</div><div style={{fontWeight:700,color:C.or}}>{fmt(sNep)} ({scratchBudget>0?pc(sNep,scratchBudget):0}%)</div></div><div><div style={{color:C.mt}}>Skupaj</div><div style={{fontWeight:700,color:sTotal<=scratchBudget?C.gn:C.rd}}>{fmt(sTotal)} ({scratchBudget>0?pc(sTotal,scratchBudget):0}%)</div></div></div>}
      </div>

      {/* Scenario builder #14 */}
      <div style={{...sC,background:"#fdf4ff",border:"1px solid #e9d5ff"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:showScenario?10:0}}>
          <div style={{fontSize:15,fontWeight:600,color:"#7e22ce"}}>📊 Scenarij — kaj če?</div>
          <button onClick={()=>setShowScenario(v=>!v)} style={{fontSize:12,padding:"2px 8px",borderRadius:4,border:"1px solid #e9d5ff",background:showScenario?"#ede9fe":"#fdf4ff",color:"#7e22ce",cursor:"pointer"}}>{showScenario?"Zapri ▲":"Odpri ▼"}</button>
        </div>
        {showScenario&&<>
          <div style={{fontSize:13,color:"#9333ea",marginBottom:10}}>Dodaj hipotetične spremembe in poglej vpliv na proračun.</div>
          {scenarioItems.map((item,i)=><div key={item.id} style={{display:"flex",gap:6,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
            <select style={{...sS,height:28,fontSize:13,width:110}} value={item.type} onChange={e=>setScenarioItems(p=>p.map((x,j)=>j===i?{...x,type:e.target.value}:x))}>
              <option value="income">+ Prihodek</option>
              <option value="expense">- Strošek</option>
              <option value="saving">→ Varčevanje</option>
            </select>
            <input style={{...sI,flex:1,minWidth:100,height:28,fontSize:13}} value={item.label} onChange={e=>setScenarioItems(p=>p.map((x,j)=>j===i?{...x,label:e.target.value}:x))} placeholder="Opis (npr. nova plača)"/>
            <input type="number" style={{...sI,width:80,height:28,fontSize:13,textAlign:"right"}} value={item.amount||""} onChange={e=>setScenarioItems(p=>p.map((x,j)=>j===i?{...x,amount:parseFloat(e.target.value)||0}:x))} placeholder="€"/>
            <span style={{fontSize:13,color:C.mt}}>€</span>
            <button onClick={()=>setScenarioItems(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:16}}>✕</button>
          </div>)}
          <button style={{...sB(false),fontSize:13,height:28,marginBottom:10}} onClick={()=>setScenarioItems(p=>[...p,{id:Date.now(),type:"expense",label:"",amount:0}])}>+ Dodaj postavko</button>
          {scenarioItems.length>0&&(()=>{
            const scInc=scenarioItems.filter(x=>x.type==="income").reduce((s,x)=>s+x.amount,0);
            const scExp=scenarioItems.filter(x=>x.type==="expense").reduce((s,x)=>s+x.amount,0);
            const scSav=scenarioItems.filter(x=>x.type==="saving").reduce((s,x)=>s+x.amount,0);
            const newBudget=AP.budget+scInc-scExp-scSav;
            const newPlan=totalPlan+scExp+scSav;
            return<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,fontSize:14,padding:"8px",background:"#ede9fe",borderRadius:6}}>
              <div><div style={{color:C.mt,fontSize:12}}>Prihodki +</div><div style={{fontWeight:700,color:C.gn}}>{fmt(scInc)}</div></div>
              <div><div style={{color:C.mt,fontSize:12}}>Stroški +</div><div style={{fontWeight:700,color:C.rd}}>{fmt(scExp)}</div></div>
              <div><div style={{color:C.mt,fontSize:12}}>Varčevanje +</div><div style={{fontWeight:700,color:C.bl}}>{fmt(scSav)}</div></div>
              <div><div style={{color:C.mt,fontSize:12}}>Nov prosti denar</div><div style={{fontWeight:700,color:newBudget-newPlan>=0?C.gn:C.rd}}>{fmt(newBudget-newPlan)}</div></div>
            </div>;
          })()}
        </>}
      </div>

      <div style={{...sC,background:"#f0fdf4",border:"1px solid #bbf7d0"}}>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:18,fontWeight:600,color:"#166534"}}>✓ Aktivni proračun:</span>
          <input type="number" style={{...sI,width:120,height:34,fontSize:18,fontWeight:700}} value={AP.budget} onChange={e=>updProf('budget',parseInt(e.target.value)||0)}/><span style={{fontSize:16,fontWeight:600}}>€</span>
          <button onClick={()=>syncPctToPlan()} style={{...sB(true),background:C.gn,fontSize:17}}>Sinhroniziraj → mesečni vnos</button>
          <span style={{marginLeft:"auto",fontSize:15,color:C.mt}}>Plan skupaj: <strong style={{color:totalPlan<=AP.budget?C.gn:C.rd}}>{fmt(totalPlan)}</strong> ({totalPct}%)</span>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:10,alignItems:"start"}}>
        {[{tp:"fixed",nm:"Fiksni stroški",sum:fxSum},{tp:"var",nm:"Variabilni stroški",sum:vrSum}].map(type=><div key={type.tp} style={{...sC,overflowX:"auto",padding:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6,paddingBottom:6,borderBottom:`2px solid ${C.bd}`}}>
            <span style={{fontSize:18,fontWeight:800,color:C.tx}}>{type.nm}</span>
            <span style={{...compactMoney(C.bl),fontSize:17}}>{fmt(type.sum)} <span style={{fontSize:13,color:C.mt,fontWeight:500}}>({AP.budget>0?pc(type.sum,AP.budget):0}% proračuna)</span></span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"minmax(210px,1fr) 54px 78px 28px 92px 28px 110px",gap:8,fontSize:15,color:C.mt,fontWeight:700,padding:"0 0 6px",borderBottom:"1px solid #eee",alignItems:"center",minWidth:650}}>
            <span>Postavka</span><span>Način</span><span>%</span><span></span><span>€</span><span></span><span style={{textAlign:"right"}}>Cilj</span>
          </div>
          {effectiveCats.filter(c=>c.tp===type.tp).map(cat=><div key={cat.id}><div style={{fontSize:15,fontWeight:600,color:C.tx,padding:"4px 0 2px",marginTop:3}}>{cat.nm}</div>{cat.subs.filter(sub=>subVis[sub.id]!==true).map(sub=>{const mode=AP.pMd[sub.id]||"fixed";const pV=AP.bPct[sub.id]||0;const fV=AP.pFx[sub.id]||0;const base=AP.budget;const target=mode==="pct"?Math.round(base*pV/100):fV;const pctOfBudget=base>0?pc(target,base):0;const euroFromPct=Math.round(base*pV/100);
          return<div key={sub.id} style={{display:"grid",gridTemplateColumns:"minmax(210px,1fr) 54px 78px 28px 92px 28px 110px",gap:8,padding:"5px 0",borderBottom:`1px solid ${C.fn}`,fontSize:15,alignItems:"center",paddingLeft:10,minWidth:650}}>
            <span style={{fontSize:15,color:"#555",lineHeight:1.25}}>{sub.nm}</span>
            <select style={{...sS,width:50,height:30,fontSize:14}} value={mode} onChange={e=>updProf('pMd',{...AP.pMd,[sub.id]:e.target.value})}><option value="pct">%</option><option value="fixed">€</option></select>
            <input type="number" min={0} max={100} value={mode==="pct"?pV:pctOfBudget} onChange={e=>{if(mode==="pct")updProf('bPct',{...AP.bPct,[sub.id]:parseInt(e.target.value)||0});else{const newPct=parseInt(e.target.value)||0;updProf('pFx',{...AP.pFx,[sub.id]:Math.round(base*newPct/100)})}}} style={{...sI,width:72,height:30,fontSize:15,textAlign:"right",fontWeight:700}}/>
            <span style={{fontSize:13,color:C.mt}}>%</span>
            <input type="number" value={mode==="pct"?euroFromPct:fV} onChange={e=>{if(mode==="fixed")updProf('pFx',{...AP.pFx,[sub.id]:parseInt(e.target.value)||0});else{const euro=parseInt(e.target.value)||0;updProf('bPct',{...AP.bPct,[sub.id]:base>0?Math.round(euro/base*100):0})}}} style={{...sI,width:88,height:30,fontSize:15,textAlign:"right",fontWeight:700}}/>
            <span style={{fontSize:13,color:C.mt}}>€</span>
            <span style={{...compactMoney(C.tx),textAlign:"right",fontSize:16}}>{fmt(target)}</span>
          </div>})}</div>)}
        </div>)}
      </div>

      {/* Nepredvideni stroški - planiran delež */}
      <div style={sC}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6,paddingBottom:6,borderBottom:`2px solid ${C.bd}`}}>
          <span style={{fontSize:16,fontWeight:700,color:C.tx}}>Nepredvideni stroški (planiran delež)</span>
          <span style={{fontSize:15,fontWeight:700,color:C.or}}>{fmt(nepTarget)} <span style={{fontSize:13,color:C.mt,fontWeight:500}}>({AP.budget>0?pc(nepTarget,AP.budget):0}% proračuna)</span></span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:8}}>
          <span style={{fontSize:14,color:C.mt}}>Način:</span>
          <select style={{...sS,width:60,height:28,fontSize:14}} value={AP.nepMd} onChange={e=>updProf('nepMd',e.target.value)}><option value="pct">%</option><option value="fixed">€</option></select>
          <input type="number" min={0} value={AP.nepMd==="pct"?AP.nepPct:AP.nepFx} onChange={e=>{const v=parseInt(e.target.value)||0;if(AP.nepMd==="pct")updProf('nepPct',v);else updProf('nepFx',v)}} style={{...sI,width:70,height:28,fontSize:14,textAlign:"right",fontWeight:600}}/>
          <span style={{fontSize:14,color:C.mt}}>{AP.nepMd==="pct"?"%":"€"}</span>
          <span style={{marginLeft:8,fontSize:14,color:C.mt}}>= rezerva za nepredvidene mesečne dogodke</span>
        </div>
        <div style={{fontSize:15,fontWeight:600,color:C.tx,padding:"4px 0 2px",marginTop:4}}>Mesečne nepredvidene postavke (dejanske)</div>
        <AddUX onAdd={(d,a,p)=>{setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[yr])n[yr]=initY();if(!n[yr][mo])n[yr][mo]=initM();n[yr][mo].unexpectedItems.push({desc:d,amount:parseFloat(a)||0,person:p});return n})}} kuList={kuList} setKuList={setKuList}/>
        {(md.unexpectedItems||[]).map((it,i)=><div key={i} style={{display:"flex",gap:6,padding:"6px 0",borderBottom:`1px solid ${C.fn}`,fontSize:15,alignItems:"center",paddingLeft:16}}><span style={{flex:1,color:"#666"}}>{it.desc} <span style={{color:"#999"}}>/{it.person}</span></span><span style={{fontWeight:600}}>{fmt(it.amount)}</span><button type="button" onClick={()=>setData(prev=>{const n=JSON.parse(JSON.stringify(prev));if(n[yr]&&n[yr][mo])n[yr][mo].unexpectedItems=n[yr][mo].unexpectedItems.filter((_,j)=>j!==i);return n})} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:14}}>✕</button></div>)}
        <div style={{marginTop:8,fontSize:14,color:C.mt}}>Dejansko v {MF[mo]}: <strong style={{color:(md.unexpectedItems||[]).reduce((s,it)=>s+it.amount,0)<=nepTarget?C.gn:C.rd}}>{fmt((md.unexpectedItems||[]).reduce((s,it)=>s+it.amount,0))}</strong> / plan {fmt(nepTarget)}</div>
      </div>

      {/* Total summary */}
      <div style={{...sC,background:"#f9fafb"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,fontSize:15}}>
          <div><div style={{color:C.mt,fontSize:13}}>Fiksni</div><div style={{fontWeight:700,color:C.bl}}>{fmt(fxSum)} <span style={{fontSize:12,color:C.mt}}>({AP.budget>0?pc(fxSum,AP.budget):0}%)</span></div></div>
          <div><div style={{color:C.mt,fontSize:13}}>Variabilni</div><div style={{fontWeight:700,color:C.bl}}>{fmt(vrSum)} <span style={{fontSize:12,color:C.mt}}>({AP.budget>0?pc(vrSum,AP.budget):0}%)</span></div></div>
          <div><div style={{color:C.mt,fontSize:13}}>Nepredvideni</div><div style={{fontWeight:700,color:C.or}}>{fmt(nepTarget)} <span style={{fontSize:12,color:C.mt}}>({AP.budget>0?pc(nepTarget,AP.budget):0}%)</span></div></div>
          <div><div style={{color:C.mt,fontSize:13}}>Skupaj plan</div><div style={{fontSize:18,fontWeight:800,color:totalPlan<=AP.budget?C.gn:C.rd}}>{fmt(totalPlan)} <span style={{fontSize:13,color:C.mt,fontWeight:500}}>({totalPct}% od {fmt(AP.budget)})</span></div></div>
        </div>
      </div>
    </div>;})()}

    {/* ===== WISHLIST ===== */}
    {vw==="wishes"&&<div>
      <h2 style={{fontSize:24,fontWeight:700,margin:"0 0 12px"}}>Wishlist</h2>
      <div style={sC}>
        <div style={{fontSize:16,fontWeight:600,color:C.sb,marginBottom:8}}>Dodaj novo željo</div>
        <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"auto 1fr 1fr 1fr 1fr auto",gap:6,marginBottom:8,alignItems:"flex-end"}}>
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
            <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
              <button style={{fontSize:13,padding:"3px 10px",borderRadius:12,border:"1px solid #d1fae5",background:"#ecfdf5",color:"#059669",cursor:"pointer",fontWeight:600}} onClick={()=>setWishes(prev=>prev.map((x,j)=>j===i?{...x,votes:{...(x.votes||{up:0,down:0}),up:(x.votes?.up||0)+1}}:x))}>👍 {w.votes?.up||0}</button>
              <button style={{fontSize:13,padding:"3px 10px",borderRadius:12,border:"1px solid #fee2e2",background:"#fef2f2",color:C.rd,cursor:"pointer",fontWeight:600}} onClick={()=>setWishes(prev=>prev.map((x,j)=>j===i?{...x,votes:{...(x.votes||{up:0,down:0}),down:(x.votes?.down||0)+1}}:x))}>👎 {w.votes?.down||0}</button>
            </div>
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

        {/* NET WORTH SUMMARY */}
        {(()=>{
          const savT=savData.members.reduce((s,m)=>s+m.sources.reduce((ss,src)=>ss+(src.amount||0),0),0);
          const assT=nwAssets.reduce((s,a)=>s+(a.value||0),0);
          const liabT=nwLiabs.reduce((s,l)=>s+(l.value||0),0);
          const totalAss=savT+cryptoVal+assT;
          const nw=totalAss-liabT;
          const histMin=nwHist.length>1?Math.min(...nwHist.map(h=>h.nw)):0;
          const histMax=nwHist.length>1?Math.max(...nwHist.map(h=>h.nw)):nw;
          const nwDelta=nwHist.length>1?nw-nwHist[0].nw:0;
          return<>
            <div style={{...sC,background:nw>=0?"linear-gradient(135deg,#2fa172 0%,#0e7a52 100%)":"linear-gradient(135deg,#e0786a,#c0453a)",border:"none",color:"#fff",padding:18,boxShadow:SHL,animation:"dpFadeUp .4s ease"}}>
              <div style={{fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:0.7,opacity:0.92}}>Neto vrednost družine</div>
              <div style={{fontSize:isMob?38:50,fontWeight:900,margin:"2px 0 6px",lineHeight:1.05}}>{fmt(nw)}</div>
              {nwHist.length>1&&<div style={{fontSize:14,fontWeight:700,opacity:0.95,marginBottom:8}}>{nwDelta>=0?"▲ +":"▼ "}{fmt(nwDelta)} od prvega merenja</div>}
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <span style={{background:"rgba(255,255,255,0.22)",borderRadius:10,padding:"5px 11px",fontSize:13,fontWeight:700}}>Premoženje {fmt(totalAss)}</span>
                <span style={{background:"rgba(255,255,255,0.22)",borderRadius:10,padding:"5px 11px",fontSize:13,fontWeight:700}}>Obveznosti {fmt(liabT)}</span>
              </div>
            </div>
            {(()=>{const invTotal=invAccounts.reduce((s,a)=>s+(a.value||0),0);const debtTotal=debts.reduce((s,d)=>s+(d.balance||0),0);const subMonthly=subscriptions.reduce((s,sub)=>s+(sub.period==='annual'?sub.amount/12:sub.amount),0);const rows=[["Prihranki",savT,C.gn],["Naložbeni računi",invTotal,C.pu],["Kripto",cryptoVal,C.bl],["Druga sredstva",assT,C.or],["Obveznosti",liabT+debtTotal,C.rd],["Naročnine / mesec",subMonthly,C.sb]];return<div style={{...sC,display:"grid",gridTemplateColumns:isMob?"1fr":"repeat(3,1fr)",gap:8}}>
              {rows.map(([label,value,color])=><div key={label} style={{padding:"9px 11px",border:`1px solid ${C.bd}`,borderRadius:12,background:"#fffdfb"}}>
                <div style={{fontSize:12,color:C.mt,fontWeight:900,textTransform:"uppercase"}}>{label}</div>
                <div style={{fontSize:22,fontWeight:900,color}}>{fmt(value)}</div>
              </div>)}
              <div style={{gridColumn:isMob?"auto":"1/-1",fontSize:13,color:C.sb,lineHeight:1.4}}>Ta blok združi obstoječe podatke v eno sliko: prihranki, naložbe, kripto, sredstva, dolgovi in mesečne naročnine. Ni novega izračuna v ozadju, samo isti podatki na enem mestu.</div>
            </div>;})()}
            {/* #48 Net worth milestones */}
            {(()=>{
              const ms=[...nwMilestones].sort((a,b)=>a-b);
              const achieved=ms.filter(m=>nw>=m);
              const next=ms.find(m=>nw<m);
              const prev=achieved.length?achieved[achieved.length-1]:0;
              const pct=next?Math.max(2,Math.min(100,Math.round((nw-prev)/(next-prev)*100))):100;
              return<div style={sC}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:15,fontWeight:800,color:C.tx}}>🏆 Mejniki neto vrednosti</span>
                  {next&&<span style={{fontSize:13,fontWeight:700,color:C.gn}}>še {fmt(next-nw)}</span>}
                </div>
                {next?<>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.mt,fontWeight:700,marginBottom:3}}><span>{fmt(prev)}</span><span style={{color:C.bl}}>Naslednji: {fmt(next)}</span></div>
                  <div style={{height:12,borderRadius:7,background:C.fn,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:GR,borderRadius:7,transition:"width .5s ease"}}/></div>
                </>:<div style={{fontSize:14,color:C.gn,fontWeight:700,padding:"4px 0"}}>Vsi mejniki doseženi — čestitke! 🎉</div>}
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
                  {ms.map(m=>{const done=nw>=m;return<span key={m} style={{display:"flex",alignItems:"center",gap:3,padding:"3px 9px",borderRadius:20,fontSize:12,fontWeight:700,background:done?"#d9f3e6":C.fn,color:done?"#0e7a52":C.mt,border:`1px solid ${done?"#a5e0c5":C.bd}`}}>{done?"✓":"○"} {fmt(m)}<span onClick={()=>setNwMilestones(p=>p.filter(x=>x!==m))} style={{cursor:"pointer",marginLeft:2,opacity:0.55}}>✕</span></span>;})}
                  <button onClick={()=>{const v=prompt('Nov mejnik (€):','');const n=parseFloat(v);if(n>0)setNwMilestones(p=>[...new Set([...p,Math.round(n)])])}} style={{...sB(false),height:28,fontSize:12,padding:"0 10px"}}>+ Mejnik</button>
                </div>
              </div>;
            })()}
            {/* Asset/liability breakdown */}
            <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:8,marginBottom:10}}>
              <div style={sC}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <span style={{fontSize:15,fontWeight:700,color:C.gn}}>Premoženje</span>
                  <button onClick={()=>setShowNWEdit(v=>!v)} style={{fontSize:13,fontWeight:600,padding:"3px 10px",borderRadius:9,border:`1px solid ${C.bd}`,background:showNWEdit?"#fbe8db":C.fn,color:C.sb,cursor:"pointer",fontFamily:FF}}>{showNWEdit?"Zapri":"⚙ Uredi"}</button>
                </div>
                <div style={{fontSize:14,padding:"4px 0",display:"flex",justifyContent:"space-between",borderBottom:`1px solid ${C.fn}`}}><span style={{color:"#555"}}>Prihranki</span><strong>{fmt(savT)}</strong></div>
                {cryptoVal>0&&<div style={{fontSize:14,padding:"4px 0",display:"flex",justifyContent:"space-between",borderBottom:`1px solid ${C.fn}`}}><span style={{color:"#555"}}>Kripto</span><strong>{fmt(cryptoVal)}</strong></div>}
                {nwAssets.map((a,i)=><div key={i} style={{fontSize:14,padding:"4px 0",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${C.fn}`}}>
                  {showNWEdit?<><input style={{...sI,flex:1,height:24,fontSize:13}} defaultValue={a.name} onBlur={e=>setNwAssets(p=>p.map((x,j)=>j===i?{...x,name:e.target.value}:x))} placeholder="Naziv"/><input type="number" style={{...sI,width:80,height:24,fontSize:13,textAlign:"right"}} defaultValue={a.value} onBlur={e=>setNwAssets(p=>p.map((x,j)=>j===i?{...x,value:parseFloat(e.target.value)||0}:x))} placeholder="€"/><button onClick={()=>setNwAssets(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:15}}>✕</button></>
                  :<><span style={{color:"#555"}}>{a.name||"—"}</span><strong>{fmt(a.value)}</strong></>}
                </div>)}
                {showNWEdit&&<button style={{...sB(false),fontSize:13,marginTop:4,height:26}} onClick={()=>setNwAssets(p=>[...p,{id:Date.now(),name:"",value:0}])}>+ Dodaj sredstvo</button>}
                <div style={{borderTop:`2px solid ${C.gn}`,marginTop:4,paddingTop:4,display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:15}}><span>Skupaj</span><span style={{color:C.gn}}>{fmt(totalAss)}</span></div>
              </div>
              <div style={sC}>
                <div style={{fontSize:15,fontWeight:700,color:C.rd,marginBottom:6}}>Obveznosti</div>
                {nwLiabs.map((l,i)=><div key={i} style={{fontSize:14,padding:"4px 0",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${C.fn}`}}>
                  {showNWEdit?<><input style={{...sI,flex:1,height:24,fontSize:13}} defaultValue={l.name} onBlur={e=>setNwLiabs(p=>p.map((x,j)=>j===i?{...x,name:e.target.value}:x))} placeholder="Naziv"/><input type="number" style={{...sI,width:80,height:24,fontSize:13,textAlign:"right"}} defaultValue={l.value} onBlur={e=>setNwLiabs(p=>p.map((x,j)=>j===i?{...x,value:parseFloat(e.target.value)||0}:x))} placeholder="€"/><button onClick={()=>setNwLiabs(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:15}}>✕</button></>
                  :<><span style={{color:"#555"}}>{l.name||"—"}</span><strong>{fmt(l.value)}</strong></>}
                </div>)}
                {nwLiabs.length===0&&!showNWEdit&&<div style={{fontSize:14,color:C.mt,padding:"8px 0"}}>Ni obveznosti.</div>}
                {showNWEdit&&<button style={{...sB(false),fontSize:13,marginTop:4,height:26}} onClick={()=>setNwLiabs(p=>[...p,{id:Date.now(),name:"",value:0}])}>+ Dodaj obveznost</button>}
                <div style={{borderTop:`2px solid ${C.rd}`,marginTop:4,paddingTop:4,display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:15}}><span>Skupaj</span><span style={{color:C.rd}}>{fmt(liabT)}</span></div>
              </div>
            </div>
            {/* History chart */}
            {nwHist.length>1&&<div style={sC}>
              <div style={{fontSize:15,fontWeight:600,color:C.sb,marginBottom:6}}>Trend neto vrednosti</div>
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={nwHist} margin={{top:4,right:4,left:0,bottom:0}}>
                  <XAxis dataKey="date" tick={{fontSize:11}} tickFormatter={d=>d.slice(5)} axisLine={false} tickLine={false}/>
                  <YAxis hide domain={[Math.min(histMin*0.95,histMin-1000), Math.max(histMax*1.05,histMax+1000)]}/>
                  <Tooltip formatter={v=>fmt(v)} labelFormatter={d=>d} contentStyle={{fontSize:13}}/>
                  <Area type="monotone" dataKey="nw" stroke={C.bl} fill="#f7e3d8" strokeWidth={2.5} dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>}
          </>;
        })()}

        {/* #31 Debt payoff calculator */}
        {(()=>{
          const totalMin=debts.reduce((s,d)=>s+(d.minPayment||0),0);
          const calcOrder=(method)=>{
            if(!debts.length)return[];
            const ds=debts.map(d=>({...d,bal:d.balance||0,interestPaid:0}));
            let months=0;const results=ds.map(d=>({id:d.id,name:d.name,paidMonth:null}));
            while(ds.some(d=>d.bal>0.01)&&months<480){
              months++;
              ds.forEach(d=>{if(d.bal>0.01)d.bal+=d.bal*(d.rate||0)/100/12});
              let extra=totalMin;
              ds.forEach(d=>{if(d.bal>0.01){const pay=Math.min(d.minPayment||0,d.bal);d.bal-=pay;extra-=pay}});
              const active=ds.filter(d=>d.bal>0.01);
              if(method==='snowball')active.sort((a,b)=>a.bal-b.bal);else active.sort((a,b)=>(b.rate||0)-(a.rate||0));
              if(active.length&&extra>0){const pay=Math.min(extra,active[0].bal);active[0].bal-=pay}
              ds.forEach((d,i)=>{if(d.bal<0.01&&!results[i].paidMonth)results[i].paidMonth=months});
            }
            const totInt=ds.reduce((s,d,i)=>s+(d.bal>0.01?d.bal:0)+(debts[i].balance||0)*(debts[i].rate||0)/100/12*months*0.1,0);
            return results.map((r,i)=>({...r,balance:debts[i].balance,months:r.paidMonth||months}));
          };
          const order=calcOrder(debtMethod);
          const totalDebt=debts.reduce((s,d)=>s+(d.balance||0),0);
          const paidOffByM=order.reduce((m,r)=>Math.max(m,r.months||0),0);
          return<div style={sC}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:16,fontWeight:700,color:C.tx}}>Odplačevanje dolgov</span>
              <div style={{display:"flex",gap:4}}>
                {['snowball','avalanche'].map(m=><button key={m} style={{...sB(debtMethod===m),height:24,fontSize:13,padding:"0 8px"}} onClick={()=>setDebtMethod(m)}>{m==='snowball'?'Snežna kepa':'Plaz'}</button>)}
              </div>
            </div>
            <div style={{fontSize:13,color:C.mt,marginBottom:8}}>{debtMethod==='snowball'?'Snežna kepa: najprej najmanjši dolg (motivacija)':'Plaz: najprej najvišja obrestna mera (manj obresti)'}</div>
            {debts.length===0&&<div style={{fontSize:14,color:C.mt,padding:"8px 0"}}>Ni vpisanih dolgov.</div>}
            {debts.map((d,i)=>{const res=order.find(r=>r.id===d.id);const mo=res?.months||0;const done=new Date();done.setMonth(done.getMonth()+mo);return<div key={d.id} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 0",borderBottom:`1px solid ${C.fn}`,fontSize:14}}>
              <div style={{flex:1}}><div style={{fontWeight:600}}>{d.name||"Dolg"}</div><div style={{fontSize:12,color:C.mt}}>{fmt(d.balance)} · {d.rate||0}% APR · min {fmt(d.minPayment)}/mes</div></div>
              <div style={{textAlign:"right"}}><div style={{fontWeight:700,color:C.rd}}>{mo} mes.</div><div style={{fontSize:11,color:C.mt}}>{done.toLocaleDateString('sl-SI',{year:'numeric',month:'short'})}</div></div>
              <button onClick={()=>setDebts(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#bbb",cursor:"pointer",fontSize:15}}>✕</button>
            </div>})}
            {debts.length>0&&paidOffByM>0&&<div style={{marginTop:6,padding:"6px 8px",background:"#f0fdf4",borderRadius:6,fontSize:13,color:"#15803d",fontWeight:600}}>Skupaj dolg {fmt(totalDebt)} · poplačano v {paidOffByM} mes. ({new Date(Date.now()+paidOffByM*30*24*60*60*1000).toLocaleDateString('sl-SI',{year:'numeric',month:'short'})})</div>}
            {!showAddDebt?<button style={{...sB(false),fontSize:13,height:26,marginTop:6}} onClick={()=>setShowAddDebt(true)}>+ Dodaj dolg</button>
            :<div style={{display:"grid",gridTemplateColumns:"1fr 70px 60px 70px auto",gap:4,marginTop:6}}>
              <input id="debt-nm" style={{...sI,height:26,fontSize:13}} placeholder="Kredit, kartica…"/>
              <input id="debt-bal" type="number" style={{...sI,height:26,fontSize:13}} placeholder="Stanje €"/>
              <input id="debt-rate" type="number" style={{...sI,height:26,fontSize:13}} placeholder="% APR"/>
              <input id="debt-min" type="number" style={{...sI,height:26,fontSize:13}} placeholder="Min €"/>
              <button style={{...sB(true),height:26,padding:"0 8px",fontSize:13}} onClick={()=>{const nm=document.getElementById('debt-nm').value.trim();const bal=parseFloat(document.getElementById('debt-bal').value)||0;if(!nm||!bal)return;setDebts(p=>[...p,{id:Date.now(),name:nm,balance:bal,rate:parseFloat(document.getElementById('debt-rate').value)||0,minPayment:parseFloat(document.getElementById('debt-min').value)||0}]);setShowAddDebt(false)}}>+</button>
            </div>}
          </div>;
        })()}

        {/* #37 Investment tracking */}
        {(()=>{const invTotal=invAccounts.reduce((s,a)=>s+(a.value||0),0);return<div style={sC}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:16,fontWeight:700,color:C.tx}}>Naložbeni računi</span><div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{fontSize:17,fontWeight:700,color:C.pu}}>{fmt(invTotal)}</span><button style={{...sB(false),fontSize:13,height:24,padding:"0 8px"}} onClick={()=>setShowAddInv(v=>!v)}>{showAddInv?"✕":"+ Dodaj"}</button></div></div>{invAccounts.length===0&&!showAddInv&&<div style={{fontSize:14,color:C.mt,padding:"4px 0"}}>Ni vpisanih naložb. Dodaj ETF, delnice, obveznice…</div>}{invAccounts.map((acc,i)=><div key={acc.id} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 0",borderBottom:`1px solid ${C.fn}`,fontSize:14}}><div style={{flex:1}}><div style={{fontWeight:600}}>{acc.name||"Naložba"}</div>{acc.note&&<div style={{fontSize:11,color:C.mt}}>{acc.note}</div>}</div><input type="number" style={{...sI,width:90,height:24,fontSize:13,textAlign:"right"}} defaultValue={acc.value||0} onBlur={e=>setInvAccounts(p=>p.map((x,j)=>j===i?{...x,value:parseFloat(e.target.value)||0}:x))} placeholder="€"/><button onClick={()=>setInvAccounts(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#bbb",cursor:"pointer",fontSize:15}}>✕</button></div>)}{showAddInv&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 30px",gap:4,marginTop:6}}><input id="inv-nm" style={{...sI,height:26,fontSize:13}} placeholder="ETF, delnice…"/><input id="inv-note" style={{...sI,height:26,fontSize:13}} placeholder="ISIN / ticker (neobvezno)"/><button style={{...sB(true),height:26,padding:"0 6px",fontSize:13}} onClick={()=>{const nm=document.getElementById('inv-nm')?.value.trim();if(!nm)return;setInvAccounts(p=>[...p,{id:Date.now(),name:nm,note:document.getElementById('inv-note')?.value.trim()||"",value:0}]);setShowAddInv(false)}}>+</button></div>}</div>;})()}

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

    {/* ===== ČASOVNICA ===== */}
    {vw==="timeline"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:10}}>
        <h2 style={{fontSize:24,fontWeight:700,margin:0}}>{tabNames.timeline||"Časovnica"}</h2>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {[["all","Vse"],["bill","Položnice"],["subscription","Naročnine"],["debt","Dolgovi"],["goal","Cilji"],["simulation","Simulacija"]].map(([k,l])=><button key={k} onClick={()=>setTimelineFilter(k)} style={{...sB(timelineFilter===k),height:34,fontSize:14,padding:"0 12px"}}>{l}</button>)}
        </div>
      </div>
      <div style={{...sC,background:GRW,border:`1px solid #f2d9c6`}}>
        <div style={{fontSize:15,fontWeight:800,color:C.tx,marginBottom:4}}>Finančna časovnica</div>
        <div style={{fontSize:13,color:C.sb}}>Enoten vrstni red prihodnjih obveznosti in mejnikov iz obstoječih podatkov: položnice, naročnine, dolgovi, cilji in simulacija.</div>
      </div>
      <div style={{display:"grid",gap:8}}>
        {timelineEvents.filter(e=>timelineFilter==='all'||e.type===timelineFilter).length===0?<div style={sC}>Ni dogodkov za izbran filter. Dodaj dneve položnic, naročnine, cilje ali dogodke v simulaciji.</div>:
        timelineEvents.filter(e=>timelineFilter==='all'||e.type===timelineFilter).map((e,i)=>{
          const color=e.type==='bill'?C.or:e.type==='subscription'?C.pu:e.type==='debt'?C.rd:e.type==='goal'?C.gn:e.type==='simulation'?C.bl:C.sb;
          return<div key={`${e.type}-${e.date}-${i}`} style={{...sC,display:"grid",gridTemplateColumns:isMob?"1fr":"110px 1fr 120px",gap:10,alignItems:"center",marginBottom:0,borderLeft:`4px solid ${color}`}}>
            <div style={{fontSize:14,fontWeight:900,color}}>{new Date(e.date).toLocaleDateString("sl-SI")}</div>
            <div>
              <div style={{fontSize:17,fontWeight:900,color:C.tx}}>{e.title}</div>
              <div style={{fontSize:13,color:C.mt}}>{e.source}{e.detail?` · ${e.detail}`:''}</div>
            </div>
            <div style={{...compactMoney(color),fontSize:18,textAlign:isMob?"left":"right"}}>{e.amount?fmt(e.amount):"—"}</div>
          </div>;
        })}
      </div>
    </div>}

    {/* ===== ANALITIKA ===== */}
    {vw==="analytics"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:10}}>
        <h2 style={{fontSize:24,fontWeight:700,margin:0}}>{tabNames.analytics||"Analitika"}</h2>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <button style={{...sB(true),height:34,fontSize:14}} onClick={()=>{const name=prompt("Ime poročila:",`Poročilo ${savedReports.length+1}`);if(name)setSavedReports(r=>[...r,{id:Date.now(),name,filter:reportFilter}])}}>Shrani poročilo</button>
          <button style={{...sB(false),height:34,fontSize:14}} onClick={exportReportCsv}>CSV izvoz</button>
        </div>
      </div>
      <div style={{...sC,background:GRW,border:`1px solid #f2d9c6`}}>
        <div style={{fontSize:15,fontWeight:900,color:C.tx,marginBottom:6}}>Filtri poročila</div>
        <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"repeat(4,1fr)",gap:8}}>
          <label style={{fontSize:12,color:C.mt,fontWeight:800}}>Od<input type="month" value={reportFilter.from} onChange={e=>setReportFilter(f=>({...f,from:e.target.value}))} style={{...sI,width:"100%",height:34,fontSize:14,marginTop:3}}/></label>
          <label style={{fontSize:12,color:C.mt,fontWeight:800}}>Do<input type="month" value={reportFilter.to} onChange={e=>setReportFilter(f=>({...f,to:e.target.value}))} style={{...sI,width:"100%",height:34,fontSize:14,marginTop:3}}/></label>
          <label style={{fontSize:12,color:C.mt,fontWeight:800}}>Oseba<select value={reportFilter.person} onChange={e=>setReportFilter(f=>({...f,person:e.target.value}))} style={{...sS,width:"100%",height:34,fontSize:14,marginTop:3}}><option value="all">Vse</option><option>Tadej</option><option>Kristina</option><option>Skupaj</option></select></label>
          <label style={{fontSize:12,color:C.mt,fontWeight:800}}>Kategorija<select value={reportFilter.cat} onChange={e=>setReportFilter(f=>({...f,cat:e.target.value}))} style={{...sS,width:"100%",height:34,fontSize:14,marginTop:3}}><option value="all">Vse</option>{effectiveCats.map(c=><option key={c.id} value={c.id}>{c.nm}</option>)}</select></label>
          <label style={{fontSize:12,color:C.mt,fontWeight:800}}>Oznaka<select value={reportFilter.tag} onChange={e=>setReportFilter(f=>({...f,tag:e.target.value}))} style={{...sS,width:"100%",height:34,fontSize:14,marginTop:3}}><option value="all">Vse</option>{BEHAVIOR_TAGS.map(([tag,label])=><option key={tag} value={tag}>{label}</option>)}</select></label>
          <label style={{fontSize:12,color:C.mt,fontWeight:800}}>Min €<input type="number" value={reportFilter.min} onChange={e=>setReportFilter(f=>({...f,min:e.target.value}))} style={{...sI,width:"100%",height:34,fontSize:14,marginTop:3}}/></label>
          <label style={{fontSize:12,color:C.mt,fontWeight:800}}>Max €<input type="number" value={reportFilter.max} onChange={e=>setReportFilter(f=>({...f,max:e.target.value}))} style={{...sI,width:"100%",height:34,fontSize:14,marginTop:3}}/></label>
          <div style={{display:"flex",alignItems:"end"}}><button style={{...sB(false),height:34,fontSize:14,width:"100%"}} onClick={()=>setReportFilter({from:`${yr}-01`,to:`${yr}-12`,person:'all',cat:'all',tag:'all',min:'',max:''})}>Ponastavi</button></div>
        </div>
      </div>
      {savedReports.length>0&&<div style={sC}>
        <div style={{fontSize:15,fontWeight:900,color:C.tx,marginBottom:8}}>Shranjena poročila</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{savedReports.map(r=><span key={r.id} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 9px",borderRadius:999,border:`1px solid ${C.bd}`,background:C.fn,fontSize:13,fontWeight:800}}><button style={{background:"none",border:"none",cursor:"pointer",fontWeight:900,color:C.bl}} onClick={()=>setReportFilter(r.filter)}>{r.name}</button><button style={{background:"none",border:"none",cursor:"pointer",color:C.rd}} onClick={()=>setSavedReports(x=>x.filter(y=>y.id!==r.id))}>×</button></span>)}</div>
      </div>}
      {(()=>{const byCat={};filteredReportRows.forEach(r=>{byCat[r.catName]=(byCat[r.catName]||0)+r.amount});const top=Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,8);const total=filteredReportRows.reduce((s,r)=>s+r.amount,0);return<div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:10}}>
        <div style={sC}><div style={{fontSize:15,fontWeight:900,color:C.tx,marginBottom:8}}>Povzetek</div><div style={{fontSize:32,fontWeight:900,color:C.bl}}>{fmt(total)}</div><div style={{fontSize:13,color:C.mt,marginBottom:10}}>{filteredReportRows.length} transakcij v izbranem filtru</div>{top.map(([name,val])=><div key={name} style={{display:"grid",gridTemplateColumns:"1fr 90px",gap:8,padding:"5px 0",borderBottom:`1px solid ${C.fn}`,fontSize:14}}><span>{name}</span><strong style={{textAlign:"right",color:C.tx}}>{fmt(val)}</strong></div>)}</div>
        <div style={sC}><div style={{fontSize:15,fontWeight:900,color:C.tx,marginBottom:8}}>Tabela</div><div style={{maxHeight:360,overflow:"auto"}}>{filteredReportRows.slice(0,160).map((r,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"74px 1fr 82px",gap:8,padding:"5px 0",borderBottom:`1px solid ${C.fn}`,fontSize:13,alignItems:"center"}}><span style={{color:C.mt}}>{r.date}</span><span><strong>{r.subName}</strong><br/><span style={{color:C.mt}}>{r.person} {r.tags.join(' ')}</span></span><strong style={{textAlign:"right",color:C.tx}}>{fmt(r.amount)}</strong></div>)}</div></div>
      </div>})()}
    </div>}

    {/* ===== NASTAVITVE ===== */}
    {vw==="settings"&&(()=>{
      const SecHdr=({k,icon,title,sub})=><div onClick={()=>togSec(k)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:settingsOpen[k]?"#f0f7ff":"#f8f9fa",border:`1px solid ${settingsOpen[k]?"#bfdbfe":C.fn}`,borderRadius:settingsOpen[k]?"6px 6px 0 0":6,cursor:"pointer",marginTop:8,userSelect:"none"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:17,fontWeight:600}}>{icon} {title}</span>{sub&&<span style={{fontSize:13,color:C.mt}}>{sub}</span>}</div>
        <span style={{fontSize:14,color:C.mt}}>{settingsOpen[k]?"▲":"▼"}</span>
      </div>;
      const SecBody=({k,children})=>settingsOpen[k]?<div style={{border:`1px solid #bfdbfe`,borderTop:"none",borderRadius:"0 0 6px 6px",padding:"12px 14px",background:"#fff",marginBottom:4}}>{children}</div>:null;
      const allTabs=[["dash","Pregled"],["pct","Plan"],["entry","Mesečni vnos"],["annual","Letni pregled"],["goals","Cilji"],["sim","Simulacija"],["timeline","Časovnica"],["analytics","Analitika"],["wishes","Wishlist"],["varsav","Varčevanje"],["settings","Nastavitve"],["crypto","🔒"]];
      const configurableTabs=allTabs.filter(([k])=>isSA||!["varsav","settings","crypto"].includes(k));
      const profileCfg=(key)=>({...VIEW_PROFILE_PRESETS[key],...(viewProfiles[key]||{}),widgets:{...(VIEW_PROFILE_PRESETS[key]?.widgets||{}),...((viewProfiles[key]||{}).widgets||{})}});
      const setTabsVisible=(keys)=>setTabHidden(configurableTabs.map(([k])=>k).filter(k=>!keys.includes(k)));
      const applyViewProfile=(key)=>{const p=profileCfg(key);setUiMode(key);setTabsVisible(p.tabs||[]);setDashWidgets(p.widgets||{});setDashOrder(p.order||DASH_SECTIONS.map(([id])=>id));setDashCostTextSize(p.textSize||15)};
      const resetViewProfile=(key)=>{const p=VIEW_PROFILE_PRESETS[key];setViewProfiles(v=>{const n={...v};delete n[key];return n});setUiMode(key);setTabsVisible(p.tabs);setDashWidgets(p.widgets||{});setDashOrder(DASH_SECTIONS.map(([id])=>id));setDashCostTextSize(15)};
      const saveCurrentProfile=(patch={})=>setViewProfiles(v=>({...v,[uiMode]:{...profileCfg(uiMode),tabs:configurableTabs.map(([k])=>k).filter(k=>!tabHidden.includes(k)),widgets:dashWidgets,order:dashOrder,textSize:dashCostTextSize,...patch}}));
      const setProfileTab=(tab,on)=>{const cur=profileCfg(uiMode);const tabs=new Set(cur.tabs||[]);on?tabs.add(tab):tabs.delete(tab);tabs.add("settings");const next=[...tabs];setViewProfiles(v=>({...v,[uiMode]:{...cur,tabs:next}}));setTabsVisible(next)};
      const setProfileWidget=(key,on)=>{const cur=profileCfg(uiMode);const widgets={...(cur.widgets||{}),[key]:on};setViewProfiles(v=>({...v,[uiMode]:{...cur,widgets}}));setDashWidgets(widgets)};
      const visibleTabsNow=configurableTabs.map(([k])=>k).filter(k=>!tabHidden.includes(k));
      return<div>
        <h2 style={{fontSize:24,fontWeight:700,margin:"0 0 8px"}}>Nastavitve</h2>

        {/* #50 Način uporabe — basic/advanced mode */}
        <div style={{...sC,background:GRW,border:`1px solid #f2d9c6`,padding:14}}>
          <div style={{fontSize:15,fontWeight:800,color:C.tx,marginBottom:2}}>🎚 Način uporabe</div>
          <div style={{fontSize:13,color:C.sb,marginBottom:10}}>Izberi profil prikaza. Vsak profil si lahko nastaviš po svoje: zavihki in razdelki spodaj se shranijo v izbrani profil.</div>
          <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"repeat(3,1fr)",gap:8}}>
            {Object.entries(VIEW_PROFILE_PRESETS).map(([m,p])=>
              <div key={m} onClick={()=>applyViewProfile(m)} style={{cursor:"pointer",padding:"12px 14px",borderRadius:13,border:`2px solid ${uiMode===m?C.bl:C.bd}`,background:uiMode===m?C.cd:"transparent",boxShadow:uiMode===m?SH:"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                  <span style={{fontSize:15,fontWeight:800,color:uiMode===m?C.bl:C.tx}}>{p.icon} {p.label}</span>
                  <span style={{fontSize:16}}>{uiMode===m?"◉":"○"}</span>
                </div>
                <div style={{fontSize:12,color:C.mt,marginTop:3}}>{p.desc}</div>
              </div>
            )}
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
            <button type="button" onClick={()=>resetViewProfile(uiMode)} style={{...sB(false),height:30,fontSize:13,padding:"0 10px"}}>Ponastavi ta profil</button>
            <button type="button" onClick={()=>{const tabs=configurableTabs.map(([k])=>k);setProfileTab("settings",true);setViewProfiles(v=>({...v,[uiMode]:{...profileCfg(uiMode),tabs}}));setTabsVisible(tabs)}} style={{...sB(false),height:30,fontSize:13,padding:"0 10px"}}>Izberi vse zavihke</button>
            <button type="button" onClick={()=>{const tabs=["dash","settings"];setViewProfiles(v=>({...v,[uiMode]:{...profileCfg(uiMode),tabs}}));setTabsVisible(tabs)}} style={{...sB(false),height:30,fontSize:13,padding:"0 10px"}}>Počisti zavihke</button>
            <button type="button" onClick={()=>saveCurrentProfile()} style={{...sB(true),height:30,fontSize:13,padding:"0 10px"}}>Shrani trenutni prikaz v profil</button>
          </div>
          <div style={{fontSize:13,fontWeight:800,color:C.tx,margin:"12px 0 6px"}}>Kaj naj bo prikazano v zavihkih profila {profileCfg(uiMode).label}</div>
          <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"repeat(3,1fr)",gap:6}}>
            {configurableTabs.map(([k,def])=><label key={k} style={{display:"flex",alignItems:"center",gap:7,fontSize:14,padding:"6px 9px",background:C.cd,borderRadius:10,border:`1px solid ${C.bd}`,cursor:"pointer",fontWeight:700,color:tabHidden.includes(k)?C.mt:C.sb}}>
              <input type="checkbox" checked={!tabHidden.includes(k)} onChange={e=>setProfileTab(k,e.target.checked)} style={{accentColor:C.bl,width:16,height:16}}/>
              {tabNames[k]||def}
            </label>)}
          </div>
          <div style={{fontSize:13,fontWeight:800,color:C.tx,margin:"12px 0 6px"}}>Kaj naj bo prikazano na zavihku Pregled</div>
          <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"repeat(3,1fr)",gap:6}}>
            {DASH_SECTIONS.map(([k,lbl])=><label key={k} style={{display:"flex",alignItems:"center",gap:7,fontSize:14,padding:"6px 9px",background:C.cd,borderRadius:10,border:`1px solid ${C.bd}`,cursor:"pointer",fontWeight:700,color:dashW(k)?C.sb:C.mt}}>
              <input type="checkbox" checked={dashW(k)} onChange={e=>setProfileWidget(k,e.target.checked)} style={{accentColor:C.bl,width:16,height:16}}/>
              {lbl}
            </label>)}
          </div>
        </div>

        {/* 👤 Račun */}
        <label style={{display:"flex",alignItems:"center",gap:8,margin:"10px 0",fontSize:15,fontWeight:700,color:C.tx,cursor:"pointer"}}>
          <input type="checkbox" checked={showTips} onChange={e=>setShowTips(e.target.checked)} style={{width:17,height:17,accentColor:C.bl}}/>
          Vodi me skozi sistem
        </label>

        <SecHdr k="guide" icon="📘" title="Navodila za uporabo" sub="Kako delujejo številke in gumbi"/>
        <SecBody k="guide">
          <label style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,fontSize:16,fontWeight:700,color:C.tx,cursor:"pointer"}}>
            <input type="checkbox" checked={showTips} onChange={e=>setShowTips(e.target.checked)} style={{width:17,height:17,accentColor:C.bl}}/>
            Prikaži vodene namige v aplikaciji
          </label>
          <div style={{...sM,background:"#fffdfb",marginBottom:12}}>
            <label style={{display:"flex",alignItems:"center",gap:8,fontSize:16,fontWeight:800,color:C.tx,cursor:"pointer",marginBottom:8}}>
              <input type="checkbox" checked={hoverHelpEnabled} onChange={e=>{setHoverHelpEnabled(e.target.checked);stopHoverHelp()}} style={{width:17,height:17,accentColor:C.bl}}/>
              Prikaži razlage na označenih elementih
            </label>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
              {[["hover","Alt + hover po 1 sekundi"],["context","Desni klik"]].map(([mode,label])=><button key={mode} type="button" disabled={!hoverHelpEnabled} onClick={()=>{setHoverHelpMode(mode);stopHoverHelp()}} style={{...sB(hoverHelpEnabled&&hoverHelpMode===mode),height:30,fontSize:13,padding:"0 10px",opacity:hoverHelpEnabled?1:.55}}>{label}</button>)}
            </div>
            <div style={{fontSize:13,color:C.mt,marginBottom:8}}>Besedilo je enako v obeh načinih; spremeni se samo način prikaza. Hover način se sproži samo z držanjem tipke Alt, desni klik pa z drugim klikom na istem mestu razlago zapre.</div>
            <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"repeat(3,1fr)",gap:6}}>
              {allTabs.map(([k,label])=><label key={k} style={{display:"flex",alignItems:"center",gap:7,fontSize:14,color:hoverHelpEnabled?C.tx:C.mt,cursor:hoverHelpEnabled?"pointer":"default"}}>
                <input type="checkbox" disabled={!hoverHelpEnabled} checked={hoverHelpPages[k]!==false} onChange={e=>setHoverHelpPages(p=>({...p,[k]:e.target.checked}))} style={{width:16,height:16,accentColor:C.bl}}/>
                {tabNames[k]||label}
              </label>)}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:14,fontSize:14,lineHeight:1.45,color:C.sb}}>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:C.tx,marginBottom:6}}>Postopek dela</div>
              <ol style={{margin:"0 0 0 18px",padding:0}}>
                <li><strong>Plan:</strong> nastavi pričakovane mesečne prihodke, fiksne in variabilne stroške.</li>
                <li><strong>Mesečni vnos:</strong> vnašaj dejanske prihodke in račune. To je glavni vir podatkov.</li>
                <li><strong>Zaključi mesec:</strong> ko je mesec preverjen, ga zapreš. Zaprti meseci hranijo dejansko stanje za letni pregled in simulacijo.</li>
                <li><strong>Pregled:</strong> pokaže razliko med planom in dejansko porabo za izbrani mesec.</li>
                <li><strong>Cilji, simulacija, varčevanje:</strong> uporabljajo iste številke, zato se vse spremembe poznajo povsod.</li>
              </ol>
            </div>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:C.tx,marginBottom:6}}>Kako so številke povezane</div>
              <div><strong>Prihodki</strong> = osebe + dodatni prihodki.</div>
              <div><strong>Odhodki</strong> = fiksni stroški + variabilni stroški + nepredvideni stroški.</div>
              <div><strong>Razlika</strong> = prihodki minus odhodki.</div>
              <div><strong>Varno za porabo</strong> = prihodki minus fiksni plan minus dejanska variabilna in nepredvidena poraba.</div>
              <div><strong>%</strong> = izvedba deljena s planom. Nad 100% pomeni, da je plan presežen.</div>
              <div><strong>Neto vrednost</strong> = prihranki + kripto + sredstva minus dolgovi.</div>
            </div>
          </div>
          <div style={{marginTop:14,fontSize:14,lineHeight:1.45,color:C.sb}}>
            <div style={{fontSize:16,fontWeight:800,color:C.tx,marginBottom:6}}>Kaj pomenijo glavni gumbi</div>
            <div><strong>Bančni izpisek:</strong> uvozi transakcije iz banke in jih poveže s kategorijami.</div>
            <div><strong>Uvoz Excel / Izvoz:</strong> prenese podatke v aplikacijo ali naredi datoteko za varnostno kopijo.</div>
            <div><strong>Uredi plan:</strong> začasno odpre planske zneske za popravljanje.</div>
            <div><strong>€/mes ali €/dan:</strong> preklopi prikaz mesečnih zneskov v dnevni občutek porabe.</div>
            <div><strong>Razdeli plačo:</strong> pomaga razporediti prihodke po namenih.</div>
            <div><strong>Predloge transakcij:</strong> shrani ponavljajoče vnose, da jih naslednji mesec dodaš hitreje.</div>
            <div><strong>Prenos neporabljenega proračuna:</strong> premakne neporabljen del izbranih kategorij naprej.</div>
            <div><strong>Varnostna kopija / Sync:</strong> shrani oziroma prenese podatke, da ne ostanejo samo v trenutnem brskalniku.</div>
          </div>
        </SecBody>

        <SecHdr k="onboarding" icon="🧭" title="Začetna nastavitev" sub={onboarding.done?"Končano":"Ni končano"}/>
        <SecBody k="onboarding">
          <div style={{fontSize:14,color:C.sb,marginBottom:10}}>Voden začetek pomaga nastaviti način uporabe, prihodke, plan, pregled in varnostno kopijo. Ne zaklene izkušenih uporabnikov; vedno ga lahko preskočiš ali ponovno zaženeš.</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            <button style={sB(true)} onClick={()=>{setOnboarding({done:false,step:0});setShowOnboarding(true)}}>Zaženi voden začetek</button>
            <button style={sB(false)} onClick={()=>setOnboarding({done:true,step:0})}>Označi kot končano</button>
            <span style={{fontSize:13,color:C.mt}}>Korak: {onboarding.step+1}/5</span>
          </div>
        </SecBody>

        <SecHdr k="features" icon="🧭" title="Potrjene funkcije" sub="Feature register 16.5.2026"/>
        <SecBody k="features">
          <div style={{fontSize:14,color:C.sb,marginBottom:10}}>Vsa priporočila iz dokumenta so potrjena kot smer razvoja. Local-first stvari gradimo neposredno tukaj; funkcije z bančnimi povezavami, zunanjimi sodelavci ali AI API gredo v fazo z varnim backendom.</div>
          <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"repeat(2,1fr)",gap:8}}>
            {FEATURE_RECOMMENDATIONS.map(f=><div key={f.name} style={{border:`1px solid ${C.bd}`,borderRadius:10,padding:10,background:C.cd}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"flex-start",marginBottom:5}}>
                <strong style={{fontSize:14,color:C.tx}}>{f.name}</strong>
                <span style={{...sT(f.grade==="High"?"#dcfce7":f.grade==="Mid"?"#fef3c7":"#f3f4f6",f.grade==="High"?"#166534":f.grade==="Mid"?"#92400e":C.sb),fontSize:12,whiteSpace:"nowrap"}}>{f.grade}</span>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6}}>
                <span style={{...sT("#dbeafe",C.bl),fontSize:12}}>{f.status}</span>
                <span style={{...sT("#f5ede2",C.sb),fontSize:12}}>{f.phase}</span>
                <span style={{...sT("#fff7ed",C.or),fontSize:12}}>Effort {f.effort}</span>
              </div>
              <div style={{fontSize:13,lineHeight:1.35,color:C.sb}}>{f.note}</div>
            </div>)}
          </div>
        </SecBody>

        <SecHdr k="automation" icon="⚡" title="Avtomatizacije" sub="Lokalna pravila za trenutni mesec"/>
        <SecBody k="automation">
          <div style={{fontSize:14,color:C.sb,marginBottom:10}}>Pravila delujejo lokalno in vidno: poiščejo besedo v komentarju transakcije ter jo premaknejo v izbrano podkategorijo. Zaprtih mesecev ne spreminjajo.</div>
          <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr 220px auto",gap:6,alignItems:"center",marginBottom:10}}>
            <input style={sI} value={autoRuleForm.name} onChange={e=>setAutoRuleForm(f=>({...f,name:e.target.value}))} placeholder="Ime pravila"/>
            <input style={sI} value={autoRuleForm.keyword} onChange={e=>setAutoRuleForm(f=>({...f,keyword:e.target.value}))} placeholder="Beseda v opisu, npr. mercator"/>
            <select style={sS} value={autoRuleForm.targetSubId} onChange={e=>setAutoRuleForm(f=>({...f,targetSubId:e.target.value}))}>{effectiveCats.map(cat=><optgroup key={cat.id} label={cat.nm}>{cat.subs.map(s=><option key={s.id} value={s.id}>{subRename[s.id]||s.nm}</option>)}</optgroup>)}</select>
            <button style={sB(true)} onClick={()=>{const kw=autoRuleForm.keyword.trim();if(!kw){setSMsg('Vpiši besedo za pravilo.');return}setAutomationRules(r=>[...r,{id:Date.now(),name:autoRuleForm.name||kw,keyword:kw,targetSubId:autoRuleForm.targetSubId,enabled:true}]);setAutoRuleForm({name:'',keyword:'',targetSubId:autoRuleForm.targetSubId})}}>Dodaj</button>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
            <button style={{...sB(true),height:34,fontSize:14}} onClick={runAutomationRules}>Zaženi na trenutnem mesecu</button>
            <button style={{...sB(false),height:34,fontSize:14}} onClick={()=>setAutomationRules([])}>Počisti pravila</button>
          </div>
          {automationRules.length===0?<div style={{fontSize:14,color:C.mt}}>Ni pravil. Dodaj npr. “mercator” → “Nakup živil”.</div>:
          <div style={{display:"grid",gap:6}}>
            {automationMatches.map(rule=>{
              const target=effectiveAS.find(s=>s.id===rule.targetSubId);
              return<div key={rule.id} style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr 90px 36px",gap:8,alignItems:"center",padding:9,border:`1px solid ${C.bd}`,borderRadius:10,background:C.cd}}>
                <div><strong>{rule.name}</strong><div style={{fontSize:12,color:C.mt}}>išči: {rule.keyword}</div></div>
                <div style={{fontSize:14,color:C.sb}}>Premakni v: <strong>{target?subRename[target.id]||target.nm:'—'}</strong></div>
                <div style={{fontSize:13,fontWeight:800,color:rule.matches.length?C.gn:C.mt}}>{rule.matches.length} ujemanj</div>
                <button style={{...sB(false),height:30,padding:0,color:C.rd}} onClick={()=>setAutomationRules(r=>r.filter(x=>x.id!==rule.id))}>×</button>
              </div>
            })}
          </div>}
        </SecBody>

        <SecHdr k="household" icon="🏠" title="Gospodinjstvo" sub={`${household.members.filter(m=>m.active!==false).length} aktivnih članov`}/>
        <SecBody k="household">
          <div style={{fontSize:14,color:C.sb,marginBottom:10}}>To je lokalni seznam članov gospodinjstva. Za zdaj poveže imena, vloge in privzeta pravila; kasneje ga lahko uporabimo v vseh dropdownih za prihodke, stroške, wishlist, cilje in dovoljenja.</div>
          <div style={{display:"grid",gap:6,marginBottom:10}}>
            {household.members.map((m,i)=><div key={i} style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 150px 150px 82px 34px",gap:6,alignItems:"center",padding:8,border:`1px solid ${C.bd}`,borderRadius:10,background:C.cd}}>
              <input style={{...sI,height:34,fontSize:14}} value={m.name} onChange={e=>setHousehold(h=>({...h,members:h.members.map((x,j)=>j===i?{...x,name:e.target.value}:x)}))} placeholder="Ime"/>
              <select style={{...sS,height:34,fontSize:14}} value={m.role} onChange={e=>setHousehold(h=>({...h,members:h.members.map((x,j)=>j===i?{...x,role:e.target.value}:x)}))}><option value="superadmin">superadmin</option><option value="član">član</option><option value="otrok">otrok</option><option value="gost">gost</option></select>
              <select style={{...sS,height:34,fontSize:14}} value={m.share} onChange={e=>setHousehold(h=>({...h,members:h.members.map((x,j)=>j===i?{...x,share:e.target.value}:x)}))}><option value="Skupno">Skupno</option><option value="Osebno">Osebno</option><option value="Družina">Družina</option><option value="Skrito">Skrito</option></select>
              <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:700,color:C.sb}}><input type="checkbox" checked={m.active!==false} onChange={e=>setHousehold(h=>({...h,members:h.members.map((x,j)=>j===i?{...x,active:e.target.checked}:x)}))}/>Aktiven</label>
              <button type="button" style={{...sB(false),height:30,padding:0,color:C.rd}} onClick={()=>setHousehold(h=>({...h,members:h.members.filter((_,j)=>j!==i)}))}>×</button>
            </div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr auto",gap:8,alignItems:"end"}}>
            <label style={{fontSize:13,fontWeight:800,color:C.sb}}>Privzeti strošek
              <select style={{...sS,width:"100%",marginTop:3}} value={household.rules.defaultExpense} onChange={e=>setHousehold(h=>({...h,rules:{...h.rules,defaultExpense:e.target.value}}))}><option value="Skupaj">Skupaj</option>{household.members.filter(m=>m.active!==false&&m.name).map(m=><option key={m.name} value={m.name}>{m.name}</option>)}</select>
            </label>
            <label style={{display:"flex",alignItems:"center",gap:8,fontSize:14,fontWeight:700,color:C.tx,paddingBottom:8}}><input type="checkbox" checked={!!household.rules.privateMode} onChange={e=>setHousehold(h=>({...h,rules:{...h.rules,privateMode:e.target.checked}}))}/>Zasebni način za osebne zneske</label>
            <button style={sB(true)} onClick={()=>setHousehold(h=>({...h,members:[...h.members,{name:"",role:"član",share:"Skupno",active:true}]}))}>+ Član</button>
          </div>
        </SecBody>

        <SecHdr k="account" icon="👤" title="Račun" sub={`Prijavljen: ${curUser}`}/>
        <SecBody k="account">
          <div style={{fontSize:18,marginBottom:10}}>Prijavljen: <strong>{curUser}</strong> <span style={sT(isSA?"#dbeafe":"#dcfce7",isSA?C.bl:"#166534")}>{curRole}</span></div>
          {isSA&&<><div style={{fontSize:15,fontWeight:600,marginBottom:6}}>Spremeni geslo</div>
          <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
            <span style={{fontSize:16,minWidth:80}}>Uporabnik:</span>
            <select style={{...sS,width:140}} id="chgPwdUser">{JSON.parse(localStorage.getItem('dp_accounts')||'[]').map(a=><option key={a.username}>{a.username}</option>)}</select>
          </div>
          <input style={{...sI,width:"100%",marginBottom:6}} type="password" value={sNP} onChange={e=>setSNP(e.target.value)} placeholder="Novo geslo (≥ 6)"/>
          <input style={{...sI,width:"100%",marginBottom:6}} type="password" value={sNP2} onChange={e=>setSNP2(e.target.value)} placeholder="Ponovi geslo"/>
          <button style={sB(true)} onClick={()=>{const user=document.getElementById('chgPwdUser')?.value;if(user)doChgPwd(user,sNP)}}>Spremeni geslo</button>
          <div style={{marginTop:12}}><CreateUserForm onAdd={async(u,p,e)=>{const accs=JSON.parse(localStorage.getItem('dp_accounts')||'[]');if(accs.find(a=>a.username===u)){setSMsg('Uporabnik že obstaja!');return}const salt=Array.from(crypto.getRandomValues(new Uint8Array(16))).join('');const h=await hPwd(p,salt);accs.push({username:u,hash:h,salt,role:'admin',email:e});localStorage.setItem('dp_accounts',JSON.stringify(accs));setAdminConf(prev=>({...prev,[u]:{varsav:false,crypto:false,settings:false}}));setSMsg(`Uporabnik ${u} ustvarjen!`)}}/></div>
          </>}
          {isSA&&<div style={{marginTop:10}}>
            <div style={{fontSize:15,fontWeight:600,marginBottom:6}}>Aktivni uporabniki</div>
            {JSON.parse(localStorage.getItem('dp_accounts')||'[]').map((a,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:`1px solid ${C.fn}`,fontSize:17}}><span><strong>{a.username}</strong> <span style={sT(a.role==='superadmin'?"#dbeafe":"#dcfce7",a.role==='superadmin'?C.bl:"#166534")}>{a.role}</span></span><span style={{color:C.mt}}>{a.email||"brez emaila"}</span></div>)}
          </div>}
          {isSA&&(()=>{const reqs=ld('dp_resetreqs',[]);return reqs.length>0?<div style={{marginTop:10,padding:10,background:"#fefce8",border:"1px solid #fde68a",borderRadius:4}}><div style={{fontSize:15,fontWeight:600,marginBottom:6}}>Zahteve za ponastavitev gesla</div>{reqs.map((r,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:`1px solid ${C.fn}`}}><span style={{fontSize:17}}>{r.email} — {r.date}</span><div style={{display:"flex",gap:4}}><button style={{...sB(true),height:26,fontSize:15}} onClick={()=>{const accs=JSON.parse(localStorage.getItem('dp_accounts')||'[]');const acc=accs.find(a=>a.email===r.email);if(acc){const newPwd=prompt(`Novo geslo za ${acc.username}:`);if(newPwd)doChgPwd(acc.username,newPwd)}const updated=reqs.filter((_,j)=>j!==i);sv('dp_resetreqs',updated);setSMsg('Geslo ponastavljeno.')}}>Ponastavi</button><button style={{...sB(false),height:26,fontSize:15,color:C.rd}} onClick={()=>{const updated=reqs.filter((_,j)=>j!==i);sv('dp_resetreqs',updated)}}>Zavrni</button></div></div>)}</div>:null})()}
        </SecBody>

        {/* 🔒 Varnost */}
        {isSA&&<><SecHdr k="security" icon="🔒" title="Varnost" sub="Gesla sekcij • Vidnost za admins"/>
        <SecBody k="security">
          <div style={{fontSize:15,fontWeight:600,marginBottom:8}}>Gesla za zaklenjene sekcije</div>
          <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:16,minWidth:90}}>Kripto:</span>
            <input style={{...sI,flex:1}} type="password" value={sCP} onChange={e=>setSCP(e.target.value)} placeholder="Geslo za kripto"/>
            <button style={sB(true)} onClick={()=>{sv('dp_cpwd',sCP);setSMsg('Kripto geslo nastavljeno!');setSCP('')}}>Nastavi</button>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:12}}>
            <span style={{fontSize:16,minWidth:90}}>Varčevanje:</span>
            <input style={{...sI,flex:1}} type="password" id="savPwdSet" placeholder="Geslo za varčevanje"/>
            <button style={sB(true)} onClick={()=>{sv('dp_savpwd',document.getElementById('savPwdSet')?.value||'');setSMsg('Varčevanje geslo nastavljeno!')}}>Nastavi</button>
          </div>
          <div style={{fontSize:15,fontWeight:600,marginBottom:6}}>Vidnost kategorij za admin uporabnike</div>
          <div style={{fontSize:14,color:C.mt,marginBottom:8}}>Superadmin vidi vedno vse. Tukaj nastavi katere kategorije so vidne navadnim adminom.</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:4,marginBottom:8}}>{CATS.map(cat=><label key={cat.id} style={{display:"flex",alignItems:"center",gap:6,fontSize:16,padding:"3px 0",cursor:"pointer"}}><input type="checkbox" checked={adminViews.includes(cat.id)} onChange={e=>{if(e.target.checked)setAdminViews(v=>[...v,cat.id]);else setAdminViews(v=>v.filter(x=>x!==cat.id))}}/>{cat.nm}</label>)}</div>
          <div style={{display:"flex",gap:6}}><button style={{...sB(false),fontSize:15,height:26}} onClick={()=>setAdminViews(CATS.map(c=>c.id))}>Izberi vse</button><button style={{...sB(false),fontSize:15,height:26}} onClick={()=>setAdminViews([])}>Počisti</button></div>
        </SecBody></>}

        {/* 🗂 Zavihki */}
        <SecHdr k="tabs" icon="🗂" title="Zavihki" sub={`${tabHidden.length} skritih`}/>
        <SecBody k="tabs">
          <div style={{fontSize:14,color:C.mt,marginBottom:10}}>Skrij zavihke, ki jih ne potrebuješ, ali jih preimenuj.</div>
          {configurableTabs.map(([k,def])=><div key={k} style={{display:"grid",gridTemplateColumns:"28px 1fr 1fr 32px",gap:8,alignItems:"center",padding:"5px 0",borderBottom:`1px solid ${C.fn}`}}>
            <input type="checkbox" checked={!tabHidden.includes(k)} onChange={e=>{if(e.target.checked)setTabHidden(h=>h.filter(x=>x!==k));else setTabHidden(h=>[...h,k])}} style={{width:16,height:16,cursor:"pointer"}}/>
            <span style={{fontSize:16,color:tabHidden.includes(k)?C.mt:C.tx}}>{def}</span>
            <input style={{...sI,height:26,fontSize:14}} value={tabNames[k]||""} onChange={e=>setTabNames(n=>({...n,[k]:e.target.value}))} placeholder={`Preimenuji (privzeto: ${def})`}/>
            {tabNames[k]&&<button onClick={()=>setTabNames(n=>{const c={...n};delete c[k];return c})} style={{background:"none",border:"none",color:C.mt,cursor:"pointer",fontSize:13}}>↺</button>}
          </div>)}
          <div style={{marginTop:8,display:"flex",gap:6}}>
            <button style={{...sB(false),fontSize:14,height:26}} onClick={()=>setTabHidden([])}>Pokaži vse</button>
            <button style={{...sB(false),fontSize:14,height:26}} onClick={()=>setTabNames({})}> Počisti preimenovanja</button>
          </div>
        </SecBody>

        {/* 👁 Kategorije */}
        <SecHdr k="cats" icon="👁" title="Kategorije & Postavke" sub="Preimenuj, skrij, izbriši"/>
        <SecBody k="cats">
          <div style={{fontSize:14,color:C.mt,marginBottom:10}}>Preimenuj postavko, jo trajno skrij, ali izbriši (samo če nima vnosov).</div>
          {CATS.filter(c=>c.id!=="unexpected").map(cat=>{
            const subsWithStats=cat.subs.map(sub=>{let total=0,plan=0;for(let m=0;m<12;m++){const mdata=yd[m]||initM();total+=mdata.subs?.[sub.id]?.actual||0;plan+=mdata.subs?.[sub.id]?.plan||0}return{sub,total,plan,empty:total===0&&plan===0}});
            return<div key={cat.id} style={{marginBottom:10,paddingBottom:8,borderBottom:`1px solid ${C.fn}`}}>
              <div style={{fontSize:14,fontWeight:700,color:C.tx,marginBottom:5,display:"flex",alignItems:"center",gap:6}}>
                {cat.nm} <span style={sT(cat.tp==="fixed"?"#dbeafe":"#fef3c7",cat.tp==="fixed"?C.bl:"#92400e")}>{cat.tp==="fixed"?"Fiksni":"Variabilni"}</span>
              </div>
              {subsWithStats.map(({sub,total,plan,empty})=><div key={sub.id} style={{display:"grid",gridTemplateColumns:"1fr 200px 90px 100px 26px",gap:5,alignItems:"center",padding:"3px 0",fontSize:13}}>
                <span style={{color:"#555"}}>{sub.nm}</span>
                <input style={{...sI,height:24,fontSize:13}} value={subRename[sub.id]||""} onChange={e=>setSubRename(p=>({...p,[sub.id]:e.target.value}))} placeholder={`(${sub.nm.substring(0,18)})`}/>
                <span style={{fontSize:12,color:empty?C.gn:C.mt,textAlign:"right"}}>{empty?"✓ prazno":`${fmt(total)}`}</span>
                <label style={{display:"flex",alignItems:"center",gap:4,fontSize:12,cursor:"pointer",color:subVis[sub.id]?C.rd:C.mt}}>
                  <input type="checkbox" checked={subVis[sub.id]===true} onChange={e=>setSubVis(p=>({...p,[sub.id]:e.target.checked}))}/>
                  {subVis[sub.id]?"Skrito":"Skrij"}
                </label>
                <button type="button" disabled={!empty} title={empty?"Skrij trajno":"Najprej počisti podatke"} onClick={()=>{if(empty&&confirm(`Skrij "${sub.nm}" trajno?`))setSubVis(p=>({...p,[sub.id]:true}))}} style={{background:"none",border:"none",color:empty?C.rd:"#ddd",cursor:empty?"pointer":"not-allowed",fontSize:13}}>🗑</button>
              </div>)}
            </div>;
          })}
          <div style={{padding:"8px 10px",background:"#fef9c3",borderRadius:4,fontSize:13,color:"#713f12"}}>💡 Postavke brez podatkov v letu lahko trajno skriješ.</div>

          {/* Custom subs per built-in cat */}
          <div style={{fontSize:14,fontWeight:700,color:C.tx,marginTop:14,marginBottom:6}}>Dodaj postavke v obstoječe kategorije</div>
          {CATS.filter(c=>c.id!=="unexpected").map(cat=>{
            const custom=customSubs[cat.id]||[];
            return<div key={cat.id} style={{marginBottom:8}}>
              <div style={{fontSize:13,fontWeight:600,color:C.bl,marginBottom:4}}>{cat.nm}</div>
              {custom.map((cs,i)=><div key={cs.id} style={{display:"flex",gap:4,alignItems:"center",marginBottom:3}}>
                <input style={{...sI,flex:1,height:24,fontSize:13}} value={cs.nm} onChange={e=>setCustomSubs(p=>{const n={...p,[cat.id]:[...p[cat.id]]};n[cat.id][i]={...n[cat.id][i],nm:e.target.value};return n})} placeholder="Ime postavke"/>
                <button onClick={()=>setCustomSubs(p=>({...p,[cat.id]:(p[cat.id]||[]).filter((_,j)=>j!==i)}))} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:14}}>✕</button>
              </div>)}
              <button style={{...sB(false),fontSize:12,height:24,padding:"0 8px"}} onClick={()=>setCustomSubs(p=>({...p,[cat.id]:[...(p[cat.id]||[]),{id:`c_${cat.id}_${Date.now()}`,nm:'',dp:0}]}))}>+ Dodaj</button>
            </div>;
          })}

          {/* New custom category groups */}
          <div style={{fontSize:14,fontWeight:700,color:C.tx,marginTop:14,marginBottom:6}}>Nove kategorije po meri</div>
          {customCatGroups.map((ccg,i)=><div key={ccg.id} style={{...sC,padding:8,marginBottom:6}}>
            <div style={{display:"flex",gap:4,alignItems:"center",marginBottom:4}}>
              <input style={{...sI,flex:1,height:24,fontSize:13}} value={ccg.nm} onChange={e=>setCustomCatGroups(p=>p.map((x,j)=>j===i?{...x,nm:e.target.value}:x))} placeholder="Ime kategorije"/>
              <select style={{...sS,height:24,fontSize:12,width:90}} value={ccg.tp} onChange={e=>setCustomCatGroups(p=>p.map((x,j)=>j===i?{...x,tp:e.target.value}:x))}><option value="fixed">Fiksni</option><option value="var">Variabilni</option></select>
              <button onClick={()=>setCustomCatGroups(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:13}}>🗑</button>
            </div>
            {(ccg.subs||[]).map((s,si)=><div key={s.id} style={{display:"flex",gap:4,alignItems:"center",marginBottom:3,paddingLeft:8}}>
              <input style={{...sI,flex:1,height:22,fontSize:12}} value={s.nm} onChange={e=>setCustomCatGroups(p=>p.map((x,j)=>{if(j!==i)return x;const ns=[...x.subs];ns[si]={...ns[si],nm:e.target.value};return{...x,subs:ns}}))} placeholder="Ime postavke"/>
              <button onClick={()=>setCustomCatGroups(p=>p.map((x,j)=>j===i?{...x,subs:x.subs.filter((_,k)=>k!==si)}:x))} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:13}}>✕</button>
            </div>)}
            <button style={{...sB(false),fontSize:12,height:22,padding:"0 6px"}} onClick={()=>setCustomCatGroups(p=>p.map((x,j)=>j===i?{...x,subs:[...(x.subs||[]),{id:`cg_${ccg.id}_${Date.now()}`,nm:'',dp:0}]}:x))}>+ Postavka</button>
          </div>)}
          <button style={{...sB(true),marginTop:4,fontSize:13}} onClick={()=>setCustomCatGroups(p=>[...p,{id:`ccg_${Date.now()}`,nm:'Nova kategorija',tp:'var',subs:[]}])}>+ Nova kategorija</button>
        </SecBody>

        {/* 📋 Dropdown seznami */}
        <SecHdr k="lists" icon="📋" title="Dropdown seznami" sub="Prihodki • Trgovine • Priložnosti"/>
        <SecBody k="lists">
          <div style={{fontSize:15,fontWeight:600,marginBottom:6}}>Vrste prihodkov</div>
          <div style={{marginBottom:12}}>{itList.map((item,i)=><div key={i} style={{display:"flex",gap:6,alignItems:"center",padding:"3px 0"}}><input style={{...sI,flex:1,height:26,fontSize:15}} value={item} onChange={e=>{const n=[...itList];n[i]=e.target.value;setItList(n)}}/><button type="button" onClick={()=>setItList(itList.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:15}}>✕</button></div>)}<button type="button" style={{...sB(false),fontSize:14,marginTop:4}} onClick={()=>setItList([...itList,'Nova vrsta'])}>+ Dodaj</button></div>
          <div style={{fontSize:15,fontWeight:600,marginBottom:6}}>Trgovine / Viri (nepredvideni)</div>
          <div style={{marginBottom:12,maxHeight:180,overflowY:"auto"}}>{kuList.map((item,i)=><div key={i} style={{display:"flex",gap:6,alignItems:"center",padding:"3px 0"}}><input style={{...sI,flex:1,height:26,fontSize:15}} value={item} onChange={e=>{const n=[...kuList];n[i]=e.target.value;setKuList(n)}}/><button type="button" onClick={()=>setKuList(kuList.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:15}}>✕</button></div>)}<button type="button" style={{...sB(false),fontSize:14,marginTop:4}} onClick={()=>setKuList([...kuList,'Nova trgovina'])}>+ Dodaj</button></div>
          <div style={{fontSize:15,fontWeight:600,marginBottom:6}}>Priložnosti (Wishlist)</div>
          <div>{occasions.map((occ,i)=><div key={i} style={{display:"flex",gap:6,alignItems:"center",padding:"3px 0"}}><input style={{...sI,flex:1,height:26,fontSize:15}} value={occ} onChange={e=>{const n=[...occasions];n[i]=e.target.value;setOccasions(n)}}/><button type="button" onClick={()=>setOccasions(occasions.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:15}}>✕</button></div>)}<button type="button" style={{...sB(false),fontSize:14,marginTop:4}} onClick={()=>setOccasions([...occasions,'Nova priložnost'])}>+ Dodaj</button></div>
        </SecBody>

        {/* ☁ Cloud sync */}
        <SecHdr k="locale" icon="🌍" title="Država, valuta in lokalni način" sub={`${appPrefs.country} • ${appPrefs.currency}`}/>
        <SecBody k="locale">
          <div style={{fontSize:14,color:C.sb,marginBottom:10}}>Slovenija in EUR ostaneta privzeta. Te nastavitve pripravijo aplikacijo za širšo EU uporabo; obstoječi zneski se ne pretvarjajo samodejno.</div>
          <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"repeat(4,1fr)",gap:8,marginBottom:10}}>
            <div><div style={{fontSize:13,fontWeight:800,color:C.sb,marginBottom:3}}>Država</div><select style={{...sS,width:"100%"}} value={appPrefs.country} onChange={e=>setAppPrefs(p=>({...p,country:e.target.value}))}><option value="SI">Slovenija</option><option value="AT">Avstrija</option><option value="HR">Hrvaška</option><option value="DE">Nemčija</option><option value="IT">Italija</option></select></div>
            <div><div style={{fontSize:13,fontWeight:800,color:C.sb,marginBottom:3}}>Valuta</div><select style={{...sS,width:"100%"}} value={appPrefs.currency} onChange={e=>setAppPrefs(p=>({...p,currency:e.target.value}))}><option value="EUR">EUR</option><option value="CHF">CHF</option><option value="USD">USD</option><option value="GBP">GBP</option></select></div>
            <div><div style={{fontSize:13,fontWeight:800,color:C.sb,marginBottom:3}}>Format datuma</div><select style={{...sS,width:"100%"}} value={appPrefs.dateFormat} onChange={e=>setAppPrefs(p=>({...p,dateFormat:e.target.value}))}><option value="sl-SI">sl-SI</option><option value="de-DE">de-DE</option><option value="hr-HR">hr-HR</option><option value="en-US">en-US</option></select></div>
            <div><div style={{fontSize:13,fontWeight:800,color:C.sb,marginBottom:3}}>Hramba</div><select style={{...sS,width:"100%"}} value={appPrefs.storage} onChange={e=>setAppPrefs(p=>({...p,storage:e.target.value}))}><option value="local">Samo lokalno</option><option value="cloud-ready">Lokalno + pripravljen sync</option></select></div>
          </div>
          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:14,fontWeight:700,color:C.tx}}><input type="checkbox" checked={appPrefs.offline!==false} onChange={e=>setAppPrefs(p=>({...p,offline:e.target.checked}))} style={{width:17,height:17,accentColor:C.bl}}/>Offline-first način: aplikacija mora delovati tudi brez interneta, dokler uporabnik sam ne vklopi sync.</label>
        </SecBody>

        <SecHdr k="sync" icon="☁" title="Sinhronizacija v oblak" sub={syncUrl?`Worker: ${syncUrl.replace('https://','').split('/')[0]}`:"Ni nastavljeno"}/>
        <SecBody k="sync">
          <div style={{fontSize:13,color:C.mt,marginBottom:10}}>
            Šifrira vse podatke z AES-GCM (ključ iz gesla) preden jih pošlje na Cloudflare Worker.
            Nastavi worker po navodilih v <code>worker/wrangler.toml</code>.
          </div>
          <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:8,marginBottom:8}}>
            <div><div style={{fontSize:13,color:C.mt,marginBottom:2}}>Worker URL</div>
              <input style={{...sI,width:"100%",fontSize:13}} value={syncUrl} onChange={e=>setSyncUrl(e.target.value.trim())} placeholder="https://domaci-proracun-sync.USER.workers.dev"/></div>
            <div><div style={{fontSize:13,color:C.mt,marginBottom:2}}>Sync token (SYNC_TOKEN)</div>
              <input style={{...sI,width:"100%",fontSize:13}} type="password" value={syncToken} onChange={e=>setSyncToken(e.target.value.trim())} placeholder="tajni žeton"/></div>
          </div>
          <div style={{marginBottom:10}}><div style={{fontSize:13,color:C.mt,marginBottom:2}}>Družinsko šifrirno geslo (≠ login geslo)</div>
            <input style={{...sI,width:"100%",fontSize:13}} type="password" value={syncPwd} onChange={e=>setSyncPwd(e.target.value)} placeholder="geslo za šifriranje podatkov"/>
            <div style={{fontSize:12,color:C.mt,marginTop:2}}>Isti geslo mora biti na vseh napravah. Brez njega podatkov ni mogoče prebrati.</div>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
            <button style={sB(true)} onClick={doSyncPush} disabled={syncStatus==='syncing'||!syncUrl}>
              {syncStatus==='syncing'?'Sinhronizacija…':'↑ Potisni v oblak'}
            </button>
            <button style={sB(false)} onClick={doSyncPull} disabled={syncStatus==='syncing'||!syncUrl}>
              ↓ Potegni iz oblaka
            </button>
            {syncLastPush&&<span style={{fontSize:12,color:C.mt}}>Zadnji push: {new Date(syncLastPush).toLocaleString("sl-SI")}</span>}
          </div>
          {syncStatus==='ok'&&<div style={{fontSize:13,color:C.gn,marginTop:6}}>✓ Sinhronizacija uspešna</div>}
          {syncStatus.startsWith('err:')&&<div style={{fontSize:13,color:C.rd,marginTop:6}}>⚠ {syncStatus.slice(4)}</div>}
          <div style={{fontSize:12,color:C.mt,marginTop:10,padding:"6px 8px",background:"#f9fafb",borderRadius:4}}>
            Samodejni push se zgodi ob zaključitvi meseca (če je sync nastavljen).
          </div>
        </SecBody>

        {/* 💾 Podatki */}
        <SecHdr k="data" icon="💾" title="Podatki & Varnostne kopije" sub={`Zadnja kopija: ${localStorage.getItem('dp_lastbackup')?new Date(parseInt(localStorage.getItem('dp_lastbackup'))).toLocaleDateString("sl-SI"):"nikoli"}`}/>
        <SecBody k="data">
          <div style={{fontSize:14,color:C.mt,marginBottom:10}}>Priporočamo varnostno kopijo vsaj vsaka 2 tedna.</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
            <button style={{...sB(true),background:"#d97706"}} onClick={()=>{createBackup();localStorage.setItem('dp_lastbackup',String(Date.now()));setSMsg('Varnostna kopija prenesena!')}}>Varnostna kopija (JSON)</button>
            <button style={sB(false)} onClick={doExport}>Izvoz Excel</button>
            <button style={{...sB(false),borderColor:C.gn,color:C.gn}} onClick={()=>{if(confirm('Dodam testne številke za razvoj? Trenutni proračunski podatki bodo prepisani.'))fillDemoData()}}>Napolni s testnimi podatki</button>
            <label style={{...sB(false),display:"flex",alignItems:"center",cursor:"pointer"}}><span>Obnovi iz kopije</span><input type="file" accept=".json" style={{display:"none"}} onChange={async e=>{const f=e.target.files?.[0];if(!f)return;try{const msg=await restoreBackup(f);setSMsg(msg+' Stran se bo osvežila.');setTimeout(()=>window.location.reload(),2000)}catch(err){setSMsg('Napaka: '+err)}}}/></label>
          </div>
          <label style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,cursor:"pointer"}}><input type="checkbox" checked={autoBackup} onChange={e=>setAutoBackup(e.target.checked)}/><div><div style={{fontSize:14,fontWeight:600}}>Samodejno kopiraj ob zaključitvi meseca</div><div style={{fontSize:12,color:C.mt}}>Datoteka se prenese pri vsakem zaključku.</div></div></label>
          <button style={{...sB(false),color:C.rd,borderColor:C.rd}} onClick={()=>{if(confirm('Izbriši vse podatke? To je nepovratno!')){localStorage.clear();sessionStorage.clear();window.location.reload()}}}>🗑 Izbriši vse podatke</button>
        </SecBody>

        {/* 🔔 Opozorila */}
        <SecHdr k="receipts" icon="🧾" title="Računi" sub="Slika računa • besedilo • osnova za vnos"/>
        <SecBody k="receipts">
          <div style={{fontSize:14,color:C.mt,marginBottom:10}}>Brskalnik sam nima zanesljivega OCR branja slik. Brez dodatne knjižnice ali zunanjega OCR servisa lahko račun naložiš kot sliko za referenco ali prilepiš prebrano besedilo; iz besedila aplikacija vzame največji znesek in predlaga kategorijo.</div>
          <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:10}}>
            <label style={{...sC,marginBottom:0,cursor:"pointer",display:"block"}}>
              <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>Naloži sliko računa</div>
              <div style={{fontSize:12,color:C.mt,marginBottom:6}}>Shrani se ne; služi kot vizualna pomoč pri ročnem vnosu.</div>
              <input type="file" accept="image/*,.txt" onChange={e=>{const f=e.target.files?.[0];if(!f)return;if(f.type.startsWith('text/')||f.name.endsWith('.txt')){const r=new FileReader();r.onload=()=>{const el=document.getElementById('receiptText');if(el)el.value=r.result||'';setSMsg('Besedilo računa je naloženo. Klikni Dodaj osnovo.');};r.readAsText(f)}else setSMsg('Slika je sprejeta kot referenca. Za avtomatsko branje slike potrebujemo OCR knjižnico ali servis.')}}/>
            </label>
            <div>
              <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>Besedilo računa</div>
              <textarea id="receiptText" style={{width:"100%",minHeight:120,fontSize:14,border:`1px solid ${C.bd}`,borderRadius:10,padding:10,fontFamily:FF,boxSizing:"border-box"}} placeholder="Prilepi OCR besedilo ali prepiši vrstice računa..."/>
              <button style={{...sB(true),marginTop:6}} onClick={addReceiptText}>Dodaj osnovo v mesečni vnos</button>
            </div>
          </div>
        </SecBody>

        <SecHdr k="privacy" icon="🔐" title="Zasebnost & debug" sub="Beta podatki niso berljivi razvijalcu"/>
        <SecBody k="privacy">
          <div style={{fontSize:14,color:C.mt,marginBottom:10}}>Za beta testiranje naj uporabniki pošiljajo samo šifriran debug paket. V paketu so lokalni podatki, vendar jih brez njihovega gesla ni mogoče prebrati niti superadminu niti razvijalcu.</div>
          <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"repeat(4,1fr)",gap:8,marginBottom:10}}>
            <div style={{...sM,background:"#fffdfb"}}><div style={{fontSize:12,color:C.mt,fontWeight:800}}>Lokalni zapisi</div><div style={{fontSize:20,fontWeight:900,color:C.tx}}>{privacyHealth.keys}</div></div>
            <div style={{...sM,background:"#fffdfb"}}><div style={{fontSize:12,color:C.mt,fontWeight:800}}>Velikost podatkov</div><div style={{fontSize:20,fontWeight:900,color:C.tx}}>{Math.max(1,Math.round(privacyHealth.bytes/1024))} KB</div></div>
            <div style={{...sM,background:"#fffdfb"}}><div style={{fontSize:12,color:C.mt,fontWeight:800}}>Zadnja kopija</div><div style={{fontSize:20,fontWeight:900,color:privacyHealth.backupAge==null||privacyHealth.backupAge>14?C.or:C.gn}}>{privacyHealth.backupAge==null?"nikoli":`${privacyHealth.backupAge} dni`}</div></div>
            <div style={{...sM,background:"#fffdfb"}}><div style={{fontSize:12,color:C.mt,fontWeight:800}}>Šifriran sync</div><div style={{fontSize:20,fontWeight:900,color:privacyHealth.syncReady?C.gn:C.mt}}>{privacyHealth.syncReady?"pripravljen":"lokalno"}</div></div>
          </div>
          <button style={sB(true)} onClick={async()=>{try{const pwd=prompt('Geslo za šifriran debug paket (vsaj 8 znakov). Uporabnik ga deli ločeno samo, če želi razkriti podatke.');if(!pwd)return;await downloadEncryptedDebugBundle(pwd);setSMsg('Šifriran debug paket je prenesen.')}catch(e){setSMsg('Napaka: '+e.message)}}}>Prenesi šifriran debug paket</button>
          <div style={{fontSize:12,color:C.mt,marginTop:8,padding:"6px 8px",background:"#f9fafb",borderRadius:6}}>Pravilo za razvoj: za napake uporabljaj šifriran paket ali anonimizirane posnetke zaslona; ne zahtevaj navadnega JSON izvoza z realnimi družinskimi številkami.</div>
        </SecBody>

        <SecHdr k="terms" icon="📄" title="Pogoji uporabe" sub="Beta pogoji in zasebnost"/>
        <SecBody k="terms">
          <div style={{fontSize:14,lineHeight:1.55,color:C.tx}}>
            <strong>Domači proračun je beta orodje za osebno vodenje financ.</strong> Podatki se privzeto hranijo lokalno v brskalniku uporabnika. Uporabnik je odgovoren za varnostne kopije, pravilnost vnosov in odločitve na podlagi prikazanih izračunov. Aplikacija ne daje finančnega, davčnega ali investicijskega svetovanja.
            <br/><br/>
            Pri vklopu sinhronizacije se podatki pred pošiljanjem šifrirajo v brskalniku z geslom uporabnika. Brez tega gesla podatkov ni mogoče obnoviti. Za podporo in debug se uporabljajo samo šifrirani paketi ali anonimizirani primeri, razen če uporabnik izrecno deli razkrito kopijo.
            <br/><br/>
            Beta funkcije se lahko spremenijo, zato naj uporabnik pred večjimi spremembami izvozi varnostno kopijo. Nadaljnja uporaba pomeni sprejem teh pogojev.
          </div>
        </SecBody>

        <SecHdr k="alerts" icon="🔔" title="Opozorila" sub={`${alertRules.length} pravil aktivnih`}/>
        <SecBody k="alerts">
          <div style={{fontSize:13,color:C.mt,marginBottom:8}}>Nastavi pragove opozorila za kategorije. Copilot prikaže opozorilo ko presežeš prag.</div>
          {alertRules.map((rule,i)=><div key={rule.id} style={{display:"grid",gridTemplateColumns:"1fr 110px 80px 30px",gap:6,alignItems:"center",marginBottom:6,padding:"6px 8px",background:"#f9fafb",borderRadius:4}}>
            <select style={{...sS,height:28,fontSize:13}} value={rule.catId} onChange={e=>setAlertRules(p=>p.map((r,j)=>j===i?{...r,catId:e.target.value}:r))}>
              <option value="">Skupni proračun</option>
              {effectiveCats.map(c=><option key={c.id} value={c.id}>{c.nm}</option>)}
            </select>
            <select style={{...sS,height:28,fontSize:13}} value={rule.type} onChange={e=>setAlertRules(p=>p.map((r,j)=>j===i?{...r,type:e.target.value}:r))}>
              <option value="pct">% plana</option><option value="amt">€ znesek</option>
            </select>
            <input type="number" style={{...sI,height:28,fontSize:13}} value={rule.value} onChange={e=>setAlertRules(p=>p.map((r,j)=>j===i?{...r,value:parseFloat(e.target.value)||0}:r))} placeholder={rule.type==="pct"?"80":""} />
            <button onClick={()=>setAlertRules(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:15}}>✕</button>
          </div>)}
          <button style={{...sB(false),fontSize:13,height:28}} onClick={()=>setAlertRules(p=>[...p,{id:Date.now(),catId:"",type:"pct",value:90}])}>+ Dodaj pravilo</button>
          {alertRules.length>0&&(()=>{const triggered=alertRules.filter(rule=>{if(!rule.catId){const totalPlan=effectiveCats.reduce((s,c)=>s+cT(md,c,'plan'),0);return rule.type==="pct"?totalPlan>0&&tAc>=totalPlan*rule.value/100:tAc>=rule.value}const cat=effectiveCats.find(c=>c.id===rule.catId);if(!cat)return false;const actual=cT(md,cat,'actual');const plan=cT(md,cat,'plan');return rule.type==="pct"?plan>0&&actual>=plan*rule.value/100:actual>=rule.value});return triggered.length>0?<div style={{marginTop:8,padding:"6px 10px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:4,fontSize:13,color:C.rd,fontWeight:600}}>🔔 {triggered.length} opozorilo(-a) aktivno ta mesec</div>:null;})()}
        </SecBody>
        {/* 🕐 Dnevni posnetki */}
        <SecHdr k="snapshots" icon="🕐" title="Dnevni posnetki" sub="Obnovi stanje iz preteklega dne"/>
        <SecBody k="snapshots">
          <div style={{fontSize:14,color:C.mt,marginBottom:10}}>Vsak dan se samodejno shrani posnetek podatkov. Obnovi lahko do 30 dni nazaj.</div>
          {(()=>{const snaps=ld('dp_snapshots',{});const dates=Object.keys(snaps).sort().reverse();return dates.length===0?<div style={{fontSize:15,color:C.mt}}>Ni shranjenih posnetkov.</div>:dates.map(d=><div key={d} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.fn}`}}>
            <span style={{fontSize:16}}>{new Date(d).toLocaleDateString("sl-SI",{weekday:"short",day:"numeric",month:"long",year:"numeric"})}</span>
            <button style={{...sB(false),fontSize:14,height:26}} onClick={()=>{if(confirm(`Obnovi stanje iz ${d}? Trenutni podatki bodo prepisani.`)){const snap=snaps[d];Object.entries(snap).forEach(([k,v])=>{if(v!==null)localStorage.setItem(k,JSON.stringify(v));else localStorage.removeItem(k)});setSMsg(`Stanje iz ${d} obnovljeno. Stran se osvežuje...`);setTimeout(()=>window.location.reload(),1500)}}}>Obnovi na ta dan</button>
          </div>)})()}
        </SecBody>

        {sMsg&&<div style={{fontSize:18,color:C.gn,marginTop:10}}>{sMsg}</div>}
      </div>;
    })()}

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

    </div></div>
    <InstallPrompt/>

    {/* #40 + #42 Floating action buttons */}
    <div style={{position:"fixed",right:18,bottom:18,zIndex:900,display:"flex",flexDirection:"column",gap:10,alignItems:"center"}}>
      <button onClick={()=>setShowSearch(true)} title="Iskanje transakcij" style={{width:46,height:46,borderRadius:"50%",border:`1px solid ${C.bd}`,background:C.cd,color:C.sb,fontSize:20,cursor:"pointer",boxShadow:SHL,display:"flex",alignItems:"center",justifyContent:"center"}}>🔍</button>
      <button onClick={()=>setShowQuickAdd(true)} title="Hitri vnos transakcije" style={{width:58,height:58,borderRadius:"50%",border:"none",background:GR,color:"#fff",fontSize:32,fontWeight:400,cursor:"pointer",boxShadow:"0 6px 22px rgba(217,119,87,0.5)",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,paddingBottom:4}}>+</button>
    </div>

    {/* #40 Global transaction search */}
    {showSearch&&<div onClick={()=>{setShowSearch(false);setSearchQ('')}} style={{position:"fixed",inset:0,background:"rgba(58,50,44,0.5)",backdropFilter:"blur(2px)",zIndex:1300,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"7vh 16px"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.cd,borderRadius:20,width:580,maxWidth:"96vw",maxHeight:"82vh",display:"flex",flexDirection:"column",boxShadow:SHL,overflow:"hidden",animation:"dpPop .2s ease"}}>
        <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.bd}`,display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:20}}>🔍</span>
          <input autoFocus value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Išči po opisu, kategoriji ali znesku…" style={{flex:1,border:"none",outline:"none",fontSize:17,fontFamily:FF,background:"transparent",color:C.tx}}/>
          <button onClick={()=>{setShowSearch(false);setSearchQ('')}} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:C.mt}}>✕</button>
        </div>
        <div style={{overflowY:"auto",padding:"8px"}}>
          {(()=>{
            const q=searchQ.trim().toLowerCase();
            if(q.length<2)return<div style={{fontSize:14,color:C.mt,textAlign:"center",padding:"30px 16px"}}>Vnesi vsaj 2 znaka za iskanje med vsemi transakcijami.</div>;
            const res=[];
            Object.entries(data).forEach(([y,yd2])=>Object.entries(yd2||{}).forEach(([m,md2])=>Object.entries(md2.subs||{}).forEach(([subId,sd])=>{
              const sub=effectiveAS.find(s=>s.id===subId);const subNm=sub?(subRename[subId]||sub.nm):subId;
              (sd.transactions||[]).forEach(t=>{if(typeof t!=='object')return;const cmt=t.comment||'';const hay=(cmt+' '+subNm).toLowerCase();if(hay.includes(q)||String(Math.round(t.amt||0)).includes(q))res.push({y:+y,m:+m,subNm,amt:t.amt||0,comment:cmt,person:t.person});});
            })));
            res.sort((a,b)=>b.y-a.y||b.m-a.m||b.amt-a.amt);
            if(!res.length)return<div style={{fontSize:14,color:C.mt,textAlign:"center",padding:"30px 16px"}}>Ni zadetkov za "{searchQ}".</div>;
            const total=res.reduce((s,r)=>s+r.amt,0);
            return<><div style={{fontSize:12,color:C.mt,fontWeight:700,padding:"2px 8px 8px"}}>{res.length} zadetkov · skupaj {fmt(total)}</div>
            {res.slice(0,60).map((r,i)=><div key={i} onClick={()=>{setYr(r.y);setMo(r.m);setVw('entry');setShowSearch(false);setSearchQ('')}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:11,cursor:"pointer",marginBottom:3,background:i%2?C.fn:"transparent"}}>
              <div style={{minWidth:0,flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:C.tx,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.comment||r.subNm}</div>
                <div style={{fontSize:12,color:C.mt}}>{MS[r.m]} {r.y} · {r.subNm}{r.person?` · ${r.person}`:""}</div>
              </div>
              <span style={{fontSize:15,fontWeight:800,color:C.tx,flexShrink:0}}>{fmt(r.amt)}</span>
            </div>)}
            {res.length>60&&<div style={{fontSize:12,color:C.mt,textAlign:"center",padding:8}}>Prikazanih prvih 60 — natančneje določi iskanje.</div>}</>;
          })()}
        </div>
      </div>
    </div>}

    {/* #42 Quick-add transaction modal */}
    {showQuickAdd&&<div onClick={()=>setShowQuickAdd(false)} style={{position:"fixed",inset:0,background:"rgba(58,50,44,0.5)",backdropFilter:"blur(2px)",zIndex:1300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.cd,borderRadius:22,width:430,maxWidth:"96vw",padding:22,boxShadow:SHL,animation:"dpPop .2s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <span style={{fontSize:20,fontWeight:800,color:C.tx}}>✏️ Hitri vnos</span>
          <button onClick={()=>setShowQuickAdd(false)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:C.mt}}>✕</button>
        </div>
        <div style={{fontSize:13,color:C.mt,marginBottom:14}}>Dodajam v <strong style={{color:C.bl}}>{MF[mo]} {yr}</strong></div>
        <div style={{fontSize:12,fontWeight:700,color:C.sb,marginBottom:4}}>Znesek (€)</div>
        <input id="qa-amt" type="number" inputMode="decimal" autoFocus placeholder="0,00" style={{...sI,width:"100%",height:52,fontSize:24,fontWeight:800,marginBottom:12,textAlign:"center"}}/>
        <div style={{fontSize:12,fontWeight:700,color:C.sb,marginBottom:4}}>Kategorija</div>
        <select id="qa-sub" style={{...sS,width:"100%",marginBottom:12}}>
          {effectiveCats.map(cat=><optgroup key={cat.id} label={cat.nm}>{cat.subs.map(s=><option key={s.id} value={s.id}>{subRename[s.id]||s.nm}</option>)}</optgroup>)}
        </select>
        <div style={{display:"flex",gap:10,marginBottom:12}}>
          <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:C.sb,marginBottom:4}}>Oseba</div>
            <select id="qa-person" style={{...sS,width:"100%"}}><option value="">—</option><option value="Tadej">Tadej</option><option value="Kristina">Kristina</option></select></div>
        </div>
        <div style={{fontSize:12,fontWeight:700,color:C.sb,marginBottom:4}}>Opis (neobvezno)</div>
        <input id="qa-note" placeholder="npr. Mercator, kosilo…" style={{...sI,width:"100%",marginBottom:16}}/>
        <button onClick={()=>{const amt=parseFloat((document.getElementById('qa-amt')||{}).value);const subId=(document.getElementById('qa-sub')||{}).value;if(!amt||amt<=0||!subId)return;addTransaction(subId,amt,(document.getElementById('qa-note')||{}).value||"",(document.getElementById('qa-person')||{}).value||"");setShowQuickAdd(false)}} style={{...aBtn,width:"100%",height:50,fontSize:17}}>Dodaj transakcijo ✓</button>
      </div>
    </div>}
    {showPayday&&(()=>{
      const savCat=effectiveCats.find(c=>c.id==="savings_inv");
      const savSubs=savCat?savCat.subs.filter(s=>subVis[s.id]!==true):[];
      const fixedPlan=effectiveCats.filter(c=>c.tp==="fixed"&&c.id!=="savings_inv").reduce((s,c)=>s+cT(md,c,'plan'),0);
      const alloc=payAlloc;const setAlloc=setPayAlloc;
      const totalAlloc=Object.values(alloc).reduce((s,v)=>s+v,0);
      const available=tInc-fixedPlan;const free=available-totalAlloc;
      const doApply=()=>{
        savSubs.forEach(s=>{const v=alloc[s.id]||0;if(v>0){addTransaction(s.id,v,'💰 Razdelitev plače')}});
        setShowPayday(false);
      };
      return<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{background:'#fff',borderRadius:12,padding:24,width:440,maxWidth:'95vw',maxHeight:'90vh',overflowY:'auto',boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <h3 style={{fontSize:18,fontWeight:700,margin:0}}>💰 Razdeli plačo — {MF[mo]} {yr}</h3>
            <button onClick={()=>setShowPayday(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:C.mt}}>✕</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:16}}>
            <div style={{...sC,marginBottom:0,textAlign:'center'}}><div style={{fontSize:11,color:C.mt,textTransform:'uppercase'}}>Prihodki</div><div style={{fontSize:20,fontWeight:700,color:C.gn}}>{fmt(tInc)}</div></div>
            <div style={{...sC,marginBottom:0,textAlign:'center'}}><div style={{fontSize:11,color:C.mt,textTransform:'uppercase'}}>Fiksni plan</div><div style={{fontSize:20,fontWeight:700,color:C.rd}}>{fmt(fixedPlan)}</div></div>
            <div style={{...sC,marginBottom:0,textAlign:'center',borderLeft:`3px solid ${available>=0?C.bl:C.rd}`}}><div style={{fontSize:11,color:C.mt,textTransform:'uppercase'}}>Na voljo</div><div style={{fontSize:20,fontWeight:700,color:available>=0?C.bl:C.rd}}>{fmt(available)}</div></div>
          </div>
          <div style={{fontSize:14,fontWeight:600,color:C.sb,marginBottom:8}}>Razporeditev v varčevanje</div>
          {savSubs.map(s=>{const cur=md.subs?.[s.id]?.actual||0;return<div key={s.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,padding:'8px 10px',borderRadius:6,background:'#f8f7f4',border:`1px solid ${C.bd}`}}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600}}>{subRename[s.id]||s.nm}</div>
              {cur>0&&<div style={{fontSize:12,color:C.gn}}>Že dodano ta mesec: {fmt(cur)}</div>}
            </div>
            <input type="number" min="0" value={alloc[s.id]||0} onChange={e=>setAlloc(p=>({...p,[s.id]:parseFloat(e.target.value)||0}))} style={{...sI,width:80,height:32,fontSize:14,textAlign:'right'}}/>
            <span style={{fontSize:13,color:C.mt,minWidth:12}}>€</span>
          </div>})}
          <div style={{padding:'10px 12px',borderRadius:6,background:free>=0?'#dcfce7':'#fee2e2',marginTop:4,marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:14,fontWeight:600,color:free>=0?'#166534':C.rd}}>Ostalo (svobodno)</span>
            <span style={{fontSize:18,fontWeight:700,color:free>=0?C.gn:C.rd}}>{fmt(free)}</span>
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button style={sB(false)} onClick={()=>setShowPayday(false)}>Prekliči</button>
            <button style={{...sB(true),background:C.gn}} onClick={doApply} disabled={totalAlloc===0}>Izvedi razporeditev ({fmt(totalAlloc)})</button>
          </div>
        </div>
      </div>;
    })()}
    {showRetro&&(()=>{
      // Gather story data for closed month
      const bestCat=effectiveCats.reduce((best,cat)=>{const p=cT(md,cat,'plan');const a=cT(md,cat,'actual');if(p<=0)return best;const diff=p-a;return diff>best.diff?{cat,diff,p,a}:best},{diff:-Infinity,cat:null,p:0,a:0});
      const worstCat=effectiveCats.reduce((worst,cat)=>{const p=cT(md,cat,'plan');const a=cT(md,cat,'actual');if(p<=0)return worst;const over=a-p;return over>worst.over?{cat,over,p,a}:worst},{over:-Infinity,cat:null,p:0,a:0});
      const totalPlanR=effectiveCats.reduce((s,cat)=>s+cT(md,cat,'plan'),0);
      const totalActR=effectiveCats.reduce((s,cat)=>s+cT(md,cat,'actual'),0);
      const savedR=totalPlanR-totalActR;
      const savGoals=AP.goals||[];
      const steps=[
        {title:"📖 Zgodba meseca",content:<>
          <div style={{textAlign:"center",marginBottom:16}}>
            <div style={{fontSize:28,fontWeight:800,color:savedR>=0?C.gn:C.rd}}>{savedR>=0?"+":""}{fmt(savedR)}</div>
            <div style={{fontSize:14,color:C.mt,marginTop:2}}>{savedR>=0?"Prihranili glede na plan":"Prekoračili plan"}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            {bestCat.cat&&<div style={{padding:"10px 12px",background:"#f0fdf4",borderRadius:8,borderLeft:"3px solid "+C.gn}}>
              <div style={{fontSize:12,color:C.mt,marginBottom:2}}>Najboljša kategorija</div>
              <div style={{fontSize:15,fontWeight:700,color:"#166534"}}>{bestCat.cat.nm}</div>
              <div style={{fontSize:13,color:C.gn}}>Plan {fmt(bestCat.p)} → Dejansko {fmt(bestCat.a)}</div>
            </div>}
            {worstCat.cat&&worstCat.over>0&&<div style={{padding:"10px 12px",background:"#fef2f2",borderRadius:8,borderLeft:"3px solid "+C.rd}}>
              <div style={{fontSize:12,color:C.mt,marginBottom:2}}>Prekoračena kategorija</div>
              <div style={{fontSize:15,fontWeight:700,color:C.rd}}>{worstCat.cat.nm}</div>
              <div style={{fontSize:13,color:C.rd}}>Plan {fmt(worstCat.p)} → Dejansko {fmt(worstCat.a)}</div>
            </div>}
          </div>
          <div style={{padding:"8px 12px",background:"#f9fafb",borderRadius:6,fontSize:14,color:C.mt,textAlign:"center"}}>
            Plan skupaj: <strong>{fmt(totalPlanR)}</strong> &nbsp;|&nbsp; Dejansko: <strong style={{color:totalActR<=totalPlanR?C.gn:C.rd}}>{fmt(totalActR)}</strong>
          </div>
        </>},
        {title:"Vedenjski pogled",content:<>
          <div style={{fontSize:14,color:C.mt,marginBottom:12}}>Oznake so prostovoljne in niso ocena. Pomagajo razumeti, zakaj je nastala poraba.</div>
          {behaviorSummary.rows.length===0?<div style={{padding:"14px",background:"#f9fafb",borderRadius:8,color:C.mt,fontSize:14}}>Ta mesec še nima vedenjskih oznak. V razčlenitvi transakcij lahko dodaš oznake: načrtovano, nujno, družina, nagrada, impulz, stres ali obžalovanje.</div>:
          <div style={{display:"grid",gap:7,marginBottom:10}}>{behaviorSummary.rows.map(r=><div key={r.tag} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:"#f9fafb",borderRadius:8,border:`1px solid ${C.bd}`}}><span style={{fontWeight:700}}>{r.label}</span><span style={{fontWeight:900,color:C.bl}}>{fmt(r.total)} <span style={{fontSize:12,color:C.mt}}>({r.count})</span></span></div>)}</div>}
          {behaviorSummary.soft.map((x,i)=><div key={i} style={{padding:"8px 10px",background:i===0?"#eff6ff":"#fffdfb",borderRadius:8,fontSize:13,color:C.sb,marginBottom:6,border:`1px solid ${C.bd}`}}>{x}</div>)}
        </>},
        {title:"🎯 Cilji — kdaj dosežemo?",content:<>
          {savGoals.length===0&&<div style={{fontSize:14,color:C.mt,padding:"20px 0",textAlign:"center"}}>Ni nastavljenih varčevalnih ciljev. Dodaj jih v zavihku Varčevanje.</div>}
          {savGoals.map((g,i)=>{
            const monthly=savedR>0?savedR:0;
            const remaining=Math.max(0,(g.target||0)-(g.current||0));
            const months=monthly>0?Math.ceil(remaining/monthly):null;
            const eta=months?new Date(new Date().getFullYear(),new Date().getMonth()+months,1).toLocaleDateString('sl-SI',{month:'long',year:'numeric'}):null;
            return<div key={i} style={{padding:"10px 12px",background:"#f9fafb",borderRadius:8,marginBottom:8,border:"1px solid "+C.bd}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div style={{fontSize:15,fontWeight:600}}>{g.name||"Cilj "+(i+1)}</div>
                <div style={{fontSize:13,color:C.bl,fontWeight:600}}>{fmt(g.current||0)} / {fmt(g.target||0)}</div>
              </div>
              <div style={{background:C.fn,borderRadius:4,height:8,marginBottom:6,overflow:"hidden"}}><div style={{height:"100%",background:C.bl,width:pc(g.current||0,g.target||1)+"%",borderRadius:4}}/></div>
              {eta&&<div style={{fontSize:13,color:C.mt}}>Predviden datum: <strong>{eta}</strong> (ob {fmt(monthly)}/mes.)</div>}
              {!eta&&<div style={{fontSize:13,color:C.mt}}>Ne moremo izračunati — ta mesec ni prihranka.</div>}
            </div>;
          })}
        </>},
        {title:"💡 Priporočilo",content:<>
          <div style={{fontSize:14,color:C.mt,marginBottom:12}}>Na podlagi tega meseca:</div>
          {worstCat.cat&&worstCat.over>0&&<div style={{padding:"12px 14px",background:"#fff7ed",borderRadius:8,borderLeft:"3px solid "+C.or,marginBottom:10}}>
            <div style={{fontSize:14,fontWeight:600,color:"#92400e",marginBottom:4}}>Povišaj plan za {worstCat.cat.nm}</div>
            <div style={{fontSize:13,color:"#78350f"}}>Dejansko {fmt(worstCat.a)} vs. plan {fmt(worstCat.p)} (+{fmt(worstCat.over)} prekoračitve). Razmisli o povišanju plana na ~{fmt(Math.round(worstCat.a*1.05))}.</div>
          </div>}
          {bestCat.cat&&bestCat.diff>30&&<div style={{padding:"12px 14px",background:"#f0fdf4",borderRadius:8,borderLeft:"3px solid "+C.gn,marginBottom:10}}>
            <div style={{fontSize:14,fontWeight:600,color:"#166534",marginBottom:4}}>{bestCat.cat.nm} — odlično!</div>
            <div style={{fontSize:13,color:"#15803d"}}>Ostalo {fmt(bestCat.diff)} pod planom. Ta znesek lahko preusmerite v varčevanje ali cilj.</div>
          </div>}
          {savedR>50&&<div style={{padding:"12px 14px",background:"#eff6ff",borderRadius:8,borderLeft:"3px solid "+C.bl}}>
            <div style={{fontSize:14,fontWeight:600,color:"#1d4ed8",marginBottom:4}}>Prihranili ste {fmt(savedR)}</div>
            <div style={{fontSize:13,color:"#1e40af"}}>Dodajte ta znesek k varčevalnemu cilju ali izrednim prihrankam.</div>
          </div>}
          {savedR<=0&&worstCat.over<=0&&<div style={{fontSize:14,color:C.mt,padding:"12px 0",textAlign:"center"}}>Mesec je bil uravnotežen. Brez posebnih priporočil.</div>}
        </>},
        {title:"📅 Prihodnji mesec",content:<>
          <div style={{fontSize:14,color:C.mt,marginBottom:12}}>Hiter pregled plana za {MF[(mo+1)%12]} {(mo+1)%12===0?yr+1:yr}:</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            <div style={{padding:"8px 10px",background:"#f9fafb",borderRadius:6,border:"1px solid "+C.bd}}>
              <div style={{fontSize:12,color:C.mt}}>Proračun</div>
              <div style={{fontSize:18,fontWeight:700,color:C.bl}}>{fmt(AP.budget)}</div>
            </div>
            <div style={{padding:"8px 10px",background:"#f9fafb",borderRadius:6,border:"1px solid "+C.bd}}>
              <div style={{fontSize:12,color:C.mt}}>Plan skupaj</div>
              <div style={{fontSize:18,fontWeight:700,color:totalPlan<=AP.budget?C.gn:C.rd}}>{fmt(totalPlan)}</div>
            </div>
          </div>
          {worstCat.cat&&worstCat.over>0&&<div style={{fontSize:13,color:C.or,padding:"6px 10px",background:"#fff7ed",borderRadius:6,marginBottom:6}}>
            Pomni: {worstCat.cat.nm} je bil ta mesec +{fmt(worstCat.over)} nad planom.
          </div>}
          <div style={{fontSize:14,color:C.mt,marginTop:8,textAlign:"center"}}>Ko zapreš, bo mesec <strong>{MF[mo]}</strong> zaklenjen.</div>
        </>},
      ];
      const step=steps[retroStep];
      return<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:1100,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{background:'#fff',borderRadius:14,padding:24,width:480,maxWidth:'95vw',maxHeight:'90vh',overflowY:'auto',boxShadow:'0 8px 40px rgba(0,0,0,0.25)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
            <div style={{fontSize:11,color:C.mt,textTransform:'uppercase',letterSpacing:0.5}}>Zaključek meseca — korak {retroStep+1}/{steps.length}</div>
            <button onClick={()=>setShowRetro(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:C.mt}}>✕</button>
          </div>
          <div style={{display:'flex',gap:4,marginBottom:16}}>
            {steps.map((_,i)=><div key={i} style={{flex:1,height:4,borderRadius:2,background:i<=retroStep?C.bl:C.fn}}/>)}
          </div>
          <h3 style={{fontSize:18,fontWeight:700,margin:"0 0 16px"}}>{step.title}</h3>
          {step.content}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>
            {retroStep>0&&<button style={sB(false)} onClick={()=>setRetroStep(v=>v-1)}>← Nazaj</button>}
            {retroStep<steps.length-1
              ?<button style={{...sB(true),background:C.bl}} onClick={()=>setRetroStep(v=>v+1)}>Naprej →</button>
              :<button style={{...sB(true),background:C.gn}} onClick={()=>{setShowRetro(false);toggleClose(mo)}}>Zaključi mesec ✓</button>
            }
          </div>
        </div>
      </div>;
    })()}
    {showYearEnd&&(()=>{
      const closedMs=[];for(let i=0;i<12;i++){if((yd[i]||{}).closed)closedMs.push({...yd[i],mo:i});}
      const n=Math.max(1,closedMs.length);
      const yrInc=closedMs.reduce((s,m)=>s+iT(m),0);
      const yrExp=closedMs.reduce((s,m)=>s+efxT(m,'actual')+evrT(m,'actual')+uxtT(m),0);
      const yrPlan=closedMs.reduce((s,m)=>s+effectiveCats.reduce((ss,c)=>ss+cT(m,c,'plan'),0),0);
      const yrSav=yrPlan-yrExp;
      const bestM=closedMs.reduce((b,m)=>{const p=effectiveCats.reduce((s,c)=>s+cT(m,c,'plan'),0);const a=efxT(m,'actual')+evrT(m,'actual')+uxtT(m);const diff=p-a;return diff>b.diff?{m,diff}:b},{diff:-Infinity,m:null});
      const bestCatYr=effectiveCats.reduce((best,cat)=>{const plan=closedMs.reduce((s,m)=>s+cT(m,cat,'plan'),0);const actual=closedMs.reduce((s,m)=>s+cT(m,cat,'actual'),0);const diff=plan-actual;return diff>best.diff&&plan>100?{cat,diff,plan,actual}:best},{diff:-Infinity,cat:null});
      const worstCatYr=effectiveCats.reduce((worst,cat)=>{const plan=closedMs.reduce((s,m)=>s+cT(m,cat,'plan'),0);const actual=closedMs.reduce((s,m)=>s+cT(m,cat,'actual'),0);const over=actual-plan;return over>worst.over&&plan>100?{cat,over,plan,actual}:worst},{over:-Infinity,cat:null});
      const steps=[
        {title:"🎆 Leto "+yr+" — pregled",content:<>
          <div style={{textAlign:"center",marginBottom:16}}>
            <div style={{fontSize:13,color:C.mt,marginBottom:4}}>Skupni prihranek glede na plan</div>
            <div style={{fontSize:36,fontWeight:800,color:yrSav>=0?C.gn:C.rd}}>{yrSav>=0?"+":""}{fmt(yrSav)}</div>
            <div style={{fontSize:13,color:C.mt}}>{closedMs.length} zaključenih mesecev</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
            <div style={{textAlign:"center",padding:"8px 4px",background:"#f0fdf4",borderRadius:8}}><div style={{fontSize:11,color:C.mt}}>Prihodki</div><div style={{fontSize:18,fontWeight:700,color:C.gn}}>{fmt(yrInc)}</div></div>
            <div style={{textAlign:"center",padding:"8px 4px",background:"#fef2f2",borderRadius:8}}><div style={{fontSize:11,color:C.mt}}>Odhodki</div><div style={{fontSize:18,fontWeight:700,color:C.rd}}>{fmt(yrExp)}</div></div>
            <div style={{textAlign:"center",padding:"8px 4px",background:"#eff6ff",borderRadius:8}}><div style={{fontSize:11,color:C.mt}}>Razlika</div><div style={{fontSize:18,fontWeight:700,color:yrInc>yrExp?C.gn:C.rd}}>{fmt(yrInc-yrExp)}</div></div>
          </div>
          {bestM.m&&<div style={{fontSize:13,color:C.mt,textAlign:"center"}}>Najboljši mesec: <strong>{MF[bestM.m.mo]}</strong> ({bestM.diff>0?"+":""}{fmt(bestM.diff)} vs. plan)</div>}
        </>},
        {title:"🏆 Kategorije — "+yr,content:<>
          {bestCatYr.cat&&<div style={{padding:"10px 12px",background:"#f0fdf4",borderRadius:8,borderLeft:"3px solid "+C.gn,marginBottom:10}}><div style={{fontSize:12,color:C.mt,marginBottom:2}}>Najboljša kategorija</div><div style={{fontSize:15,fontWeight:700,color:"#166534"}}>{bestCatYr.cat.nm}</div><div style={{fontSize:13,color:C.gn}}>Plan {fmt(bestCatYr.plan)} → {fmt(bestCatYr.actual)} (prihranek {fmt(bestCatYr.diff)})</div></div>}
          {worstCatYr.cat&&worstCatYr.over>0&&<div style={{padding:"10px 12px",background:"#fef2f2",borderRadius:8,borderLeft:"3px solid "+C.rd,marginBottom:10}}><div style={{fontSize:12,color:C.mt,marginBottom:2}}>Največja prekoračitev</div><div style={{fontSize:15,fontWeight:700,color:C.rd}}>{worstCatYr.cat.nm}</div><div style={{fontSize:13,color:C.rd}}>Plan {fmt(worstCatYr.plan)} → {fmt(worstCatYr.actual)} (+{fmt(worstCatYr.over)})</div></div>}
          <div style={{maxHeight:200,overflowY:"auto"}}>{effectiveCats.map(cat=>{const plan=closedMs.reduce((s,m)=>s+cT(m,cat,'plan'),0);const actual=closedMs.reduce((s,m)=>s+cT(m,cat,'actual'),0);if(!plan&&!actual)return null;const pct=plan>0?pc(actual,plan):0;return<div key={cat.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:`1px solid ${C.fn}`,fontSize:13}}><span>{cat.nm}</span><span style={{fontWeight:600,color:pct>100?C.rd:pct>80?C.or:C.gn}}>{fmt(actual)} <span style={{fontSize:11,fontWeight:400}}>({pct}%)</span></span></div>})}</div>
        </>},
        {title:"💡 Priporočila za "+String(yr+1),content:<>
          <div style={{fontSize:14,color:C.mt,marginBottom:12}}>Na podlagi leta {yr}:</div>
          {worstCatYr.cat&&worstCatYr.over>0&&<div style={{padding:"10px 12px",background:"#fff7ed",borderRadius:8,borderLeft:"3px solid "+C.or,marginBottom:8}}><div style={{fontSize:13,fontWeight:600,color:"#92400e"}}>Povišaj plan — {worstCatYr.cat.nm}</div><div style={{fontSize:12,color:"#78350f",marginTop:2}}>Letna prekoračitev {fmt(worstCatYr.over)}. Prilagodi plan za ~{fmt(Math.round(worstCatYr.over/12))}/mesec.</div></div>}
          {bestCatYr.cat&&bestCatYr.diff>200&&<div style={{padding:"10px 12px",background:"#f0fdf4",borderRadius:8,borderLeft:"3px solid "+C.gn,marginBottom:8}}><div style={{fontSize:13,fontWeight:600,color:"#166534"}}>Preusmeri prihranke — {bestCatYr.cat.nm}</div><div style={{fontSize:12,color:"#15803d",marginTop:2}}>Prihranjenih {fmt(bestCatYr.diff)} glede na plan. Preusmeri v naložbe ali varčevalni cilj.</div></div>}
          {yrInc>0&&yrExp>0&&<div style={{padding:"10px 12px",background:"#eff6ff",borderRadius:8,borderLeft:"3px solid "+C.bl,marginBottom:8}}><div style={{fontSize:13,fontWeight:600,color:"#1d4ed8"}}>Stopnja varčevanja {yr}</div><div style={{fontSize:12,color:"#1e40af",marginTop:2}}>{Math.max(0,Math.round((yrInc-yrExp)/yrInc*100))}% prihodkov je ostalo (priporočeno: ≥20%).</div></div>}
        </>},
        {title:"🌅 Dobrodošli v "+String(yr+1)+"!",content:<>
          <div style={{textAlign:"center",marginBottom:16,padding:"16px 8px",background:"linear-gradient(135deg,#dbeafe,#ede9fe)",borderRadius:10}}><div style={{fontSize:24,marginBottom:4}}>🎉</div><div style={{fontSize:16,fontWeight:700,color:"#1e40af"}}>Novo leto, novi cilji!</div><div style={{fontSize:13,color:"#3730a3",marginTop:4}}>Pripravi plan za {yr+1} v zavihku Plan.</div></div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <div style={{fontSize:13,padding:"8px 10px",background:"#f9fafb",borderRadius:6}}>✅ Pregledaj plan za {yr+1} in ga prilagodi</div>
            <div style={{fontSize:13,padding:"8px 10px",background:"#f9fafb",borderRadius:6}}>✅ Postavi 3 finančne cilje za {yr+1}</div>
            <div style={{fontSize:13,padding:"8px 10px",background:"#f9fafb",borderRadius:6}}>✅ Nastavi nujni sklad na {fmt(Math.round(yrExp/n*6))}</div>
          </div>
        </>},
      ];
      const step=steps[yearEndStep];
      return<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:1200,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{background:'#fff',borderRadius:16,padding:28,width:500,maxWidth:'95vw',maxHeight:'90vh',overflowY:'auto',boxShadow:'0 12px 48px rgba(0,0,0,0.3)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
            <div style={{fontSize:11,color:C.mt,textTransform:'uppercase',letterSpacing:0.5}}>Letni zaključek {yr} — {yearEndStep+1}/{steps.length}</div>
            <button aria-label="Zapri" onClick={()=>setShowYearEnd(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:C.mt}}>✕</button>
          </div>
          <div style={{display:'flex',gap:4,marginBottom:16}}>{steps.map((_,i)=><div key={i} style={{flex:1,height:4,borderRadius:2,background:i<=yearEndStep?C.bl:C.fn}}/>)}</div>
          <h3 style={{fontSize:18,fontWeight:700,margin:"0 0 16px"}}>{step.title}</h3>
          {step.content}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>
            {yearEndStep>0&&<button style={sB(false)} onClick={()=>setYearEndStep(v=>v-1)}>← Nazaj</button>}
            {yearEndStep<steps.length-1
              ?<button style={{...sB(true),background:C.bl}} onClick={()=>setYearEndStep(v=>v+1)}>Naprej →</button>
              :<button style={{...sB(true),background:"#7c3aed"}} onClick={()=>{setShowYearEnd(false);setVw('pct')}}>Plan za {yr+1} 🎯</button>
            }
          </div>
        </div>
      </div>;
    })()}
    </EB>;
}

