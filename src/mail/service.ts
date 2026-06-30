/** Mail — email generation, password generation, activation, mail polling with retry */
import { sleep, sleepWithEsc, showCancelPrompt } from '../cli/helpers.js';
import { isDebug } from '../utils/runtime.js';
import { randomInt } from 'crypto';

// ── Email generation ────────────────────────────────────────────────

export function generateEmail(domain: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let user = '';
  for (let i = 0; i < 10; i++) user += chars[randomInt(chars.length)];
  return `${user}@${domain}`;
}

// ── Password generation ─────────────────────────────────────────────

export function generatePassword(length = 16): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%';
  const all = upper + lower + digits + special;
  const chars = [upper[randomInt(upper.length)], lower[randomInt(lower.length)], digits[randomInt(digits.length)], special[randomInt(special.length)]];
  for (let i = chars.length; i < length; i++) chars.push(all[randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

// ── Activation via link with retry ─────────────────────────────────

export async function activateAccount(link: string): Promise<boolean> {
  const debug = isDebug();
  if (!isAllowedActivationLink(link)) return false;
  if (debug) console.log(`[DEBUG] Opening activation link: ${redactUrl(link)}`);

  for (let attempt = 0; attempt < 2; attempt++) {
    if (debug && attempt > 0) console.log(`[DEBUG] Activation retry attempt ${attempt + 1}/2`);

    try {
      const resp = await fetch(link, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(30000),
      });
      if (debug) console.log(`[DEBUG] Activation response: ${resp.status} ${resp.statusText}`);

      if (resp.ok) {
        if (debug) console.log(`[DEBUG] Activation successful`);
        return true;
      }
    } catch (err: any) {
      if (debug) console.log(`[DEBUG] Activation request failed: ${err.message || err}`);
    }
    if (attempt === 0) {
      const esc = await sleepWithEsc(3000);
      if (esc) {
        const cancelled = await showCancelPrompt('Cancel activation?');
        if (cancelled) {
          if (debug) console.log(`[DEBUG] Activation cancelled by user`);
          return false;
        }
      }
    }
  }

  if (debug) console.log(`[DEBUG] Activation failed after 2 attempts`);
  return false;
}

function isAllowedActivationLink(link: string): boolean {
  try {
    const url = new URL(link);
    return url.protocol === 'https:' && (url.hostname === 'chat.qwen.ai' || url.hostname.endsWith('.qwen.ai'));
  } catch {
    return false;
  }
}

function redactUrl(link: string): string {
  try {
    const url = new URL(link);
    if (url.search) url.search = '?...';
    return url.toString();
  } catch {
    return '[invalid-url]';
  }
}

// ── Mail API client with retry and exponential backoff ──────────────

const RETRY_DELAYS = [2000, 4000, 8000];

async function fetchWithRetry(url: string, timeoutMs = 15000): Promise<Response> {
  let lastErr: Error | null = null;
  for (const delay of [0, ...RETRY_DELAYS]) {
    if (delay > 0) await sleep(delay);
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
      if (resp.ok) return resp;
      if (resp.status >= 500) { lastErr = new Error(`HTTP ${resp.status}`); continue; }
      return resp;
    } catch (err: any) {
      lastErr = err;
    }
  }
  throw lastErr || new Error(`Request failed: ${url}`);
}

export async function fetchMessages(apiUrl: string, email: string): Promise<any[]> {
  const debug = isDebug();
  const url = `${apiUrl}/mailbox?address=${encodeURIComponent(email)}`;

  if (debug) console.log(`[DEBUG] HTTP GET ${url}`);

  const resp = await fetchWithRetry(url);

  if (debug) console.log(`[DEBUG] HTTP ${resp.status} ${resp.statusText}`);

  const data = await resp.json();

  if (debug) {
    const jsonSize = JSON.stringify(data).length;
    console.log(`[DEBUG] Response size: ${jsonSize} bytes`);
    console.log(`[DEBUG] Response structure: ${Object.keys(data).join(', ')}`);
  }

  return data.messages || [];
}

export async function fetchMessage(apiUrl: string, messageId: string, email: string): Promise<any> {
  const debug = isDebug();
  const url = `${apiUrl}/message/${messageId}?mailbox=${encodeURIComponent(email)}`;

  if (debug) console.log(`[DEBUG] HTTP GET ${url}`);

  const resp = await fetchWithRetry(url);

  if (debug) console.log(`[DEBUG] HTTP ${resp.status} ${resp.statusText}`);

  const data = await resp.json();

  if (debug) {
    const jsonSize = JSON.stringify(data).length;
    console.log(`[DEBUG] Response size: ${jsonSize} bytes`);
  }

  return data;
}

