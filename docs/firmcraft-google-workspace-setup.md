# Firmcraft Google Workspace Email Setup — Status & Runbook

**Related docs:** [Resend Mail Setup](resend-firmcraft-mail-setup.md) · [Cloudflare Access Setup](../cloudflare-access-setup.md) · [Credentials Template](firmcraft-credentials-template.md)

_Last updated 2026-06-01. Covers domain verification, DKIM, DMARC, and email
access for OpenClaw (Mac mini) + Hermes dogfood._

## TL;DR — what's done vs. what needs you

| Item | Status | Who |
|------|--------|-----|
| DMARC record (`_dmarc.firmcraft.ai`) | ✅ **Done** — pushed to Cloudflare, resolving publicly | — |
| SPF (`v=spf1 include:_spf.google.com ~all`) | ✅ Already present | — |
| Google MX records (5×) | ✅ Already present | — |
| Domain-verification DNS (`google-site-verification` TXT + `gv-…` CNAME) | ✅ Present in Cloudflare | — |
| Click "Verify" in admin console | ✅ **Done** — domain verified 2026-06-07 | — |
| Gmail DKIM key generation | ✅ **Done** — 2048-bit DKIM key generated, pushed to Cloudflare, confirmed in Google setup | — |
| Hermes dogfood Gmail re-auth | ⏳ **Needs you** (sign in + consent) → URL ready, see below | Doyle |
| OpenClaw Gmail access | ⏳ **Needs you** (App Password) → then I wire it | Doyle |

**Why several steps need you and not me:** signing into the brand-new
`doyle@firmcraft.ai` account requires typing the account password into Google's
login form. Entering passwords to authenticate is a hard safety boundary I don't
cross — so any step gated behind that first login is yours. Everything that
could be done with the Cloudflare API or over SSH, I've already done or staged.

---

## Task 1 — Domain verification + DKIM + DMARC

### Already done
- **DMARC** — `TXT _dmarc.firmcraft.ai = v=DMARC1; p=quarantine; rua=mailto:doyle@firmcraft.ai`
  pushed to Cloudflare zone `5b314fe1a40778ea0fbf6a73d04ed410`. Verified live:
  `dig +short TXT _dmarc.firmcraft.ai`.
- **Domain verification records** are already in Cloudflare (TXT
  `google-site-verification=DQAorFgaMKQ…` and CNAME `7t3dxle7yqcc → gv-…dv.googlehosted.com`).
  Domain verification was completed in Google Admin on 2026-06-07. Gmail activation also completed; Google notes delivery can take up to 24 hours.

### DKIM — completed
DKIM was generated in Google Admin on 2026-06-07, pushed to Cloudflare with `ops/push-firmcraft-dkim.sh`, and confirmed in the Google setup flow. Public DNS resolves at `google._domainkey.firmcraft.ai`. Original runbook kept below for future rotation:

1. In **admin.google.com** (signed in as `doyle@firmcraft.ai`):
   **Apps → Google Workspace → Gmail → Authenticate email**. Select `firmcraft.ai`,
   leave selector `google`, key length 2048, **Generate new record**. Copy the
   **TXT record value** (`v=DKIM1; k=rsa; p=…`).

2. Push it to Cloudflare with the staged helper (create-or-update, safe to re-run):

   ```bash
   CLOUDFLARE_TOKEN=<CLOUDFLARE_API_TOKEN> \
     ops/push-firmcraft-dkim.sh 'google._domainkey' 'v=DKIM1; k=rsa; p=PASTE_WHOLE_VALUE'
   ```

3. Back in the console, click **Start authentication**. (Google may take up to
   ~48h, usually minutes, to flip it on.)

---

## Task 2 — OpenClaw (Mac mini) Gmail access

**Current state:** OpenClaw (`~/.openclaw/openclaw.json`, v2026.5.7) has **no email
channel and no MCP server** configured — only Slack. Its "channels" are chat
transports (Slack/Telegram/Discord); email is not a native channel. Gmail access
therefore needs either an MCP server or an IMAP/SMTP bridge, both of which need a
credential that requires the first Google login.

**Recommended path (simplest, no Google Cloud project): Gmail App Password.**

1. Enable **2-Step Verification** on `doyle@firmcraft.ai`
   (myaccount.google.com → Security). Required before app passwords exist.
2. Create an **App Password** (Security → App passwords → "Mail" / "Other").
   You get a 16-char password.
3. Hand it to me and I'll wire an IMAP/SMTP Gmail MCP into OpenClaw via
   `openclaw mcp set`, scoped to `doyle@firmcraft.ai`
   (IMAP `imap.gmail.com:993`, SMTP `smtp.gmail.com:587`). I did **not**
   pre-install a speculative MCP package — I'll do it once the credential exists
   so it's tested, not guessed.

(Alternative: OAuth desktop-client like Hermes uses — heavier, needs a Cloud
project. App Password is the right call for send/receive only.)

---

## Task 3 — Hermes dogfood (5.78.117.234) Gmail access

**Current state:** Hermes already has the `google-workspace` skill wired
(`/root/.hermes/google_client_secret.json` present), but the stored OAuth token
is **revoked** — `setup.py --check` returns `REFRESH_FAILED (invalid_grant)`. It
just needs re-authorization as `doyle@firmcraft.ai`.

I've already **generated a fresh authorization URL** and staged the matching PKCE
verifier on the server (`/opt/data/google_oauth_pending.json` inside the `hermes`
container). Complete the loopback flow:

1. **Open this URL in a browser signed in as `doyle@firmcraft.ai`** and approve:

   ```
   https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=906730405406-1tefl1eo9b2o6v9sn52nsv0slg04ou23.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A1&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.send+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.modify+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcontacts.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fspreadsheets+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdocuments.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fadmin.directory.user.alias+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fadmin.directory.user.readonly&state=32EgeSIk7aAH3JCZ0TnBS6GtblqvdC&code_challenge=U0k1Nz-SRWCMbpGoOzyMxD_FZxMHkoBI45cgUMVaE0E&code_challenge_method=S256&access_type=offline&prompt=consent
   ```

2. The browser will fail to load `http://localhost:1/?code=…` — that's expected.
   Copy the **`code`** value out of the address bar.

3. Give me the code and I'll finish it (no password involved):

   ```bash
   ssh firmcraft-dogfood "docker exec hermes /opt/hermes/.venv/bin/python3 \
     /opt/data/skills/productivity/google-workspace/scripts/setup.py --auth-code 'PASTE_CODE'"
   ```

   Then `--check` should print `AUTHENTICATED`.

**Caveats:**
- The OAuth client (`906730405406-…`) lives in a Google Cloud project. If its
  consent screen is in "Testing", `doyle@firmcraft.ai` must be added as a test
  user, or consent will be blocked. If sign-in errors, that's the likely cause.
- The URL is single-use and tied to the staged verifier. If it expires, ping me
  and I'll regenerate it (`setup.py --auth-url`).

---

## Reference

- Cloudflare zone (firmcraft.ai): `5b314fe1a40778ea0fbf6a73d04ed410`
- `cf-everything` token: in [`firmcraft-credentials.md`](../firmcraft-credentials.md)
- DKIM push helper: `ops/push-firmcraft-dkim.sh`
- Hermes Gmail skill: `/root/.hermes/skills/productivity/google-workspace/` (runs
  inside the `hermes` Docker container; HERMES_HOME = `/opt/data`)
