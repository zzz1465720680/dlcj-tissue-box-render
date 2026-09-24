from playwright.sync_api import sync_playwright
from pathlib import Path
from urllib.parse import urlsplit
import json,mimetypes,os
ROOT=Path(__file__).resolve().parents[1]/'dist'
OUT=Path(os.environ.get('DINGLI_TEST_OUTPUT', ROOT.parent/'test-results'))
OUT.mkdir(parents=True,exist_ok=True)
ORIGIN='http://127.0.0.1:4174'

def render(page,path):
    page.set_content('<!doctype html><html><head><base href="'+ORIGIN+'/"><link rel="stylesheet" href="'+ORIGIN+'/runtime/base.css"><link rel="stylesheet" href="'+ORIGIN+'/runtime/redesign.css"></head><body><div id="root"></div></body></html>')
    page.evaluate('''path=>{
      const u = new URL(path,'http://127.0.0.1:4174');
      window.__testLocation = {href:u.href,pathname:u.pathname,search:u.search,hash:u.hash,assign:x=>{window.__lastNavigation=x}};
      window.__testHistory = {replaceState:(_a,_b,url)=> {const v=new URL(url,u.href);Object.assign(window.__testLocation,{href:v.href,pathname:v.pathname,search:v.search,hash:v.hash})}};
      window.__testStorage={getItem:k=>window.__memory?.[k]??null,setItem:(k,v)=>{window.__memory??={};window.__memory[k]=v},removeItem:k=>delete window.__memory[k]};
    }''',path)
    page.add_script_tag(content=Path(__file__).with_name('fake-idb.js').read_text())
    page.add_script_tag(type='module',url=ORIGIN+'/app/src/main.js')
    page.wait_for_timeout(1800)

def route(r):
    f=ROOT/urlsplit(r.request.url).path.lstrip('/')
    if not f.is_file():return r.fulfill(status=404,body='Not found')
    data=f.read_bytes()
    if f.suffix=='.js' and '/app/' in r.request.url:
        text=data.decode().replace('window.location','window.__testLocation').replace('window.history','window.__testHistory').replace('window.localStorage','window.__testStorage').replace('localStorage.','window.__testStorage.')
        data=text.encode()
    r.fulfill(status=200,content_type=mimetypes.guess_type(str(f))[0] or 'application/octet-stream',body=data,headers={'Access-Control-Allow-Origin':'*'})

