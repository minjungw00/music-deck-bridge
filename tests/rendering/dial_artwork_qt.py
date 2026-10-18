"""Optional Qt SVG regression: PYTHONPATH=<PySide6> python tests/rendering/dial_artwork_qt.py.

Uses generated images and the real JS fitting helper; no browser/site or device.
Requires PySide6-Essentials (verified with 6.10.3), outside the default test suite.
"""
import base64
import json
from pathlib import Path
import subprocess

from PySide6.QtCore import QByteArray, QBuffer, QIODevice, QRectF, qVersion
from PySide6.QtGui import QColor, QImage, QPainter
from PySide6.QtSvg import QSvgRenderer

ROOT = Path(__file__).resolve().parents[2]


def render(svg):
    renderer = QSvgRenderer(QByteArray(svg.encode()))
    assert renderer.isValid()
    output = QImage(200, 100, QImage.Format.Format_ARGB32)
    output.fill(0)
    painter = QPainter(output)
    renderer.render(painter, QRectF(0, 0, 200, 100))
    painter.end()
    return output


def fixture(width, height, fmt):
    image = QImage(width, height, QImage.Format.Format_RGB32)
    painter = QPainter(image)
    for index, color in enumerate(['red', 'green', 'blue']):
        painter.fillRect(QRectF(0, index * height / 3, width, height / 3), QColor(color))
    painter.end()
    encoded = QBuffer()
    encoded.open(QIODevice.OpenModeFlag.WriteOnly)
    assert image.save(encoded, fmt)
    data = bytes(encoded.data())
    return QImage.fromData(data), 'data:image/' + ('jpeg' if fmt == 'JPEG' else fmt.lower()) + ';base64,' + base64.b64encode(data).decode()


for width, height in [(300, 300), (300, 150), (150, 300), (300, 100)]:
    for fmt in ['PNG', 'JPEG', 'WEBP']:
        original, cover = fixture(width, height, fmt)
        result = subprocess.run(['node', '-e', """
const { fitDialArtwork } = require('./streamdeck/src/dial-artwork.cjs');
const cover = require('node:fs').readFileSync(0, 'utf8');
console.log(JSON.stringify(['height', 'width'].map(fit =>
  Buffer.from(fitDialArtwork(cover, fit).split(',')[1], 'base64').toString())));
"""], cwd=ROOT, input=cover, text=True, capture_output=True, check=True)
        for mode, svg in zip(['height', 'width'], json.loads(result.stdout)):
            actual = render(svg)
            scale = 200 / width if mode == 'width' else 100 / height
            w, h = width * scale, height * scale
            expected = QImage(200, 100, QImage.Format.Format_ARGB32)
            expected.fill(0)
            painter = QPainter(expected)
            painter.drawImage(QRectF((200 - w) / 2, (100 - h) / 2, w, h), original)
            painter.end()
            for x in range(5, 200, 10):
                for y in range(5, 100, 10):
                    a, b = actual.pixelColor(x, y), expected.pixelColor(x, y)
                    assert max(abs(i - j) for i, j in zip(a.getRgb(), b.getRgb())) <= 8, (width, height, fmt, mode, x, y, a.getRgb(), b.getRgb())
            print(f'{fmt} {width}x{height} {mode}: pixel checks passed')
        if width == height and fmt == 'PNG':
            old = [render(f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="100" viewBox="0 0 200 100"><image width="200" height="100" preserveAspectRatio="xMidYMid {fit}" xlink:href="{cover}"/></svg>') for fit in ['meet', 'slice']]
            assert old[0] == old[1], 'legacy fit attributes must reproduce identical Qt output'
            assert old[0].pixelColor(5, 50).alpha() == 255, 'legacy height mode stretches across the strip'
            print('Legacy SVG: identical stretched output reproduced for both fit modes')
print(f'Qt {qVersion()}: 24 fitted outputs verified')
