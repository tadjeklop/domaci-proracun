// App constants — month labels, category tree, income types, budget profiles,
// view presets, feature register, and help text. Pure data, no React.

export const MF=["Januar","Februar","Marec","April","Maj","Junij","Julij","Avgust","September","Oktober","November","December"];
export const MS=["Jan","Feb","Mar","Apr","Maj","Jun","Jul","Avg","Sep","Okt","Nov","Dec"];
export const CL=["#d97757","#0d9488","#e0913c","#8b5cf6","#0e9f6e","#e0564a","#e11d48","#0284c7","#ca8a04","#6366f1","#be185d","#15803d","#ea580c","#4f46e5","#0891b2","#a21caf","#65a30d"];
export const CATS=[
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
export const IT=["Plača","Nagrada","Regres","Božičnica","Otroški dodatek","Porodniška","Refund"];
export const KU=["Amazon","HM","About You","Sports Direct","Mohito","Notino","Stradivarius","Grand Hotel Bernardin","Best Secret","Equa","Lelosi","DDStepOnline","Fever vstopnice"];
export const QUIZ_QS=["Ali si pregledal/-a vse naročnine?","Ali si jedel/-a doma vsaj 5× na teden?","Ali si varčeval/-a za izredne situacije?","Ali si naredil/-a varnostno kopijo podatkov?","Ali si preveril/-a stanje na bančnem računu?","Ali si dosegel/-a vsaj en finančni cilj?","Ali si se izognil/-a impulzivnim nakupom?","Ali je tvoj proračun v ravnovesju?","Ali si na poti do finančnih ciljev?","Ali si pregledal/-a letni napredek?","Ali si zaključil/-a vse mesečne naloge?","Ali si zadovoljen/-a z letnim rezultatom?"];
export const BEHAVIOR_TAGS=[["planned","Načrtovano"],["essential","Nujno"],["family","Družina"],["reward","Nagrada"],["impulse","Impulz"],["stress","Stres"],["regret","Obžalovanje"]];
export const AS=CATS.flatMap(c=>c.subs);

// ===== BUDGET PROFILE TEMPLATES =====
export const PROF_TEMPLATES=[
  {id:"tpl_standard",name:"Standard (3.600 €)",budget:3600,nepMd:"pct",nepPct:5,nepFx:180,pMd:{},bPct:{},
   pFx:{rent:700,utilities:200,admin:30,internet:60,propIns:20,carLoan:0,carIns:70,kinder:0,consL:0,vacSav:100,etf:150,tradeRep:150,groc:500,eatOut:100,snacks:30,fuel:100,parking:15,carMnt:20,taxi:0,clothes:50,shoes:30,hair:40,depil:20,drug:40,hobbies:30,trips:40,cinema:20,social:40,pharm:20,massage:0,suppl:20,dental:0,books:10,courses:0,stream:20,members:60,sw:20,bday:30,donate:0,repairs:30,equip:30,travel:80,kidStuff:0,kidOth:0}},
  {id:"tpl_skromen",name:"Skromen (3.000 €)",budget:3000,nepMd:"pct",nepPct:5,nepFx:150,pMd:{},bPct:{},
   pFx:{rent:600,utilities:150,admin:20,internet:50,propIns:0,carLoan:0,carIns:50,kinder:0,consL:0,vacSav:50,etf:100,tradeRep:100,groc:400,eatOut:60,snacks:20,fuel:70,parking:10,carMnt:10,taxi:0,clothes:30,shoes:20,hair:30,depil:10,drug:30,hobbies:20,trips:20,cinema:10,social:20,pharm:15,massage:0,suppl:10,dental:0,books:5,courses:0,stream:15,members:30,sw:15,bday:20,donate:0,repairs:20,equip:10,travel:50,kidStuff:0,kidOth:0}},
  {id:"tpl_udoben",name:"Udoben (4.500 €)",budget:4500,nepMd:"pct",nepPct:5,nepFx:225,pMd:{},bPct:{},
   pFx:{rent:900,utilities:250,admin:40,internet:70,propIns:30,carLoan:0,carIns:100,kinder:300,consL:0,vacSav:100,etf:200,tradeRep:200,groc:550,eatOut:150,snacks:40,fuel:120,parking:20,carMnt:30,taxi:10,clothes:80,shoes:50,hair:60,depil:30,drug:50,hobbies:50,trips:80,cinema:40,social:60,pharm:30,massage:40,suppl:30,dental:40,books:20,courses:50,stream:25,members:90,sw:25,bday:60,donate:20,repairs:50,equip:50,travel:150,kidStuff:60,kidOth:30}},
];

export const DASH_SECTIONS=[
  ["health","Finančno zdravje"],["kpi","Glavni kvadratki"],["momtrend","Primerjava in varčevalna stopnja"],
  ["copilot","Finančni copilot"],["velocity","Napoved porabe"],["merchants","Poraba po trgovcih"],["categories","Fiksni in variabilni stroški"],
  ["charts","Grafi"],["subscriptions","Naročnine"],["cashflow","Denarni tok"],["bills","Položnice"],
  ["coach","Nasveti"],["insights","Uvidi"],["behavior","Vedenjski uvidi"],["calendar","Finančni koledar"],["emergency","Nujni sklad"],
  ["quiz","Mesečno vprašanje"],["linkedGoals","Varčevalni cilji"]
];
export const VIEW_PROFILE_PRESETS={
  default:{label:"Osnovni (default)",icon:"🌱",pct:"30%",desc:"Samo ključne funkcije za najčistejši začetek.",tabs:["dash","entry","settings"],widgets:{health:true,kpi:true,copilot:false,categories:true,momtrend:false,velocity:false,merchants:false,charts:false,subscriptions:false,cashflow:false,bills:false,coach:false,insights:false,behavior:false,calendar:false,emergency:false,quiz:false,linkedGoals:false,mom:false,savtrend:false}},
  basic:{label:"Osnovni",icon:"🌿",pct:"66%",desc:"Večina uporabnih funkcij brez najbolj naprednih dodatkov.",tabs:["dash","pct","entry","annual","goals","sim","timeline","analytics","settings"],widgets:{health:true,kpi:true,copilot:true,momtrend:true,velocity:false,merchants:false,categories:true,charts:true,subscriptions:false,cashflow:true,bills:true,coach:true,insights:false,behavior:true,calendar:false,emergency:true,quiz:false,linkedGoals:true,mom:true,savtrend:true}},
  advanced:{label:"Napredni",icon:"⚙",pct:"100%",desc:"Vse funkcije, vsi zavihki in poln pregled.",tabs:["dash","pct","entry","annual","goals","sim","timeline","analytics","wishes","varsav","settings","crypto"],widgets:Object.fromEntries([...DASH_SECTIONS.map(([k])=>[k,true]),["mom",true],["savtrend",true]])}
};
export const LOCAL_AUTH_DISABLED=false;
export const FEATURE_RECOMMENDATIONS=[
  {name:"Multi-Method Budgeting Engine",grade:"Mid",effort:"XL",status:"Potrjeno",phase:"Načrtovano",note:"Metode proračuna: category, zero-based, envelope, flexible, hybrid."},
  {name:"Universal Account Aggregation",grade:"High",effort:"XL",status:"Potrjeno",phase:"Backend kasneje",note:"Potrebuje varen backend/PSD2 ali agregator. CSV/Excel import ostane prvi korak."},
  {name:"AI Financial Copilot",grade:"High",effort:"L",status:"Potrjeno",phase:"Lokalni povzetki najprej",note:"Najprej deterministični mesečni povzetki; API šele z zasebnostnim stikalom."},
  {name:"Household Finance System",grade:"High",effort:"L",status:"Potrjeno",phase:"Local-first",note:"Člani, vloge, lastništvo stroškov, skupni cilji in vidnost."},
  {name:"Life-Centric Financial Timeline",grade:"High",effort:"L",status:"Potrjeno",phase:"Local-first",note:"Ena časovnica za račune, naročnine, cilje, dolgove in simulacije."},
  {name:"Full Financial Visibility",grade:"Mid",effort:"M",status:"Potrjeno",phase:"Local-first",note:"Enoten pregled prihrankov, dolgov, sredstev, naložb, kripta in neto vrednosti."},
  {name:"Behavioral Finance Features",grade:"Mid",effort:"M",status:"Potrjeno",phase:"Local-first",note:"Oznake vedenja na transakcijah in nežni mesečni uvidi brez obsojanja."},
  {name:"Workflow Automation",grade:"High",effort:"L",status:"Potrjeno",phase:"Local-first",note:"Vidna pravila za trgovce, rollover, opozorila, naročnine in predloge."},
  {name:"Financial Collaboration",grade:"Low",effort:"XL",status:"Potrjeno",phase:"Backend kasneje",note:"Zunanji sodelavci zahtevajo pravo avtentikacijo, dovoljenja in revizijsko sled."},
  {name:"UX Gaps / Onboarding Improvements",grade:"High",effort:"M",status:"Potrjeno",phase:"Local-first",note:"Voden prvi zagon: člani, prihodki, plan, uvoz, prikaz in cilji."},
  {name:"Internationalization / EU Readiness",grade:"Mid",effort:"L",status:"Potrjeno",phase:"Postopno",note:"Slovenija ostane privzeta; kasneje valuta, država, jezik, SEPA/PSD2 struktura."},
  {name:"Privacy-First Positioning",grade:"High",effort:"M",status:"Potrjeno",phase:"Local-first",note:"Jasno pokaži, kje so podatki, izvoz, šifriran sync, backup in lastništvo."},
  {name:"Advanced Analytics Layer",grade:"Mid",effort:"L",status:"Potrjeno",phase:"Local-first",note:"Shranjena poročila, filtri, oznake, pivot pregled in izvoz."}
];
export const HOVER_HELP_PAGES={dash:true,pct:true,entry:true,annual:true,goals:true,sim:true,timeline:true,analytics:true,wishes:true,varsav:true,settings:true,crypto:true};
export const HELP={
  health:"Finančno zdravje je skupna ocena iz štirih delov: varčevalna stopnja, disciplina glede plana, nujni sklad in dolg. Podatki pridejo iz zaprtih mesecev, trenutnega meseca, varčevanja, sredstev in dolgov.",
  kpi:"Ti kvadratki so hitra slika meseca. Prihodki so vsi vneseni prihodki. Odhodki so fiksni, variabilni in nepredvideni stroški. Razlika je prihodki minus odhodki. Varno za porabo upošteva fiksni plan in že porabljene variabilne zneske.",
  mom:"Primerjava z mesecem prej primerja dejansko porabo trenutnega meseca z dejansko porabo prejšnjega meseca. Spodaj pokaže kategorije, kjer se je znesek najbolj spremenil.",
  savtrend:"Varčevalna stopnja je delež prihodkov, ki ostane po odhodkih. Vsak stolpec je en mesec: (prihodki - odhodki) / prihodki.",
  cashflow:"Denarni tok napove naslednjih šest mesecev. Zaprti meseci uporabljajo dejanske podatke, odprti meseci pa planirane prihodke in stroške.",
  emergency:"Nujni sklad pokaže, koliko mesecev stroškov imaš pokritih. Cilj je povprečna mesečna poraba iz zaprtih mesecev krat izbrano število mesecev.",
  scratch:"Eksperimentalni izračun začasno preveri, kako bi se plan obnašal pri drugem proračunu. Ne spremeni podatkov, dokler ne klikneš uporabi.",
  profiles:"Profili proračuna so različne verzije plana. Aktivni profil določa proračun, odstotke, fiksne zneske in cilje za trenutni plan.",
  scenario:"Scenarij je kaj-če izračun. Dodaš hipotetičen prihodek, strošek ali varčevanje in vidiš, kako bi to spremenilo prosti denar.",
  sync:"Sinhronizacija prepiše planske zneske v mesečni vnos, da se plan in izvedba primerjata na isti osnovi.",
  payday:"Razdeli plačo predlaga razporeditev prihodkov med fiksne stroške, varčevanje in preostanek za porabo.",
  rollover:"Prenos neporabljenega proračuna doda neporabljen del iz prejšnjega meseca k izbranim kategorijam v tem mesecu.",
  templates:"Predloge shranijo ponavljajoče transakcije ali prihodke, da jih lahko naslednji mesec dodaš z enim klikom.",
  quick:"Hitri vnos prebere znesek in opis iz naravnega jezika. Opis primerja z imeni postavk in predlaga najbolj verjetno kategorijo.",
  newgoal:"Nov cilj odpre obrazec za varčevalni, mesečni ali ročni cilj. Cilji se lahko polnijo ročno ali iz povezane postavke.",
  annualCompare:"Primerjaj v letnem pregledu odpre primerjavo z drugim letom, da vidiš razliko v prihodkih, stroških in kategorijah.",
  yoy:"YoY pokaže spremembo glede na isti mesec prejšnjega leta. Uporabi se za iskanje sezonskih razlik.",
  annualChart:"Graf prikazuje prihodke in odhodke po mesecih. Črte uporabljajo podatke iz mesečnih vnosov za izbrano leto.",
  categoryTrends:"Trendi kategorij pokažejo 12-mesečni razvoj porabe po kategorijah, da lažje vidiš rast ali padec stroškov.",
  badges:"Odznaki so avtomatski povzetki leta, na primer zaporedni meseci v planu, prihranki ali delež mesecev pod planom.",
  goalsTabs:"Preklopi med splošnimi cilji in mesečnimi cilji. Splošni so dolgoročni, mesečni veljajo za določen mesec.",
  goalCard:"Kartica cilja kaže trenutno stanje, cilj, odstotek napredka in opombo. Sprememba trenutnega zneska takoj popravi napredek.",
  sim:"Simulacija združi plan, zaprte mesece, ročne predpostavke, rast plače, inflacijo in donos naložb ter izračuna prihodnjo pot.",
  mode:"Način uporabe skrije ali pokaže napredne funkcije. Osnovni način je čistejši, napredni pokaže vse gradnike in nastavitve.",
  snapshots:"Dnevni posnetki so lokalne kopije podatkov po dnevih. Uporabni so, če želiš obnoviti stanje iz prejšnjega dne."
};
