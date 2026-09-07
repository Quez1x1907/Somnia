"""Install the approved desktop page without altering mobile HTML/CSS/JS."""
from pathlib import Path
import base64, hashlib, json, re, subprocess

payload=json.loads(Path('.github/desktop-release.json').read_text())
assert payload['format']==1
router=payload['router'].encode()
def blob(b):
    return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
originals={name:Path(name).read_bytes() for name in payload['source_blobs']}
base=originals['index.html']
if router in base:
    assert base.count(router)==1
    base=base.replace(router,b'',1)
for name, expected in payload['source_blobs'].items():
    raw=base if name=='index.html' else originals[name]
    assert blob(raw)==expected, f'Source changed: {name}; deployment stopped.'
anchor=b'<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">'
assert base.count(anchor)==1
updated=base.replace(anchor,anchor+router,1)
assert updated.replace(router,b'',1)==base
assert updated.split(b'<body>',1)[1]==base.split(b'<body>',1)[1]
desktop=subprocess.check_output(['node','-e',"const c=[];process.stdin.on('data',d=>c.push(d));process.stdin.on('end',()=>process.stdout.write(require('node:zlib').brotliDecompressSync(Buffer.concat(c))))"],input=base64.b64decode(''.join(payload['desktop_brotli_base64']),validate=True))
assert len(desktop)<150000
assert hashlib.sha256(desktop).hexdigest()==payload['desktop_sha256']
assert b'(min-width: 1024px) and (hover: hover) and (pointer: fine)' in desktop
assert b'noindex' not in desktop
assert 'не опубликован' not in desktop.decode()
for index,code in enumerate(re.findall(r'<script(?:\s[^>]*)?>([\s\S]*?)</script>',desktop.decode())):
    dest=Path(f'/tmp/somnia-script-{index}.js');dest.write_text(code)
    subprocess.run(['node','--check',str(dest)],check=True)
Path('/tmp/somnia-mobile-before.html').write_bytes(base)
Path('desktop.html').write_bytes(desktop)
Path('index.html').write_bytes(updated)
for name in ('styles.css','updates.css','script.js'):
    assert Path(name).read_bytes()==originals[name]
print('PASS: original mobile body, styles and scripts preserved. Desktop router is mouse/large-screen only.')
