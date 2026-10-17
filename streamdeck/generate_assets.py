"""Render project icons from geometric primitives, without external artwork inputs."""

import argparse
from pathlib import Path


def render(kind, size, background):
    from PIL import Image, ImageDraw

    # Draw in a fixed 512-unit coordinate system, then downsample for small displays.
    image = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    white = "#ffffff"
    if kind == "brand":
        # A play disc with an offset signal and a bent bridge connection.
        # No surrounding rings: the silhouette must remain distinct at 16px.
        magenta = "#F72575" if background else white
        deep_magenta = "#CF145A" if background else white
        if background:
            draw.rounded_rectangle((12, 12, 500, 500), radius=112, fill="#151923")
        draw.line([(280, 372), (340, 372), (388, 316), (444, 316)],
                  fill=deep_magenta, width=28, joint="curve")
        draw.ellipse((430, 302, 458, 330), fill=deep_magenta)
        draw.rounded_rectangle((400, 104, 424, 212), radius=12, fill=magenta)
        draw.rounded_rectangle((444, 144, 468, 212), radius=12, fill=magenta)
        draw.ellipse((88, 100, 376, 388), fill=magenta)
        # A transparent play cutout makes the category mark monochrome.
        draw.polygon([(200, 158), (200, 330), (316, 244)],
                     fill=white if background else (0, 0, 0, 0))
        return image.resize((size, size), Image.Resampling.LANCZOS)
    if background:
        draw.rounded_rectangle((12, 12, 500, 500), radius=112, fill="#202433")
        draw.rounded_rectangle((30, 30, 482, 482), radius=96, outline="#414b64", width=8)
    if kind == "nowplaying":
        # Equalizer bars joined by a bridge deck: the project's own visual mark.
        for x, top in [(128, 216), (224, 120), (320, 168)]:
            draw.rounded_rectangle((x, top, x + 64, 368), radius=24, fill="#f36b83" if background else white)
        draw.rounded_rectangle((104, 272, 408, 312), radius=16, fill=white)
    elif kind == "toggle":
        draw.polygon([(116, 144), (116, 368), (272, 256)], fill=white)
        draw.rounded_rectangle((308, 144, 340, 368), radius=10, fill=white)
        draw.rounded_rectangle((372, 144, 404, 368), radius=10, fill=white)
    elif kind in ("prev", "next", "trackdial"):
        draw.polygon([(156, 156), (156, 356), (308, 256)], fill=white)
        draw.rounded_rectangle((324, 156, 360, 356), radius=10, fill=white)
        if kind == "prev":
            image = image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        if kind == "trackdial":
            draw.arc((80, 80, 432, 432), 200, 340, fill="#f36b83" if background else white, width=20)
            draw.arc((80, 80, 432, 432), 20, 160, fill="#f36b83" if background else white, width=20)
    elif kind in ("mute", "volume"):
        draw.rounded_rectangle((104, 212, 184, 300), radius=12, fill=white)
        draw.polygon([(164, 212), (260, 140), (260, 372), (164, 300)], fill=white)
        if kind == "mute":
            draw.line((316, 208, 400, 304), fill=white, width=24)
            draw.line((400, 208, 316, 304), fill=white, width=24)
        else:
            draw.arc((220, 172, 352, 340), -60, 60, fill=white, width=20)
            draw.arc((188, 128, 416, 384), -60, 60, fill=white, width=20)
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
        f"{plugin}/plugin/icon.png": ("brand", 256, True),
        f"{plugin}/plugin/icon@2x.png": ("brand", 512, True),
        f"{plugin}/plugin/category.png": ("brand", 28, False),
        f"{plugin}/plugin/category@2x.png": ("brand", 56, False),
    }
    for size in (16, 48, 128):
        outputs[f"chrome-extension/icons/{size}.png"] = ("brand", size, True)
    for kind in ("nowplaying", "toggle", "prev", "next", "mute", "volume", "trackdial"):
        for name, size, background in [("icon", 20, False), ("key", 72, True)]:
            for suffix, scale in [("", 1), ("@2x", 2)]:
                outputs[f"{plugin}/actions/{kind}/{name}{suffix}.png"] = (kind, size * scale, background)
    for name, spec in outputs.items():
        target = args.output_root / name
        target.parent.mkdir(parents=True, exist_ok=True)
        render(*spec).save(target)
        print(target)


if __name__ == "__main__":
    main()
