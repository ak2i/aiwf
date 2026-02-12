# Session Structure

aiwf stores execution history under a session directory. The default root is:

- `~/.aiwf/sessions`

Each run creates a new session folder:

```
~/.aiwf/sessions/
  20260209_123456_demo/
    run.json
    events.jsonl
    artifacts/
      stdout.txt
      stderr.txt
    inputs/
```

## Files

- `run.json`
  - Session metadata (tool, argv, started_at, spec_stack, command, cwd, exit code)
  - Optional `participants`: list of `{ name, role }`

- `events.jsonl`
  - Line-delimited JSON events
  - Minimal event types (v0.1.1):
    - `session_start`
    - `tool_start`
    - `artifact_written`
    - `tool_end`

- `artifacts/stdout.txt`
  - Captured stdout

- `artifacts/stderr.txt`
  - Captured stderr

- `inputs/`
  - Optional input snapshots for reproducibility

## Notes

- Session names are timestamp-based.
- `--session-root` can override the default root.
- `--tools-path` can override the default tools registry file.

## Commands (v0.1.3)

```bash
aiwf session new
aiwf session list --format json
aiwf session attach <id>
aiwf session detach
aiwf session archive <id>
aiwf session remove <id> --hard
```
