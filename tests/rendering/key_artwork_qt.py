"""Generated-artwork pixel regression; requires PySide6-Essentials.

PYTHONPATH=<PySide6> python3 tests/rendering/key_artwork_qt.py [helper-to-compare]
Checks Qt rendering, not physical Stream Deck output.
"""
import base64
import json
from pathlib import Path
import subprocess
import sys

from PySide6.QtCore import QByteArray, QBuffer, QIODevice, QRectF, qVersion
from PySide6.QtGui import QColor, QImage, QPainter
from PySide6.QtSvg import QSvgRenderer

ROOT = Path(__file__).resolve().parents[2]
helper = sys.argv[1] if len(sys.argv) > 1 else str(ROOT / 'streamdeck/src/key-background.cjs')
count = 0
for width, height in [(300, 300), (300, 150), (150, 300)]:
    for fmt in ['PNG', 'JPEG', 'WEBP']:
        source = QImage(width, height, QImage.Format.Format_RGB32)
        painter = QPainter(source)
        for index, color in enumerate(['red', 'green', 'blue']):
            painter.fillRect(QRectF(index * width / 3, 0, width / 3, height), QColor(color))
        painter.end()
        buffer = QBuffer()
        buffer.open(QIODevice.OpenModeFlag.WriteOnly)
        assert source.save(buffer, fmt)
        data = bytes(buffer.data())
        original = QImage.fromData(data)
        cover = 'data:image/' + ('jpeg' if fmt == 'JPEG' else fmt.lower()) + ';base64,' + base64.b64encode(data).decode()
        result = subprocess.run(['node', '-e', """
const { keyTextBackground } = require(process.argv[1]);
const cover = require('node:fs').readFileSync(0, 'utf8');
console.log(JSON.stringify([0, 1, 2].map(lines => keyTextBackground(cover, lines))));
""", helper], cwd=ROOT, input=cover, text=True, capture_output=True, check=True)
        for lines, uri in enumerate(json.loads(result.stdout)):
            actual = QImage(144, 144, QImage.Format.Format_ARGB32)
            actual.fill(QColor('black'))
            painter = QPainter(actual)
            encoded = base64.b64decode(uri.split(',')[1])
            if uri.startswith('data:image/svg+xml;'):
                renderer = QSvgRenderer(QByteArray(encoded))
                assert renderer.isValid()
                renderer.render(painter, QRectF(0, 0, 144, 144))
            else:
                painter.drawImage(QRectF(0, 0, 144, 144), QImage.fromData(encoded))
            painter.end()
            expected = QImage(144, 144, QImage.Format.Format_ARGB32)
            expected.fill(QColor('black'))
            painter = QPainter(expected)
            scale = min(144 / width, 144 / height)
            w, h = width * scale, height * scale
            painter.drawImage(QRectF((144 - w) / 2, (144 - h) / 2, w, h), original)
            if lines:
                band = 54 if lines == 2 else 30
                painter.fillRect(QRectF(0, 144 - band, 144, band), QColor('black'))
            painter.end()
            edges_x = [(144 - w) / 2 + w * i / 3 for i in range(4)]
            edges_y = [(144 - h) / 2, (144 + h) / 2] + ([144 - band] if lines else [])
            for x in range(5, 144, 10):
                for y in range(5, 144, 10):
                    # Compare interiors; Qt SVG and drawImage use different edge filters.
                    if any(abs(x - edge) < 3 for edge in edges_x) or any(abs(y - edge) < 3 for edge in edges_y):
                        continue
                    a, b = actual.pixelColor(x, y), expected.pixelColor(x, y)
                    assert max(abs(i - j) for i, j in zip(a.getRgb(), b.getRgb())) <= 8, (width, height, fmt, lines, x, y, a.getRgb(), b.getRgb())
            count += 1
print(f'Qt {qVersion()}: {count} key artwork/backdrop outputs preserve aspect ratio')

# Render only the diagonal corners of a 2×2 canvas and the far-right tile of a
# horizontal canvas. The absent cells still participate in crop geometry.
source = QImage(288, 288, QImage.Format.Format_RGB32)
painter = QPainter(source)
colors = ['red', 'green', 'blue', 'white']
for index, color in enumerate(colors):
    painter.fillRect(QRectF((index % 2) * 144, (index // 2) * 144, 144, 144), QColor(color))
painter.end()
buffer = QBuffer()
buffer.open(QIODevice.OpenModeFlag.WriteOnly)
assert source.save(buffer, 'PNG')
cover = 'data:image/png;base64,' + base64.b64encode(bytes(buffer.data())).decode()
result = subprocess.run(['node', '-e', """
const { keyTextBackground } = require(process.argv[1]);
const cover = require('node:fs').readFileSync(0, 'utf8');
const tiles = [{ row: 0, column: 0, width: 2, height: 2 },
  { row: 1, column: 1, width: 2, height: 2 }, { row: 0, column: 2, width: 3, height: 1 }];
console.log(JSON.stringify(tiles.map(tile => keyTextBackground(cover, 0, tile))));
""", helper], cwd=ROOT, input=cover, text=True, capture_output=True, check=True)
for uri, expected in zip(json.loads(result.stdout), [('red', 'red'), ('white', 'white'), ('green', 'white')], strict=True):
    image = QImage(144, 144, QImage.Format.Format_ARGB32)
    image.fill(QColor('black'))
    painter = QPainter(image)
    renderer = QSvgRenderer(QByteArray(base64.b64decode(uri.split(',')[1])))
    assert renderer.isValid()
    renderer.render(painter, QRectF(0, 0, 144, 144))
    painter.end()
    assert image.pixelColor(72, 36) == QColor(expected[0])
    assert image.pixelColor(72, 108) == QColor(expected[1])
print(f'Qt {qVersion()}: three sparse diagonal and rectangular linked crops match their canvas coordinates')
