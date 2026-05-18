// Inline style tokens — warm & cozy theme. No CSS framework; styles live here.

export const C={bg:"#faf6f1",cd:"#fffdfb",bd:"#ece2d6",mt:"#9c9085",fn:"#f5ede2",gn:"#0e9f6e",rd:"#e0564a",bl:"#d97757",pu:"#8b5cf6",or:"#e0913c",tx:"#3a322c",sb:"#6b6055"};
export const SH="0 1px 2px rgba(74,58,46,0.04), 0 6px 16px rgba(74,58,46,0.06)";
export const SHL="0 4px 14px rgba(74,58,46,0.08), 0 12px 32px rgba(74,58,46,0.08)";
export const GR="linear-gradient(135deg, #e89370 0%, #d97757 100%)";
export const GRW="linear-gradient(135deg, #fff5ee 0%, #fbe8db 100%)";
export const FF="'Nunito','Segoe UI',system-ui,-apple-system,sans-serif";
export const sC={background:C.cd,borderRadius:16,border:`1px solid ${C.bd}`,padding:14,marginBottom:10,boxShadow:SH};
export const sM={background:C.fn,borderRadius:12,padding:"10px 12px",border:`1px solid ${C.bd}`,marginBottom:4};
export const sI={height:42,fontSize:16,border:`1px solid ${C.bd}`,borderRadius:11,padding:"0 12px",outline:"none",boxSizing:"border-box",background:C.cd,color:C.tx,fontFamily:FF};
export const sS={height:42,fontSize:16,border:`1px solid ${C.bd}`,borderRadius:11,padding:"0 10px",background:C.cd,color:C.tx,outline:"none",boxSizing:"border-box",fontFamily:FF};
export const sB=p=>({height:42,fontSize:16,fontWeight:700,border:p?"none":`1px solid ${C.bd}`,borderRadius:11,padding:"0 16px",background:p?C.bl:C.cd,color:p?"#fff":C.sb,cursor:"pointer",fontFamily:FF,boxShadow:p?"0 2px 8px rgba(217,119,87,0.28)":"none",transition:"transform .08s ease, box-shadow .15s ease"});
export const sT=(b,f)=>({fontSize:17,padding:"3px 9px",borderRadius:9,fontWeight:700,background:b,color:f,display:"inline-block"});
export const aBtn={padding:'12px 20px',background:C.bl,color:'#fff',border:'none',borderRadius:12,cursor:'pointer',fontSize:16,fontWeight:700,fontFamily:FF,boxShadow:'0 2px 10px rgba(217,119,87,0.3)'};
export const aInp={width:'100%',height:48,fontSize:16,border:`1px solid ${C.bd}`,borderRadius:12,padding:'0 14px',outline:'none',boxSizing:'border-box',marginBottom:10,fontFamily:FF,background:C.cd,color:C.tx};
export const aPg={minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:C.bg,fontFamily:FF,padding:16};
export const aCd={background:C.cd,borderRadius:24,padding:'2.5rem',width:380,boxShadow:'0 12px 48px rgba(74,58,46,0.12)',border:`1px solid ${C.bd}`};
export const moneyText=(color,size=20)=>({fontSize:size,fontWeight:800,color,whiteSpace:"nowrap",fontVariantNumeric:"tabular-nums",letterSpacing:0,lineHeight:1.12,overflow:"visible"});
export const compactMoney=(color=C.tx)=>({fontWeight:700,color,whiteSpace:"nowrap",fontVariantNumeric:"tabular-nums",letterSpacing:0});
export const kpiBox=(color)=>({...sC,borderLeft:`4px solid ${color}`,marginBottom:0,minHeight:92,display:"flex",flexDirection:"column",justifyContent:"center",overflow:"visible"});
export const metricGrid={display:"grid",gridTemplateColumns:"minmax(0,1fr) 96px 96px 78px 50px",gap:10};
