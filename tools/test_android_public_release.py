import copy
import unittest
from android_public_release import ROOT, CERT, validate_release
from build_android_update_site import public_candidates

class PublicFeedTests(unittest.TestCase):
  def setUp(self):
    self.artifact = dict(abi='arm64-v8a', minSdk=24, url=ROOT+'/releases/download/v0.9.7/ggcamp-0.9.7.apk', size=123, sha256='a'*64, certificateSha256=CERT)
    self.metadata = dict(schemaVersion=1, channel='beta', latest=dict(packageName='com.chen.ggcamp', versionName='0.9.7', versionCode=109, releasePageUrl=ROOT+'/releases/tag/v0.9.7', artifacts=[self.artifact]))
    self.release = dict(draft=False, prerelease=True, tag_name='v0.9.7', published_at='2026-10-11T14:00:00Z', body='更新', assets=[dict(name='ggcamp-0.9.7.apk', state='uploaded', size=123, browser_download_url=self.artifact['url']),dict(name='ANDROID-UPDATE.json', state='uploaded', browser_download_url=ROOT+'/releases/download/v0.9.7/ANDROID-UPDATE.json')])
  def test_drafts_never_fetch_metadata(self):
    self.release['draft'] = True
    def forbidden(url): raise AssertionError('draft accessed')
    self.assertEqual(public_candidates([self.release], forbidden), dict(stable=None,beta=None))
  def test_channels_and_uploaded_assets(self):
    self.assertEqual(validate_release(self.release,self.metadata)['versionCode'],109)
    self.release['prerelease']=False
    with self.assertRaises(ValueError): validate_release(self.release,self.metadata)
    self.release['prerelease']=True
    self.release['assets'][0]['size']=1
    with self.assertRaises(ValueError): validate_release(self.release,self.metadata)
  def test_legacy_is_not_implicitly_an_update(self):
    self.release['assets']=self.release['assets'][:1]
    self.assertEqual(public_candidates([self.release],lambda _:self.metadata),dict(stable=None,beta=None))
  def test_private_source_and_certificate_rejected(self):
    for key,value in [('url','http://localhost/a.apk'),('certificateSha256','0'*64),('minSdk',35)]:
      changed=copy.deepcopy(self.metadata); changed['latest']['artifacts'][0][key]=value
      with self.assertRaises(ValueError): validate_release(self.release,changed)
  def test_published_beta_only_enters_beta(self):
    result=public_candidates([self.release],lambda _:self.metadata)
    self.assertIsNone(result['stable']); self.assertEqual(result['beta']['versionCode'],109)

if __name__ == '__main__': unittest.main()
