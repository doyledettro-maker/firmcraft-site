# Cloudflare Access Setup — firmcraft.ai

**Date:** 2026-05-09
**Status:** GOOGLE SSO LIVE — All 5 apps protected, Google + Microsoft + OTP login working

---

## Completed

1. **Zero Trust activated** — Free plan, team domain: `firmcraft.cloudflareaccess.com`
2. **Credentials file updated** — Account ID, API token, Google OAuth creds in [`firmcraft-credentials.md`](firmcraft-credentials.md)
3. **API token verified** — `cfut_x8f...adf` is active, zone-scoped
4. **Zone confirmed** — `firmcraft.ai` zone ID: `5b314fe1a40778ea0fbf6a73d04ed410`, status: active
5. **Google OAuth client created** — "Firmcraft Cloudflare Access" in predictium GCP project
6. **All 5 Access apps created via API** — see table below
7. **Access policies set** — Email-based allow for doyle.dettro@emergenext.com, admin@skillcalibrate.com, doyle@skillcalibrate.com
8. **WorldMax app added** — worldmax.firmcraft.ai with Google/Microsoft/OTP login, policy includes mary@worldmaxp2.com
9. **DNS A record live** — worldmax.firmcraft.ai → 178.105.96.71 (proxied). Hetzner CX23 server `worldmax-firmcraft` in Falkenstein, DE.
10. **API token updated** — cf-everything token now has Zone DNS Write/Read for firmcraft.ai zone

## Access Applications (Live)

| App Name | Subdomain | App ID | Policy |
|---|---|---|---|
| Firmcraft Dogfood | firmcraft.firmcraft.ai | `6f3755f3-2a1d-4337-b498-0804d3449c00` | Allow specific emails (created by onboarding) |
| Admin Dashboard | admin.firmcraft.ai | `4f2e08a8-c777-4939-a5c1-e89aa4163590` | Internal Team Only |
| LiteLLM Proxy | litellm.firmcraft.ai | `ea71d2fc-d488-4394-8ee0-edd319eb575a` | Internal Team Only |
| Langfuse Observability | langfuse.firmcraft.ai | `507a1332-63ba-430b-9400-d87d42b98add` | Internal Team Only |
| WorldMax | worldmax.firmcraft.ai | `4196fa15-0b1b-40f5-b8ad-8f13d1a843b5` | WorldMax Team (mary@worldmaxp2.com + internal) |

All apps: `self_hosted`, 24h session duration. WorldMax also includes Google, Microsoft, and OTP identity providers with login chooser.

## Blocker: Identity Provider Configuration

### Problem
The API token (`cfut_x8f...adf`) has **Zone Access Edit + Account Access Apps & Policies Edit** but **NOT** identity provider management permissions. API calls to `/accounts/{id}/access/identity_providers` return `code: 10000, "Authentication error"`.

The Cloudflare dashboard also fails to render in Chrome on the Mac mini — React app hydration failure (Module Federation version mismatches cause JSON parse errors in federated chunks). Service worker was cleared but issue persists.

### Fix: Create a new API token with IdP permissions

From phone (CF dashboard works on mobile):
1. Go to **My Profile → API Tokens → Create Token**
2. Start with "Custom token" template
3. Add permission: **Account → Access: Identity Providers → Edit**
4. Scope: Account → Firmcraft account
5. Create and share the token

**OR** provide your **Global API Key** (My Profile → API Tokens → Global API Key → View) — it has full permissions.

### Once we have the right token

**Google SSO** (credentials ready):
```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/caf31c0bae4c44afe76040e457c07078/access/identity_providers" \
  -H "Authorization: Bearer NEW_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Google",
    "type": "google",
    "config": {
      "client_id": "<GOOGLE_OAUTH_CLIENT_ID>",
      "client_secret": "<GOOGLE_OAUTH_CLIENT_SECRET>"
    }
  }'
```

**Microsoft SSO** (needs Azure AD app registration first):
1. Create app at https://portal.azure.com → Azure Active Directory → App registrations → New
2. Set redirect URI: `https://firmcraft.cloudflareaccess.com/cdn-cgi/access/callback`
3. Create client secret
4. Note: Application ID, Client Secret, Directory (Tenant) ID
5. Then add to Cloudflare via same API endpoint with `type: "azureAD"`

### After IdPs configured

Update each app's policy to require SSO login (currently email-based allow). Add Mary's email to policies for WorldMax subdomain.

## Reference

- **Account ID:** `caf31c0bae4c44afe76040e457c07078`
- **Zone ID:** `5b314fe1a40778ea0fbf6a73d04ed410`
- **Zone:** firmcraft.ai (active, free plan)
- **Team Domain:** `firmcraft.cloudflareaccess.com`
- **API Token ID:** `271c5331fff45824709889ae4fbf4302`
- **Google OAuth Client ID:** `<GOOGLE_OAUTH_CLIENT_ID>` (see credentials store)
