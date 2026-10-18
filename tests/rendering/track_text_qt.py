"""Optional Qt pixel check for full-width dial text and key backdrops.

QT_QPA_PLATFORM=offscreen python3 tests/rendering/track_text_qt.py
Requires PySide6-Essentials, verified with 6.10.3.
"""
import base64
import json
from pathlib import Path
import subprocess

from PySide6.QtCore import QByteArray, QRectF, Qt, qVersion
from PySide6.QtGui import QColor, QFont, QGuiApplication, QImage, QPainter
from PySide6.QtSvg import QSvgRenderer

ROOT = Path(__file__).resolve().parents[2]
app = QGuiApplication([])
result = subprocess.run(['node', '-e', r"""
const fs = require('node:fs'), vm = require('node:vm');
const { keyTextBackground } = require('./streamdeck/src/key-background.cjs');
const source = fs.readFileSync('streamdeck/src/plugin.cjs', 'utf8');
const renderer = source.slice(source.indexOf('function renderCurrentTrackDial('), source.indexOf('function showAlert('));
const text = source.slice(source.indexOf('const segmenter ='), source.indexOf('const COVERS ='));
const displayed = new Map(); let feedback, clock = 1000;
const ctx = vm.createContext({ Intl, Buffer, sdOnline: true, displayed, cachedCoverUrl: '', cachedCoverData: '',
  fitDialArtwork: () => '', keyTextBackground, Date: { now: () => clock }, MARQUEE_WIDTH: 11, MARQUEE_STEP_MS: 380,
  tr: x => x, ellipsis: x => x, setImage() {}, sendStream: async () => {}, setFeedback: async (_, value) => { feedback = value; } });
vm.runInContext(text + renderer + '\nthis.render = renderCurrentTrackDial; this.marquee = marquee;', ctx);
(async () => {
  const title = 'abcdefghijklmnopqrstuvwxyz0123456789'.repeat(2);
  const state = { title, artist: 'Artist ' + title };
  const frames = [];
  for (const position of ['inline', 'below']) {
    const item = { settings: { dialDisplay: 'artwork', artworkShowTitle: true, artworkShowArtist: true,
      artworkArtistPosition: position, artworkTitleMode: 'scroll' } };
    displayed.set('dial', item); clock = 1000;
    for (const at of [1000, 2520]) {
      clock = at; ctx.render('dial', item, state); await item.feedbackQueue;
      frames.push(feedback);
    }
  }
  console.log(JSON.stringify({ frames, old: ctx.marquee(title, 1000, 1000, 14),
    backdrops: [1, 2].map(lines => keyTextBackground(null, lines)) }));
})().catch(e => { console.error(e); process.exitCode = 1; });
"""], cwd=ROOT, text=True, capture_output=True, check=True)
data = json.loads(result.stdout)
layout = json.loads((ROOT / 'streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/layouts/current-track-artwork.json').read_text())
fields = {item['key']: item for item in layout['items']}


def pixels(text, rect):
    image = QImage(200, 100, QImage.Format.Format_ARGB32)
    image.fill(0)
    painter = QPainter(image)
    painter.setClipRect(QRectF(*rect))
    font = QFont('DejaVu Sans')
    font.setPixelSize(14)
    font.setWeight(QFont.Weight.DemiBold)
    painter.setFont(font)
    painter.setPen(QColor('white'))
    painter.drawText(QRectF(*rect), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter | Qt.TextFlag.TextSingleLine, text)
    painter.end()
    return [x for x in range(200) for y in range(100) if image.pixelColor(x, y).alpha() > 0]


old_edge = max(pixels(data['old'], fields['songName']['rect']))
assert old_edge < 145, old_edge
print(f'Legacy 14-glyph frame ends at x={old_edge}')
for index, feedback in enumerate(data['frames']):
    for name in ['songName', 'songTitleAbove', 'songArtist']:
        field = feedback[name]
        if not field['enabled']:
            continue
        edge = max(pixels(field['value'], fields[name]['rect']))
        assert edge >= 190, (index, name, edge)
        print(f'Frame {index} {name}: text reaches x={edge} in the 200 px field')
for lines, uri in enumerate(data['backdrops'], start=1):
    svg = base64.b64decode(uri.split(',')[1])
    renderer = QSvgRenderer(QByteArray(svg))
    assert renderer.isValid()
    image = QImage(144, 144, QImage.Format.Format_ARGB32)
    image.fill(0)
    painter = QPainter(image)
    renderer.render(painter)
    painter.end()
    assert image.pixelColor(72, 140) == QColor('black')
    if lines == 2:
        assert image.pixelColor(72, 100) == QColor('black')
    else:
        assert image.pixelColor(72, 100) != QColor('black')
    print(f'Key {lines}-line backdrop: expected black band rendered')
print(f'Qt {qVersion()}: text and backdrop checks passed')
