/**
 * Offline deployment builder for the uploaded production snapshot.
 * Application TSX is recompiled; precompiled third-party / 3D modules are reused.
 * This is NOT a substitute for `npm ci && npm run build` verification.
 * Guarded engine/UI files must remain byte-identical to manifest.json.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
let ts;
try { ts = require('typescript'); }
catch { if (!process.env.TYPESCRIPT_PATH) throw new Error('TypeScript required. Run npm ci, or set TYPESCRIPT_PATH to the installed TypeScript module.'); ts = require(process.env.TYPESCRIPT_PATH); }
const root = path.resolve(__dirname, '..');
const target = path.join(root, 'dist');
const runtime = path.join(root, 'vendor', 'offline-runtime');
const manifest = JSON.parse(fs.readFileSync(path.join(runtime, 'manifest.json'), 'utf8'));
const hash = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
for (const [file, digest] of Object.entries(manifest.files)) {
  if (hash(path.join(root, file)) !== digest) throw new Error(`Offline snapshot mismatch: ${file}. Use the normal Vite build after editing engine/dependency wrappers.`);
}
fs.rmSync(target, {recursive: true, force: true});
fs.mkdirSync(path.join(target, 'runtime'), {recursive: true});
fs.cpSync(path.join(root, 'public'), target, {recursive: true});
const put = (file, text) => { const p = path.join(target, file); fs.mkdirSync(path.dirname(p), {recursive:true}); fs.writeFileSync(p, text); };
const indexName = 'index-BBiH8-aW.js', studioName = 'studio-BSbKHWnv.js';
let index = fs.readFileSync(path.join(runtime, indexName), 'utf8');
const mount = '(0,le.createRoot)(document.getElementById(`root`)).render((0,O.jsx)(we,{}));';
if (!index.includes(mount)) throw new Error('Unexpected original bootstrap; refusing an unsafe rewrite.');
index = index.replace(mount, '');
index += '\nexport {S as __React, O as __JSX, le as __ReactDOM, w as ArrowUpRight, ie as Check, ae as ChevronRight, oe as ClipboardCopy, se as MessageSquare, ce as Phone};\n';
put('runtime/'+indexName, index);
let studio = fs.readFileSync(path.join(runtime, studioName), 'utf8');
const sf = ts.createSourceFile('studio.js', studio, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const localized = ['Ep', 'up']; // Engine component UI and image-loading failure, never serialized design data.
const printer = ts.createPrinter({removeComments:false});
const replacements=[];
for (const st of sf.statements) if (ts.isFunctionDeclaration(st) && localized.includes(st.name.text)) {
  const transformed=ts.transform(st,[ctx=>{
    const F=ctx.factory;
    const call=(text,values=[])=>F.createCallExpression(F.createIdentifier('__dingliT'),undefined,[F.createStringLiteral(text),...(values.length?[F.createArrayLiteralExpression(values)]:[])]);
    const visit=n=>{
      if(ts.isTemplateExpression(n)) { let key=n.head.text; n.templateSpans.forEach((s,i)=>key+='{'+i+'}'+s.literal.text); if(/[\u4e00-\u9fff]/.test(key))return call(key,n.templateSpans.map(s=>ts.visitNode(s.expression,visit))); }
      if((ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n))&&/[\u4e00-\u9fff]/.test(n.text))return call(n.text);
      return ts.visitEachChild(n,visit,ctx);
    }; return n=>ts.visitNode(n,visit);
  }]);
  replacements.push([st.getStart(), st.getEnd(), printer.printNode(ts.EmitHint.Unspecified, transformed.transformed[0],sf)]);transformed.dispose();
}
if(replacements.length!==localized.length)throw new Error('Original renderer functions could not be located.');
for(const [start,end,text] of replacements.sort((a,b)=>b[0]-a[0])) studio=studio.slice(0,start)+text+studio.slice(end);
const runtimeExports = {
 ProductView:'Ep',loadArt:'up',paintArtwork:'dp',designSchema:'Cw',
 Slider:'Ex',Switch:'Dx',Input:'Ox',Tabs:'Fw',TabsList:'Lw',TabsTrigger:'Rw',TabsContent:'zw',
 Dialog:'Bw',DialogContent:'Uw',DialogTitle:'Ww',DialogDescription:'Gw',Toaster:'Xw',toast:'Gx',
 Bookmark:'_',Box:'v',Download:'b',Eraser:'x',Eye:'S',FileJson:'C',FileUp:'w',FolderOpen:'T',ImageDown:'E',ImagePlus:'D',Layers:'k',LoaderCircle:'A',Maximize2:'j',Minus:'ee',Move:'M',Paintbrush:'N',Palette:'P',PenLine:'ne',Plus:'re',Redo2:'ie',Rotate3D:'ae',RotateCcw:'F',Scissors:'oe',Send:'se',SplitSquareHorizontal:'ce',Tag:'le',Trash2:'I',Type:'de',Undo2:'fe',X:'pe'
};
const named = Object.entries(runtimeExports).map(([a,b])=>`${b} as ${a}`).join(',');
studio = "import {t as __dingliT} from '../app/lib/i18n.js';\n"+studio+`\nexport {${named}};\n`;
put('runtime/'+studioName,studio);
fs.copyFileSync(path.join(runtime,'meshopt_decoder.module-DXTYc6wn.js'),path.join(target,'runtime','meshopt_decoder.module-DXTYc6wn.js'));
fs.copyFileSync(path.join(runtime,'index-CvaNqkZG.css'),path.join(target,'runtime','base.css'));
const hooks=['Children','Component','Fragment','Profiler','PureComponent','StrictMode','Suspense','cloneElement','createContext','createElement','createRef','forwardRef','isValidElement','lazy','memo','startTransition','use','useActionState','useCallback','useContext','useDebugValue','useDeferredValue','useEffect','useId','useImperativeHandle','useInsertionEffect','useLayoutEffect','useMemo','useOptimistic','useReducer','useRef','useState','useSyncExternalStore','useTransition','version'];
put('runtime/react.js',`import {__React as React} from './${indexName}';\nexport default React;\nexport const {${hooks.join(',')}} = React;\n`);
put('runtime/react-jsx.js',`import {__JSX as JSX} from './${indexName}';\nexport const {jsx,jsxs,Fragment}=JSX;\n`);
put('runtime/react-dom-client.js',`import {__ReactDOM as DOM} from './${indexName}';\nexport const {createRoot,hydrateRoot}=DOM;\n`);
const icons=Object.keys(runtimeExports).slice(Object.keys(runtimeExports).indexOf('Bookmark'));
put('runtime/lucide.js',`export {ArrowUpRight,Check,ChevronRight,ClipboardCopy,MessageSquare,Phone} from './${indexName}';\nexport {${icons.join(',')}} from './${studioName}';\n`);
const bridges = {
 'components/product-view':`export {ProductView as default,loadArt,paintArtwork} from '/runtime/${studioName}';`,
 'lib/schema':`export {designSchema} from '/runtime/${studioName}';`,
 'components/ui/slider':`export {Slider} from '/runtime/${studioName}';`,
 'components/ui/switch':`export {Switch} from '/runtime/${studioName}';`,
 'components/ui/input':`export {Input} from '/runtime/${studioName}';`,
 'components/ui/tabs':`export {Tabs,TabsList,TabsTrigger,TabsContent} from '/runtime/${studioName}';`,
 'components/ui/dialog':`export {Dialog,DialogContent,DialogTitle,DialogDescription} from '/runtime/${studioName}';`,
 'components/ui/sonner':`export {Toaster} from '/runtime/${studioName}';`
};
const external={react:'/runtime/react.js','react/jsx-runtime':'/runtime/react-jsx.js','react-dom/client':'/runtime/react-dom-client.js','lucide-react':'/runtime/lucide.js',sonner:'/runtime/sonner.js'};
put('runtime/sonner.js',`export {toast,Toaster} from './${studioName}';`);
let built = new Set(); let diagnostics=[];
function compile(file) {
 file=file.replace(/\.(tsx?|js)$/, ''); if(built.has(file))return; built.add(file);
 if(bridges[file]) {put('app/'+file+'.js',bridges[file]);return;}
 const full=['.tsx','.ts'].map(x=>path.join(root,file+x)).find(x=>fs.existsSync(x));
 if(!full)throw new Error('Missing application source: '+file);
 let source=fs.readFileSync(full,'utf8').replace(/import\s+['"][^'"]+\.css['"];?/g,'').replace(/process\.env\.NODE_ENV/g,'"production"');
 const result=ts.transpileModule(source,{fileName:full,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,isolatedModules:true}});
 diagnostics.push(...(result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error));
 const deps=[];
 const rewrite=(spec)=> {
   if(external[spec])return external[spec];
   const local=spec.startsWith('@/')?spec.slice(2):spec.startsWith('.')?path.posix.normalize(path.posix.join(path.posix.dirname(file),spec)):null;
   if(!local)throw new Error(`Unsupported package ${spec} in ${file}. Use the normal Vite build.`);
   const normalized=local.replace(/\.(tsx?|js)$/,''); deps.push(normalized); return '/app/'+normalized+'.js';
 };
 let output=result.outputText.replace(/(from\s*|import\s*\(\s*)(['"])([^'"\n]+)\2/g,(_m,p,q,s)=>p+q+rewrite(s)+q);
 put('app/'+file+'.js',output);
 deps.forEach(compile);
}
compile('src/main');
if(diagnostics.length)throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:x=>x,getCurrentDirectory:()=>root,getNewLine:()=> '\n'}));
fs.copyFileSync(path.join(root,'styles/redesign.css'),path.join(target,'runtime/redesign.css'));
put('index.html',`<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#233e2d"><meta name="description" content="鼎立车眷 · 皮革纸巾盒配色与定制预览"><title>鼎立车眷 · 定制纸巾盒</title><link rel="icon" type="image/svg+xml" href="/brand/dc-logo.svg"><link rel="stylesheet" href="/runtime/base.css"><link rel="stylesheet" href="/runtime/redesign.css"></head><body><div id="root"></div><noscript>请启用 JavaScript 以使用配色定制。 / Enable JavaScript to use the custom studio.</noscript><script type="module" src="/app/src/main.js"></script></body></html>`);
put('BUILD-INFO.json',JSON.stringify({method:'offline-runtime-reuse',application:'updated-original-source',typescript:ts.version,standardViteBuildVerified:false,compiledModules:[...built].sort(),snapshot:manifest.snapshot},null,2));
console.log(`Offline deployment generated: ${built.size} application modules. Vite/npm build NOT run by this command.`);
