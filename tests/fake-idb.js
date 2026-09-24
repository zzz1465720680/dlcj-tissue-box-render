/* Test double for blocked browser storage in the embedded renderer. NOT shipped in the site. */
window.__databases = window.__databases || {};
Object.defineProperty(window,'indexedDB',{configurable:true,value:{open(name,version){
 const r={}; setTimeout(()=>{
  if(window.__storageDenied){r.error=new Error('Storage unavailable for test');r.onerror?.();return;}
  const created=!window.__databases[name];const data=window.__databases[name]??={};
  const db={createObjectStore:(n,options={})=>{data[n]??={options,records:{}};},close(){},transaction(n,mode){
   const tx={};tx.objectStore=(n)=>({
    get:(key)=>req(()=>data[n].records[key]),
    getAll:()=>req(()=>Object.values(data[n].records)),
    add:(value)=>req(()=>{data[n].records[value[data[n].options.keyPath]]=structuredClone(value);return value[data[n].options.keyPath]}),
    put:(value,key)=>req(()=>{data[n].records[key]=structuredClone(value);return key})
   });
   function req(action){const request={};setTimeout(()=>{try{if(window.__storageDenied)throw new Error('Storage unavailable for test');request.result=structuredClone(action());request.onsuccess?.();setTimeout(()=>tx.oncomplete?.(),0)}catch(e){request.error=e;tx.error=e;request.onerror?.();tx.onerror?.()}},0);return request;}
   return tx;
  }};
  r.result=db;if(created)r.onupgradeneeded?.();r.onsuccess?.();
 },0);return r;
}}});
if(!crypto.randomUUID)crypto.randomUUID=()=> 'test-'+Array.from(crypto.getRandomValues(new Uint32Array(4)),n=>n.toString(16)).join('-');
