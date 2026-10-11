"""Apply release policy to a native Android project before building it."""
import argparse
from pathlib import Path
import xml.etree.ElementTree as ET

ANDROID = 'http://schemas.android.com/apk/res/android'
TOOLS = 'http://schemas.android.com/tools'
ET.register_namespace('android', ANDROID)
ET.register_namespace('tools', TOOLS)


def fix_manifest(path, package_name='com.chen.ggcamp'):
  path = Path(path).resolve()
  sdk_cache = Path.home() / 'Library/Application Support/微信开发者工具'
  if path.is_relative_to(sdk_cache) or path.parts[-4:] != ('app', 'src', 'main', 'AndroidManifest.xml'):
    raise ValueError('仅支持独立原生工程 app/src/main/AndroidManifest.xml；不修改 SDK 或 APK。')
  tree = ET.parse(path)
  root = tree.getroot()
  if root.tag != 'manifest':
    raise ValueError('输入必须是原生工程中的 AndroidManifest.xml。')
  if root.get('package') not in (None, package_name):
    raise ValueError('Manifest 包名不符，未修改文件。')
  app = root.find('application')
  if app is None:
    raise ValueError('清单缺少 application，未修改文件。')
  app.set('{' + ANDROID + '}usesCleartextTraffic', 'false')
  replace = set(filter(None, (app.get('{' + TOOLS + '}replace') or '').split(',')))
  replace.add('android:usesCleartextTraffic')
  app.set('{' + TOOLS + '}replace', ','.join(sorted(replace)))
  for name in ('android.hardware.camera', 'android.hardware.camera.autofocus'):
    feature = next((item for item in root.findall('uses-feature') if item.get('{' + ANDROID + '}name') == name), None)
    if feature is None:
      feature = ET.SubElement(root, 'uses-feature', {'{' + ANDROID + '}name': name})
    feature.set('{' + ANDROID + '}required', 'false')
    replace = set(filter(None, (feature.get('{' + TOOLS + '}replace') or '').split(',')))
    replace.add('android:required')
    feature.set('{' + TOOLS + '}replace', ','.join(sorted(replace)))
  ET.indent(tree, space='  ')
  tree.write(path, encoding='utf-8', xml_declaration=True)


if __name__ == '__main__':
  parser = argparse.ArgumentParser(description=__doc__)
  parser.add_argument('manifest', type=Path, help='独立原生工程 app/src/main/AndroidManifest.xml')
  args = parser.parse_args()
  fix_manifest(args.manifest)
  print('原生清单已更新；必须重新构建 APK 并通过正式签名检查。')
