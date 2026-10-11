import importlib.util
from pathlib import Path
import struct
import unittest

source = Path(__file__).resolve().parents[1] / 'tools/android_validation_metadata.py'
spec = importlib.util.spec_from_file_location('metadata', source)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class Apk:
  def __init__(self, version='0.9.4', validation='!0'):
    script = ('define("lib/android-build.js",function(){module.exports={'
              'packageName:"com.chen.ggcamp",versionName:"' + version + '",'
              'versionCode:106,validation:' + validation + '};});define("next",function(){});').encode()
    filename = b'/app-service.js'
    index_size = 4 + 4 + len(filename) + 8
    header = b'\xbe' + struct.pack('>III', 0, index_size, len(script)) + b'\xed'
    self.data = header + struct.pack('>II', 1, len(filename)) + filename + struct.pack('>II', 14 + index_size, len(script)) + script
  def get_package(self): return 'com.chen.ggcamp'
  def get_androidversion_name(self): return '0.9.4'
  def get_androidversion_code(self): return '106'
  def get_files(self): return ['assets/SaaA_embed/app.wxapkg']
  def get_file(self, name): return self.data


class MetadataTests(unittest.TestCase):
  def test_exact_embedded_apk_identity(self):
    self.assertEqual(module.validate_embedded_build(Apk()), ('com.chen.ggcamp', '0.9.4', 106))
  def test_reject_mismatch_and_non_validation(self):
    for apk in [Apk(version='0.9.5'), Apk(validation='!1')]:
      with self.assertRaises(ValueError): module.validate_embedded_build(apk)
  def test_reject_missing_package(self):
    apk = Apk(); apk.get_files = lambda: []
    with self.assertRaises(ValueError): module.validate_embedded_build(apk)


if __name__ == '__main__':
  unittest.main()
