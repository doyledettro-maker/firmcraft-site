# Google Business Profile API Access — Application Checklist

**Related docs:** [GBP Setup Plan](gbp-setup-plan.md) · [Digital Ops Research](digital-ops-research.md) · [ROADMAP.md](../ROADMAP.md) (Phase 6)

_Created 2026-06-08. Execute-ready reference for getting Firmcraft approved for GBP API access._

---

## Quick Summary

One application grants access to **all** GBP sub-APIs (reviews, business info, posts, performance, etc.) with a default 300 QPM quota across the board. There is no separate approval per sub-API. Approval is typically reviewed within **14 days** (FAQ states this; community reports suggest 3-10 business days is common). There is no official expedite path.

---

## Step 1 — Verify Firmcraft Has a Qualifying Google Business Profile

**This is the #1 blocker. Do this first.**

Google requires all applicants to manage a GBP that is **verified and active for 60+ days**. This can be Firmcraft's own office/headquarters or a client location you manage.

**Action items:**
- [ ] Confirm Firmcraft has a verified GBP listing (search "Firmcraft" on Google Maps)
- [ ] If no GBP exists: create one at https://business.google.com/ for Firmcraft's business address
- [ ] If just created: you must wait 60 days before applying (this is a hard requirement)
- [ ] Ensure the GBP is **fully complete**: hours, description, category, photos, website = firmcraft.ai
- [ ] Ensure `doyle@firmcraft.ai` (or a firmcraft.ai email) is listed as **owner or manager** on the GBP
- [ ] Verify the website URL on the GBP matches the email domain (firmcraft.ai)

**Important:** If Firmcraft doesn't have a 60-day-old verified GBP, you can alternatively use a client's GBP where Firmcraft is listed as a manager. But owning your own is cleaner for the application.

---

## Step 2 — Confirm Google Cloud Project Setup

You already have a GCP project for firmcraft.ai (project with OAuth client `906730405406-...` per the workspace setup doc).

**Action items:**
- [ ] Go to https://console.cloud.google.com/ and select the firmcraft.ai project
- [ ] Find the **Project Number** on the Dashboard → Project info card (this is a numeric ID, different from project ID)
- [ ] Record the project number — you'll enter it in the application form
- [ ] Confirm the **OAuth consent screen** is configured (you already have this per your workspace setup)
- [ ] If using Google Workspace: confirm **Google Business Profile is turned on** for your organization
  - Go to admin.google.com → Apps → Google Workspace → check GBP is enabled
  - If it's turned off, you'll get `403 PERMISSION_DENIED` errors even after API approval

**Account type:** A standard Google Cloud account works fine. Google Workspace is not required but is supported. Since you're already on Workspace for firmcraft.ai, just make sure GBP is enabled in the admin console.

---

## Step 3 — Create a GBP Organization Account

