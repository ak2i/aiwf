# aiwf v0.1.1 Specification

**Version:** 0.1.1  
**Last updated:** 2026-02-09

aiwf (AI Workflow Framework) is a **Runner-first workflow engine**
for executing external tools and recording their execution
in a reproducible, inspectable form.

---

## 1. Scope

aiwf v0.1.1 covers:

- Execution of external CLI tools
- Session management
- Artifact capture
- Event logging

aiwf v0.1.1 does NOT interpret tool-specific specifications.

---

## 2. Core Concepts

### 2.1 Tool
An external executable registered to aiwf.

### 2.2 Session
A directory representing a single execution.

Each session MUST contain:
- `run.json`
- `events.jsonl`
- `artifacts/`

---

## 3. Session Files

### 3.1 run.json

Minimal required fields:

```json
{
  "tool": "string",
  "argv": ["string"],
  "started_at": "ISO-8601",
  "spec_stack": ["string"]
}
```

`spec_stack` is optional but recommended.

---

### 3.2 events.jsonl

Each line is a JSON object.

Minimal event types:

- `session_start`
- `tool_start`
- `artifact_written`
- `tool_end`

---

### 3.3 artifacts/

All tool outputs SHOULD be stored under this directory.

---

## 4. Tool Execution Model

- aiwf invokes the tool as a child process
- aiwf does not inspect or modify tool semantics
- Exit codes and outputs are recorded

---

## 5. Relationship to Specifications

- aiwf MAY record spec identifiers or paths
- aiwf MUST NOT enforce or interpret spec semantics

---

## 6. Future Extensions (Non-normative)

Possible future additions include:

- LLM Provider integration
- Workflow composition
- Semantic validation layers

These are out of scope for v0.1.1.

---
