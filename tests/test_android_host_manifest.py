import importlib.util
from pathlib import Path
import tempfile
import unittest
import xml.etree.ElementTree as ET

spec = importlib.util.spec_from_file_location('host', Path(__file__).resolve().parents[1] / 'tools/fix_android_host_manifest.py')
host = importlib.util.module_from_spec(spec)
spec.loader.exec_module(host)


class HostManifestTest(unittest.TestCase):
  def test_policy_preserves_host_and_is_idempotent(self):
    with tempfile.TemporaryDirectory() as folder:
      path = Path(folder) / 'app/src/main/AndroidManifest.xml'
      path.parent.mkdir(parents=True)
      path.write_text('<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools" package="com.chen.ggcamp"><application android:name=".DemoApplication" android:usesCleartextTraffic="true" tools:replace="android:allowBackup"/><uses-feature android:name="android.hardware.camera" android:required="true"/></manifest>')
      host.fix_manifest(path)
      root = ET.parse(path).getroot()
      app = root.find('application')
      self.assertEqual(app.get('{' + host.ANDROID + '}usesCleartextTraffic'), 'false')
      self.assertEqual(app.get('{' + host.ANDROID + '}name'), '.DemoApplication')
      self.assertIn('android:allowBackup', app.get('{' + host.TOOLS + '}replace'))
      for feature in root.findall('uses-feature'):
        self.assertEqual(feature.get('{' + host.ANDROID + '}required'), 'false')
        self.assertIn('android:required', feature.get('{' + host.TOOLS + '}replace'))
      first = path.read_bytes()
      host.fix_manifest(path)
      self.assertEqual(first, path.read_bytes())

  def test_wrong_identity_is_unchanged(self):
    with tempfile.TemporaryDirectory() as folder:
      path = Path(folder) / 'app/src/main/AndroidManifest.xml'
      path.parent.mkdir(parents=True)
      path.write_text('<manifest package="com.example.other"><application/></manifest>')
      original = path.read_bytes()
      with self.assertRaises(ValueError):
        host.fix_manifest(path)
      self.assertEqual(original, path.read_bytes())

  def test_rejects_sdk_installation(self):
    with self.assertRaises(ValueError):
      host.fix_manifest(Path.home() / 'Library/Application Support/微信开发者工具/template/app/src/main/AndroidManifest.xml')


if __name__ == '__main__':
  unittest.main()
