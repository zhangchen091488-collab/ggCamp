"""Check a freshly built APK, then sign it with the local release key."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile


def main():
  parser = argparse.ArgumentParser(description=__doc__)
  parser.add_argument('apk', type=Path)
  parser.add_argument('--out', required=True, type=Path)
  parser.add_argument('--cloud-candidate', action='store_true', help='仅0.9.6/108草稿：记录云宿主限制，不构成公开发布验收')
  parser.add_argument('--cloud-validation', action='store_true', help='仅验证包：记录云宿主明文/相机默认项，保留其它检查')
  parser.add_argument('--apksigner', type=Path, help='存在多份官方工具时指定 apksigner.jar')
  parser.add_argument('--java', type=Path, help='存在多份 JDK 时指定 java')
  parser.add_argument('--credentials', type=Path, default=Path.home() / '.ggcamp/signing/credentials.json')
  args = parser.parse_args()
  try:
    from androguard.core.apk import APK
    from loguru import logger
  except ImportError:
    raise SystemExit('需要分析工具 androguard；请使用安装了该工具的 Python 环境。')
  logger.remove()
  root = Path(__file__).resolve().parents[1]
  config = json.loads((root / 'project.miniapp.json').read_text())['mini-android']
  apk = APK(str(args.apk))
  errors = []
  if apk.get_package() != config['packageName']:
    errors.append('APK 包名不符；请从正式应用重新构建，不能直接重签测试宿主。')
  removed = {name if '.' in name else 'android.permission.' + name for name in config['uselessPermissions']}
  unexpected = removed.intersection(apk.get_permissions())
  if unexpected:
    errors.append('APK 仍包含待移除权限：' + ', '.join(sorted(unexpected)))
  ns = '{http://schemas.android.com/apk/res/android}'
  manifest = apk.get_android_manifest_xml()
  app = manifest.find('application')
  if app.get(ns + 'debuggable') == 'true':
    errors.append('APK 开启了 debuggable。')
  if app.get(ns + 'usesCleartextTraffic') != 'false':
    errors.append('正式宿主需显式禁止明文流量；当前签名流程不修改 APK 内容。')
  if any(node.get(ns + 'name') == 'android.hardware.camera' and node.get(ns + 'required', 'true') == 'true' for node in manifest.findall('uses-feature')):
    errors.append('APK 仍要求相机硬件。')
  if args.cloud_validation and args.cloud_candidate:
    raise SystemExit('不能同时使用两种云候选模式')
  if args.cloud_validation or args.cloud_candidate:
    from android_validation_metadata import validate_embedded_build
    validate_embedded_build(apk, validation=not args.cloud_candidate, public_updates=args.cloud_candidate)
    allowed = {('0.9.6', 108)} if args.cloud_candidate else {('0.9.4', 106), ('0.9.5', 107)}
    if (apk.get_androidversion_name(), int(apk.get_androidversion_code())) not in allowed:
      errors.append('云宿主例外仅限明确的验证组合 0.9.4/106 或 0.9.5/107。')
    else:
      exceptions = [error for error in errors if error.startswith('正式宿主需显式禁止明文') or error == 'APK 仍要求相机硬件。']
      errors = [error for error in errors if error not in exceptions]
      for error in exceptions:
        print('验证包已记录的云宿主限制：' + error)
  if errors:
    raise SystemExit('\n'.join(errors))
  if args.out.resolve() == args.apk.resolve() or args.out.exists():
    raise SystemExit('输出必须是不存在的新文件，不能覆盖原 APK。')
  if args.credentials.stat().st_mode & 0o077:
    raise SystemExit('签名凭据权限过宽，应设置为 600。')
  credentials = json.loads(args.credentials.read_text())
  if credentials['packageName'] != config['packageName']:
    raise SystemExit('证书配置与项目包名不符。')
  cache = Path.home() / 'Library/Application Support/微信开发者工具'
  jars = sorted(cache.glob('*/WeappPlugin/*/toolkit/android/lib/apksigner.jar'))
  javas = sorted(cache.glob('*/WeappMiniApp/jdk/*/bin/java'))
  if args.apksigner:
    jars = [args.apksigner.resolve()]
  if args.java:
    javas = [args.java.resolve()]
  if len(jars) != 1 or len(javas) != 1:
    raise SystemExit('存在多份或缺失官方工具；请用 --apksigner / --java 明确指定。')
  if not jars[0].is_file() or not javas[0].is_file():
    raise SystemExit('指定的 apksigner / Java 文件不存在。')
  env = dict(os.environ)
  env['GGCAMP_STORE_PASS'] = credentials['storePass']
  env['GGCAMP_KEY_PASS'] = credentials['keyPass']
  args.out.parent.mkdir(parents=True, exist_ok=True)
  command = [str(javas[0]), '-jar', str(jars[0])]
  with tempfile.TemporaryDirectory(prefix='ggcamp-sign-', dir=args.out.parent) as scratch:
    signed = Path(scratch) / 'signed.apk'
    subprocess.run(command + ['sign', '--ks', credentials['keyStore'], '--ks-key-alias', credentials['keyAlias'], '--ks-pass', 'env:GGCAMP_STORE_PASS', '--key-pass', 'env:GGCAMP_KEY_PASS', '--out', str(signed), str(args.apk)], env=env, check=True)
    subprocess.run(command + ['verify', '--verbose', '--print-certs', str(signed)], check=True)
    os.link(signed, args.out)
  print('发布签名与密码学校验完成：' + str(args.out.resolve()))


if __name__ == '__main__':
  try:
    main()
  except (OSError, subprocess.CalledProcessError) as error:
    print('签名未完成：' + str(error), file=sys.stderr)
    sys.exit(1)
