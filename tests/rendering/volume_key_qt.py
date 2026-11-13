"""Check generated numeric key SVGs in Qt, not on a physical Stream Deck.

Requires PySide6-Essentials. Optional --font arguments register local font files;
--output-dir saves sample renderings for visual inspection.
"""
import argparse
import base64
import json
from pathlib import Path
import subprocess

from PySide6.QtCore import QByteArray, QRectF, qVersion
from PySide6.QtGui import QColor, QFontDatabase, QGuiApplication, QImage, QPainter
from PySide6.QtSvg import QSvgRenderer

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--font', type=Path, action='append', default=[])
parser.add_argument('--output-dir', type=Path)
args = parser.parse_args()
app = QGuiApplication([])
for font in args.font:
    assert QFontDatabase.addApplicationFont(str(font)) >= 0, font
root = Path(__file__).resolve().parents[2]
result = subprocess.run(['node', '-e', """
const { volumeKeyImage } = require('./streamdeck/src/volume-key-image.cjs');
console.log(JSON.stringify(Array.from({length:101}, (_, value) => [false, true].map(percent => volumeKeyImage(value, percent)))));
"""], cwd=root, capture_output=True, text=True, check=True)
background = QImage(str(root / 'streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/imgs/actions/volume/level@2x.png'))
assert not background.isNull()
for volume, variants in enumerate(json.loads(result.stdout)):
    for percent, uri in enumerate(variants):
        svg = QSvgRenderer(QByteArray(base64.b64decode(uri.split(',')[1])))
        assert svg.isValid(), volume
        for size in (72, 144):
            image = QImage(size, size, QImage.Format.Format_ARGB32)
            image.fill(QColor('black'))
            painter = QPainter(image)
            svg.render(painter, QRectF(0, 0, size, size))
            painter.end()
            points = [(x, y) for y in range(size) for x in range(size)
                      if min(image.pixelColor(x, y).getRgb()[:3]) > 235]
            assert points, (volume, size, 'missing digits')
            # All foreground pixels must remain within the original circular disc.
            assert all((x / size - .5) ** 2 + (y / size - 252 / 512) ** 2 < .34 ** 2
                       for x, y in points), (volume, size, 'digits escape the disc')
            xs, ys = zip(*points)
            assert abs((min(xs) + max(xs)) / 2 / size - .5) < .035, (volume, size, 'horizontal alignment')
            assert abs((min(ys) + max(ys)) / 2 / size - 252 / 512) < .035, (volume, size, 'vertical alignment')
            if size == 144:
                for y in range(size):
                    for x in range(size):
                        if y < 48 or y > 94:
                            assert image.pixelColor(x, y) == background.pixelColor(x, y), (volume, x, y, 'background changed')
            if args.output_dir and volume in (0, 37, 100):
                args.output_dir.mkdir(parents=True, exist_ok=True)
                assert image.save(str(args.output_dir / f'sample-volume-{volume}-{size}-percent-{percent}.png'))
print(f'Qt {qVersion()}: all 101 volumes with/without % at 72px/144px stay centered inside the shared badge')
