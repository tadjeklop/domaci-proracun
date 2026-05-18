// Authentication helpers — password hashing and superadmin bootstrap.

export function sHash(s){let h=0;for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h=h&h}return Math.abs(h).toString(36)+s.length.toString(36)}
export async function hPwd(p,salt){if(typeof crypto!=='undefined'&&crypto.subtle){const d=new TextEncoder().encode(salt+p);const b=await crypto.subtle.digest('SHA-256',d);return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')}return sHash(salt+p+salt)}
export async function ensureSuperadmin(){
  const accs=JSON.parse(localStorage.getItem('dp_accounts')||'[]');
  if(!accs.find(a=>a.username==='Tadej'&&a.role==='superadmin')){
    const salt=Array.from(crypto.getRandomValues(new Uint8Array(16))).join('');
    const hash=await hPwd('Akcija!23',salt);
    const newAccs=accs.filter(a=>a.username!=='Tadej');
    newAccs.push({username:'Tadej',hash,salt,role:'superadmin'});
    localStorage.setItem('dp_accounts',JSON.stringify(newAccs));
  }
}
