# aiwf v0.1.2 Specification

**Version:** 0.1.2  
**Last updated:** 2026-02-09

This specification introduces the **Participant model** to aiwf.

---

## 1. Overview

aiwf v0.1.2 extends v0.1.1 by defining how humans, LLMs, and AI agents
participate in a session without changing aiwf's Runner-first nature.

---

## 2. Participant

A Participant is an entity that contributes to a session.

Participants do NOT execute tools directly.
All tool execution remains under aiwf control.

---

## 3. Responder

- Request/response based participant
- Produces artifacts such as:
  - plans
  - reviews
  - generated documents
- Typical implementation: LLM

---

## 4. Actor (Non-normative)

- Observes session events
- May suggest or request tool execution
- Optional in v0.1.2

---

## 5. Session Interaction Rules

- Participants MAY read session state
- Participants MUST write outputs as artifacts
- Participants MUST NOT mutate session logs directly

---

## 6. Compatibility

- v0.1.1 sessions remain valid
- Participant metadata is optional

---
