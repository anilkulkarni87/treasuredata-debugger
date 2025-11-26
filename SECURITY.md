# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 3.1.x   | :white_check_mark: |
| 3.0.x   | :x:                |
| < 3.0   | :x:                |

## Reporting a Vulnerability

We take the security of Treasure Data Debugger seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Where to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via:

- **Email**: [your-email@example.com] (replace with actual contact)
- **GitHub Security Advisories**: Use the "Security" tab in the repository

### What to Include

Please include the following information in your report:

- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity (see below)

### Severity Levels

| Severity     | Description                                 | Response Time |
| ------------ | ------------------------------------------- | ------------- |
| **Critical** | Remote code execution, data exfiltration    | 24-48 hours   |
| **High**     | Authentication bypass, privilege escalation | 3-7 days      |
| **Medium**   | XSS, CSRF, information disclosure           | 7-14 days     |
| **Low**      | Minor information leaks, DoS                | 14-30 days    |

## Security Measures

### Current Protections

1. **Local-Only Processing**
   - All data processing happens locally in DevTools
   - No data sent to external servers
   - No telemetry or analytics

2. **Authorization Masking**
   - Authorization headers are automatically masked in UI
   - Only first 8 characters visible
   - Full tokens never stored or logged

3. **PII Redaction**
   - Built-in patterns for emails and tokens
   - Custom regex rules for additional PII
   - Applied before display in UI

4. **Content Security Policy**
   - Strict CSP prevents inline script execution
   - Only allows scripts from extension itself
   - Blocks external resource loading

5. **Input Validation**
   - JSON validation in settings modal
   - Regex validation in redaction rules
   - Sanitized output in UI (textContent, not innerHTML)

6. **Chrome Extension Permissions**
   - Minimal permissions requested
   - Only `storage` permission required
   - Host permissions limited to treasuredata.com domains

### Known Limitations

1. **DevTools Requirement**
   - Extension only works when DevTools is open
   - Cannot capture requests when DevTools is closed

2. **Storage Limits**
   - Chrome sync storage limited to 100KB
   - Large configurations may hit limits

3. **Browser Compatibility**
   - Requires Chrome 114+ or equivalent Edge version
   - Not compatible with Firefox (different extension API)

## Best Practices for Users

### Protecting Your Data

1. **Don't Share Screenshots**
   - Screenshots may contain sensitive data
   - Redact PII before sharing
   - Use the built-in redaction feature

2. **Review Export Files**
   - Exported CSV/JSON may contain sensitive data
   - Review before sharing with others
   - Use redaction before export

3. **Custom Redaction Rules**
   - Add patterns for your specific PII
   - Test rules before relying on them
   - Keep rules up to date

4. **Settings Security**
   - Don't import settings from untrusted sources
   - Review imported settings before applying
   - Export settings to backup

### Safe Development

1. **Code Review**
   - Review all code changes
   - Check for security implications
   - Test with sensitive data

2. **Dependencies**
   - Keep dependencies updated
   - Review dependency changes
   - Use `npm audit` regularly

3. **Testing**
   - Test with real-world data
   - Include security test cases
   - Verify redaction works

## Disclosure Policy

### Coordinated Disclosure

We follow coordinated disclosure:

1. Reporter notifies us privately
2. We confirm and investigate
3. We develop and test a fix
4. We release the fix
5. We publicly disclose (with credit to reporter)

### Public Disclosure Timeline

- **Critical/High**: 90 days after fix release
- **Medium/Low**: 120 days after fix release
- **Earlier disclosure**: If exploit is public or actively exploited

### Credit

We will credit security researchers who:

- Report vulnerabilities responsibly
- Follow our disclosure policy
- Don't exploit vulnerabilities
- Help us improve security

Credit will be given in:

- Security advisory
- CHANGELOG.md
- README.md (if significant)

## Security Updates

### How to Stay Informed

- Watch this repository for security advisories
- Check CHANGELOG.md for security fixes
- Subscribe to release notifications

### Applying Updates

1. Check for updates regularly
2. Review CHANGELOG.md for security fixes
3. Update extension via Chrome Web Store (when published)
4. Or manually update from GitHub releases

## Vulnerability History

No security vulnerabilities have been reported or fixed yet.

## Contact

For security concerns, please contact:

- **Email**: [your-email@example.com]
- **GitHub**: [@your-username]

For general questions, use GitHub Issues or Discussions.

---

**Last Updated**: 2025-01-25  
**Version**: 1.0
