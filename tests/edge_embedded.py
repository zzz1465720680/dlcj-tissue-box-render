import re
from harness import *
import base64,hashlib
from playwright.sync_api import expect
cases=[]
def check(name,ok):cases.append({'name':name,'passed':bool(ok)});print('PASS' if ok else 'FAIL',name,flush=True)
def draft(pg):return pg.evaluate("window.__databases?.['dlcj-drafts']?.drafts?.records?.current")
def close(pg):pg.keyboard.press('Escape');pg.wait_for_timeout(100)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_BINARY'),headless=True,args=['--no-sandbox'])
 pg=b.new_page(viewport={'width':1440,'height':1000});pg.set_default_timeout(5000);pg.emulate_media(reduced_motion='reduce');pg.route(ORIGIN+'/**',route);render(pg,'/customize?lang=en&preview=light');
 pg.get_by_role('button',name='Export design',exact=True).click()
 try:
  with pg.expect_download(timeout=5000) as d:pg.get_by_role('button',name=re.compile('Editable design file')).click()
  download=d.value;path=download.path();value=json.loads(Path(path).read_text());check('Editable JSON actually downloads in Chromium',value['design']['version']==1)
 except Exception as e:
  value=None;check('Editable JSON actually downloads in Chromium',False);print(e)
 if value is None:
  from urllib.parse import unquote
  href=pg.get_by_role('link',name='Download JSON design',exact=True).get_attribute('href');value=json.loads(unquote(href.split(',',1)[1]))
 check('JSON export preserves original schema and all six parts',len(value['design']['parts'])==6)
 close(pg)
 value['design']['name']='Imported original-format design';value['design']['parts']['corner2']['color']='#102030'
 field=pg.locator('input[accept="application/json,.json"]')
 field.set_input_files({'name':'roundtrip.json','mimeType':'application/json','buffer':json.dumps(value).encode()});pg.wait_for_timeout(500)
 check('Old-format JSON roundtrip preserves independent corner',draft(pg)['parts']['corner2']['color']=='#102030')
 previous=draft(pg)
 field.set_input_files({'name':'invalid.json','mimeType':'application/json','buffer':b'{"design":{"version":999}}'});pg.wait_for_timeout(300)
 check('Invalid JSON is rejected without changing draft',draft(pg)==previous)
 pg.get_by_role('tab',name='Artwork',exact=True).click()
 iminput=pg.locator('.art-editor input[type=file]')
 iminput.set_input_files({'name':'bad.svg','mimeType':'image/svg+xml','buffer':b'<svg></svg>'});pg.wait_for_timeout(250)
 check('Unsupported SVG upload rejected',len(draft(pg)['parts']['body']['art'])==0)
 iminput.set_input_files({'name':'broken.png','mimeType':'image/png','buffer':b'not a png'});pg.wait_for_timeout(250)
 check('Unreadable image displays English error',pg.get_by_text('The image could not be read.',exact=True).count()>0)
 pg.get_by_role('button',name='Save design',exact=True).click();pg.locator('#designName').fill('Saved once');pg.get_by_role('button',name='Save in this browser',exact=True).click();pg.wait_for_timeout(150);pg.locator('#designName').fill('Another name')
 check('Changing the name after save enables saving again',pg.get_by_role('button',name='Save in this browser',exact=True).is_enabled());close(pg)
 pg.close()
 # Test a script-load failure: original React error boundary, no replacement UI.
 pg=b.new_page(viewport={'width':390,'height':844});pg.route(ORIGIN+'/**',route);pg.route(ORIGIN+'/app/components/studio.js',lambda r:r.abort());render(pg,'/customize?lang=en')
 check('Studio chunk failure provides localized recovery',pg.get_by_text('The studio could not load',exact=True).count()==1 and pg.get_by_role('link',name='Try again',exact=True).count()==1)
 pg.close()
 b.close()
(OUT/'edge-results.json').write_text(json.dumps({'mode':'Embedded Chromium; original application code with simulated browser URL/storage boundary','passed':sum(x['passed'] for x in cases),'total':len(cases),'cases':cases},ensure_ascii=False,indent=2))

raise SystemExit(0 if all(case['passed'] for case in cases) else 1)
