from pathlib import Path
import urllib.request,urllib.parse,re,json,hashlib,concurrent.futures
root=Path('public');root.mkdir(exist_ok=True)
origin='https://loopproof.me'
seed=Path('/tmp/qofeno-live.html').read_text()
seen=set();pending=set(re.findall(r'(?:src|href)="(/[^"?]+(?:\.js|\.css|\.svg|\.png))',seed))|{'/og-reference.png','/brand/qofeno-icon.svg','/favicon.svg','/apple-touch-icon.png','/discover.xml'}
manifest=[]
def get(path):
 try:
  with urllib.request.urlopen(urllib.request.Request(origin+path,headers={'User-Agent':'Mozilla/5.0'}),timeout=30)as r:
   data=r.read();ctype=r.headers.get('content-type','')
   if 'text/html'in ctype:return(path,None,'unexpected HTML')
   dest=root/path.lstrip('/');dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
   return(path,data,ctype)
 except Exception as e:return(path,None,str(e))
while pending:
 batch=sorted(pending-seen);pending=set()
 if not batch:break
 seen.update(batch)
 with concurrent.futures.ThreadPoolExecutor(max_workers=6)as pool:
  for path,data,ctype in pool.map(get,batch):
   if data is None:print('SKIP',path,ctype);continue
   manifest.append({'path':path,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
   print('Saved',path,len(data))
   if path.endswith(('.js','.css')):
    text=data.decode()
    for raw in re.findall(r'["`\'(]((?:\./|/)?(?:assets/)?[A-Za-z0-9_./-]+\.(?:js|css|woff2?|svg|png|webp|jpg|ico))["`\')]' ,text):
     if raw.startswith('/'):url=raw
     elif raw.startswith('assets/'):url='/'+raw
     else:url=urllib.parse.urljoin(path,raw)
     if '..'not in url:pending.add(url)
Path('docs/recovered-assets.json').write_text(json.dumps(manifest,indent=2))
print('Total',len(manifest))
