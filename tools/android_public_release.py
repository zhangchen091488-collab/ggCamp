"""Validate public updates; only the explicitly approved 1.0.0 cloud host has two exceptions."""
import hashlib
from pathlib import Path
import re
import subprocess
from android_validation_metadata import validate_embedded_build

REPO = 'zhangchen091488-collab/ggCamp'
ROOT = 'https://github.com/' + REPO
CERT = '9ecbc0690bc086721c81ad61a1ec6a9ec0fe521b7937c6473ac94b7ee845ae67'


# User approved these two cloud-host declarations for this exact release on 2026-10-11.
# This does not allow debug builds, sensitive permissions, or different app identities.
APPROVED_CLOUD_RELEASE = ('com.chen.ggcamp', '1.0.0', 109)


def check_host_manifest(manifest, identity):
  ns = '{http://schemas.android.com/apk/res/android}'
  app = manifest.find('application')
  if app is None or app.get(ns + 'debuggable') == 'true':
    raise ValueError('公开更新拒绝调试宿主')
  limitations = []
  if app.get(ns + 'usesCleartextTraffic') != 'false':
    limitations.append('云宿主尚未禁止明文网络')
  if any(n.get(ns + 'name', '').startswith('android.hardware.camera') and n.get(ns + 'required', 'true') == 'true' for n in manifest.findall('uses-feature')):
    limitations.append('云宿主声明必需相机硬件')
  if limitations and tuple(identity) != APPROVED_CLOUD_RELEASE:
    raise ValueError('该版本未获准接受云宿主限制：' + '；'.join(limitations))
  return limitations


def validate_release(release, metadata):
  if release.get('draft') or not release.get('published_at'):
    raise ValueError('草稿不能进入更新渠道')
  tag = release.get('tag_name', '')
  if not re.fullmatch(r'[A-Za-z0-9._-]+', tag) or 'validation' in tag.lower() or tag.startswith('untagged'):
    raise ValueError('私有验证标签不能发布更新')
  channel = 'beta' if release.get('prerelease') else 'stable'
  if metadata.get('schemaVersion') != 1 or metadata.get('channel') != channel:
    raise ValueError('发布渠道不符')
  value = metadata.get('latest') or {}
  if value.get('packageName') != 'com.chen.ggcamp' or not re.fullmatch(r'\d+\.\d+\.\d+', value.get('versionName', '')) or type(value.get('versionCode')) is not int or value['versionCode'] < 1:
    raise ValueError('版本身份不符')
  if value.get('releasePageUrl') != ROOT + '/releases/tag/' + tag:
    raise ValueError('发布地址不符')
  artifacts = value.get('artifacts', [])
  if len(artifacts) != 1:
    raise ValueError('当前只支持一个arm64安装包')
  artifact = artifacts[0]
  name = artifact.get('url', '').removeprefix(ROOT + '/releases/download/' + tag + '/')
  if not re.fullmatch(r'ggcamp-[A-Za-z0-9._-]+\.apk', name) or artifact['url'] != ROOT + '/releases/download/' + tag + '/' + name:
    raise ValueError('下载来源不符')
  if artifact.get('abi') != 'arm64-v8a' or artifact.get('minSdk') != 24 or artifact.get('certificateSha256') != CERT or not re.fullmatch(r'[a-f0-9]{64}', artifact.get('sha256', '')) or type(artifact.get('size')) is not int or not 0 < artifact['size'] <= 200 * 1024 * 1024:
    raise ValueError('安装包元数据不符')
  assets = [a for a in release.get('assets', []) if a.get('name') == name]
  if len(assets) != 1 or assets[0].get('state') != 'uploaded' or assets[0].get('size') != artifact['size'] or assets[0].get('browser_download_url') != artifact['url']:
    raise ValueError('发布附件缺失或未上传完成')
  return { **value, 'publishedAt': release['published_at'], 'releaseNotes': str(release.get('body') or '')[:4000] }


def inspect_apk(path, artifact, version, apksigner):
  from androguard.core.apk import APK
  from loguru import logger
  logger.remove()
  path = Path(path)
  with path.open('rb') as file:
    digest = hashlib.file_digest(file, 'sha256').hexdigest()
  if path.stat().st_size != artifact['size'] or digest != artifact['sha256']:
    raise ValueError('实际APK摘要或大小不符')
  apk = APK(str(path))
  if (apk.get_package(), apk.get_androidversion_name(), int(apk.get_androidversion_code())) != (version['packageName'], version['versionName'], version['versionCode']):
    raise ValueError('实际APK版本不符')
  validate_embedded_build(apk, validation=False, public_updates=True)
  certificates = apk.get_certificates_der_v2()
  if len(certificates) != 1 or hashlib.sha256(certificates[0]).hexdigest() != CERT:
    raise ValueError('实际APK证书不符')
  check_host_manifest(apk.get_android_manifest_xml(), (apk.get_package(), apk.get_androidversion_name(), int(apk.get_androidversion_code())))
  if sorted({name.split('/')[1] for name in apk.get_files() if name.startswith('lib/') and name.endswith('.so')}) != ['arm64-v8a'] or int(apk.get_min_sdk_version()) != artifact['minSdk']:
    raise ValueError('实际APK架构或系统要求不符')
  forbidden = {'CAMERA', 'RECORD_AUDIO', 'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'READ_PHONE_STATE', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE'}
  if any(p.rsplit('.', 1)[-1] in forbidden for p in apk.get_permissions()):
    raise ValueError('实际APK包含无关敏感权限')
  subprocess.run([str(apksigner), 'verify', '--verbose', str(path)], check=True, capture_output=True)
