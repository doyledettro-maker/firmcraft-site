# Outreach sending subdomain: `mail.firmcraft.ai`

**Related docs:** [Google Workspace Setup](firmcraft-google-workspace-setup.md) · [Cloudflare Access Setup](../cloudflare-access-setup.md) · [Credentials Template](firmcraft-credentials-template.md)

Status (2026-06-01): **blocked on Resend plan upgrade.**

Cold outreach should never send from the apex `firmcraft.ai` domain — one
bounce wave can poison the reputation we use for transactional mail (onboarding
confirms, password resets, partner invites). Standard mitigation is a sending
subdomain reserved for outreach.

## The blocker

Our Resend account (under `doyle.dettro@predictium.ai`) is on the free plan,
which allows **one verified domain**. That slot is taken by
`skillcalibrate.com`. Adding `mail.firmcraft.ai` returns:

```
{"statusCode":403,"message":"Your plan includes 1 domain. Upgrade to add more."}
```

Resolve by either:

1. **Upgrade Resend to Pro** ($20/mo, recommended) — gets us 10 domains and
   higher send limits. Outreach volume alone justifies it.
2. Move SkillCalibrate to a different provider (Postmark, Mailgun) and reuse
   the free slot for Firmcraft. Trade: smaller blast radius for SC.

## After upgrading: one command

Everything else is automated.

```bash
RESEND_API_KEY=re_…   # from admin/.env.local
CLOUDFLARE_TOKEN=cfat_…   # firmcraft-credentials.md → "cf-everything"
ops/setup-resend-firmcraft-mail.sh
```

The script:

1. Calls `POST /domains` on Resend to create `mail.firmcraft.ai`.
2. Pulls the DKIM / SPF / MX records Resend generates.
3. Pushes each record into the Cloudflare zone for `firmcraft.ai`
   (zone id `5b314fe1a40778ea0fbf6a73d04ed410`).
4. Triggers Resend verification.

## DNS records (reference)

These are what Resend will provision. The DKIM key is unique per domain so
exact values come from the Resend API response — don't hard-code them.

| Type | Host                                  | Value                                              | TTL  |
| ---- | ------------------------------------- | -------------------------------------------------- | ---- |
| MX   | `send.mail.firmcraft.ai`              | `feedback-smtp.us-east-1.amazonses.com` (prio 10)  | Auto |
| TXT  | `send.mail.firmcraft.ai`              | `v=spf1 include:amazonses.com ~all`                | Auto |
| TXT  | `resend._domainkey.mail.firmcraft.ai` | DKIM public key (issued by Resend)                 | Auto |

The apex `firmcraft.ai` SPF and Cloudflare Email Routing DKIM
(`cf2024-1._domainkey.firmcraft.ai`) are left alone — keeping the outreach
auth chain isolated is the whole point.

## After verification

- Set sender to something like `outreach@mail.firmcraft.ai` (or a named
  inbox — `doyle@mail.firmcraft.ai`).
- Update `admin/src/lib/outreach.ts` `FROM_ADDRESS` (or wherever the From
  header is set) to use the new subdomain.
- Verify a test send goes through and DMARC / DKIM align in the headers.
