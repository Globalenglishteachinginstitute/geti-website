from pathlib import Path
from urllib.parse import quote
from html import escape
base = "https://getienglish.com"
names = sorted(p.name for p in Path("gallery/images").iterdir() if p.is_file() and p.suffix.lower() in {".jpg",".jpeg",".png",".webp",".gif",".avif"})
page = Path("photos/index.html")
old = page.read_text(encoding="utf-8")
cards = []
for name in names:
    url = "/gallery/images/" + quote(name)
    title = Path(name).stem.replace("_"," ").replace("-"," ")
    cards.append(f'<figure><a href="{url}"><img src="{url}" alt="{escape("GETI Global English Teaching Institute – "+title, quote=True)}" loading="lazy"></a><figcaption>{escape(title)}</figcaption></figure>')
start = '<div class="grid">'
page.write_text(old.split(start,1)[0]+start+"\n".join(cards)+"</div></main></body></html>\n", encoding="utf-8")
xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"><url><loc>'+base+'/photos/</loc>'+"\n".join('<image:image><image:loc>'+base+'/gallery/images/'+quote(n)+'</image:loc></image:image>' for n in names)+'</url></urlset>\n'
Path("image-sitemap.xml").write_text(xml, encoding="utf-8")
