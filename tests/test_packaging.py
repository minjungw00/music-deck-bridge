"""Verify artifact boundaries and notices without a Stream Deck installation."""

import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("packaging_tool", ROOT / "scripts/package.py")
packaging_tool = importlib.util.module_from_spec(spec)
spec.loader.exec_module(packaging_tool)


class PackagingTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for name in ("chrome-extension", "streamdeck"):
            shutil.copytree(ROOT / name, self.root / name)
        for name in (*packaging_tool.LEGAL, "package.json"):
            shutil.copyfile(ROOT / name, self.root / name)

    def test_chrome_zip_has_root_manifest_resources_and_notices_without_secrets(self):
        (self.root / "scripts").mkdir()
        shutil.copyfile(ROOT / "scripts/package.py", self.root / "scripts/package.py")
        for name in ("auth.json", "test.pem", "content.js:Zone.Identifier", "_locales/en/auth.json"):
            (self.root / "chrome-extension" / name).write_text("DO NOT DISTRIBUTE")
        subprocess.run([sys.executable, str(self.root / "scripts/package.py"), "chrome"],
                       check=True, capture_output=True)
        archive = next((self.root / "dist").glob("*.zip"))
        with zipfile.ZipFile(archive) as bundle:
            names = set(bundle.namelist())
            manifest = json.loads(bundle.read("manifest.json"))
            expected_version = json.loads((self.root / "package.json").read_text(encoding="utf-8"))["version"]
            self.assertEqual(manifest["version"], expected_version)
            for name in (*packaging_tool.LEGAL, "background.js", "content.js", "popup.js",
                         manifest["action"]["default_popup"], *manifest["icons"].values(),
                         "_locales/en/messages.json", "_locales/ko/messages.json"):
                self.assertIn(name, names)
            self.assertFalse(any("auth.json" in name or name.endswith(".pem") or ":" in name for name in names))
            self.assertFalse(any(name.startswith("chrome-extension/") for name in names))
            for name in manifest["icons"].values():
                self.assertEqual(bundle.read(name), (self.root / "chrome-extension" / name).read_bytes())

    def test_streamdeck_staging_preserves_runtime_resources_and_licenses(self):
        plugin = self.root / "streamdeck" / packaging_tool.PLUGIN
        (plugin / "auth.json").write_text("DO NOT DISTRIBUTE")
        (plugin / "bin" / "plugin.js:Zone.Identifier").write_text("DO NOT DISTRIBUTE")
        staged = self.root / "dist" / packaging_tool.PLUGIN
        original = packaging_tool.ROOT
        try:
            packaging_tool.ROOT = self.root
            packaging_tool.stage("streamdeck", staged)
        finally:
            packaging_tool.ROOT = original
        manifest = json.loads((staged / "manifest.json").read_text())
        for name in (*packaging_tool.LEGAL, manifest["CodePath"], manifest["PropertyInspectorPath"],
                     "property-inspector/settings.js", "property-inspector/sdpi-components.js", "en.json", "ko.json"):
            self.assertTrue((staged / name).is_file(), name)
        for action in manifest["Actions"]:
            for icon in (action["Icon"], *(state["Image"] for state in action["States"])):
                for suffix in (".png", "@2x.png"):
                    name = icon + suffix
                    self.assertEqual((staged / name).read_bytes(), (plugin / name).read_bytes())
        for icon in (manifest["Icon"], manifest["CategoryIcon"]):
            for suffix in (".png", "@2x.png"):
                name = icon + suffix
                self.assertEqual((staged / name).read_bytes(), (plugin / name).read_bytes())
        for variant in ("toggle/pause", "like/selected", "dislike/selected"):
            for suffix in (".png", "@2x.png"):
                name = "imgs/actions/" + variant + suffix
                self.assertEqual((staged / name).read_bytes(), (plugin / name).read_bytes())
        self.assertFalse((staged / "auth.json").exists())
        self.assertFalse((staged / "bin/plugin.js:Zone.Identifier").exists())


if __name__ == "__main__":
    unittest.main()
