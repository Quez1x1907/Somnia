from pathlib import Path
import urllib.request, hashlib, base64
BASE = 'https://somnia-guild.pages.dev/'
EXPECTED = {
 'index.html': '7b09d1e6278616ecdc316ec1f82c2a6b3c6b83ae',
 'styles.css': '740923f118223beaeab68c75eef198014a66accc',
 'script.js': '67aed289ca957154ec9553753f0c4cc98c5c6e2c',
 'assets/about-bg.jpg': 'd19396823629f3eaaeb6b5d2194702ca96375bb6',
 'assets/apple-touch-icon.png': '326e8ab0cfd47210c2f68c38f57086a4fbd095d4',
 'assets/branch.jpg': '68c100db1179e306375adedb26499b8372479550',
 'assets/emblem.png': '546c16680990a392c1d68c1e812b7c3ea196edbb',
 'assets/favicon.png': '531a68f54994bd2a5d52d5862d9f0defdd9e5ec9',
 'assets/og.jpg': 'a60808ba0841efe7f8a01b96e9f8625f3e803a6f',
}
for name, expected in EXPECTED.items():
    path = Path(name)
    if path.exists():
        raise RuntimeError('Refusing to overwrite existing site: ' + name)
    print('Copying', name, flush=True)
    url = BASE if name == 'index.html' else BASE + name
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Accept': '*/*'})
    data = urllib.request.urlopen(request, timeout=30).read()
    sha = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
    if sha != expected:
        raise RuntimeError('Deployed file differs from original repository: ' + name)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
Path('assets/hero-photo.webp').write_bytes(base64.b64decode(Path('.github/hero-photo.b64').read_text().strip(), validate=True))
html = Path('index.html').read_text()
html = html.replace('src="assets/branch.jpg"', 'src="assets/hero-photo.webp" width="400" height="418" fetchpriority="high"')
html = html.replace('  <link rel="stylesheet" href="styles.css">', '  <link rel="stylesheet" href="styles.css">\n  <link rel="stylesheet" href="updates.css">')
html = html.replace('Один шаг: напиши человеку, который отвечает за набор. Расскажешь немного о себе — и получишь приглашение.', 'Один шаг: напиши лидеру или офицеру гильдии. Расскажешь немного о себе — и обсудим вступление.')
needle = '            <a class="btn btn--ghost btn--lg" href="https://t.me/somni1aa"'
assert html.count(needle) == 1
html = html.replace(needle, '            <a class="btn btn--ghost btn--lg" href="https://t.me/ssh1ck" target="_blank" rel="noopener">Офицер гильдии — @ssh1ck</a>\n' + needle)
needle = '          Вступление — @damn1luck\n        </a>'
assert html.count(needle) == 1
html = html.replace(needle, needle + '\n        <a href="https://t.me/ssh1ck" target="_blank" rel="noopener">\n          <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" d="M4 6h16v12H4zM4 7l8 6 8-6"/></svg>\n          Офицер гильдии — @ssh1ck\n        </a>')
Path('index.html').write_text(html)
js = Path('script.js').read_text().replace('if (heroBg && !reduceMotion) {', 'if (heroBg && !reduceMotion && window.matchMedia("(min-width: 760px)").matches) {')
Path('script.js').write_text(js)
print('Verified original files copied; photo and officer contact applied.')
