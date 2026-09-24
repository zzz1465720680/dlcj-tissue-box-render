const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
let ts;try{ts=require('typescript')}catch{ts=require(process.env.TYPESCRIPT_PATH)}
const root=path.resolve(__dirname,'..');const cache=new Map();
function load(file){
  const f=path.resolve(root,file.endsWith('.ts')?file:file+'.ts');if(cache.has(f))return cache.get(f).exports;
  const mod={exports:{}};cache.set(f,mod);
  const source=ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('exports','require','module',source)(mod.exports,spec=>load(spec.startsWith('@/')?spec.slice(2):path.relative(root,path.resolve(path.dirname(f),spec))),mod);return mod.exports;
}
let cases=[];function test(name,run){try{run();cases.push({name,passed:true})}catch(e){cases.push({name,passed:false,error:e.message});process.exitCode=1}}
let memory={};global.window={location:{pathname:'/customize',search:'?lang=en',hash:''},localStorage:{getItem:k=>memory[k]??null,setItem:(k,v)=>memory[k]=v}};
const i=load('lib/i18n'),d=load('lib/design'),p=load('lib/purchase');
test('explicit English URL wins over Chinese storage',()=>{memory[i.LANGUAGE_KEY]='zh';assert.equal(i.getLang(),'en')});
test('stored language survives a URL without lang',()=>{window.location.search='';memory[i.LANGUAGE_KEY]='en';assert.equal(i.getLang(),'en')});
test('invalid language falls back to preference',()=>{window.location.search='?lang=fr';assert.equal(i.getLang(),'en')});
test('blocked localStorage is safe',()=>{const s=window.localStorage;window.localStorage={getItem(){throw Error()},setItem(){throw Error()}};assert.equal(i.getLang(),'zh');assert.doesNotThrow(()=>i.persistLanguage('en'));window.localStorage=s;window.location.search='?lang=en'});
test('language links retain preset, preview and fragment',()=>{const u=i.localizedHref('/customize?lang=zh&preset=forest-linen&preview=light#parts','en');assert.equal(u,'/customize?lang=en&preset=forest-linen&preview=light#parts')});
test('all original preset names translate for display',()=>{d.PRESETS.forEach(v=>assert.ok(!/[\u4e00-\u9fff]/.test(i.displayDesignName(v.name))))});
test('user authored name is not translated',()=>assert.equal(i.displayDesignName('我的礼物 Hello'),'我的礼物 Hello'));
test('user text substitutions are not reinterpreted',()=>assert.equal(i.t('设计名称：{0}',['我的 {1}']), 'Design name: 我的 {1}'));
for(const q of ['','0','-1','1.5','1e2','Infinity','1000','NaN'])test('quantity rejects '+JSON.stringify(q),()=>assert.equal(p.parseQuantity(q).ok,false));
for(const q of ['1','999',' 24 '])test('quantity accepts '+q,()=>assert.equal(p.parseQuantity(q).ok,true));
test('preset 2 retains original black/coral materials',()=>{const a=d.preset(1);assert.equal(a.parts.body.color,'#273137');assert.equal(a.parts.corner0.edge,'#eb5968')});
test('preset 3 retains green/linen and side label',()=>{const a=d.preset(2);assert.equal(a.parts.body.color,'#365d52');assert.equal(a.parts.corner0.color,'#d5cbb6');assert.equal(a.label.enabled,true)});
test('clone does not mutate original preset',()=>{let a=d.initialDesign(),b=d.cloneDesign(a);b.parts.body.color='#ffffff';assert.notEqual(a.parts.body.color,b.parts.body.color)});
test('summary covers all six individual parts in English',()=>{const a=d.initialDesign();a.parts.corner1.color='#123456';let s=p.summarizeDesign(a);assert.equal(s.parts.length,6);assert.equal(s.parts.find(x=>x.part==='corner1').colorHex,'#123456');assert.ok(!/[\u4e00-\u9fff]/.test(JSON.stringify(s)))});
test('enquiry text is English, with no false order confirmation',()=>{let s=p.buildInquiryText(d.initialDesign(),{quantity:2,note:''},new Date('2026-09-24T00:00:00Z'));assert.ok(!/[\u4e00-\u9fff]/.test(s));assert.ok(s.includes('not an order')||s.includes('not a merchant order'));assert.ok(s.includes('not sent to the maker'))});
test('JSON keeps exact original design including user artwork',()=>{const a=d.preset(2);a.parts.body.art.push({id:'sample',kind:'text',text:'你好 Hello',x:.5,y:.1,scale:.55,rotation:0,color:'#223344'});const b=JSON.parse(p.buildInquiryJson(a,{quantity:3,note:'Hello'},new Date()));assert.deepEqual(b.design,a);assert.equal(b.sent,false)});
test('invalid export quantity is rejected',()=>assert.throws(()=>p.buildInquiryJson(d.initialDesign(),{quantity:0,note:''},new Date())));
test('overlong notes are rejected',()=>assert.throws(()=>p.buildInquiryText(d.initialDesign(),{quantity:1,note:'a'.repeat(301)},new Date())));
test('design change changes signature',()=>{let a=d.initialDesign(),b=d.cloneDesign(a);b.parts.body.color='#123456';assert.notEqual(p.designSignature(a),p.designSignature(b))});
test('quantity and note changes invalidate copied enquiry',()=>{let a=d.initialDesign();assert.notEqual(p.inquiryContentKey(a,'1','a'),p.inquiryContentKey(a,'2','a'));assert.notEqual(p.inquiryContentKey(a,'1','a'),p.inquiryContentKey(a,'1','b'))});
test('all UI files parse; all literal translation keys exist',()=>{
 const EN=load('lib/locale-en').EN;const files=['src/main.tsx','pages/Home.tsx','components/studio.tsx','components/consult-panel.tsx','components/art-editor.tsx','components/product-view.tsx','lib/purchase.ts','lib/local-designs.ts','lib/artwork.ts'];let checked=0;
 for(const file of files){const source=fs.readFileSync(path.join(root,file),'utf8');const sf=ts.createSourceFile(file,source,99,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);assert.equal(sf.parseDiagnostics.length,0,file);const walk=n=>{if(ts.isCallExpression(n)&&['ui','t'].includes(n.expression.getText(sf))&&n.arguments.length&&(ts.isStringLiteral(n.arguments[0])||ts.isNoSubstitutionTemplateLiteral(n.arguments[0]))){const k=n.arguments[0].text.replace(/\s+/g,' ').trim();if(/[\u4e00-\u9fff]/.test(k)){assert.ok(EN[k],`${file}: ${k}`);checked++}}ts.forEachChild(n,walk)};walk(sf)}assert.ok(checked>300);
});
console.log(JSON.stringify({mode:'unit tests; mocked URL/localStorage',passed:cases.filter(t=>t.passed).length,total:cases.length,cases},null,2));