export function extractActivationLink(message: any): string | null {
  const debug = isDebug();

  const bodyText = (typeof message.body?.text === 'string' ? message.body.text :
                    typeof message.text === 'string' ? message.text :
                    typeof message.body === 'string' ? message.body : '') as string;
  const bodyHtml = (typeof message.body?.html === 'string' ? message.body.html :
                    typeof message.html === 'string' ? message.html : '') as string;
  const searchText = bodyText + ' ' + bodyHtml;

  if (debug) {
    const allText = [
      ...Object.keys(message).filter(k => typeof message[k] === 'string').map(k => `${k}:${String(message[k]).substring(0,80)}`),
      ...(message.body ? Object.keys(message.body).filter(k => typeof message.body[k] === 'string').map(k => `body.${k}:${String(message.body[k]).substring(0,80)}`) : []),
    ];
    console.log(`[DEBUG] Extracting link from message`);
    console.log(`[DEBUG] Message + body fields: ${allText.join(', ')}`);
    console.log(`[DEBUG] body text length: ${bodyText.length}, body html length: ${bodyHtml.length}`);
  }

  const qwenPattern = /https:\/\/[a-z0-9.-]*qwen\.ai[^\s"'>]*/i;
  const qwenMatch = searchText.match(qwenPattern);
  if (qwenMatch && isAllowedActivationLink(qwenMatch[0])) {
    if (debug) console.log(`[DEBUG] Found qwen.ai link: ${qwenMatch[0]}`);
    return qwenMatch[0];
  }

  const patterns = [/https:\/\/[a-z0-9.-]*qwen\.ai[^\s"'>]*(activate|verify|confirm|signup|\/auth)[^\s"'>]*/i];

  for (const pattern of patterns) {
    const match = searchText.match(pattern);
    if (match) {
      const link = match[0];
      if (!isAllowedActivationLink(link) || /unsubscribe|track|notification/i.test(link)) {
        if (debug) console.log(`[DEBUG] Skipping excluded link: ${link}`);
        continue;
      }
      if (debug) console.log(`[DEBUG] Found activation link: ${redactUrl(link)}`);
      return link;
    }
  }

  if (debug) console.log(`[DEBUG] No activation link found in message`);
  return null;
}

export async function waitForMail(
  apiUrl: string, email: string, timeoutMs: number
): Promise<{ link: string | null; messages: number }> {
  const deadline = Date.now() + timeoutMs;
  let attempts = 0;
  const debug = isDebug();

  if (debug) {
    console.log('[DEBUG] ┌─ Mail Pipeline ──────────────────────────────');
    console.log(`[DEBUG] │ Polling... (timeout: ${timeoutMs}ms)`);
    console.log(`[DEBUG] │ Email: ${email}`);
    console.log(`[DEBUG] │ API: ${apiUrl}`);
  }

  while (Date.now() < deadline) {
    attempts++;
    if (debug) console.log(`[DEBUG] │ Polling mailbox... (attempt ${attempts})`);

    try {
      const url = `${apiUrl}/mailbox?address=${encodeURIComponent(email)}`;
      if (debug) console.log(`[DEBUG] │ HTTP Request: GET ${url.substring(0, 100)}`);

      const resp = await fetchWithRetry(url);
      if (debug) console.log(`[DEBUG] │ HTTP Status: ${resp.status} ${resp.statusText}`);

      const data = await resp.json();
      const messages = data.messages || [];

      if (debug) {
        const jsonSize = JSON.stringify(data).length;
        console.log(`[DEBUG] │ JSON Response: ${jsonSize} bytes`);
        console.log(`[DEBUG] │ Messages count: ${messages.length}`);
      }

      if (messages.length === 0) {
        if (debug) console.log(`[DEBUG] │ └ No messages yet, retrying in 3s...`);
        const esc = await sleepWithEsc(3000);
        if (esc) {
          const cancelled = await showCancelPrompt('Cancel mail waiting?');
          if (cancelled) {
            if (debug) console.log(`[DEBUG] │ └ Cancelled by user`);
            return { link: null, messages: 0 };
          }
        }
        continue;
      }

      const sorted = [...messages].sort((a, b) =>
        new Date(b.created_at || b.date || 0).getTime() -
        new Date(a.created_at || a.date || 0).getTime()
      );

      for (let i = 0; i < sorted.length; i++) {
        const msg = sorted[i];
        if (debug) console.log(`[DEBUG] │ Selected message ID: ${msg.id} (${i + 1}/${sorted.length})`);

        try {
          const full = await fetchMessage(apiUrl, msg.id, email);

          if (debug) console.log(`[DEBUG] │ Reading message body...`);
          const link = extractActivationLink(full);

          if (link) {
            if (debug) {
              console.log(`[DEBUG] │ Activation link found: ${link}`);
              console.log(`[DEBUG] └────────────────────────────────────────`);
            }
            return { link, messages: messages.length };
          } else {
            if (debug) console.log(`[DEBUG] │ No activation link in this message`);
          }
        } catch (err: any) {
          if (debug) console.log(`[DEBUG] │ Failed to fetch message ${msg.id}: ${err.message || err}`);
          continue;
        }
      }

      if (debug) console.log(`[DEBUG] │ Checked ${sorted.length} messages`);

      const esc2 = await sleepWithEsc(3000);
      if (esc2) {
        const cancelled = await showCancelPrompt('Cancel mail waiting?');
        if (cancelled) {
          if (debug) console.log(`[DEBUG] │ └ Cancelled by user`);
          return { link: null, messages: 0 };
        }
      }
    } catch (err: any) {
      if (debug) console.log(`[DEBUG] │ Error: ${err.message || err}`);
      const backoff = Math.min(attempts * 2000, 10000);
      if (debug) console.log(`[DEBUG] │ Backing off ${backoff}ms...`);
      const esc3 = await sleepWithEsc(backoff);
      if (esc3) {
        const cancelled = await showCancelPrompt('Cancel mail waiting?');
        if (cancelled) {
          if (debug) console.log(`[DEBUG] │ └ Cancelled by user`);
          return { link: null, messages: 0 };
        }
      }
    }
  }

  if (debug) {
    console.log(`[DEBUG] │ Timeout reached after ${attempts} attempts`);
    console.log(`[DEBUG] └────────────────────────────────────────`);
  }
  return { link: null, messages: 0 };
}
