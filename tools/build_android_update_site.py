"""Build one Pages artifact: existing pronunciation assets plus verified public feeds."""
import argparse
import json
import os
from pathlib import Path
import shutil
import tempfile
from urllib.request import Request, urlopen
from android_public_release import REPO, validate_release, inspect_apk


def fetch_json(url, token=None, limit=2000000):
  headers = {'User-Agent': 'ggcamp-update-publisher', 'Accept': 'application/vnd.github+json'}
  if token:
    headers['Authorization'] = 'Bearer ' + token
  with urlopen(Request(url, headers=headers), timeout=30) as response:
    data = response.read(limit + 1)
  if len(data) > limit:
    raise ValueError('更新元数据过大')
  return json.loads(data)


def public_candidates(releases, fetch):
  result = {'stable': [], 'beta': []}
  for release in releases:
    if release.get('draft') or not release.get('published_at'):
      continue
    assets = [a for a in release.get('assets', []) if a.get('name') == 'ANDROID-UPDATE.json']
    if not assets:
      continue  # Legacy releases never become APK updates implicitly.
    if len(assets) != 1 or assets[0].get('state') != 'uploaded':
      raise ValueError('更新清单附件不完整')
    url = assets[0].get('browser_download_url', '')
    expected = 'https://github.com/' + REPO + '/releases/download/' + release['tag_name'] + '/ANDROID-UPDATE.json'
    if url != expected:
      raise ValueError('元数据附件来源不符')
    metadata = fetch(url)
    value = validate_release(release, metadata)
    result[metadata['channel']].append(value)
  return {channel: max(values, key=lambda v: v['versionCode']) if values else None for channel, values in result.items()}


def main():
  parser = argparse.ArgumentParser(description=__doc__)
  parser.add_argument('--site', required=True, type=Path)
  parser.add_argument('--output', required=True, type=Path)
  parser.add_argument('--apksigner', type=Path)
  args = parser.parse_args()
  if not (args.site / 'index.html').is_file() or args.output.exists():
    raise SystemExit('需要音频站点源目录和不存在的输出目录')
  releases = []
  for page in range(1, 11):
    batch = fetch_json(f'https://api.github.com/repos/{REPO}/releases?per_page=100&page={page}', os.environ.get('GITHUB_TOKEN'))
    if not isinstance(batch, list):
      raise ValueError('GitHub发布列表无效')
    releases.extend(batch)
    if len(batch) < 100:
      break
  else:
    raise ValueError('发布历史超出校验范围，停止部署')
  latest = public_candidates(releases, lambda url: fetch_json(url, limit=65536))
  with tempfile.TemporaryDirectory(prefix='ggcamp-published-apk-') as temp:
    for channel, value in latest.items():
      if not value:
        continue
      if not args.apksigner:
        raise ValueError('公开更新需要官方apksigner校验')
      artifact = value['artifacts'][0]
      path = Path(temp) / f'{channel}.apk'
      with urlopen(Request(artifact['url'], headers={'User-Agent': 'ggcamp-update-publisher'}), timeout=120) as response, path.open('wb') as file:
        total = 0
        while chunk := response.read(262144):
          total += len(chunk)
          if total > artifact['size']:
            raise ValueError('APK下载大小超限')
          file.write(chunk)
      inspect_apk(path, artifact, value, args.apksigner)
  shutil.copytree(args.site, args.output)
  target = args.output / 'updates/android'
  target.mkdir(parents=True, exist_ok=True)
  for channel, value in latest.items():
    (target / f'{channel}.json').write_text(json.dumps(dict(schemaVersion=1, channel=channel, latest=value), ensure_ascii=False, indent=2) + '\n')
  print('Pages includes pronunciation assets and verified stable/beta feeds; drafts excluded.')


if __name__ == '__main__':
  main()
