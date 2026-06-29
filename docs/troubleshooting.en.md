# Troubleshooting

## Application won't start

**Application already running**
```
Application already running
```
The previous process did not exit. Remove the lock file or wait.

**No internet connection**
```
No internet connection
```
Check your network connection.

**Qwen unavailable**
```
Qwen unavailable
```
chat.qwen.ai may be down. Check manually in a browser.

## Registration errors

**Form not submitted**
```
Failed to submit form
```
Possible causes:
- Qwen page structure changed (selectors outdated)
- CAPTCHA/Cloudflare blocking the submission
- Network issues

**Email not received**
```
Email not received
```
- Increase `mail.timeout` in `config.json`
- Check CatchMail — delivery may be delayed
- Verify the email was generated correctly

**Activation failed**
```
Activation failed
```
- Open the activation link manually in a browser
- The link may have expired

**Logout failed**
```
Logout failed
```
- Re-run the application — logout will retry automatically
- If the issue persists, clear the browser profile

## Diagnostics

```bash
qf --debug
```

In `--debug` mode, logs are printed to the console. Use for troubleshooting.

Built-in diagnostics is also available (menu item 5).
