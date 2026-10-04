# Repository Guidelines

## Project Structure

This repository is the deployable Mini Program and Android snapshot of dopa-drill. `pages/` and `components/` define native interactions; `lib/` contains platform adapters; `assets/` and `miniapp/` contain resources and icons. `shared/` and `content/` are generated in the source repository. Edit their source modules or content packs there, regenerate, and synchronize the results here.

## Development and Validation

Import this repository root into WeChat Developer Tools. Run `node --test tests/*.test.mjs` for native storage and release configuration regressions. Run the full suite and `node tools/build_miniprogram.mjs --check` in dopa-drill before synchronizing generated modules. Verify visual changes on the relevant native host; simulator results do not prove APK behavior.

## Coding and Releases

Preserve two-space indentation, single-quoted JavaScript strings, semicolons and surrounding formatting. Use Simplified Chinese UI copy. Use short imperative commit subjects with `fix:`, `feat:` or `docs:` prefixes.

For Android packaging or signing, read `docs/deployment/android-release.md`. Keep signing keys, passwords and personal Developer Tools configuration outside tracked files. Validate permissions and identity in the actual generated APK. Preserve MIT and font notices; follow the character replacement restriction in LICENSE when distributing derivatives.

## Documentation

Keep README focused on introduction, use, deployment and secondary development. Before debugging audio, host lifecycle or celebration effects, consult `docs/debugging-history.md`; append diagnosis, failed attempts, fixes and validation there. Security findings belong in `docs/security/`. Current review tasks are in `docs/review/`; historical test results are not current release guarantees.
