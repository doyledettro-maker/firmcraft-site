# Hermes Local Agent — Concept Doc

**Related docs:** [Weekend Buildout Plan](firmcraft-weekend-buildout-plan.md) · [Provisioning & Hardening](hermes-provisioning-hardening.md) · [WorldMax Compromise (2026-06-13)](security/2026-06-13-worldmax-compromise.md) · [Billing Spec](billing-spec.md) · [ROADMAP.md](../ROADMAP.md)

**Status:** Concept / exploration
**Updated:** June 16, 2026
**Author:** Firmcraft

---

## The Idea in One Line

Keep the managed cloud Hermes exactly as it is — the thing users talk to — and pair it with a **local Hermes agent installed on the client's own PC**, so the cloud agent can reach back down to that machine to perform real computer tasks (print, read/write local files, drive desktop apps, query on-LAN systems) without the user's data or systems ever leaving the building.

The user experience does not change. People still talk to the cloud operator over Telegram / Slack / SMS / Email. The cloud operator simply gains a pair of **hands on the local machine** that it can delegate physical-world and desktop work to.

We already ship two primitive versions of this:

- The **print bridge** (Rumble Bee) — cloud agent reaching back to a local printer.
- The **Hermes Desktop app** — a local client already talking to the cloud backend over `agent.firmcraft.ai`.

This concept generalizes those into a first-class capability.

---

## Mental Model: Brain in the Cloud, Hands on the Edge

| Plane | Where | Responsibilities |
|---|---|---|
| **Control plane (the brain)** | Cloud VPS (per client, as today) | Conversation, memory (MEMORY.md / USER.md), LLM routing via LiteLLM, Langfuse observability, all 21 messaging channels, orchestration, authorization |
| **Execution plane (the hands)** | Local Hermes agent on the client PC | Exposes *local* capabilities as tools; executes scoped tasks the cloud brain hands it; streams results + audit back up |

The local agent is **not** a second conversational endpoint. Nobody chats with it. It is a sandboxed executor that the cloud brain drives.

### Why MCP makes this cheap to build

Hermes already supports MCP bidirectionally and we already wire MCP servers per client. The local agent is just **one more MCP server** — except it runs on the client's machine instead of a SaaS endpoint, and it exposes local tools:

- `print` (generalized print bridge)
- `read_file` / `write_file` / `search_files` (scoped to allowed paths)
- `run_query` (local SQL / on-LAN database)
- `launch_app` / `desktop_action` (computer-use for legacy GUIs with no API)
- connectors for desktop QuickBooks, network shares, scanners, etc.

The cloud Hermes connects to it as an MCP client. Minimal new protocol; mostly transport + trust + lifecycle.

---

## Hard Requirements (from product)

These four constraints are load-bearing and shape the whole design.

### 1. The cloud must monitor health/status of every local agent

Each local agent maintains a persistent outbound connection to the cloud and emits a **heartbeat**. The cloud tracks, per agent:

- **State:** `online` / `degraded` / `offline` / `updating`
- **Last seen** timestamp
- **Agent version** (for fleet upgrade tracking)
- **Capability manifest** (which local tools this agent currently offers)
- **Queue depth / in-flight tasks**
- **Host health** signals where available (disk, the bound apps reachable, printer online, etc.)

This surfaces in two places:

- **`admin.firmcraft.ai`** — Firmcraft-side fleet view across all clients' agents, with alerting when an agent goes offline or degraded. This fits the existing admin dashboard's usage/observability role.
- **To the user, in-conversation** — when a user asks for something that needs their local agent and it's offline, the cloud operator says so plainly ("Your desktop connector looks offline — want me to queue this until it's back?") rather than failing silently.

Tasks dispatched to an offline agent are **queued and resumed**, not dropped (see Reliability).

**Health must include security telemetry, not just uptime.** The WorldMax compromise (see Security) went undetected because the beacon was uptime/cost-oriented — a 100%-CPU cryptominer read as "green" and an exposed dashboard read as "healthy/reachable." We do not repeat that on the local fleet. From day one each local agent's heartbeat also reports:

- **CPU% / load** (anomaly detection — sustained pegged CPU is a miner signal),
- **listening sockets** (`ss -tlnp` equivalent) — the agent should have **no inbound listeners**; any public-bound service is an immediate alert,
- **outbound-connection summary** matched against an **IOC list** (known exfil C2 / mining-pool hosts),
- **agent binary + config integrity** (signed hash; alert on drift),
- and **every agent must have the beacon installed** — no "pending"/uninstalled gaps like WorldMax had.

