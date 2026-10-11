"""Create ANDROID-UPDATE.json only after a signed APK passes public release checks."""
import argparse
import hashlib
import json
from pathlib import Path
import re
from android_public_release import CERT, ROOT, inspect_apk


def main():
  parser = argparse.ArgumentParser(description=__doc__)
  parser.add_argument('apk', type=Path)
  parser.add_argument('--tag', required=True)
  parser.add_argument('--channel', choices=['stable', 'beta'], required=True)
  parser.add_argument('--apksigner', required=True, type=Path)
  parser.add_argument('--out', required=True, type=Path)
  args = parser.parse_args()
  if not re.fullmatch(r'[A-Za-z0-9._-]+', args.tag) or 'validation' in args.tag.lower() or args.tag.startswith('untagged') or not re.fullmatch(r'ggcamp-[A-Za-z0-9._-]+\.apk', args.apk.name) or args.out.exists():
    raise SystemExit('需要正式标签、合法APK文件名和不存在的输出文件')
  from androguard.core.apk import APK
  from loguru import logger
  logger.remove()
  apk = APK(str(args.apk))
  with args.apk.open('rb') as file:
    digest = hashlib.file_digest(file, 'sha256').hexdigest()
  artifact = dict(abi='arm64-v8a', minSdk=24, url=ROOT + '/releases/download/' + args.tag + '/' + args.apk.name, size=args.apk.stat().st_size, sha256=digest, certificateSha256=CERT)
  value = dict(packageName=apk.get_package(), versionName=apk.get_androidversion_name(), versionCode=int(apk.get_androidversion_code()), releasePageUrl=ROOT + '/releases/tag/' + args.tag, artifacts=[artifact])
  inspect_apk(args.apk, artifact, value, args.apksigner)
  args.out.write_text(json.dumps(dict(schemaVersion=1, channel=args.channel, latest=value), ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
  main()
