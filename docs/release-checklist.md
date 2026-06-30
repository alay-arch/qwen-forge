# Release Checklist

Use this checklist before publishing any GitHub release.

## Pre-Release

- [ ] All issues for the milestone are resolved
- [ ] Changelog is updated for the new version
- [ ] Version is bumped in:
  - `package.json`
  - `src/version.ts` (single runtime version constant)
  - `README.md` (header + config snippet)
  - `README.en.md` (header + config snippet)
  - `docs/README.md` (version banner)
  - `docs/README.en.md` (version banner)
- [ ] Run `bun run typecheck` — must pass
- [ ] Run `bash -n install.sh` — must report "Syntax OK"
- [ ] Run `qf --version` — must display the new version
- [ ] Search confirms old versions remain only in changelog history

## Installation Test

- [ ] `install.sh` runs cleanly on a fresh system
- [ ] `command -v qf` succeeds after installation
- [ ] `qf --help` displays correctly
- [ ] `qf --version` displays the correct version

## Docker Test

- [ ] Docker image builds from `debian:bookworm-slim`
- [ ] Chromium diagnostics report is correct for the target distro

## Documentation

- [ ] README.md is up to date
- [ ] README.en.md is up to date
- [ ] CHANGELOG entries are accurate
- [ ] All documentation links work
- [ ] No placeholder or TODO text remains

## Repository Hygiene

- [ ] `git status` shows only intended changes
- [ ] No `config.json`, `data/accounts.json`, or `.browser-profile` in the repo
- [ ] No `.qwen-forge.lock` or similar runtime files
- [ ] No secrets, tokens, or API keys in any file
- [ ] `.gitignore` covers all generated files
- [ ] LICENSE file is present and matches README
- [ ] `.github/SECURITY.md` is present

## GitHub Release

- [ ] Git tag is created: `git tag v0.1.x -m "v0.1.x"`
- [ ] Tag is pushed: `git push origin v0.1.x`
- [ ] GitHub Release is created from the tag
- [ ] Release notes include the changelog content
- [ ] Binary/asset links are verified (if any)