Security signals route to a Slack alert channel and bypass dedupe.

### 2. All tokens route through our LiteLLM gateway

No model call escapes metering. Whether the inference is issued by the cloud brain (the default) or by an optional **local inference** step in the sovereign tier, the call routes through `llm.firmcraft.ai` (LiteLLM) so that:

- usage is **attributed per client and per user**,
- it's **billed at our 1.2× rate-card markup** (see Billing Spec),
- it's **observable in Langfuse**.

For the sovereign/local-inference tier there's a nuance worth stating: if the point is that *content* stays on-prem, the prompt body must not leave the building — but the **usage metadata** (token counts, model, latency, user attribution) still flows to the gateway for metering. We register the local model as a LiteLLM route so the meter is centralized even when inference is local; the gateway records usage without necessarily proxying the payload. (Exact mechanism is an open question — see below.)

The local *executor* itself does not call models directly out-of-band. If a local tool needs a model (e.g., to read a scanned invoice), that inference is requested back through the cloud brain → LiteLLM, not from some separate key on the PC.

### 3. Local agents are never addressed directly — only the cloud agent can drive them

This is a firm security boundary:

- The local agent **opens no inbound ports**. It dials home — an outbound, persistent, **mTLS** connection (websocket / reverse tunnel) to the cloud. The cloud pushes task requests down that existing connection. This is the same direction-of-trust pattern we already run with Cloudflare tunnels for `llm.firmcraft.ai` and `langfuse.firmcraft.ai`, pointed the other way.
- There is **no API, CLI, or UI** by which a third party (or even the client) talks to the local agent out-of-band. The only thing on the other end of the tunnel is the client's own cloud Hermes instance, authenticated by mTLS device identity + short-lived, signed task envelopes.
- Every instruction the local agent executes is therefore **provably originated by the cloud brain**, and every action is logged to Langfuse.

This means the local agent's attack surface is essentially "did someone compromise the cloud brain," which we already harden (see Provisioning & Hardening), plus the local sandbox itself.

### 4. Multi-user attribution: a user can only ever drive *their own* local agent

The cloud Hermes is **multi-user**. The local agent lives on **one person's PC**. So dispatch must be bound to identity, not to the tenant globally.

**Binding model — identity → device:**

