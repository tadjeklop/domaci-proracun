// Mini-calculator input: type "23+43+95" and it computes the sum on blur,
// or open the Σ panel to add itemised amounts.

import { useState } from "react";
import { C, sI, sB } from "../lib/styles.js";
import { fmt } from "../lib/helpers.js";

export default function CalcInput({defaultValue,onResult,style:stl,placeholder}){
  const[val,setVal]=useState(defaultValue!=null?String(defaultValue):'');
  const[showCalc,setShowCalc]=useState(false);
  const[items,setItems]=useState([]);
  const[newItem,setNewItem]=useState('');

  const evaluate=(str)=>{
    try{
      const cleaned=String(str).replace(/,/g,'.').replace(/\s/g,'');
      if(!cleaned||/[^0-9+\-*/().]/.test(cleaned))return parseFloat(str)||0;
      let pos=0;
      const peek=()=>cleaned[pos];
      const eat=(ch)=>peek()===ch?(pos++,true):false;
      const number=()=>{
        if(eat('(')){const v=expr();if(!eat(')'))throw new Error(')');return v}
        let start=pos;
        if(peek()==='+'||peek()==='-')pos++;
        while(/[0-9.]/.test(peek()))pos++;
        const v=parseFloat(cleaned.slice(start,pos));
        if(!Number.isFinite(v))throw new Error('number');
        return v;
      };
      const term=()=>{let v=number();for(;;){if(eat('*'))v*=number();else if(eat('/'))v/=number();else return v}};
      const expr=()=>{let v=term();for(;;){if(eat('+'))v+=term();else if(eat('-'))v-=term();else return v}};
      const result=expr();
      if(pos!==cleaned.length)throw new Error('syntax');
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
