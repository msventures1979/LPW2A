"""Build the static LPW2A website (site/) from the design source (src/Main.dc.html).

Usage: python3 build/build.py
"""
import os, re, shutil, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src", "Main.dc.html")
OUT = os.path.join(ROOT, "site")

BLOBS = {
    "dbd9aafdab6fb9e5ca1de36d28c9b935": "assets/img/titelbild.jpg",
    "f3f0df29fd31b217800cacc33d300b25": "assets/img/innenhof.jpg",
    "1fd1cc9bfe6428aee618de1f76850565": "assets/img/vogelperspektive.jpg",
    "25363ca461a28da53ddb15488d90f2c4": "assets/img/luftbild.jpg",
    "91e045fed482a032d68859634c02b3bd": "assets/fonts/big-shoulders-display-600.woff2",
    "8e34c512516c235df320f43a9a63228d": "assets/fonts/big-shoulders-display-800.woff2",
    "66e97ab69dc5da67e98b945852482f26": "assets/fonts/big-shoulders-display-900.woff2",
    "6a6d01afbd125147c8730b728ed01c9d": "assets/fonts/instrument-sans-400.woff2",
    "730e5d3cea855f9e75e4f3347d6caf3d": "assets/fonts/instrument-sans-500.woff2",
    "8a03e8173f881ae7b2a425df6657065d": "assets/fonts/instrument-sans-600.woff2",
    "90f3d79e4e1288bf03bc72835f41ac77": "assets/fonts/ibm-plex-mono-400.woff2",
    "084151171e8916ead0fbd0552e9a70dd": "assets/fonts/ibm-plex-mono-500.woff2",
}

TITLE = "LPW2A – Wohnen am Lagerplatzweg, Ludwigshafen"
DESC = ("15 neue Mietwohnungen am Lagerplatzweg 2a in Ludwigshafen-West: 2 und 3 Zimmer, 55–71 m², "
        "Loggia oder Dachterrasse, Effizienzhaus 55, Aufzug. Bezug ab November 2027.")


def main():
    s = open(SRC, encoding="utf-8").read()
    helmet = re.search(r"<helmet>(.*?)</helmet>", s, re.S).group(1)
    body = re.search(r"</helmet>(.*?)</x-dc>", s, re.S).group(1)
    script = re.search(r"<script[^>]*data-dc-script[^>]*>(.*?)</script>", s, re.S).group(1)

    def blob(m):
        return BLOBS[m.group(1)]
    helmet = re.sub(r"/_blob/([0-9a-f]{32})", blob, helmet)
    body = re.sub(r"/_blob/([0-9a-f]{32})", blob, body)
    left = re.findall(r"/_blob/[0-9a-f]{32}", helmet + body)
    assert not left, left

    # PDFs: served as files from the repo
    old = "pdf: '/_blob/' + PDFS[cur.label],"
    assert old in script
    script = script.replace(old, "pdf: 'assets/pdf/LPW2A_Grundriss_' + cur.label.replace(' ', '_') + '.pdf',")

    html = f"""<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{TITLE}</title>
<meta name="description" content="{DESC}">
<meta name="robots" content="noindex, nofollow">
<meta property="og:type" content="website">
<meta property="og:title" content="{TITLE}">
<meta property="og:description" content="{DESC}">
<meta property="og:image" content="assets/img/titelbild.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='4' fill='%23121618'/%3E%3Ctext x='16' y='22' font-family='Arial' font-weight='900' font-size='13' text-anchor='middle' fill='%23C9DC94'%3ELPW%3C/text%3E%3C/svg%3E">
{helmet.strip()}
<style>html{{scroll-behavior:smooth}}</style>
</head>
<body>
<div id="app"></div>
<template id="tpl">{body}</template>
<script src="runtime.js"></script>
<script>
{script}
mountPage(Component, document.getElementById('tpl'), document.getElementById('app'));
</script>
</body>
</html>
"""
    os.makedirs(OUT, exist_ok=True)
    open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(html)
    shutil.copy(os.path.join(ROOT, "build", "runtime.js"), os.path.join(OUT, "runtime.js"))
    print("site/index.html", len(html))


if __name__ == "__main__":
    main()
