"""Verify fixed validation metadata inside the actual cloud-built WX package."""
import re
import struct


def validate_embedded_build(apk, validation=True, public_updates=False):
  expected = (apk.get_package(), apk.get_androidversion_name(), int(apk.get_androidversion_code()))
  matches = []
  for name in apk.get_files():
    if not name.startswith('assets/SaaA_embed/') or not name.endswith('.wxapkg'):
      continue
    data = apk.get_file(name)
    if len(data) < 18 or data[0] != 0xbe or data[13] != 0xed:
      raise ValueError('无法解析 APK 内嵌构建信息')
    count = struct.unpack_from('>I', data, 14)[0]
    offset = 18
    for _ in range(count):
      length = struct.unpack_from('>I', data, offset)[0]
      offset += 4
      filename = data[offset:offset + length].decode()
      offset += length
      start, size = struct.unpack_from('>II', data, offset)
      offset += 8
      if start + size > len(data):
        raise ValueError('内嵌文件边界无效')
      if filename != '/app-service.js':
        continue
      script = data[start:start + size].decode()
      module = re.search(r'define\(["\']lib/android-build\.js["\'](.*?)(?=\bdefine\(|\Z)', script, re.S)
      if not module:
        raise ValueError('缺少 APK 内嵌构建信息')
      body = module.group(1)
      package = re.search(r'packageName:\s*["\']([^"\']+)', body)
      version = re.search(r'versionName:\s*["\']([^"\']+)', body)
      code = re.search(r'versionCode:\s*(\d+)', body)
      if not all([package, version, code]) or not re.search(r'validation:\s*(?:!0|true)\b' if validation else r'validation:\s*(?:!1|false)\b', body):
        raise ValueError('内嵌验证身份不完整')
      if public_updates and (not re.search(r'publicUpdates:\s*(?:!0|true)\b', body) or not re.search(r'abi:\s*[\"\']arm64-v8a[\"\']', body) or not re.search(r'minSdk:\s*24\b', body)):
        raise ValueError('正式更新构建信息不完整')
      matches.append((package.group(1), version.group(1), int(code.group(1))))
  if matches != [expected]:
    raise ValueError('内嵌构建信息与实际 APK Manifest 不一致')
  return expected
