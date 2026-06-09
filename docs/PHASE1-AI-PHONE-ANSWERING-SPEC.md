# Firmcraft AI Phone Answering System -- Technical Specification

**Version:** 1.0
**Date:** 2026-06-06
**Author:** Firmcraft Engineering
**Status:** Implementation-Ready Draft

---

**Related docs:** [Decision Log](PHASE1-DECISIONS.md) · [ROADMAP.md](../ROADMAP.md) (Phase 1)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Voice Provider Selection](#2-voice-provider-selection)
3. [System Architecture](#3-system-architecture)
4. [Hermes Skill Design](#4-hermes-skill-design)
5. [Data Model](#5-data-model)
6. [Voice Agent Prompt](#6-voice-agent-prompt)
7. [Phone Number Strategy](#7-phone-number-strategy)
8. [Call Transfer and Escalation](#8-call-transfer-and-escalation)
9. [Recording and Transcription](#9-recording-and-transcription)
10. [Cost Analysis](#10-cost-analysis)
11. [Implementation Plan](#11-implementation-plan)
12. [Decisions Needed from Doyle](#12-decisions-needed-from-doyle)

---

## 1. Executive Summary

Firmcraft's AI Phone Answering system enables trade contractors (HVAC, plumbers, electricians, roofers, tree services) to have every inbound call answered by an AI agent that can book appointments, answer service questions, take messages, and transfer to the owner when needed. This is the single highest-value feature in the Firmcraft product roadmap -- it directly addresses the #1 pain point for trade contractors: missed calls = missed revenue.

**Phase 1 scope:** Inbound call answering only. No outbound calling, no SMS follow-ups, no multi-location routing. One contractor (Mike Carr / Rumble Bee Tree Service) as pilot, then expand.

**Key architectural decision:** The voice AI provider handles the phone call, speech-to-text, text-to-speech, and LLM orchestration. Hermes handles business logic (calendar, contacts, service catalog, call logging) via webhook-based tool calls from the voice provider. This keeps the voice pipeline low-latency while giving Hermes full control over business data.

---

## 2. Voice Provider Selection

### 2.1 Provider Comparison Matrix

| Criteria | Vapi | Bland.ai | Retell.ai |
|---|---|---|---|
| **Status** | Active, $50M Series B (2026) | Active, well-funded | PIVOTED -- no longer a voice AI platform. Now a "connection" product. Eliminated from consideration. |
| **Pricing Model** | $0.05/min platform + model costs at-cost (or $0 with own API keys) | $0.14/min all-inclusive (Start), $0.12/min (Build/$299/mo), $0.11/min (Scale/$499/mo) | N/A |
| **Bring Your Own LLM** | YES -- Custom LLM endpoint via OpenAI-compatible API. Can point to our LiteLLM gateway. $0 model cost. | NO -- LLM bundled in per-minute rate. Cannot use external LLM. | N/A |
| **Bring Your Own STT/TTS** | YES -- Custom transcriber and TTS endpoints supported | NO -- bundled | N/A |
| **Effective Cost/Min (with BYOLLM)** | ~$0.05/min (platform only) + ~$0.01-0.02/min (our LiteLLM cost for STT/TTS/LLM) = ~$0.06-0.07/min | $0.12-0.14/min (all-inclusive, no way to reduce) | N/A |
| **Phone Number Provisioning** | Free US numbers via API. Import from Twilio/Telnyx. | Free inbound number on Start tier. BYOT Twilio supported. | N/A |
| **Call Transfer** | Full support: blind transfer, warm transfer (with summary, message, TwiML, experimental). Dynamic transfer via webhook. | Cold transfer only on Start/Build/Scale. Warm/live transfer Enterprise only. | N/A |
| **Recording + Transcription** | Built-in. Configurable artifact plans. Stereo recording. Custom storage (S3/GCP). | Built-in recording and transcription. | N/A |
| **Webhook/API Integration** | Comprehensive Server URL system. Tool calls, assistant requests, end-of-call reports, status updates, transcript streaming. | Webhook on call completion. Tool calls via "pathways." | N/A |
| **Custom LLM Latency** | Optimized streaming pipeline. Voice-to-voice target <500-700ms. | N/A (cannot use custom LLM) | N/A |
| **Inbound Call Handling** | Assign assistant to phone number. Dynamic assistant selection via webhook. | Inbound agent API. | N/A |
| **Call Concurrency** | 10 included, $10/additional line/month | 10 on Start, 50 on Build, 100 on Scale | N/A |
| **Recording Consent** | Enterprise feature: automated consent assistant with verbal/stay-on-line modes | Not documented as built-in | N/A |
| **Call Analysis** | Built-in: auto-summary, structured data extraction, success evaluation using Claude Sonnet | Basic call summary | N/A |
| **Spam Detection** | Server URL webhook for spam rejection | Not documented | N/A |
| **Documentation Quality** | Excellent. Comprehensive docs, API reference, examples, CLI. | Good. Clear API docs. | N/A |
| **SDKs** | TypeScript, Python, REST API, CLI | REST API | N/A |

### 2.2 Recommendation: Vapi

**Vapi is the clear winner for Firmcraft's use case.** Three decisive factors:

1. **Bring Your Own LLM (BYOLLM):** Vapi is the only provider that lets us point the LLM to our own endpoint. We point it to `llm.firmcraft.ai` (our LiteLLM gateway), which routes to GPT-5.5 or Claude Sonnet 4.6. This means:
   - We control model selection and can A/B test models
   - We control costs (our LLM costs are ~$0.01-0.02/min vs whatever Bland bundles)
   - We can use the same model routing infrastructure across all Firmcraft products
   - Total cost: ~$0.06-0.07/min vs Bland's fixed $0.12-0.14/min (42-50% savings)

2. **Warm Transfer:** Vapi supports warm transfer with summary on all tiers. When a customer asks for the owner, the AI can brief the owner on what the caller needs before connecting them. Bland restricts warm transfer to Enterprise only.

3. **Webhook Integration Depth:** Vapi's Server URL system maps perfectly to Hermes skill architecture. Tool calls from the voice AI hit our Hermes webhook, Hermes executes business logic, returns results. End-of-call reports push summaries into Hermes memory. This is exactly how Hermes skills already work.

**Cost advantage at scale:** At 500 minutes/month per client (a reasonable estimate), Vapi costs ~$35/month vs Bland's ~$60-70/month. With 50 clients, that is $1,250/month savings.

---

## 3. System Architecture

### 3.1 High-Level Call Flow

```
Customer dials contractor's business number
        |
        v
[Contractor's existing number] --call forward--> [Vapi phone number]
        |
        v
[Vapi Voice Pipeline]
  - STT: Deepgram (via Vapi default, or our key)
  - LLM: llm.firmcraft.ai (LiteLLM -> GPT-5.5 / Claude Sonnet 4.6)
  - TTS: ElevenLabs or Vapi default voices
        |
        |--- tool calls via webhook --->  [Hermes on client VPS]
        |                                   - Check calendar
        |                                   - Look up customer
        |                                   - Book appointment
        |                                   - Get service info
        |                                   - Log the call
        |<-- tool results ---------------
        |
        |--- transferCall (if needed) --> [Owner's cell phone]
        |
        |--- end-of-call-report -------> [Hermes webhook]
        |                                   - Store call summary
        |                                   - Notify owner via Telegram/SMS
        |                                   - Update customer record
        v
[Call ends]
```

### 3.2 Component Diagram

```
+-------------------+     +-------------------+     +------------------------+
|                   |     |                   |     |                        |
|  Customer Phone   |---->|  Contractor's     |---->|  Vapi Platform         |
|                   |     |  Business Number  |     |  (vapi.ai cloud)       |
|                   |     |  (call forward)   |     |                        |
+-------------------+     +-------------------+     |  +------------------+  |
                                                    |  | Voice Pipeline   |  |
                                                    |  | STT -> LLM -> TTS|  |
                                                    |  +--------+---------+  |
                                                    |           |            |
                                                    +-----------+------------+
                                                                |
                                              tool-calls &      |    end-of-call
                                              assistant-request  |    report
                                                                |
                                                    +-----------v------------+
                                                    |                        |
                                                    |  Hermes Instance       |
                                                    |  (client VPS)          |
                                                    |  e.g. 178.105.123.101  |
                                                    |                        |
                                                    |  +------------------+  |
                                                    |  | phone_answering  |  |
                                                    |  | skill            |  |
                                                    |  +------------------+  |
                                                    |                        |
                                                    |  +------------------+  |
                                                    |  | Local Data:      |  |
                                                    |  | - Calendar       |  |
                                                    |  | - Contacts       |  |
                                                    |  | - Service Catalog|  |
                                                    |  | - Call Logs      |  |
                                                    |  +------------------+  |
                                                    |                        |
                                                    +-----------+------------+
                                                                |
                                                    +-----------v------------+
                                                    |                        |
                                                    |  LiteLLM Gateway       |
                                                    |  llm.firmcraft.ai      |
                                                    |  (5.78.117.234)        |
                                                    |                        |
                                                    |  Routes to:            |
                                                    |  - GPT-5.5             |
                                                    |  - Claude Sonnet 4.6   |
                                                    |                        |
                                                    +------------------------+
```

### 3.3 Call Flow: Book Appointment

```
1. Customer calls contractor's number
2. Call forwards to Vapi number
3. Vapi answers: "Thank you for calling Rumble Bee Tree Service. This is
   the Rumble Bee virtual assistant. How can I help you today?"
4. Customer: "I need someone to come trim a big oak tree in my backyard"
5. Vapi LLM recognizes intent -> calls tool: check_service_availability
   - Webhook POST to Hermes: { tool: "check_service_availability",
     args: { service_type: "tree_trimming" } }
   - Hermes responds: { available: true, next_slot: "Monday June 9, 9am-12pm",
     estimate_note: "Tree trimming estimates are free. Mike will assess on-site." }
6. Vapi speaks: "We'd be happy to help with that! Tree trimming estimates
   are free -- Mike will come assess the job on-site. Our next available
   slot is Monday, June 9th between 9 AM and noon. Would that work for you?"
7. Customer: "Can you do Tuesday instead?"
8. Vapi LLM -> tool: check_service_availability
   - Hermes responds: { available: true, next_slot: "Tuesday June 10, 1pm-4pm" }
9. Vapi: "Tuesday the 10th works! We have the afternoon slot, 1 to 4 PM.
   Can I book that for you?"
10. Customer: "Yes please"
11. Vapi LLM -> tool: book_appointment
    - Webhook POST to Hermes: { tool: "book_appointment",
      args: { service: "tree_trimming", date: "2026-06-10",
              time_start: "13:00", time_end: "16:00",
              customer_name: "from caller ID or asked",
              customer_phone: "from caller ID",
              address: "asked during call",
              notes: "Big oak tree, backyard" } }
    - Hermes books in calendar, creates/updates contact, responds: { success: true }
12. Vapi: "You're all set! Mike will be at your place Tuesday June 10th
    between 1 and 4 PM for a free estimate on that oak tree. Is there
    anything else I can help with?"
13. Customer: "No, that's it. Thanks!"
14. Vapi: "Have a great day! Goodbye."
15. Call ends -> end-of-call-report webhook fires
16. Hermes receives report, stores call log, sends Telegram notification
    to Mike: "New appointment booked: Tree trimming estimate, Tue 6/10
    1-4 PM, [customer name], [address]. Oak tree in backyard."
```

### 3.4 Call Flow: Answer FAQ

```
1. Customer: "How much does tree removal cost?"
2. Vapi LLM -> tool: get_service_info
   - Hermes responds: { info: "Tree removal pricing varies by tree size,
     location, and complexity. We offer free on-site estimates.
     Typical range is $300-$2,500. Mike will provide an exact quote
     after seeing the tree." }
3. Vapi: "Tree removal pricing depends on the size and location of the
   tree. We offer free on-site estimates, and typical jobs range from
   $300 to $2,500. Mike will give you an exact quote after seeing the
   tree in person. Would you like to schedule a free estimate?"
```

### 3.5 Call Flow: Transfer to Owner

```
1. Customer: "I need to talk to Mike directly"
   OR
   Customer: "I have a billing question about my last invoice"
   OR
   AI determines the question is too complex
2. Vapi LLM triggers transferCall tool
3. Vapi speaks: "Let me connect you with Mike right now. One moment please."
4. Vapi initiates warm transfer to Mike's cell:
   - Dials Mike's cell
   - If Mike answers, plays summary: "Incoming call from [customer name]
     about [billing question / tree removal / etc]"
   - Connects the two parties
5. If Mike doesn't answer within 20 seconds:
   - Vapi returns to caller: "I wasn't able to reach Mike right now.
     Can I take a message and have him call you back?"
   - Takes message via tool: take_message
   - Hermes stores message + sends Telegram to Mike
```

### 3.6 Call Flow: Emergency

```
1. Customer: "A tree fell on my house!" or "There's water flooding everywhere"
2. Vapi LLM detects emergency keywords -> tool: handle_emergency
   - Hermes flags as emergency, returns owner's emergency contact preference
3. Vapi: "I understand this is an emergency. Let me get Mike on the line
   right away."
4. Immediate transfer attempt to owner's cell
5. If no answer -> "I'm sending Mike an urgent notification right now.
   He'll call you back as soon as possible. For immediate danger,
   please call 911."
6. Hermes sends URGENT Telegram/SMS to Mike with all details
```

### 3.7 Call Flow: Take Message

```
1. Customer wants to leave a message (or transfer failed)
2. Vapi: "I'd be happy to take a message for Mike. What would you like
   me to tell him?"
3. Customer explains
4. Vapi LLM -> tool: take_message
   - Hermes stores: { caller_name, caller_phone, message_text,
     urgency: "normal", timestamp }
5. Vapi: "Got it. I'll make sure Mike gets your message. He'll give you
   a call back at [phone number]. Is there anything else?"
6. After call -> Hermes sends Telegram notification to Mike with full message
```

### 3.8 Integration with Hermes Skill System

Hermes skills expose tools via HTTP endpoints. The phone answering skill registers a single webhook endpoint that Vapi's Server URL points to. This endpoint handles:

- **tool-calls**: Route to the appropriate skill function (check calendar, book appointment, etc.)
- **assistant-request**: Return the correct assistant configuration for this client
- **end-of-call-report**: Process call summary, store logs, send notifications
- **status-update**: Track call state for monitoring

The webhook endpoint is exposed on the Hermes instance at:
```
https://{client-hostname}/api/skills/phone_answering/webhook
```

This requires a reverse proxy (Caddy or Nginx) on the Hermes VPS with a valid SSL certificate, which Hermes instances already have for DocuSeal and other web services.

---

## 4. Hermes Skill Design

### 4.1 Skill Structure

```
hermes/
  skills/
    phone_answering/
      __init__.py
      skill.py              # Skill registration, lifecycle
      config.py             # Per-client configuration schema
      webhook_handler.py    # Vapi webhook endpoint (FastAPI router)
      vapi_client.py        # Vapi API client (create assistants, numbers, calls)
      tools/
        __init__.py
        calendar.py         # check_availability, book_appointment, cancel_appointment
        contacts.py         # lookup_customer, create_customer, update_customer
        services.py         # get_service_info, get_service_catalog
        messaging.py        # take_message, handle_emergency
        transfer.py         # get_transfer_destination
      models/
        __init__.py
        call_log.py         # CallLog dataclass/model
        service_catalog.py  # ServiceItem dataclass/model
        business_hours.py   # BusinessHours dataclass/model
        routing_rules.py    # RoutingRule dataclass/model
      storage/
        __init__.py
        sqlite_store.py     # Local SQLite for call logs, contacts, services
      templates/
        system_prompt.py    # Voice agent system prompt template
        greeting.py         # Greeting message templates
      notifications/
        __init__.py
        telegram.py         # Send call summaries via Telegram
        sms.py              # SMS notification fallback
      setup/
        __init__.py
        provision.py        # One-time setup: create Vapi assistant, buy number
        configure.py        # Configure forwarding, voice, prompts
```

### 4.2 Skill Registration (`skill.py`)

```python
"""
Phone Answering skill for Hermes.
Enables AI-powered inbound call answering via Vapi voice platform.
"""

from hermes.skills.base import BaseSkill

class PhoneAnsweringSkill(BaseSkill):
    name = "phone_answering"
    description = "AI phone answering for trade contractors"
    version = "1.0.0"

    required_config = [
        "vapi_api_key",           # Firmcraft's Vapi API key (shared across clients)
        "business_name",          # e.g., "Rumble Bee Tree Service"
        "owner_name",             # e.g., "Mike"
        "owner_phone",            # e.g., "+12175551234"
        "vapi_assistant_id",      # Created during provisioning
        "vapi_phone_number_id",   # Created during provisioning
        "vapi_phone_number",      # The actual number, e.g., "+12175559876"
        "timezone",               # e.g., "America/Chicago"
        "notification_channel",   # "telegram" or "sms"
        "notification_target",    # Telegram chat ID or phone number
    ]

    optional_config = [
        "emergency_keywords",     # Default: ["emergency", "urgent", "flooding", ...]
        "transfer_keywords",      # Default: ["talk to", "speak with", "owner", ...]
        "max_transfer_wait_secs", # Default: 20
        "greeting_style",         # "friendly" (default) or "professional"
        "recording_consent_type", # "one_party" (default for IL) or "all_party"
    ]

    def setup(self):
        """Called once when skill is installed for a client."""
        self.register_webhook("/api/skills/phone_answering/webhook")
        self.init_database()
        self.load_service_catalog()

    def start(self):
        """Called when Hermes starts."""
        self.verify_vapi_connection()

    def get_tools(self):
        """Return tools this skill provides to Hermes."""
        return [
            {
                "name": "phone_check_call_log",
                "description": "Check recent calls and messages",
                "handler": self.tools.call_log.check_recent,
            },
            {
                "name": "phone_update_service_catalog",
                "description": "Add or update a service in the catalog",
                "handler": self.tools.services.update_catalog,
            },
            {
                "name": "phone_update_business_hours",
                "description": "Update business hours",
                "handler": self.tools.calendar.update_hours,
            },
        ]
```

### 4.3 Webhook Handler (`webhook_handler.py`)

```python
"""
Handles all incoming webhooks from Vapi.
Single endpoint receives all event types, routes to appropriate handler.
"""

from fastapi import APIRouter, Request, Response
from typing import Any
import json

router = APIRouter()

@router.post("/api/skills/phone_answering/webhook")
async def vapi_webhook(request: Request) -> Response:
    body = await request.json()
    message = body.get("message", {})
    msg_type = message.get("type")

    if msg_type == "assistant-request":
        return handle_assistant_request(message)
    elif msg_type == "tool-calls":
        return handle_tool_calls(message)
    elif msg_type == "end-of-call-report":
        return handle_end_of_call_report(message)
    elif msg_type == "status-update":
        return handle_status_update(message)
    elif msg_type == "hang":
        return handle_hang_notification(message)
    elif msg_type == "transcript":
        return handle_transcript(message)
    else:
        return Response(status_code=200)


def handle_assistant_request(message: dict) -> Response:
    """
    Vapi asks us which assistant to use for this call.
    We return a transient assistant config with the client's business
    name, services, and tools baked into the system prompt.
    Must respond within 7.5 seconds.
    """
    call = message.get("call", {})
    caller_phone = call.get("customer", {}).get("number", "unknown")

    # Look up caller in contacts
    customer = contacts_db.lookup_by_phone(caller_phone)
    customer_context = ""
    if customer:
        customer_context = (
            f"The caller is {customer.name}, a returning customer. "
            f"Previous services: {customer.service_history}. "
            f"Notes: {customer.notes}"
        )

    # Build the system prompt with client-specific data
    system_prompt = build_system_prompt(
        business_name=config.business_name,
        owner_name=config.owner_name,
        service_catalog=get_service_catalog(),
        business_hours=get_business_hours(),
        customer_context=customer_context,
        current_datetime=now_in_timezone(config.timezone),
    )

    assistant_config = {
        "assistant": {
            "firstMessage": f"Thank you for calling {config.business_name}. "
                           f"This is the {config.business_name} virtual assistant. "
                           f"How can I help you today?",
            "model": {
                "provider": "custom-llm",
                "url": "https://llm.firmcraft.ai/v1",  # LiteLLM gateway
                "model": "gpt-5.5",  # or route via LiteLLM
                "messages": [
                    {"role": "system", "content": system_prompt}
                ],
                "tools": get_vapi_tool_definitions(),
                "temperature": 0.3,
            },
            "voice": {
                "provider": "vapi",
                "voiceId": "Elliot",  # Professional male voice
            },
            "transcriber": {
                "provider": "deepgram",
                "model": "nova-3",
                "language": "en",
            },
            "serverUrl": f"https://{config.client_hostname}/api/skills/phone_answering/webhook",
            "serverMessages": [
                "tool-calls",
                "end-of-call-report",
                "status-update",
                "hang",
                "transcript",
            ],
            "artifactPlan": {
                "recordingEnabled": True,
                "transcriptPlan": {
                    "enabled": True,
                    "assistantName": config.business_name,
                    "userName": "Customer",
                },
            },
            "analysisPlan": {
                "summaryPrompt": (
                    "Summarize this call for a busy trade contractor. "
                    "Include: caller name, what they need, outcome "
                    "(appointment booked / message taken / transferred / FAQ answered), "
                    "and any follow-up needed. Keep it under 3 sentences."
                ),
                "structuredDataSchema": {
                    "type": "object",
                    "properties": {
                        "caller_name": {"type": "string"},
                        "caller_intent": {
                            "type": "string",
                            "enum": ["book_appointment", "get_quote", "ask_question",
                                     "leave_message", "complaint", "emergency", "other"]
                        },
                        "service_requested": {"type": "string"},
                        "appointment_booked": {"type": "boolean"},
                        "appointment_date": {"type": "string"},
                        "follow_up_needed": {"type": "boolean"},
                        "follow_up_notes": {"type": "string"},
                    },
                },
                "successEvaluationRubric": "PassFail",
                "successEvaluationPrompt": (
                    "A call is successful if: the customer's question was answered, "
                    "OR an appointment was booked, OR a message was taken, "
                    "OR the customer was transferred to the owner. "
                    "A call fails if the customer hung up frustrated, "
                    "the AI couldn't help, or the call dropped."
                ),
            },
            "endCallPhrases": ["goodbye", "bye", "that's all", "nothing else"],
            "silenceTimeoutSeconds": 30,
            "maxDurationSeconds": 600,  # 10 minute max
        }
    }

    return Response(
        content=json.dumps(assistant_config),
        media_type="application/json"
    )


def handle_tool_calls(message: dict) -> Response:
    """
    Vapi's LLM wants to call a tool. Execute it and return results.
    Must respond quickly to keep conversation flowing.
    """
    results = []
    for tool_call in message.get("toolCallList", []):
        tool_name = tool_call.get("name")
        args = tool_call.get("arguments", {})
        tool_id = tool_call.get("id")

        if tool_name == "check_service_availability":
            result = tools.calendar.check_availability(args)
        elif tool_name == "book_appointment":
            result = tools.calendar.book_appointment(args)
        elif tool_name == "get_service_info":
            result = tools.services.get_info(args)
        elif tool_name == "lookup_customer":
            result = tools.contacts.lookup(args)
        elif tool_name == "take_message":
            result = tools.messaging.take_message(args)
        elif tool_name == "handle_emergency":
            result = tools.messaging.handle_emergency(args)
        else:
            result = {"error": f"Unknown tool: {tool_name}"}

        results.append({
            "toolCallId": tool_id,
            "result": json.dumps(result),
        })

    return Response(
        content=json.dumps({"results": results}),
        media_type="application/json"
    )


def handle_end_of_call_report(message: dict) -> Response:
    """
    Called after every call ends. Store the call log and notify the owner.
    """
    call = message.get("call", {})
    artifact = message.get("artifact", {})
    analysis = message.get("analysis", {})

    call_log = CallLog(
        call_id=call.get("id"),
        caller_phone=call.get("customer", {}).get("number"),
        caller_name=analysis.get("structuredData", {}).get("caller_name", "Unknown"),
        duration_seconds=calculate_duration(message),
        summary=analysis.get("summary", ""),
        outcome=analysis.get("structuredData", {}).get("caller_intent", "unknown"),
        success=analysis.get("successEvaluation") == "true",
        recording_url=artifact.get("recording", {}).get("url"),
        transcript=artifact.get("transcript", ""),
        structured_data=analysis.get("structuredData", {}),
        created_at=message.get("startedAt"),
    )

    # Store in local SQLite
    storage.save_call_log(call_log)

    # Send notification to owner
    notification_text = (
        f"Call from {call_log.caller_name or call_log.caller_phone}\n"
        f"Duration: {call_log.duration_seconds // 60}m {call_log.duration_seconds % 60}s\n"
        f"Summary: {call_log.summary}\n"
    )

    if call_log.structured_data.get("follow_up_needed"):
        notification_text += (
            f"FOLLOW-UP NEEDED: {call_log.structured_data.get('follow_up_notes', '')}\n"
        )

    notifications.send(
        channel=config.notification_channel,
        target=config.notification_target,
        message=notification_text,
    )

    return Response(status_code=200)
```

### 4.4 Tool Definitions for Vapi

These are the OpenAI-style function definitions sent to Vapi in the assistant config:

```python
def get_vapi_tool_definitions():
    return [
        {
            "type": "function",
            "function": {
                "name": "check_service_availability",
                "description": (
                    "Check when the next available appointment slot is "
                    "for a given service type. Call this when a customer "
                    "wants to schedule work or asks about availability."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "service_type": {
                            "type": "string",
                            "description": "Type of service requested",
                            "enum": []  # Populated from service catalog
                        },
                        "preferred_date": {
                            "type": "string",
                            "description": "Customer's preferred date (YYYY-MM-DD), if mentioned"
                        },
                        "preferred_time": {
                            "type": "string",
                            "description": "Customer's preferred time of day: morning, afternoon, or anytime",
                            "enum": ["morning", "afternoon", "anytime"]
                        }
                    },
                    "required": ["service_type"]
                }
            },
            "server": {
                "url": f"https://{config.client_hostname}/api/skills/phone_answering/webhook"
            }
        },
        {
            "type": "function",
            "function": {
                "name": "book_appointment",
                "description": (
                    "Book a confirmed appointment for the customer. "
                    "Only call this after the customer has agreed to a date and time. "
                    "You MUST have the customer's name, phone number, and service address."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "service_type": {"type": "string"},
                        "date": {"type": "string", "description": "YYYY-MM-DD"},
                        "time_start": {"type": "string", "description": "HH:MM 24-hour"},
                        "time_end": {"type": "string", "description": "HH:MM 24-hour"},
                        "customer_name": {"type": "string"},
                        "customer_phone": {"type": "string"},
                        "customer_address": {"type": "string"},
                        "notes": {"type": "string", "description": "Details about the job"}
                    },
                    "required": ["service_type", "date", "time_start", "time_end",
                                 "customer_name", "customer_phone", "customer_address"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_service_info",
                "description": (
                    "Get information about a service the business offers, "
                    "including general pricing ranges and what's included. "
                    "Call this when a customer asks about services or pricing."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "service_type": {"type": "string"},
                        "question": {
                            "type": "string",
                            "description": "Specific question the customer asked"
                        }
                    },
                    "required": ["service_type"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "take_message",
                "description": (
                    "Take a message for the business owner. Call this when: "
                    "the customer wants to leave a message, OR a transfer "
                    "to the owner failed, OR the question is too complex "
                    "for you to handle."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "caller_name": {"type": "string"},
                        "caller_phone": {"type": "string"},
                        "message": {"type": "string"},
                        "urgency": {
                            "type": "string",
                            "enum": ["low", "normal", "high", "emergency"]
                        },
                        "callback_requested": {"type": "boolean"}
                    },
                    "required": ["message", "urgency"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "handle_emergency",
                "description": (
                    "Handle an emergency situation. Call this IMMEDIATELY when "
                    "the customer reports: property damage, safety hazard, "
                    "flooding, fallen tree on structure, electrical danger, "
                    "or any situation requiring urgent response."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "emergency_type": {"type": "string"},
                        "description": {"type": "string"},
                        "caller_name": {"type": "string"},
                        "caller_phone": {"type": "string"},
                        "address": {"type": "string"}
                    },
                    "required": ["emergency_type", "description"]
                }
            }
        },
        {
            "type": "transferCall",
            "destinations": [
                {
                    "type": "number",
                    "number": config.owner_phone,
                    "message": "Let me connect you with the owner. One moment please.",
                    "description": "Transfer to the business owner",
                    "transferPlan": {
                        "mode": "warm-transfer-with-summary",
                        "summaryPlan": {
                            "enabled": True,
                            "messages": [
                                {
                                    "role": "system",
                                    "content": (
                                        "Summarize this call in one sentence for the "
                                        "business owner who is about to take over the call. "
                                        "Include the caller's name and what they need."
                                    )
                                },
                                {
                                    "role": "user",
                                    "content": "Transcript:\n\n{{transcript}}"
                                }
                            ]
                        }
                    }
                }
            ],
            "function": {
                "name": "transferCall",
                "description": (
                    "Transfer the call to the business owner. Use this when: "
                    "1) The customer explicitly asks to speak with the owner, "
                    "2) The question is about billing, payments, or complaints, "
                    "3) The customer is unhappy and needs human attention, "
                    "4) The situation is an emergency. "
                    "Do NOT transfer for routine questions you can answer."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "destination": {
                            "type": "string",
                            "enum": [config.owner_phone]
                        }
                    },
                    "required": ["destination"]
                }
            }
        }
    ]
```

### 4.5 Phone Number Management

```python
# vapi_client.py

import httpx

VAPI_BASE = "https://api.vapi.ai"

class VapiClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    async def create_phone_number(self, area_code: str = None) -> dict:
        """Provision a new US phone number from Vapi."""
        payload = {
            "provider": "vapi",
            "fallbackDestination": {
                "type": "number",
                "number": config.owner_phone,
                "message": "Please hold while I connect you."
            }
        }
        # Note: Vapi free numbers are US only; area code selection
        # may require Twilio import for specific area codes.
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{VAPI_BASE}/phone-number",
                headers=self.headers,
                json=payload,
            )
            return resp.json()

    async def import_twilio_number(
        self, twilio_phone: str, twilio_sid: str,
        twilio_token: str, twilio_account_sid: str
    ) -> dict:
        """Import an existing Twilio number for a specific area code."""
        payload = {
            "provider": "twilio",
            "number": twilio_phone,
            "twilioAccountSid": twilio_account_sid,
            "twilioAuthToken": twilio_token,
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{VAPI_BASE}/phone-number",
                headers=self.headers,
                json=payload,
            )
            return resp.json()

    async def assign_assistant_to_number(
        self, phone_number_id: str, assistant_id: str = None,
        server_url: str = None
    ) -> dict:
        """
        Assign an assistant to answer calls on a number.
        If server_url is provided instead of assistant_id,
        Vapi will request the assistant config via webhook
        (our preferred approach for dynamic per-caller personalization).
        """
        payload = {}
        if assistant_id:
            payload["assistantId"] = assistant_id
        if server_url:
            payload["serverUrl"] = server_url
        async with httpx.AsyncClient() as client:
            resp = await client.patch(
                f"{VAPI_BASE}/phone-number/{phone_number_id}",
                headers=self.headers,
                json=payload,
            )
            return resp.json()

    async def create_assistant(self, config: dict) -> dict:
        """Create a persistent assistant (alternative to transient)."""
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{VAPI_BASE}/assistant",
                headers=self.headers,
                json=config,
            )
            return resp.json()

    async def list_calls(
        self, phone_number_id: str = None, limit: int = 50
    ) -> dict:
        """List recent calls for monitoring."""
        params = {"limit": limit}
        if phone_number_id:
            params["phoneNumberId"] = phone_number_id
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{VAPI_BASE}/call",
                headers=self.headers,
                params=params,
            )
            return resp.json()
```

---

## 5. Data Model

All data is stored locally on each Hermes instance in SQLite (path: `/data/phone_answering/phone.db`). No external database dependency. Data stays on the client's VPS.

### 5.1 Schema

```sql
-- Call log: every inbound call
CREATE TABLE call_logs (
    id TEXT PRIMARY KEY,                    -- Vapi call ID
    caller_phone TEXT NOT NULL,             -- E.164 format
    caller_name TEXT,                       -- Extracted from call or contacts
    duration_seconds INTEGER,
    summary TEXT,                           -- AI-generated summary
    outcome TEXT NOT NULL,                  -- 'appointment_booked', 'message_taken',
                                            -- 'transferred', 'faq_answered',
                                            -- 'emergency', 'spam', 'abandoned'
    success BOOLEAN DEFAULT TRUE,
    recording_url TEXT,                     -- Vapi recording URL
    transcript TEXT,                        -- Full transcript
    structured_data TEXT,                   -- JSON: caller_intent, service_requested, etc.
    vapi_cost REAL,                         -- Vapi charges for this call
    created_at TEXT NOT NULL,               -- ISO 8601
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_call_logs_phone ON call_logs(caller_phone);
CREATE INDEX idx_call_logs_created ON call_logs(created_at);
CREATE INDEX idx_call_logs_outcome ON call_logs(outcome);


-- Service catalog: what the contractor offers
CREATE TABLE service_catalog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_type TEXT NOT NULL UNIQUE,       -- 'tree_trimming', 'tree_removal', etc.
    display_name TEXT NOT NULL,              -- 'Tree Trimming'
    description TEXT,                        -- What's included
    price_range_low REAL,                    -- Minimum typical price
    price_range_high REAL,                   -- Maximum typical price
    price_unit TEXT DEFAULT 'per_job',       -- 'per_job', 'per_hour', 'per_foot'
    duration_estimate_hours REAL,            -- Typical job duration
    requires_estimate BOOLEAN DEFAULT TRUE,  -- Must we see it first?
    estimate_is_free BOOLEAN DEFAULT TRUE,
    seasonal_availability TEXT,              -- NULL = year-round, or 'spring,summer,fall'
    notes TEXT,                              -- Additional info for the AI
    active BOOLEAN DEFAULT TRUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);


-- Business hours
CREATE TABLE business_hours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_of_week INTEGER NOT NULL,           -- 0=Monday, 6=Sunday
    open_time TEXT,                          -- HH:MM (24h), NULL = closed
    close_time TEXT,                         -- HH:MM (24h), NULL = closed
    is_closed BOOLEAN DEFAULT FALSE,
    notes TEXT                              -- e.g., "By appointment only"
);


-- Call routing rules
CREATE TABLE routing_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_type TEXT NOT NULL,                -- 'transfer_keyword', 'emergency_keyword',
                                            -- 'after_hours_action', 'spam_pattern'
    pattern TEXT NOT NULL,                  -- Keyword, regex, or action
    action TEXT NOT NULL,                   -- 'transfer', 'emergency', 'voicemail',
                                            -- 'block', 'message'
    priority INTEGER DEFAULT 0,            -- Higher = checked first
    active BOOLEAN DEFAULT TRUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);


-- Messages (voicemail / taken messages)
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    call_log_id TEXT REFERENCES call_logs(id),
    caller_phone TEXT NOT NULL,
    caller_name TEXT,
    message_text TEXT NOT NULL,
    urgency TEXT DEFAULT 'normal',          -- 'low', 'normal', 'high', 'emergency'
    callback_requested BOOLEAN DEFAULT FALSE,
    read_by_owner BOOLEAN DEFAULT FALSE,
    responded BOOLEAN DEFAULT FALSE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_unread ON messages(read_by_owner) WHERE read_by_owner = FALSE;


-- Contacts (customers)
CREATE TABLE contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL UNIQUE,             -- E.164 format
    name TEXT,
    email TEXT,
    address TEXT,
    service_history TEXT,                   -- JSON array of past services
    notes TEXT,                             -- AI-maintained notes
    total_calls INTEGER DEFAULT 0,
    first_call_at TEXT,
    last_call_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contacts_phone ON contacts(phone);


-- Appointments (booked via phone)
CREATE TABLE appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    call_log_id TEXT REFERENCES call_logs(id),
    contact_id INTEGER REFERENCES contacts(id),
    service_type TEXT NOT NULL,
    date TEXT NOT NULL,                     -- YYYY-MM-DD
    time_start TEXT NOT NULL,               -- HH:MM
    time_end TEXT NOT NULL,                 -- HH:MM
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'confirmed',        -- 'confirmed', 'cancelled', 'completed'
    synced_to_calendar BOOLEAN DEFAULT FALSE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_status ON appointments(status);
```

### 5.2 Default Data for Rumble Bee Tree Service

```sql
-- Service Catalog
INSERT INTO service_catalog (service_type, display_name, description,
    price_range_low, price_range_high, price_unit, duration_estimate_hours,
    requires_estimate, estimate_is_free, notes)
VALUES
    ('tree_trimming', 'Tree Trimming', 'Trimming and shaping of trees, removal of dead branches',
     150, 1500, 'per_job', 3, TRUE, TRUE, 'Price depends on tree size and accessibility'),
    ('tree_removal', 'Tree Removal', 'Complete tree removal including stump',
     300, 2500, 'per_job', 4, TRUE, TRUE, 'Includes stump grinding. Price depends on size and location'),
    ('stump_grinding', 'Stump Grinding', 'Grinding of existing tree stumps',
     100, 500, 'per_stump', 1, TRUE, TRUE, 'Price per stump, volume discounts available'),
    ('storm_damage', 'Storm Damage Cleanup', 'Emergency cleanup of fallen trees and debris',
     200, 3000, 'per_job', 4, TRUE, TRUE, 'Emergency service available. Call for priority scheduling'),
    ('lot_clearing', 'Lot Clearing', 'Clearing trees and brush from building lots',
     500, 5000, 'per_job', 8, TRUE, TRUE, 'Priced by lot size and tree density');

-- Business Hours (Central Time)
INSERT INTO business_hours (day_of_week, open_time, close_time, is_closed) VALUES
    (0, '07:00', '17:00', FALSE),  -- Monday
    (1, '07:00', '17:00', FALSE),  -- Tuesday
    (2, '07:00', '17:00', FALSE),  -- Wednesday
    (3, '07:00', '17:00', FALSE),  -- Thursday
    (4, '07:00', '17:00', FALSE),  -- Friday
    (5, '08:00', '12:00', FALSE),  -- Saturday (half day)
    (6, NULL, NULL, TRUE);          -- Sunday (closed)

-- Routing Rules
INSERT INTO routing_rules (rule_type, pattern, action, priority) VALUES
    ('emergency_keyword', 'emergency', 'emergency', 10),
    ('emergency_keyword', 'fell on', 'emergency', 10),
    ('emergency_keyword', 'fell onto', 'emergency', 10),
    ('emergency_keyword', 'on my house', 'emergency', 10),
    ('emergency_keyword', 'on my car', 'emergency', 10),
    ('emergency_keyword', 'blocking road', 'emergency', 10),
    ('emergency_keyword', 'power line', 'emergency', 10),
    ('emergency_keyword', 'danger', 'emergency', 9),
    ('emergency_keyword', 'urgent', 'emergency', 8),
    ('transfer_keyword', 'talk to mike', 'transfer', 5),
    ('transfer_keyword', 'speak with mike', 'transfer', 5),
    ('transfer_keyword', 'talk to the owner', 'transfer', 5),
    ('transfer_keyword', 'speak to a human', 'transfer', 5),
    ('transfer_keyword', 'billing', 'transfer', 4),
    ('transfer_keyword', 'invoice', 'transfer', 4),
    ('transfer_keyword', 'complaint', 'transfer', 4),
    ('after_hours_action', 'after_hours', 'message', 1);
```

---

## 6. Voice Agent Prompt

### 6.1 System Prompt Template

```python
def build_system_prompt(
    business_name: str,
    owner_name: str,
    service_catalog: list,
    business_hours: list,
    customer_context: str,
    current_datetime: str,
) -> str:
    services_text = "\n".join([
        f"- {s.display_name}: {s.description}. "
        f"Price range: ${s.price_range_low}-${s.price_range_high} {s.price_unit}. "
        f"{'Free estimates available.' if s.estimate_is_free else ''} "
        f"{s.notes or ''}"
        for s in service_catalog
    ])

    hours_text = "\n".join([
        f"- {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][h.day_of_week]}: "
        f"{'CLOSED' if h.is_closed else f'{h.open_time} - {h.close_time}'}"
        f"{f' ({h.notes})' if h.notes else ''}"
        for h in business_hours
    ])

    return f"""You are the virtual phone assistant for {business_name}. You answer inbound phone calls on behalf of {owner_name}.

CURRENT DATE AND TIME: {current_datetime}

## YOUR ROLE
You are a friendly, professional receptionist. You represent {business_name} and {owner_name}. Callers should feel like they're talking to a knowledgeable, helpful person at the company -- not a robot.

## TONE AND STYLE
- Friendly and warm, but professional. Think: a great small-business receptionist.
- Use natural conversational language. Say "sure thing" not "certainly." Say "let me check on that" not "I will now query the database."
- Be efficient. Trade contractors' customers are busy. Don't ramble.
- Use the caller's name once you know it, but don't overuse it.
- Mirror the caller's energy level. If they're casual, be casual. If they're stressed, be empathetic.
- Never sound scripted. Vary your phrasing naturally.

## WHAT YOU CAN DO
1. **Book appointments** - Check availability and schedule service appointments. Always collect: customer name, phone number, service address, and what they need done.
2. **Answer service questions** - Use the service catalog below to answer questions about what {business_name} offers, general pricing ranges, and what's included.
3. **Take messages** - If the caller needs something you can't handle, take a detailed message for {owner_name}.
4. **Transfer to {owner_name}** - Connect the caller directly to {owner_name}'s cell when needed.
5. **Handle emergencies** - Flag urgent situations and immediately attempt to reach {owner_name}.

## WHAT YOU MUST NOT DO
- NEVER give exact price quotes. Always say prices vary and offer a free estimate.
- NEVER promise specific arrival times. Say "{owner_name} will be there during the scheduled window."
- NEVER make commitments about timelines ("we can definitely do it this week").
- NEVER discuss other customers or jobs.
- NEVER pretend to be {owner_name} or a human employee. If asked directly, say "I'm {business_name}'s virtual assistant. I can help with scheduling and questions, or I can connect you with {owner_name}."
- NEVER give legal, insurance, or liability advice.
- NEVER engage with abusive or threatening callers. Politely offer to take a message or end the call.

## SERVICES OFFERED
{services_text}

## BUSINESS HOURS
{hours_text}

## SCHEDULING RULES
- Only book appointments during business hours.
- Minimum appointment window is 2 hours (e.g., 9 AM - 11 AM).
- If the caller wants a time outside business hours, offer the next available slot.
- For emergency/storm damage, note that priority scheduling may be available.
- Always confirm the appointment details before booking: service type, date, time window, name, address.

## CALLER CONTEXT
{customer_context if customer_context else "This appears to be a new caller. Collect their name and phone number during the conversation."}

## HANDLING SPECIFIC SITUATIONS

### Pricing Questions
"Our pricing depends on the specific job -- things like tree size, location, and complexity all factor in. I can tell you that [service] typically ranges from $X to $Y. The best way to get an exact number is a free on-site estimate. Want me to schedule one?"

### After-Hours Calls
If calling outside business hours: "Thanks for calling {business_name}. We're currently closed -- our hours are [hours]. I can take a message for {owner_name} and he'll get back to you, or I can schedule an appointment. Which would you prefer?"

### Angry/Upset Callers
Listen actively. Acknowledge their frustration. "I completely understand your frustration, and I want to make sure this gets resolved." Offer to take a message or transfer to {owner_name}. Never argue.

### Spam/Robocalls
If you detect an automated call, telemarketer, or spam: respond with "I'm sorry, we're not interested. Goodbye." and end the call.

### Non-English Speakers
If the caller speaks limited English, slow down and use simple words. If communication is impossible: "I apologize, but I'm having trouble understanding. Let me take your phone number and have {owner_name} call you back." Take the number and flag for callback.

### "Are you a robot?"
"I'm {business_name}'s virtual assistant. I can help with scheduling appointments, answer questions about our services, or connect you directly with {owner_name}. What can I do for you?"

### Multiple Services Needed
If the caller needs multiple services: "We can definitely handle all of that. Let me schedule a single visit so {owner_name} can assess everything at once and give you a complete estimate."

## CALL ENDING
- Always confirm any actions taken: "Just to confirm, I've booked you for [service] on [date] at [time]. {owner_name} will see you then."
- Ask if there's anything else: "Is there anything else I can help with?"
- End warmly: "Great, have a wonderful day!"
- Keep goodbyes brief. Don't drag out the ending.
"""
```

### 6.2 Example Dialogues

**Scenario 1: Simple Appointment Booking**
```
AI: Thank you for calling Rumble Bee Tree Service. This is the Rumble Bee
    virtual assistant. How can I help you today?

Caller: Yeah, I got a couple trees that need trimming real bad.

AI: Sure thing, I can help get that set up. We offer free on-site estimates
    for tree trimming so Mike can take a look and give you an exact price.
    When would work best for you?

Caller: Sometime next week if possible.

AI: [calls check_service_availability] Let me check... I have Tuesday the
    10th available in the afternoon, 1 to 4 PM, or Wednesday the 11th in
    the morning, 9 to noon. Either of those work?

Caller: Wednesday morning's good.

AI: Perfect. I just need a few details. Can I get your name?

Caller: Tom Henderson.

AI: Thanks, Tom. And the address where the trees are?

Caller: 1425 Oak Street in Springfield.

AI: Got it. [calls book_appointment] Alright Tom, you're all set.
    Mike will be at 1425 Oak Street in Springfield on Wednesday, June 11th
    between 9 AM and noon for a free estimate on the tree trimming.
    Is there anything else I can help with?

Caller: Nope, that's it.

AI: Sounds good. Have a great day, Tom!
```

**Scenario 2: Emergency**
```
AI: Thank you for calling Rumble Bee Tree Service. How can I help?

Caller: A tree just fell on my neighbor's fence and it's leaning on the
        power lines! We need someone out here now!

AI: [calls handle_emergency] I understand this is an emergency. Your safety
    is the first priority -- please stay away from the downed tree and
    especially the power lines. Let me get Mike on the line right away.

[initiates transferCall to owner]

AI: I'm connecting you with Mike now. If you're in immediate danger,
    please call 911.

[if transfer fails]

AI: I wasn't able to reach Mike just now, but I'm sending him an urgent
    alert right this second. Can you give me your name and address so
    he can get back to you immediately?
```

---

## 7. Phone Number Strategy

### 7.1 Recommended Approach: Call Forwarding (Existing Number Preserved)

The contractor keeps their existing business number and sets up call forwarding to the Vapi number. This is the recommended approach because:

1. **Zero disruption:** No need to update business cards, truck wraps, Google Business Profile, yard signs, Yelp listing, etc.
2. **Instant rollback:** If anything goes wrong, the contractor disables forwarding and their phone rings as before.
3. **Familiar to contractors:** They already understand call forwarding. It is a setting on their phone or via their carrier.

**Setup process per client:**

1. Firmcraft provisions a Vapi phone number via API (free, US number).
   - Preferred: request a number in the client's area code if available via Twilio import.
2. Client calls their phone carrier and sets up "conditional" or "unconditional" call forwarding to the Vapi number.
   - **Unconditional forwarding** (recommended): All calls go to Vapi. The AI answers everything.
   - **Conditional forwarding** (alternative): Calls forward only when the contractor doesn't answer within N rings. This lets the contractor answer when available and the AI catches the rest.
3. Firmcraft configures the Vapi number to use the webhook-based assistant request, pointing to the client's Hermes instance.
4. Test with multiple calls to verify the full flow.

### 7.2 Alternative: Dedicated AI Number

For clients who want to keep personally answering some calls:

1. Firmcraft provisions a separate Vapi number (e.g., for "schedule online" or "after-hours" line).
2. Client uses this number on specific marketing materials or as their after-hours number.
3. Both numbers can coexist.

### 7.3 Number Provisioning via API

```python
async def provision_client_phone(
    vapi_client: VapiClient,
    client_config: dict,
) -> dict:
    """
    Provision a phone number for a new client.
    Returns the number details and updates client config.
    """
    # Step 1: Create a Vapi phone number
    number = await vapi_client.create_phone_number()
    # Vapi free numbers are US-only, random area code.

    # Step 2: Configure the number to use our webhook
    await vapi_client.assign_assistant_to_number(
        phone_number_id=number["id"],
        server_url=f"https://{client_config['hostname']}/api/skills/phone_answering/webhook",
    )

    # Step 3: Set fallback destination (owner's cell)
    # If Vapi has issues, calls fall through to owner
    await vapi_client.update_phone_number(
        phone_number_id=number["id"],
        fallback_destination={
            "type": "number",
            "number": client_config["owner_phone"],
        }
    )

    return {
        "phone_number_id": number["id"],
        "phone_number": number["number"],
        "provider": number["provider"],
    }
```

### 7.4 Area Code Matching

For trade contractors, having a local area code matters. If the Vapi free number is not in the client's area code:

1. Create a Twilio account for Firmcraft (one account, all clients).
2. Purchase a number in the client's area code via Twilio ($1/month).
3. Import that Twilio number into Vapi.
4. This costs an additional ~$1/month per client but gives them a local number.

---

## 8. Call Transfer and Escalation

### 8.1 Transfer Types

| Scenario | Transfer Type | Behavior |
|---|---|---|
| Customer asks for owner | Warm transfer with summary | AI briefs owner on caller's needs before connecting |
| Complex question | Warm transfer with summary | AI explains what the caller needs |
| Emergency | Warm transfer with summary | AI marks as urgent in the briefing |
| Billing/payment question | Warm transfer with message | AI tells owner "billing question incoming" |
| Customer is angry | Warm transfer with summary | AI summarizes the issue and frustration level |

### 8.2 Transfer Configuration

```json
{
    "type": "transferCall",
    "destinations": [
        {
            "type": "number",
            "number": "+12175551234",
            "description": "Transfer to Mike (owner)",
            "transferPlan": {
                "mode": "warm-transfer-with-summary",
                "summaryPlan": {
                    "enabled": true,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are briefing a busy contractor who is about to take a customer call. In ONE sentence, tell them: who is calling (name if known), what they need, and any urgency. Be direct."
                        },
                        {
                            "role": "user",
                            "content": "Here is the conversation so far:\n\n{{transcript}}"
                        }
                    ]
                }
            }
        }
    ]
}
```

### 8.3 Transfer Trigger Logic

The LLM decides when to transfer based on the system prompt rules. Additionally, the Hermes webhook can force a transfer by returning a directive in a tool response:

```python
# In tools/transfer.py
def should_force_transfer(message_text: str, call_context: dict) -> bool:
    """Check if any routing rule requires an immediate transfer."""
    rules = storage.get_routing_rules(rule_type="transfer_keyword", active=True)
    for rule in rules:
        if rule.pattern.lower() in message_text.lower():
            return True
    return False
```

### 8.4 Failed Transfer Handling

When the owner doesn't answer (configurable timeout, default 20 seconds):

```python
# Vapi warm-transfer-experimental mode handles this natively:
{
    "transferPlan": {
        "mode": "warm-transfer-experimental",
        "message": "Incoming customer call about tree service.",
        "fallbackPlan": {
            "message": "I wasn't able to reach Mike right now. Let me take your information and he'll call you back as soon as possible.",
            "endCallEnabled": false  # Don't hang up -- take a message instead
        }
    }
}
```

After failed transfer, the AI takes a message and sends an urgent notification to the owner.

---

## 9. Recording and Transcription

### 9.1 Recording Consent by State

Illinois (where Rumble Bee operates) is a **one-party consent** state for recording phone calls (720 ILCS 5/14-2). This means only one party to the call needs to consent, and Firmcraft (as operator of the AI) counts as that party.

However, best practice (and some states require all-party consent):

| State | Consent Type | States Requiring All-Party |
|---|---|---|
| Illinois | One-party | N/A -- one-party is sufficient |
| California | All-party | Must disclose to caller |
| Florida | All-party | Must disclose to caller |
| Most other states | One-party | Only one party needs to know |

### 9.2 Implementation Approach

**For Illinois clients (including Rumble Bee):** Record automatically. No disclosure required by law, but we include a brief disclosure in the greeting as a best practice and to build customer trust.

**For all-party consent states:** Add a recording disclosure line at the start of the call:

```python
# Conditional greeting based on state
if config.recording_consent_type == "all_party":
    greeting = (
        f"Thank you for calling {config.business_name}. "
        f"This call may be recorded for quality purposes. "
        f"How can I help you today?"
    )
else:
    greeting = (
        f"Thank you for calling {config.business_name}. "
        f"This is the {config.business_name} virtual assistant. "
        f"How can I help you today?"
    )
```

### 9.3 Vapi Recording Configuration

```json
{
    "artifactPlan": {
        "recordingEnabled": true,
        "recordingFormat": "wav;l16",
        "loggingEnabled": true,
        "transcriptPlan": {
            "enabled": true,
            "assistantName": "Rumble Bee",
            "userName": "Customer"
        }
    }
}
```

### 9.4 Post-Call Processing

After every call, the `end-of-call-report` webhook delivers:

1. **Recording URL** -- stored in `call_logs.recording_url`. Recordings persist on Vapi for 14 days (Build tier). For permanent storage, we download and store on the Hermes VPS.
2. **Full Transcript** -- stored in `call_logs.transcript`.
3. **AI Summary** -- 2-3 sentence summary stored in `call_logs.summary`.
4. **Structured Data** -- caller intent, service requested, etc. stored in `call_logs.structured_data`.
5. **Success Evaluation** -- pass/fail stored in `call_logs.success`.

### 9.5 Owner Notification

After every call, the owner receives a notification via their preferred channel:

```
Telegram message to Mike:

CALL RECEIVED - 2:34 PM
From: Tom Henderson (217-555-9876)
Duration: 3 min 12 sec
Result: Appointment Booked

Tree trimming estimate, Wed 6/11, 9 AM-12 PM
1425 Oak Street, Springfield
Notes: Big oak tree in backyard

[Listen to recording] [View transcript]
```

The "Listen to recording" and "View transcript" links point to a simple web page served by Hermes on the client VPS, protected by a token-based auth link.

---

## 10. Cost Analysis

### 10.1 Per-Client Cost Breakdown

**Assumptions for a typical trade contractor:**
- 15-25 inbound calls per day = ~450-750 calls/month
- Average call duration: 2.5 minutes
- Total minutes: ~1,125-1,875 minutes/month
- Use middle estimate: 600 calls/month at 2.5 min = 1,500 minutes/month

| Cost Component | Per Minute | Monthly (1,500 min) | Notes |
|---|---|---|---|
| Vapi platform | $0.05 | $75.00 | Fixed rate |
| LLM (via LiteLLM) | ~$0.015 | $22.50 | GPT-5.5 input+output tokens. Avg ~800 tokens/call. |
| STT (Deepgram via Vapi) | ~$0.005 | $7.50 | If using Vapi-managed Deepgram |
| TTS (Vapi voices) | ~$0.005 | $7.50 | If using Vapi default voices |
| Phone number | - | $0-1.00 | Free Vapi number or $1 Twilio |
| Concurrency lines | - | $0-10.00 | 10 included, $10/extra line |
| **Total COGS per client** | **~$0.075** | **~$112.50** | |

### 10.2 Margin Analysis by Tier

| Tier | Monthly Price | COGS (1,500 min) | Gross Margin | Margin % |
|---|---|---|---|---|
| Solo ($399/mo) | $399 | $112.50 | $286.50 | 71.8% |
| Team ($799/mo) | $799 | $150.00* | $649.00 | 81.2% |
| Pro ($1,499/mo) | $1,499 | $200.00* | $1,299.00 | 86.7% |

*Team/Pro tiers assume higher call volumes (2,000 and 2,500 min respectively).

### 10.3 Break-Even Analysis

**Fixed costs for Firmcraft (shared across all clients):**
- Vapi account: $0 (Build tier included in per-minute)
- Twilio account (for area code matching): ~$20/month base
- Engineering time: sunk cost (building the skill)
- LiteLLM gateway: already running on Hetzner VPS

**Break-even per client:** Even at very low call volumes (250 minutes = ~100 calls/month), COGS is only ~$25/month against $399 revenue. There is no realistic scenario where a single client loses money.

### 10.4 Volume Sensitivity

| Monthly Minutes | Vapi Cost | LLM Cost | Total COGS | Solo Margin |
|---|---|---|---|---|
| 250 (low) | $12.50 | $3.75 | ~$20 | $379 (95%) |
| 750 (medium) | $37.50 | $11.25 | ~$56 | $343 (86%) |
| 1,500 (high) | $75.00 | $22.50 | ~$113 | $286 (72%) |
| 3,000 (very high) | $150.00 | $45.00 | ~$225 | $174 (44%) |
| 5,000 (extreme) | $250.00 | $75.00 | ~$375 | $24 (6%) |

A client hitting 5,000 minutes/month (100+ calls/day at 2.5 min each) should be on the Team or Pro tier. Add a usage cap or overage charges to the Solo tier at 2,000 minutes.

### 10.5 Recommended Pricing Guard

Add to Solo tier terms: **Includes up to 2,000 minutes of AI phone answering per month. Additional minutes billed at $0.10/minute.** This protects against edge cases while being generous enough that 95%+ of solo contractors never hit the cap.

---

## 11. Implementation Plan

### 11.1 Phase 1 Milestones

| Week | Milestone | Details |
|---|---|---|
| Week 1 | Vapi account + skill scaffold | Create Vapi account, build skill directory structure, implement webhook handler, write database schema |
| Week 2 | Core tools + voice agent | Implement all tool functions (calendar, contacts, services, messaging), build and test system prompt, configure Vapi assistant |
| Week 3 | Integration + notifications | Wire end-of-call report processing, build Telegram notifications, implement call log storage, test full flows |
| Week 4 | Pilot with Rumble Bee | Provision number, set up call forwarding on Mike's line, populate service catalog, go live with monitoring |

### 11.2 What Needs to Be Built (Hermes Skill)

1. **Webhook endpoint** (`webhook_handler.py`) -- FastAPI route handling all Vapi events
2. **Tool implementations** -- 6 tools: check_availability, book_appointment, get_service_info, take_message, handle_emergency, lookup_customer
3. **Vapi client** (`vapi_client.py`) -- API wrapper for phone number provisioning and assistant management
4. **SQLite storage** -- Schema creation, CRUD operations for all tables
5. **System prompt builder** -- Template function that assembles the dynamic prompt
6. **Notification sender** -- Telegram and SMS notification after every call
7. **Provisioning script** -- One-time setup for new clients (create number, configure Vapi, seed data)

### 11.3 What Needs to Be Configured Per Client

1. **Vapi phone number** -- Provisioned via API
2. **Business information** -- Name, owner name, owner phone, timezone
3. **Service catalog** -- Services offered, pricing ranges, descriptions
4. **Business hours** -- Open/close times per day
5. **Routing rules** -- Emergency keywords, transfer triggers
6. **Notification preferences** -- Telegram chat ID or SMS number
7. **Call forwarding** -- Client must configure on their carrier
8. **SSL certificate** -- Hermes VPS must have HTTPS (already standard)

### 11.4 Deployment Process for New Client

```bash
# 1. SSH into client's Hermes VPS
ssh root@{client-ip}

# 2. Install/update the phone_answering skill
hermes skill install phone_answering
# or: hermes skill update phone_answering

# 3. Run the provisioning script
hermes skill configure phone_answering \
    --business-name "Acme Plumbing" \
    --owner-name "John" \
    --owner-phone "+12175551234" \
    --timezone "America/Chicago" \
    --notification-channel telegram \
    --notification-target "chat_id_123456"

# 4. Provision Vapi phone number
hermes phone_answering provision-number --area-code 217

# 5. Seed the service catalog
hermes phone_answering load-catalog --file services.json

# 6. Test the full flow
hermes phone_answering test --scenario booking
hermes phone_answering test --scenario transfer
hermes phone_answering test --scenario emergency

# 7. Output forwarding instructions for the client
hermes phone_answering forwarding-instructions
# Prints: "Tell your phone carrier to forward all calls to +1-xxx-xxx-xxxx"
```

### 11.5 Testing Plan

**Automated tests (run before deployment):**
1. Webhook handler unit tests -- all message types, malformed payloads, timeouts
2. Tool function unit tests -- calendar logic, contact CRUD, service lookups
3. System prompt generation -- verify all variables are populated
4. Database schema tests -- migrations, indexes, constraints

**Manual integration tests (Rumble Bee pilot):**
1. Call the Vapi number directly -- verify greeting, voice quality, latency
2. Book an appointment -- verify it appears in Hermes data
3. Ask about services and pricing -- verify accurate responses
4. Request transfer to Mike -- verify warm transfer with summary
5. Simulate emergency -- verify urgent notification to Mike
6. Call after hours -- verify after-hours behavior
7. Hang up mid-call -- verify end-of-call report still fires
8. Rapid repeated calls -- verify concurrency handling
9. Long silence -- verify timeout behavior
10. Spam/robocall -- verify detection and handling

**Monitoring (ongoing):**
- Vapi dashboard: call volume, success rate, average duration, cost
- Hermes logs: tool call latency, errors, notification delivery
- Weekly review of call summaries with Mike for quality

### 11.6 Rollout Plan

1. **Week 4, Day 1:** Go live on Mike's personal cell only (he calls the Vapi number to test)
2. **Week 4, Day 2-3:** Mike forwards his business line to Vapi during specific hours only (e.g., lunch break, 12-1 PM)
3. **Week 4, Day 4-5:** Expand to full business hours, Mike monitors via Telegram notifications
4. **Week 5:** Full 24/7 forwarding, after-hours handling active
5. **Week 6+:** Collect feedback, iterate on prompt and tools, then offer to next client

---

## 12. Decisions Needed from Doyle

### Decision 1: Voice Provider -- Vapi
**Recommendation:** Vapi
**Reasoning:** BYOLLM saves 40-50% on per-minute costs, warm transfer on all tiers, best webhook integration with Hermes. See Section 2 for full analysis.
**Action needed:** Approve and create Vapi account.

### Decision 2: Call Forwarding vs. Dedicated Number
**Recommendation:** Call forwarding from existing number (Option A in Section 7.1)
**Reasoning:** Zero disruption for the contractor. No need to update marketing materials. Instant rollback if issues arise. Mike keeps his number.
**Action needed:** Confirm approach. If yes, we'll need Mike to call his carrier to set up forwarding.

### Decision 3: Area Code Matching
**Recommendation:** Use Twilio for area-code-specific numbers ($1/month per client)
**Reasoning:** Local area codes build trust with callers. A 217 (Springfield) area code matters for a tree service. Random Vapi number might be a different state.
**Action needed:** Approve creating a Firmcraft Twilio account. One-time setup, ~$20/month base + $1/number/month.

### Decision 4: Voice Selection
**Recommendation:** Start with Vapi default voice ("Elliot" -- professional, male) for Rumble Bee. Test 2-3 voices with Mike and let him pick.
**Reasoning:** Voice preference is subjective. Better to let the client choose from 2-3 options.
**Action needed:** None -- we'll present options during pilot setup.

### Decision 5: Solo Tier Usage Cap
**Recommendation:** 2,000 minutes/month included, $0.10/minute overage
**Reasoning:** Protects against high-volume clients eroding margin on the Solo tier. 95% of solo contractors will never hit 2,000 minutes. See Section 10.5.
**Action needed:** Approve or adjust the cap and overage rate.

### Decision 6: Recording Consent Approach
**Recommendation:** Record all calls (one-party consent for IL). Add "this call may be recorded" to the greeting as best practice. Add configurable consent type per client for multi-state expansion.
**Reasoning:** Illinois is one-party consent. Adding a disclosure builds trust and costs nothing. Making it configurable per client handles future expansion to all-party states.
**Action needed:** Confirm we should record by default in IL with disclosure.

### Decision 7: LLM Model for Voice
**Recommendation:** GPT-5.5 via LiteLLM as primary, Claude Sonnet 4.6 as fallback
**Reasoning:** GPT-5.5 has better function calling reliability for tool-heavy conversations. Claude Sonnet 4.6 as fallback ensures uptime. Both route through our existing LiteLLM gateway.
**Action needed:** Confirm model selection or specify preference.

### Decision 8: Notification Channel for Mike
**Recommendation:** Telegram (already in use for Rumble Bee)
**Reasoning:** Mike already gets Hermes notifications via Telegram. Adding call summaries to the same channel keeps things simple.
**Action needed:** Confirm or specify alternative (SMS, email).

### Decision 9: Calendar Integration
**Recommendation:** Phase 1 uses Hermes-managed local calendar (SQLite appointments table). Phase 2 adds Google Calendar sync.
**Reasoning:** Shipping faster with local storage. Google Calendar integration is a separate skill that can be wired in later. Mike may not use Google Calendar today.
**Action needed:** Confirm Mike's current calendar situation (Google Calendar, paper, nothing?). This determines Phase 2 priority.

### Decision 10: After-Hours Behavior
**Recommendation:** AI still answers after hours but adjusts behavior: acknowledges the business is closed, offers to take a message or schedule for the next business day. Does NOT transfer to owner's cell after hours (let the man sleep).
**Reasoning:** 24/7 answering is a key value proposition -- callers at 9 PM can still book for next week. But after-hours transfers would annoy the owner.
**Action needed:** Confirm, or specify if Mike wants after-hours transfers for emergencies only.

### Decision 11: When to Start
**Recommendation:** Immediately. This is the single highest-impact feature for contractor retention and new client acquisition.
**Reasoning:** Mike is already a client. The infrastructure (Hermes, LiteLLM, Hetzner VPS) is in place. Voice AI is the feature that sells itself -- "we answer your phone 24/7" is the elevator pitch.
**Action needed:** Green light to begin Week 1 (Vapi account + skill scaffold).

---

## Appendix A: Vapi API Reference Quick Sheet

**Base URL:** `https://api.vapi.ai`
**Auth:** `Authorization: Bearer {VAPI_API_KEY}`

| Endpoint | Method | Purpose |
|---|---|---|
| `/assistant` | POST | Create assistant |
| `/assistant/{id}` | PATCH | Update assistant |
| `/assistant/{id}` | GET | Get assistant |
| `/phone-number` | POST | Create/import phone number |
| `/phone-number/{id}` | PATCH | Update phone number config |
| `/phone-number/{id}` | GET | Get phone number details |
| `/call` | POST | Create outbound call |
| `/call` | GET | List calls |
| `/call/{id}` | GET | Get call details + artifacts |
| `/tool` | POST | Create reusable tool |

## Appendix B: Environment Variables

```bash
# On each Hermes VPS, in the skill config:
VAPI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx       # Firmcraft's Vapi API key
LITELLM_BASE_URL=https://llm.firmcraft.ai  # LiteLLM gateway
LITELLM_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx    # LiteLLM auth key

# Per-client (set during provisioning):
FC_PHONE_BUSINESS_NAME="Rumble Bee Tree Service"
FC_PHONE_OWNER_NAME="Mike"
FC_PHONE_OWNER_PHONE="+12175551234"
FC_PHONE_VAPI_ASSISTANT_ID="asst_xxxxxxxx"
FC_PHONE_VAPI_NUMBER_ID="num_xxxxxxxx"
FC_PHONE_VAPI_NUMBER="+12175559876"
FC_PHONE_TIMEZONE="America/Chicago"
FC_PHONE_NOTIFICATION_CHANNEL="telegram"
FC_PHONE_NOTIFICATION_TARGET="123456789"
FC_PHONE_RECORDING_CONSENT="one_party"
```

## Appendix C: File Inventory for Implementation

A Claude Code session with `/goal` should create these files:

```
hermes/skills/phone_answering/
  __init__.py                    # Skill package init
  skill.py                      # ~100 lines: skill registration, lifecycle
  config.py                     # ~50 lines: configuration schema + validation
  webhook_handler.py             # ~200 lines: FastAPI router, all Vapi event handlers
  vapi_client.py                 # ~150 lines: Vapi API wrapper
  tools/__init__.py
  tools/calendar.py              # ~150 lines: check_availability, book_appointment
  tools/contacts.py              # ~80 lines: lookup, create, update customer
  tools/services.py              # ~60 lines: get_service_info, get_catalog
  tools/messaging.py             # ~100 lines: take_message, handle_emergency
  tools/transfer.py              # ~40 lines: transfer decision helpers
  models/__init__.py
  models/call_log.py             # ~30 lines: CallLog dataclass
  models/service_catalog.py      # ~20 lines: ServiceItem dataclass
  models/business_hours.py       # ~15 lines: BusinessHours dataclass
  models/routing_rules.py        # ~15 lines: RoutingRule dataclass
  storage/__init__.py
  storage/sqlite_store.py        # ~200 lines: all DB operations, schema init
  templates/system_prompt.py     # ~150 lines: prompt builder function
  templates/greeting.py          # ~30 lines: greeting templates
  notifications/__init__.py
  notifications/telegram.py      # ~40 lines: send Telegram notification
  notifications/sms.py           # ~30 lines: send SMS notification
  setup/__init__.py
  setup/provision.py             # ~100 lines: Vapi number + assistant creation
  setup/configure.py             # ~80 lines: service catalog, hours, rules setup
  tests/
    test_webhook_handler.py      # ~200 lines
    test_tools.py                # ~300 lines
    test_prompt_builder.py       # ~50 lines
    test_storage.py              # ~100 lines
```

**Estimated total:** ~2,400 lines of Python across 25 files. Achievable in a single focused Claude Code session.
