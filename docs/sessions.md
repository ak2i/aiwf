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
  - Session metadata (start time, command, cwd, exit code)

- `events.jsonl`
  - Line-delimited JSON events (start, stdout, stderr, exit)

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
