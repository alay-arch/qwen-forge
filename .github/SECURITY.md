# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅ Active development |
| < 0.1   | ❌ No longer supported |

Only the latest minor release in the `0.1.x` series receives security updates.
Older versions must be upgraded to receive fixes.

## Reporting a Vulnerability

We take security seriously. If you discover a vulnerability in Qwen Forge,
please follow the responsible disclosure process below.

**Do not** report security vulnerabilities via public GitHub issues,
Discussions, or pull requests. Vulnerabilities disclosed publicly before
a fix is available put all users at risk.

### How to Report

1. **Email**: Send a detailed report to the repository owner.
   - Use the "Report a vulnerability" button on GitHub if available, or
   - Open a draft Security Advisory at
     `https://github.com/alay-arch/qwen-forge/security/advisories/new`

2. **Include in your report**:
   - Affected version(s)
   - Type of vulnerability (e.g., remote code execution, XSS, privilege escalation)
   - Steps to reproduce (proof of concept preferred)
   - Potential impact
   - Suggested fix (if known)

### Expected Response Time

- **Acknowledgment**: within 48 hours of your report
- **Initial assessment**: within 5 business days
- **Patch release**: typically within 14 days for confirmed critical issues

We will keep you informed of progress throughout the process.

## Scope

The following are in scope for security reports:

- The `qf` CLI application and its source code
- The installation script (`install.sh`)
- Runtime dependencies managed by the project
- Account registration data handling

The following are out of scope:

- Third-party services (CatchMail, Qwen AI)
- The Bun runtime or Playwright/CloakBrowser themselves
- Issues that require physical access to the machine
- Social engineering attacks

## Disclosure Process

1. Reporter submits vulnerability privately
2. Maintainer acknowledges receipt within 48 hours
3. Maintainer investigates, develops a fix, and prepares a patch release
4. Patch is released and announced via GitHub Releases
5. Reporter is credited in the release notes (if desired)
6. Vulnerability details are published after the fix is available

We aim to release a patched version within 14 days of confirming a
critical vulnerability.

## Responsible Disclosure

We kindly ask that you:

- Give us reasonable time to fix the issue before disclosing it publicly
- Do not exploit the vulnerability beyond demonstrating impact
- Do not access or modify user data without permission
- Follow all applicable laws
- Report in good faith

## Preferred Languages

We accept reports in:

- English
- Русский (Russian)
