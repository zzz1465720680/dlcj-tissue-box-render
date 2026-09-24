// Static preview only. Binds to localhost and never writes files or sends designs.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=[path.join(__dirname,'dist'),path.join(__dirname,'..','dist')].find(p=>fs.existsSync(path.join(p,'index.html')));
if(!root){console.error('dist/index.html not found. Build the project or extract the complete preview ZIP.');process.exit(1)}
const port=Number(process.env.PORT||4174);
if(!Number.isInteger(port)||port<1024||port>65535){console.error('PORT must be an integer between 1024 and 65535.');process.exit(1)}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.glb':'model/gltf-binary','.wasm':'application/wasm'};
const server=http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return}
 try{
  const url=new URL(req.url,'http://127.0.0.1');let p=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(p!==root&&!p.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  if(!fs.existsSync(p)||fs.statSync(p).isDirectory()){
   if(path.extname(url.pathname)){res.writeHead(404);res.end('Not found');return}
   p=path.join(root,'index.html');
  }
  const stat=fs.statSync(p);res.writeHead(200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  if(req.method==='HEAD')res.end();else fs.createReadStream(p).on('error',()=>res.destroy()).pipe(res);
 }catch{res.writeHead(400);res.end('Invalid request')}
});
server.on('error',e=>{console.error('Preview server:',e.message,'Set PORT to another free port if needed.');process.exit(1)});
server.listen(port,'127.0.0.1',()=>console.log(`\nDINGLI preview: http://127.0.0.1:${port}/\nEnglish: http://127.0.0.1:${port}/?lang=en\nPress Ctrl+C to stop.\n`));
