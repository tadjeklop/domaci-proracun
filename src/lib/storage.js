// Backup, restore, backup-due check, encrypted debug bundle, profile init.

import { ld } from "./helpers.js";
import { PROF_TEMPLATES } from "./constants.js";

export function initProfiles(){const saved=ld('dp_profiles',null);if(saved&&saved.length>0)return saved;const myPlan={id:'moj_plan',name:'Moj plan',isDefault:true,budget:ld('dp_mb',3600),bPct:ld('dp_pct',{}),pMd:ld('dp_pm',{}),pFx:ld('dp_pf',{}),nepPct:ld('dp_neppct',5),nepMd:ld('dp_nepmd','pct'),nepFx:ld('dp_nepfx',150)};return[myPlan,...PROF_TEMPLATES];}

export async function downloadEncryptedDebugBundle(password){
  if(!password||password.length<8)throw new Error("Geslo mora imeti vsaj 8 znakov.");
  const enc=new TextEncoder();
  const keyRaw=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:120000,hash:'SHA-256'},keyRaw,{name:'AES-GCM',length:256},false,['encrypt']);
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const data={createdAt:new Date().toISOString(),app:"domaci-proracun",localStorage:{}};
  Object.keys(localStorage).filter(k=>k.startsWith('dp_')).forEach(k=>{data.localStorage[k]=localStorage.getItem(k)});
  const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(JSON.stringify(data)));
  const b64=a=>btoa(String.fromCharCode(...new Uint8Array(a)));
  const payload={version:1,algorithm:"AES-GCM/PBKDF2-SHA256",iterations:120000,salt:b64(salt),iv:b64(iv),data:b64(cipher)};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=`debug-encrypted-${new Date().toISOString().slice(0,10)}.json`;a.click();
  URL.revokeObjectURL(url);
}

export function createBackup(){
  const backup={version:2,date:new Date().toISOString(),data:{}};
  const keys=Object.keys(localStorage).filter(k=>k.startsWith('dp_'));
  keys.forEach(k=>{
    const v=localStorage.getItem(k);
    if(v==null)return;
    try{backup.data[k]=JSON.parse(v)}
    catch{backup.data[k]=v}
  });
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=`proracun-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();URL.revokeObjectURL(url);
}
export function restoreBackup(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const backup=JSON.parse(reader.result);
        if(!backup.version||!backup.data){reject('Neveljavna datoteka.');return}
        Object.entries(backup.data).forEach(([k,v])=>{localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v))});
        resolve(`Obnovljeno iz varnostne kopije (${backup.date}).`);
      }catch(e){reject('Napaka pri branju: '+e.message)}
    };
    reader.onerror=()=>reject('Napaka pri branju datoteke.');
    reader.readAsText(file);
  });
}
export function checkBackupDue(){
  const last=localStorage.getItem('dp_lastbackup');
  if(!last)return true;
  const diff=Date.now()-parseInt(last);
  return diff>14*24*60*60*1000; // 14 days
}
