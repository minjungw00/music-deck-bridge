"""Render project icons from geometric primitives, without external artwork inputs."""

import argparse
import math
from pathlib import Path

MAGENTA = "#F72575"
DARK = "#151923"
WHITE = "#FFFFFF"


def brand_canvas(size, background):
    from PIL import Image, ImageDraw

    # Supersample curved edges even for the 512px export.
    scale = 4
    canvas = (512 * scale, 512 * scale)
    box = lambda values: tuple(value * scale for value in values)
    image = Image.new("RGBA", canvas, (0, 0, 0, 0))
    mask = Image.new("L", image.size)
    draw_mask = ImageDraw.Draw(mask)
    if background:
        draw_mask.rounded_rectangle(box((8, 8, 504, 504)), radius=96 * scale, fill=255)
        # Gentle upper-left light, keeping the small-size background flat.
        surface = Image.new("RGBA", (512, 512), DARK)
        if size > 48:
            pixels = surface.load()
            for y in range(512):
                for x in range(512):
                    light = max(0, 1 - math.hypot(x - 120, y + 40) / 580)
                    pixels[x, y] = (15 + round(13 * light), 16 + round(13 * light),
                                    23 + round(15 * light), 255)
        image.paste(surface.resize(canvas, Image.Resampling.BICUBIC), mask=mask)
    draw_mask.rectangle((0, 0, *canvas), fill=0)
    draw_mask.ellipse(box((76, 72, 436, 432)), fill=255)
    disc = Image.new("RGBA", (512, 512), MAGENTA if background else WHITE)
    if background and size > 48:
        draw_disc = ImageDraw.Draw(disc)
        stops = [(72, (255, 56, 209)), (232, (255, 0, 125)), (432, (208, 0, 164))]
        for (start, first), (end, last) in zip(stops, stops[1:]):
            for y in range(start, end + 1):
                t = (y - start) / (end - start)
                color = tuple(round(a + (b - a) * t) for a, b in zip(first, last))
                draw_disc.line((0, y, 512, y), fill=color)
    image.paste(disc.resize(canvas, Image.Resampling.BICUBIC), mask=mask)
    return image, scale


def render_brand(size, background):
    from PIL import Image, ImageDraw

    image, scale = brand_canvas(size, background)
    box = lambda values: tuple(value * scale for value in values)
    draw = ImageDraw.Draw(image)
    ink = "white" if background else (0, 0, 0, 0)
    # Rounded triangle and paired sound waves follow the maintainer's reference.
    triangle = [(228, 206), (302, 252), (228, 298)]
    draw.polygon([box(point) for point in triangle], fill=ink)
    draw.line([box(point) for point in triangle + [triangle[0]]], fill=ink,
              width=28 * scale, joint="curve")
    for x, y in triangle:
        draw.ellipse(box((x - 14, y - 14, x + 14, y + 14)), fill=ink)
    for radius, width, angle in [(154, 26, 45), (111, 22, 35)]:
        # At 16px, one pair leaves more separation around the play triangle.
        if size <= 16 and radius == 111:
            continue
        for start, end in [(-angle, angle), (180 - angle, 180 + angle)]:
            draw.arc(box((256 - radius, 252 - radius, 256 + radius, 252 + radius)),
                     start, end, fill=ink, width=width * scale)
            for degrees in (start, end):
                centerline = radius - width / 2
                x = 256 + centerline * math.cos(math.radians(degrees))
                y = 252 + centerline * math.sin(math.radians(degrees))
                half = width / 2
                draw.ellipse(box((x - half, y - half, x + half, y + half)), fill=ink)
    return image.resize((size, size), Image.Resampling.LANCZOS)


