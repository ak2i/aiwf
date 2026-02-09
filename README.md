# aiwf

AI Workflow Framework for repeatable, logged, multi-stage generation pipelines.

## Scope

aiwf is a framework to run AI workflows with:

- provider abstraction (OpenAI-compatible APIs)
- workflow runners (retries, batching)
- session logging and artifact capture
- plugins for domain tools (e.g., FlowMark)

## Usage

```bash
aiwf tool add flowmark --cmd "flowmark"
aiwf run --tool flowmark -- validate docs/dev/v0.1.2/samples/minimal.md
```

List tools:

```bash
aiwf tool list
```

This creates a session directory under `~/.aiwf/sessions` with:

- `run.json`
- `events.jsonl`
- `artifacts/stdout.txt`
- `artifacts/stderr.txt`

See `docs/sessions.md` for details.

See `docs/tools.md` for the tools registry format.

## Exit Codes

- `0` : command succeeded
- `1+` : command failed (propagates underlying command exit code)

## Relationship to FlowMark

FlowMark remains a document format. aiwf provides an execution layer for generation, validation, and review pipelines.

## License

MIT

## npm pack (Publish Check)

```bash
npm pack
tar -tf hak2i-aiwf-0.1.0.tgz
```

Check that `bin/`, `src/`, `docs/`, `README.md`, and `LICENSE` are included.