Google lists this as a prerequisite. An Organization account lets you manage multiple business locations (yours and clients') under one umbrella — exactly what Firmcraft needs.

**Action items:**
- [ ] Go to https://business.google.com/
- [ ] Follow the process to register as an Organization (agency) account: https://support.google.com/business/answer/7353903
- [ ] Set up user groups and business groups as needed: https://support.google.com/business/answer/7655731

---

## Step 4 — Submit the API Access Application

### Application URL

**Primary path:** https://support.google.com/business/contact/api_default
- Select **"Application for Basic API Access"** from the dropdown

**Direct form (alternate):** https://docs.google.com/forms/d/e/1FAIpQLSfC_FKSWzbSae_5rOpgwFeIUzXUF1JCQnlsZM_gC1I2UHjA3w/viewform

### What the form asks for

| Field | What to enter |
|-------|---------------|
| **Request type** | "Application for Basic API Access" |
| **Company name** | Firmcraft |
| **Contact email** | `doyle@firmcraft.ai` (must be owner/manager on the GBP) |
| **Google Cloud Project Number** | The numeric project number from Step 2 |
| **Business website URL** | https://firmcraft.ai |
| **Use case / business justification** | See drafted description below |
| **Expected usage volume** | Number of locations you expect to manage and approximate API call volume |

### Critical tips for approval

- **Email domain must match website domain.** Use `doyle@firmcraft.ai`, not a gmail.com address
- **Be specific about your use case.** "We need API access" gets rejected. Describe exactly which workflows you need (reviews, posts, profile updates, etc.)
- **Mention you manage client locations.** Google specifically supports the agency/third-party model
- **Answer every field accurately.** Google's form instructions say inaccurate information may affect access
- **Your GBP must be complete.** Incomplete profiles with missing hours, descriptions, or photos increase rejection risk

---

## Step 5 — Drafted Use Case Description

Use this in the application form's use case / business justification field:

> **Firmcraft** is an AI-powered operations platform for small businesses. We provide managed Google Business Profile services to our clients, acting as their authorized third-party representative.
>
> Our platform requires API access to programmatically manage the following workflows on behalf of our clients' authorized business locations:
>
> - **Review monitoring and response:** Retrieve new reviews in real-time, surface them in our client dashboard, and post owner-approved responses to customer reviews
> - **Profile management:** Update business hours, descriptions, categories, attributes, and other listing information to keep client profiles accurate and current
> - **Google Posts publishing:** Create and schedule local posts (updates, offers, events) across client locations to maintain active engagement
> - **Performance reporting:** Pull business profile performance metrics (impressions, search queries, direction requests, call clicks, website clicks) into client-facing analytics dashboards
> - **Notification management:** Subscribe to real-time notifications for profile changes, new reviews, and Google-suggested updates so our team can respond promptly
>
> We use OAuth 2.0 to authenticate each client — business owners manually sign in and grant our application permission to manage their specific locations. We do not store client credentials. We currently manage profiles for small and mid-sized businesses and expect to scale to 50-200 managed locations within the first year.
>
> Our website is https://firmcraft.ai. Our business is verified on Google Business Profile.

**Notes on the draft:**
- Frames Firmcraft as a third-party manager (the model Google explicitly supports)
- Emphasizes OAuth-based client authorization (required by Google's policies)
- Mentions real workflows Google cares about (not vague)
- Includes a realistic volume estimate (50-200 locations)
- Adjust the location count based on your actual pipeline

---

## Step 6 — Wait for Approval & Check Status

**Timeline:** Google FAQ states requests are reviewed within 14 days. Community reports suggest 3-10 business days is common for well-prepared applications. Incomplete or vague applications are rejected ~40% of the time.

**How to check approval status:**
- [ ] Go to Google Cloud Console → APIs & Services → Quotas
- [ ] Look at the quota for any GBP API
- **0 QPM** = not yet approved
- **300 QPM** = approved

**If rejected:**
- Review the rejection email for specific reasons
- Ensure all prerequisites are met (60-day verified GBP, matching domains, complete profile)
- Reapply with a more detailed use case

**No official expedite path exists.** The best way to get fast approval is to submit a thorough, specific application the first time. Google has no paid fast-track or partner program for API access.

---

## Step 7 — Enable All APIs After Approval

Once approved, you must manually enable each API in the Google Cloud Console. Approval grants quota but doesn't auto-enable the APIs.

**Go to:** https://console.cloud.google.com/apis/library

**Enable all of these** (search for each by name):

| # | API Name | What it covers |
|---|----------|----------------|
| 1 | **Google My Business API** (v4.9) | Reviews, LocalPosts, Media, FoodMenus (legacy v4 endpoints) |
| 2 | **My Business Account Management API** | Account access, invitations, location transfers, admin management |
| 3 | **My Business Business Information API** | Core profile data: hours, description, categories, attributes |
| 4 | **My Business Verifications API** | Verification workflows for new locations |
| 5 | **My Business Notifications API** | Real-time push notifications for profile events |
| 6 | **My Business Q&A API** | Customer questions and answers |
| 7 | **My Business Place Actions API** | Booking/ordering action links |
| 8 | **My Business Lodging API** | Hotel-specific data (may not be relevant for Firmcraft) |
| 9 | **Business Profile Performance API** | Impressions, clicks, direction requests, search terms |

**One approval covers all nine.** No separate application per API. Standard default quota is 300 QPM for each.

---

## Step 8 — Set Up OAuth 2.0 for Client Authorization

You already have an OAuth client (`906730405406-...`) in your GCP project. You'll need to configure it for GBP scopes.

**Action items:**
- [ ] Add the GBP OAuth scope to your consent screen: `https://www.googleapis.com/auth/business.manage`
- [ ] Create or update OAuth 2.0 client credentials (web application type)
- [ ] Configure redirect URIs for your Hermes/Firmcraft platform
- [ ] If the OAuth consent screen is in "Testing" mode, add test users or publish for production
- [ ] Implement the OAuth flow so clients can authorize Firmcraft to manage their GBP

**OAuth scope:** The single scope `https://www.googleapis.com/auth/business.manage` covers all GBP API operations.

---

## Step 9 — Verify with a Test API Call

After enabling APIs and setting up OAuth, verify everything works.

**Quickest test:** Use the OAuth 2.0 Playground (https://developers.google.com/oauthplayground)

1. Enter your OAuth client ID in the playground settings
2. Authorize with scope: `https://www.googleapis.com/auth/business.manage`
3. Make a GET request to: `https://mybusinessaccountmanagement.googleapis.com/v1/accounts`
4. A `200 OK` response with account data = you're live

**Note:** There is no sandbox/test environment. Use `validateOnly=true` parameter where supported to test requests without modifying real data.

---

## Key Policy Requirements to Follow

Once approved, Firmcraft must comply with these policies (from https://developers.google.com/my-business/content/policies):

- **Client authorization required:** Business owners must manually sign in via OAuth to authorize Firmcraft. No automated access without user consent.
- **Transparency:** Notify clients within 48 hours of any account changes you make on their behalf.
- **Review responses:** Must have client authorization before responding to reviews on their behalf.
- **Termination:** Must provide clients a way to disconnect within 7 business days of their request.
- **No content caching beyond 30 days:** API data must be stored temporarily and securely.
- **No automated reverting of Google updates:** Can't use the API to auto-undo changes Google makes.
- **Demo account:** Google may request a demo of your tool within 7 days at any time.

---

## Default Quota Limits (Post-Approval)

| API | Default Quota |
|-----|---------------|
| All GBP APIs | 300 queries per minute (QPM) |
| Business Information API (edits) | 10 edits per minute per profile (hard cap, cannot be increased) |

To request a quota increase later: use the same contact form (https://support.google.com/business/contact/api_default) and select "Quota Increase Request." You must be consistently using >70% of your current quota before Google will consider an increase.

---

## Pre-Flight Checklist (Execute Immediately)

- [ ] **Check if Firmcraft has a verified GBP** that's been active 60+ days
- [ ] **If not:** Create GBP now at business.google.com — but note you'll need to wait 60 days
- [ ] **Get GCP project number** from Cloud Console dashboard
- [ ] **Confirm GBP is enabled** in Google Workspace admin console for firmcraft.ai
- [ ] **Register for GBP Organization account** at business.google.com
- [ ] **Ensure doyle@firmcraft.ai is owner/manager** on the Firmcraft GBP listing
- [ ] **Submit application** at https://support.google.com/business/contact/api_default
- [ ] **Use the drafted use case description** above (adjust location count to match reality)
- [ ] **Wait for approval email** (up to 14 days)
- [ ] **Check quota in Cloud Console** to verify approval (300 QPM = approved)
- [ ] **Enable all 9 APIs** in Cloud Console API Library
- [ ] **Add GBP scope** to OAuth consent screen
- [ ] **Test with OAuth Playground** to confirm access

---

## Reference Links

- Prerequisites: https://developers.google.com/my-business/content/prereqs
- Basic setup: https://developers.google.com/my-business/content/basic-setup
- FAQ: https://developers.google.com/my-business/content/faq
- API policies: https://developers.google.com/my-business/content/policies
- Usage limits: https://developers.google.com/my-business/content/limits
- Terms of Service: https://developers.google.com/my-business/content/terms
- Application form: https://support.google.com/business/contact/api_default
- GBP Organization account: https://support.google.com/business/answer/7353903
- OAuth setup guide: https://developers.google.com/my-business/content/oauth-setup
- Third-party policies: https://support.google.com/business/answer/7353941
