"""Stage redistributable files; never package the checkout or runtime state."""

import argparse
import json
from pathlib import Path
import shutil
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PLUGIN = "io.github.minjungw00.musicdeckbridge.sdPlugin"
LEGAL = ("LICENSE", "NOTICE", "THIRD_PARTY_NOTICES.md", "PRIVACY.md")


def stage(component, output):
    source = ROOT / ("chrome-extension" if component == "chrome" else f"streamdeck/{PLUGIN}")
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)
    # Explicit allowlists keep personal files, keys and runtime data out of artifacts.
    files = ["manifest.json"]
    folders = [] if component == "chrome" else ["imgs"]
    files += (["background.js", "content.js", "popup.html", "popup.js",
               "icons/16.png", "icons/48.png", "icons/128.png",
               "_locales/en/messages.json", "_locales/ko/messages.json"] if component == "chrome" else [
        "bin/plugin.js", "property-inspector/settings.html",
        "property-inspector/settings.js", "property-inspector/sdpi-components.js", "en.json", "ko.json",
    ])
    for folder in folders:
        files.extend(str(p.relative_to(source)) for p in sorted((source / folder).rglob("*.png")))
    for name in files:
        src = source / name
        if src.is_symlink():
            raise ValueError(f"Refusing symbolic link: {src}")
        target = output / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, target)
    for name in LEGAL:
        shutil.copyfile(ROOT / name, output / name)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("component", choices=("chrome", "streamdeck"))
    args = parser.parse_args()
    version = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))["version"]
    output = ROOT / "dist"
    staged = output / "staging" / ("chrome-extension" if args.component == "chrome" else PLUGIN)
    stage(args.component, staged)
    if args.component == "chrome":
        archive = output / f"music-deck-bridge-chrome-{version}.zip"
        with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as bundle:
            for src in sorted(staged.rglob("*")):
                if src.is_file():
                    bundle.write(src, src.relative_to(staged).as_posix())
        print(archive)
    else:
        cli = shutil.which("streamdeck")
        if not cli:
            parser.error("Install @elgato/cli first; see docs/development.md.")
        subprocess.run([cli, "validate", str(staged), "--no-update-check"], check=True)
        subprocess.run([cli, "pack", str(staged), "--output", str(output), "--force", "--no-update-check"], check=True)


if __name__ == "__main__":
    main()
