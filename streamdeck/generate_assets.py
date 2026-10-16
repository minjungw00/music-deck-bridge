"""Resize the supplied mark into brand icons; preserve existing action artwork."""

import argparse
from pathlib import Path


def main():
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=root / "streamdeck/assets/music-mark.png")
    parser.add_argument("--output-root", type=Path, default=root,
                        help="Repository-shaped output directory; defaults to this checkout")
    args = parser.parse_args()
    try:
        from PIL import Image, ImageOps
    except ImportError:
        parser.error("Install the optional asset tool with: python -m pip install Pillow")
    plugin = "streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/imgs/plugin"
    outputs = {
        f"{plugin}/icon.png": 256, f"{plugin}/icon@2x.png": 512,
        f"{plugin}/category.png": 28, f"{plugin}/category@2x.png": 56,
        "chrome-extension/icons/16.png": 16, "chrome-extension/icons/48.png": 48,
        "chrome-extension/icons/128.png": 128,
    }
    with Image.open(args.source) as source:
        source = source.convert("RGBA")
        for name, size in outputs.items():
            target = args.output_root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            ImageOps.contain(source, (size, size), Image.Resampling.LANCZOS).save(target)
            print(target)


if __name__ == "__main__":
    main()
