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

With spec stack:

```bash
aiwf run --tool flowmark --spec-stack v0.1,v0.1.1,v0.1.2 -- validate docs/dev/v0.1.2/samples/minimal.md
```

With participants:

```bash
aiwf run --tool flowmark --participant "llm:responder" --participant "human:actor" -- validate docs/dev/v0.1.2/samples/minimal.md
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

## v0.1.3 CLI (partial)

```bash
aiwf session new
aiwf session list --format json
aiwf material add ./docs/spec.md --type file
aiwf material set create --include material_20260212_120000_abcd
aiwf catalog materials --format table
aiwf fetch material:material_20260212_120000_abcd --format json --pretty
```

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
tar -tf hak2i-aiwf-0.1.2.tgz
```

Check that `bin/`, `src/`, `docs/`, `README.md`, and `LICENSE` are included.
