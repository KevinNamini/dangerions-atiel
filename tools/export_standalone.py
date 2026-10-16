#!/usr/bin/env python3
"""Create a portable, offline-capable HTML version of the current public snapshot."""
from pathlib import Path
import base64,json,mimetypes,re,sys
ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
def uri(relative):
    path=(DIST/relative).resolve()
    if not path.is_relative_to(DIST.resolve()):raise ValueError('Asset outside site')
    mime=mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
    return 'data:'+mime+';base64,'+base64.b64encode(path.read_bytes()).decode()
def inline_css(filename):
    css=(DIST/filename).read_text()
    return re.sub(r'url\([\'\"]?([^\)\'\"]+)[\'\"]?\)',lambda m:'url("'+uri(m[1])+'")',css)
def export(target):
    html=(DIST/'index.html').read_text()
    for name in ['fonts.css','style.css','chronicle.css','rank-motion.css']:
        html=html.replace('<link rel="stylesheet" href="'+name+'">','<style>'+inline_css(name)+'</style>')
    dataset=json.loads((ROOT/'data/history.json').read_text())
    for player in dataset['players']:player['avatar']=uri(player['avatar'])
    script='window.DANGERIONS_DATA='+json.dumps(dataset,ensure_ascii=False).replace('<','\\u003c')+';\n'+(DIST/'progress.js').read_text()+';\n'+(DIST/'chronicle.js').read_text()+';\n'+(DIST/'app.js').read_text()
    html=html.replace('<script src="data.js" defer></script>','').replace('<script src="progress.js" defer></script>','').replace('<script src="chronicle.js" defer></script>','').replace('<script src="app.js" defer></script>','')
    html=html.replace('src="assets/crest.svg"','src="'+uri('assets/crest.svg')+'"').replace('href="assets/crest.svg"','href="'+uri('assets/crest.svg')+'"')
    html=html.replace('</body>','<script>'+script.replace('</script','<\\/script')+'</script></body>')
    notices='\n\n'.join(path.read_text() for path in sorted((ROOT/'licenses').glob('*.txt')))
    html=html.replace('</body>','<script type="text/plain" id="font-license-notices">'+notices.replace('</script','<\\/script')+'</script></body>')
    target=Path(target);target.parent.mkdir(parents=True,exist_ok=True);target.write_text(html)
    print(f'Exported {target.name}: {target.stat().st_size:,} bytes')
if __name__=='__main__':export(sys.argv[1] if len(sys.argv)>1 else ROOT/'Dangerions.html')
