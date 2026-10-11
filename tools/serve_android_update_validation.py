"""Serve one verified APK to a USB-connected test device; never publish it."""
import argparse
import hashlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path


def main():
  from androguard.core.apk import APK
  from loguru import logger
  logger.remove()
  parser = argparse.ArgumentParser(description=__doc__)
  parser.add_argument('apk', type=Path)
  args = parser.parse_args()
  apk = APK(str(args.apk))
  from android_validation_metadata import validate_embedded_build
  validate_embedded_build(apk)
  expected = '9ecbc0690bc086721c81ad61a1ec6a9ec0fe521b7937c6473ac94b7ee845ae67'
  certs = apk.get_certificates_der_v2()
  if apk.get_package() != 'com.chen.ggcamp' or (apk.get_androidversion_name(), int(apk.get_androidversion_code())) not in {('0.9.4', 106), ('0.9.5', 107)} or len(certs) != 1 or hashlib.sha256(certs[0]).hexdigest() != expected:
    raise SystemExit('仅支持正式证书签名的 ggCamp 更新验证包。')
  with args.apk.open('rb') as file:
    digest = hashlib.file_digest(file, 'sha256').hexdigest()
  manifest = dict(schemaVersion=1, channel='validation', packageName=apk.get_package(), versionName=apk.get_androidversion_name(), versionCode=int(apk.get_androidversion_code()), size=args.apk.stat().st_size, sha256=digest, certificateSha256=expected, url='http://127.0.0.1:18765/target.apk')
  payload = json.dumps(manifest).encode()

  class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
      if self.path == '/manifest.json':
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(payload)
      elif self.path == '/target.apk':
        self.send_response(200)
        self.send_header('Content-Type', 'application/vnd.android.package-archive')
        self.send_header('Content-Length', str(manifest['size']))
        self.end_headers()
        with args.apk.open('rb') as file:
          while chunk := file.read(262144):
            self.wfile.write(chunk)
      else:
        self.send_error(404)

  print(json.dumps(manifest, ensure_ascii=False), flush=True)
  print('仅监听本机 127.0.0.1:18765；通过 adb reverse 连接，不发布到 GitHub。', flush=True)
  ThreadingHTTPServer(('127.0.0.1', 18765), Handler).serve_forever()


if __name__ == '__main__':
  main()