- Each local agent is enrolled and **bound to a specific user identity** within the tenant: a Slack member ID, a Telegram user ID, a Teams/AAD object ID, or an email address — whatever channel that person uses.
- The cloud keeps a per-tenant registry: `user_identity → local_agent_id` (at most one bound device per identity for v1).
- At the moment the cloud brain wants to invoke a local tool, it resolves the target agent **from the identity of the user in the current conversation turn** — never from a tenant-wide default. A message from user A can only ever dispatch to user A's bound agent. User B in the same Slack workspace physically cannot cause an action on user A's PC, because the dispatch resolver never returns A's device for B's turn.
- **Shared channels:** in a multi-person Slack channel, attribution is to the *speaking* user (the message author's member ID), not to the channel. The channel does not own a device; the person does.
- **No bound agent → the local tools simply aren't available** for that user's turn; the operator behaves like today.

**The solo case is trivial.** For Mike (solo operator, Telegram only) there is exactly one identity and exactly one device. The resolver always returns Mike's agent because Mike is the only one talking. The multi-user machinery is dormant but present. The complexity only shows up — and only needs to — when a company has multiple people in Slack, each with their own PC and their own bound agent.

**Enrollment / pairing flow (sketch):** Firmcraft installs the local agent → it shows a one-time **claim code** → an admin (or the user themselves, in-conversation with the cloud operator) confirms the code, which writes the `user_identity → local_agent_id` binding. mTLS device cert is issued at claim time. Re-pairing requires re-claim.

---

## Reference Architecture

```
                 ┌──────────────────────────────────────────────┐
   User (Mike)   │                CLOUD (per client)            │
  Telegram/Slack │                                              │
   ───────────►  │  Hermes (brain) ──► LiteLLM ──► model        │
                 │     │  ▲             (llm.firmcraft.ai)       │
                 │     │  │                                       │
                 │     │  └── Langfuse (observability/audit)     │
                 │     │                                          │
                 │  dispatch resolver: identity → device         │
                 │     │                                          │
                 └─────┼──────────────────────────────────────────┘
                       │  outbound mTLS tunnel (agent dials home)
                       │  signed, scoped task envelopes ▼ / results ▲
                 ┌─────┴──────────────────────────────────────────┐
                 │           CLIENT PC (Mike's machine)            │
                 │   Local Hermes agent (MCP server, sandboxed)    │
                 │   tools: print · files · run_query · desktop    │
                 │   connectors: desktop QuickBooks · LAN db · ... │
                 │   heartbeat ▲   audit ▲   kill-switch           │
                 └─────────────────────────────────────────────────┘
```

Key properties: brain in cloud, hands on edge; connection is outbound-only; dispatch is identity-scoped; every model call goes through LiteLLM; every local action is heartbeated and audited.

---

## Where Does the Data Meet the Model? (tiered placement)

"Computer tasks" come in two flavors, and they have different sovereignty implications:

- **Execution-only** ("print this", "move this file", "run this query and file the result") — the model never needs to see the sensitive payload. Cloud brain + local hands works perfectly and data sovereignty fully holds.
- **Comprehension** ("read this scanned invoice and book it", "summarize these contracts") — the model *does* need to see the data, so it transits to the cloud model. For a client who bought "sovereign," that weakens the promise.

So we offer a ladder, which doubles as a pricing ladder:

| Tier | How it works | Sovereignty | Cost |
|---|---|---|---|
| **Standard** | Cloud brain, local hands, execution-only | Systems stay local; comprehension data may transit | Lowest |
| **Redact-at-edge** | Local agent strips/tokenizes PII before anything reaches the cloud model | Strong | Medium |
| **Sovereign** | Local small model handles the comprehension step on-device; cloud only orchestrates; usage still metered via LiteLLM | Strongest | Premium |

---

## Security & Trust Model

> **Threat model in one sentence:** the local agent is, by design, a **remote-code-execution capability on the customer's own PC** — it runs terminal / launch-app / desktop tools and connects to local files and systems. That is the entire point of the feature and the entire risk. Anything that can write its config or dispatch it tasks must be treated as RCE-equivalent on a client machine and on their LAN.

This is the same class of surface that bit us on WorldMax (see below), except the blast radius now extends off our own VPS and onto customer-owned hardware. That raises the bar, and it's why this is a load-bearing section rather than a footnote.

### Lessons from the WorldMax compromise (2026-06-13)

On 2026-06-13 the WorldMax managed-Hermes VPS was found running a cryptominer (with credential-exfil and container-escape attempts) because its **Hermes dashboard was exposed to the internet unauthenticated** (`HERMES_DASHBOARD_HOST=0.0.0.0`, `HERMES_DASHBOARD_INSECURE=1`). The attacker wrote the agent config, which supports RCE via `startup_hooks` and `mcp_servers`. No host compromise and no data loss (the box was dormant with empty keys), but it's a clear preview of what an exposed control surface buys an attacker. Full writeup: [`security/2026-06-13-worldmax-compromise.md`](security/2026-06-13-worldmax-compromise.md).

Each finding maps to a hard rule for this design:

| WorldMax finding | Rule for the local-agent design |
|---|---|
| Unauthenticated dashboard bound to `0.0.0.0` was the root cause | **No unauthenticated control surface anywhere** — not the cloud admin/dashboard, not the local agent. The local agent is outbound-only with no inbound listeners (Req #3). |
| We explicitly set `INSECURE=1` and defeated a secure-by-default gate | **Secure-by-default provisioning, no insecure flags.** Agents ship from a hardened template; an automated provisioning/CI audit rejects any `0.0.0.0` bind or `INSECURE` flag on every current and future instance. |
| Config fields (`startup_hooks`, `mcp_servers`) gave instant RCE with no second confirmation | **Treat the local agent's config + task channel as RCE.** Config is signed and integrity-checked; the agent only accepts capabilities from the enrolled allowlist; sensitive actions need human approval. |
| Exfil targeted `~/.hermes/.env` credentials | **Minimize secrets on the box.** The cloud holds keys; model calls go back through LiteLLM so **no provider API keys live on the customer PC**, shrinking exfil value. |
| Container-escape attempt (chroot/nsenter/docker.sock) | **Least privilege / sandbox.** Run unprivileged, no host-escape primitives, no Docker socket; constrain to enrolled paths/apps. |
| Monitoring was uptime-oriented; the miner read "green" | **Security telemetry in the heartbeat from day one** (see Requirement #1). |

### Non-negotiables

- **Outbound-only, mTLS, device identity.** No inbound ports. (Requirement #3.)
- **Secure-by-default, audited provisioning.** No `0.0.0.0` binds, no `INSECURE`/no-auth flags on the agent or the cloud control plane; provisioning fails closed and a standing audit re-checks the whole fleet.
- **Assume the cloud brain could be compromised.** Defense-in-depth so a rogue/hijacked cloud instance still can't run arbitrary actions on a customer PC: capability allowlists and human-approval gates are **enforced locally**, not just cloud-side. The local agent distrusts even its own brain beyond the enrolled scope.
- **Capability allowlists.** The agent only exposes the specific tools/paths/apps enrolled for that client. Default-deny.
- **Scoped, short-lived, signed task envelopes.** Every task names exactly what it may touch and expires.
- **Human-in-the-loop for writes/destructive actions.** Model the approval UX on Claude Code's allow/deny prompts — surfaced in the user's normal channel.
- **Minimize secrets on the local box.** Keys stay in the cloud; inference routes through LiteLLM.
- **Sandbox / least privilege.** Unprivileged, no host-escape primitives, scoped to enrolled resources.
- **Full audit trail** of every local action streamed to Langfuse.
- **Visible local kill-switch / pause** on the client machine — for the user and for Firmcraft.
- **Prefer API/DB connectors over screen automation.** Computer-use (vision + click) is the brittle last resort, not the default.
- Liability / insurance review before we put an executor on customer machines at scale.

---

## Reliability Considerations

The cloud instance is the **always-on anchor**; the local agent is a **best-effort helper** for the subset of tasks that genuinely need a local connection or local files. The machine does **not** have to be always-on, and we deliberately keep the system from depending heavily on the local agent.

- **Starts on boot.** The local agent installs as a service that launches at startup and immediately dials home, so it's available whenever the machine is. An offline machine is a normal, expected state — not an error.
- **Degrade gracefully, don't depend.** Anything that can be done in the cloud stays in the cloud. The local agent is only invoked for tasks that *require* the local machine; everything else proceeds regardless of whether the agent is online.
- **Queue + resume** for the local-only tasks: work dispatched while the agent is offline is held and replayed when the machine next boots and reconnects (ties to Requirement #1), rather than failing.
- **Graceful "agent offline" UX** in-conversation — the operator can offer to queue a local task until the machine is back, instead of silently failing.
- Auto-update with version reporting in the fleet view.

---

## Productization & Pricing

- **Trade contractors (Model A):** ship as a **"Desktop Connector"** add-on to Flex. The print bridge is the v1 wedge; expand to desktop QuickBooks, job photos off the office PC, work-order printing.
- **Finance/ops SMBs (Model B):** this is the bigger unlock — it makes **"sovereign by default" literally true**, bridges on-prem/legacy systems with no public API (desktop QuickBooks, on-prem Business Central, Acumatica, local SQL), and opens an **AI-native RPA** play against UiPath/Automation Anywhere. Position as the on-prem embodiment of "Foundation," sold as a premium / sovereign tier.

Strategic fit: it resolves the tension our own homepage names — "you need both" the cloud convenience and the on-prem/legacy reach. Pure-SaaS competitors can't run on the customer's PC; pure AI agencies won't touch on-prem. The hybrid sits exactly in the gap we've staked out and deepens the moat.

---

## Phased Build Plan

- **Phase 0 — done.** Print bridge + Hermes Desktop app prove the round-trip.
- **Phase 1.** Generalize the print bridge into a **local MCP server** (file r/w, print, launch app) over an outbound mTLS tunnel. Execution-only, cloud brain, human approval for writes. Heartbeat + fleet view in `admin.firmcraft.ai`. Identity→device binding + claim-code enrollment. Dogfood on Mike (solo, trivial attribution).
- **Phase 2.** Connectors to common local systems — desktop QuickBooks, local SQL, network shares, scanners.
- **Phase 3.** Computer-use / RPA for legacy GUIs (vision + click), recorded as reusable Hermes **skills**.
- **Phase 4.** Optional **local inference** (sovereign tier), still metered through LiteLLM.
- **Phase 5 (multi-user hardening).** First multi-person client: prove that user A in Slack can only ever drive A's PC, shared-channel attribution, multiple bound devices per tenant.

---

## Open Questions

1. **LiteLLM + local inference metering:** exact mechanism for logging usage centrally when inference is on-device without shipping prompt content off-box (gateway-side usage receipts vs. local proxy vs. async usage reporting).
2. **One device per identity, or several?** v1 assumes one. Do power users need multiple bound machines (office + shop PC)?
3. **Who approves enrollment** in a multi-user tenant — the individual user, or a tenant admin? Likely admin-gated.
4. **Computer-use brittleness budget:** how much screen automation do we take on vs. waiting for an API/DB path.
5. **Support model & SLA** for software running on customer-owned hardware (OS heterogeneity, "my agent is offline" tickets).
6. **Liability / insurance** posture for an executor with desktop control.