def render(kind, size, background):
    from PIL import Image, ImageDraw

    if kind in ("brand", "nowplaying"):
        return render_brand(size, background)
    image, scale = brand_canvas(size, background)
    box = lambda values: tuple(value * scale for value in values)
    # Use one circular badge and the same palette/surface as the main icon.
    # A mask makes action-list glyphs transparent cutouts in the white badge.
    glyph = Image.new("L", image.size)
    draw = ImageDraw.Draw(glyph)

    def polygon(points):
        draw.polygon([box(point) for point in points], fill=255)

    def rectangle(bounds, radius=8):
        draw.rounded_rectangle(box(bounds), radius=radius * scale, fill=255)

    def line(points, width):
        draw.line([box(point) for point in points], fill=255, width=width * scale)
        half = width / 2
        for x, y in (points[0], points[-1]):
            draw.ellipse(box((x - half, y - half, x + half, y + half)), fill=255)

    if kind == "toggle":
        polygon([(208, 168), (208, 336), (334, 252)])
    elif kind == "pause":
        rectangle((202, 174, 236, 330))
        rectangle((276, 174, 310, 330))
    elif kind == "open":
        line([(290, 184), (174, 184), (174, 330), (330, 330), (330, 280)], 18)
        line([(242, 270), (340, 172)], 24)
        line([(280, 172), (340, 172), (340, 232)], 24)
    elif kind in ("like", "dislike", "like_selected", "dislike_selected"):
        thumb = [(212, 234), (246, 188), (254, 154), (278, 154), (292, 180),
                 (282, 224), (338, 224), (354, 242), (328, 332), (212, 332)]
        if kind.endswith("_selected"):
            polygon(thumb)
        else:
            draw.line([box(point) for point in thumb + [thumb[0]]],
                      fill=255, width=16 * scale, joint="curve")
        rectangle((158, 236, 194, 334), radius=5)
        if kind.startswith("dislike"):
            glyph = glyph.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    elif kind in ("prev", "next", "trackdial"):
        polygon([(170, 178), (170, 326), (286, 252)])
        rectangle((310, 178, 340, 326))
        if kind == "trackdial":
            for start, end in [(205, 335), (25, 155)]:
                draw.arc(box((126, 122, 386, 382)), start, end, fill=255, width=16 * scale)
    elif kind in ("mute", "volume"):
        rectangle((142, 224, 194, 280))
        polygon([(180, 224), (244, 178), (244, 326), (180, 280)])
        if kind == "mute":
            line([(284, 220), (344, 284)], 20)
            line([(344, 220), (284, 284)], 20)
        else:
            for bounds in [(232, 202, 312, 302), (208, 170, 360, 334)]:
                draw.arc(box(bounds), -60, 60, fill=255, width=18 * scale)
    else:
        raise ValueError(f"Unknown icon kind: {kind}")
    if kind == "prev":
        # Mirror only the symbol, retaining the shared upper-left lighting.
        glyph = glyph.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    image.paste(WHITE if background else (0, 0, 0, 0), (0, 0), glyph)
    return image.resize((size, size), Image.Resampling.LANCZOS)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    try:
        import PIL  # noqa: F401
    except ImportError:
        parser.error("Install the optional renderer: python -m pip install Pillow==12.0.0")
    plugin = "streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/imgs"
    outputs = {
        "store-assets/elgato/app-icon.png": ("brand", 288, True),
        f"{plugin}/plugin/icon.png": ("brand", 256, True),
        f"{plugin}/plugin/icon@2x.png": ("brand", 512, True),
        f"{plugin}/plugin/category.png": ("brand", 28, False),
        f"{plugin}/plugin/category@2x.png": ("brand", 56, False),
    }
    for size in (16, 48, 128):
        outputs[f"chrome-extension/icons/{size}.png"] = ("brand", size, True)
    for kind in ("nowplaying", "toggle", "prev", "next", "mute", "volume", "trackdial", "open", "like", "dislike"):
        for name, size, background in [("icon", 20, False), ("key", 72, True)]:
            for suffix, scale in [("", 1), ("@2x", 2)]:
                outputs[f"{plugin}/actions/{kind}/{name}{suffix}.png"] = (kind, size * scale, background)
    for suffix, scale in [("", 1), ("@2x", 2)]:
        outputs[f"{plugin}/actions/toggle/pause{suffix}.png"] = ("pause", 72 * scale, True)
        for kind in ("like", "dislike"):
            outputs[f"{plugin}/actions/{kind}/selected{suffix}.png"] = (kind + "_selected", 72 * scale, True)
    for name, spec in outputs.items():
        target = args.output_root / name
        target.parent.mkdir(parents=True, exist_ok=True)
        render(*spec).save(target)
        print(target)


if __name__ == "__main__":
    main()
